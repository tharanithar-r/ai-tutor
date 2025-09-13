import { Pool, PoolClient } from "pg";
import { config } from "dotenv";

config();

type DbParam = string | number | boolean | null | undefined | Date | string[];

let pool: Pool | null = null;

export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });

  return pool;
}

// Get database connection pool
export function getDatabase(): Pool {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
}

// Execute a query with error handling
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: DbParam[]
): Promise<T[]> {
  const db = getDatabase();
  const start = Date.now();

  try {
    const result = await db.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected: ${duration}ms - ${text}`);
    }

    return result.rows;
  } catch (error) {
    console.error("Database query error:", {
      query: text,
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw new Error(
      `Database query failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Execute a query and return a single row
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: DbParam[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// Execute a transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Database utility functions for common operations

// Users
export const userQueries = {
  findByEmail: (email: string) =>
    queryOne("SELECT * FROM users WHERE email = $1", [email]),

  findById: (id: number) => queryOne("SELECT * FROM users WHERE id = $1", [id]),

  create: (userData: { email: string; password: string; name?: string }) =>
    queryOne(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
      [userData.email, userData.password, userData.name]
    ),

  updateLastLogin: (id: number) =>
    query("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
      id,
    ]),
};

// Goals
export const goalQueries = {
  findByUserId: (userId: number) =>
    query("SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC", [
      userId,
    ]),

  findById: (id: number) => queryOne("SELECT * FROM goals WHERE id = $1", [id]),

  create: (goalData: {
    user_id: number;
    title: string;
    description?: string;
    category?: string;
    difficulty_level?: string;
    estimated_duration_weeks: number;
    timeline: object;
    ai_analysis?: object;
  }) =>
    queryOne(
      `INSERT INTO goals (user_id, title, description, category, difficulty_level, 
       estimated_duration_weeks, timeline, ai_analysis) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        goalData.user_id,
        goalData.title,
        goalData.description,
        goalData.category,
        goalData.difficulty_level,
        goalData.estimated_duration_weeks,
        JSON.stringify(goalData.timeline),
        goalData.ai_analysis ? JSON.stringify(goalData.ai_analysis) : null,
      ]
    ),

  updateStatus: (id: number, status: string) =>
    query(
      "UPDATE goals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [status, id]
    ),
};

// Milestones
export const milestoneQueries = {
  findByGoalId: (goalId: number) =>
    query(
      "SELECT * FROM milestones WHERE goal_id = $1 ORDER BY milestone_order ASC",
      [goalId]
    ),

  create: (milestoneData: {
    goal_id: number;
    title: string;
    description?: string;
    milestone_order: number;
    due_date?: string;
    depends_on_milestone_id?: number;
  }) =>
    queryOne(
      `INSERT INTO milestones (goal_id, title, description, milestone_order, 
       due_date, depends_on_milestone_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        milestoneData.goal_id,
        milestoneData.title,
        milestoneData.description,
        milestoneData.milestone_order,
        milestoneData.due_date,
        milestoneData.depends_on_milestone_id,
      ]
    ),

  markCompleted: (id: number) =>
    query(
      "UPDATE milestones SET completed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    ),
};

// Chat Messages
export const chatQueries = {
  findBySessionId: (sessionId: string) =>
    query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    ),

  createMessage: (messageData: {
    user_id: number;
    goal_id?: number;
    milestone_id?: number;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    context_data?: object;
  }) =>
    queryOne(
      `INSERT INTO chat_messages (user_id, goal_id, milestone_id, session_id, 
       role, content, context_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        messageData.user_id,
        messageData.goal_id,
        messageData.milestone_id,
        messageData.session_id,
        messageData.role,
        messageData.content,
        messageData.context_data
          ? JSON.stringify(messageData.context_data)
          : null,
      ]
    ),

  createSession: (sessionData: {
    user_id: number;
    goal_id?: number;
    title?: string;
  }) =>
    queryOne(
      "INSERT INTO chat_sessions (user_id, goal_id, title) VALUES ($1, $2, $3) RETURNING *",
      [sessionData.user_id, sessionData.goal_id, sessionData.title]
    ),

  updateSessionSummary: (
    sessionId: string,
    summary: string,
    keyPoints: string[],
    actionItems: string[]
  ) =>
    query(
      `UPDATE chat_sessions SET summary = $1, key_learning_points = $2, 
       action_items = $3, ended_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [summary, keyPoints, actionItems, sessionId]
    ),
};

// Progress Tracking
export const progressQueries = {
  recordActivity: (activityData: {
    user_id: number;
    goal_id?: number;
    milestone_id?: number;
    activity_type: string;
    activity_data?: object;
    time_spent_minutes?: number;
    completion_percentage?: number;
  }) =>
    queryOne(
      `INSERT INTO progress_tracking (user_id, goal_id, milestone_id, activity_type, 
       activity_data, time_spent_minutes, completion_percentage) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        activityData.user_id,
        activityData.goal_id,
        activityData.milestone_id,
        activityData.activity_type,
        activityData.activity_data
          ? JSON.stringify(activityData.activity_data)
          : null,
        activityData.time_spent_minutes,
        activityData.completion_percentage,
      ]
    ),

  getProgressByGoal: (userId: number, goalId: number) =>
    query(
      `SELECT * FROM progress_tracking 
       WHERE user_id = $1 AND goal_id = $2 
       ORDER BY created_at DESC`,
      [userId, goalId]
    ),

  updateMetrics: (metricsData: {
    user_id: number;
    goal_id: number;
    completion_rate: number;
    learning_velocity: number;
    streak_days?: number;
    total_time_spent_hours?: number;
    milestones_completed?: number;
  }) =>
    queryOne(
      `INSERT INTO progress_metrics (user_id, goal_id, completion_rate, 
       learning_velocity, streak_days, total_time_spent_hours, milestones_completed) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (user_id, goal_id) DO UPDATE SET
       completion_rate = EXCLUDED.completion_rate,
       learning_velocity = EXCLUDED.learning_velocity,
       streak_days = EXCLUDED.streak_days,
       total_time_spent_hours = EXCLUDED.total_time_spent_hours,
       milestones_completed = EXCLUDED.milestones_completed,
       recorded_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        metricsData.user_id,
        metricsData.goal_id,
        metricsData.completion_rate,
        metricsData.learning_velocity,
        metricsData.streak_days || 0,
        metricsData.total_time_spent_hours || 0,
        metricsData.milestones_completed || 0,
      ]
    ),
};

// Check-ins
export const checkinQueries = {
  findByUserAndGoal: (userId: number, goalId: number) =>
    query(
      "SELECT * FROM check_ins WHERE user_id = $1 AND goal_id = $2 ORDER BY created_at DESC",
      [userId, goalId]
    ),

  create: (checkinData: {
    user_id: number;
    goal_id: number;
    milestone_id?: number;
    frequency: string;
    assessment_data?: object;
    notes?: string;
    mood_rating?: number;
    confidence_rating?: number;
    next_check_in?: Date;
  }) =>
    queryOne(
      `INSERT INTO check_ins (user_id, goal_id, milestone_id, frequency, 
       assessment_data, notes, mood_rating, confidence_rating, 
       last_check_in, next_check_in) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9) RETURNING *`,
      [
        checkinData.user_id,
        checkinData.goal_id,
        checkinData.milestone_id,
        checkinData.frequency,
        checkinData.assessment_data
          ? JSON.stringify(checkinData.assessment_data)
          : null,
        checkinData.notes,
        checkinData.mood_rating,
        checkinData.confidence_rating,
        checkinData.next_check_in,
      ]
    ),

  getDueCheckIns: () =>
    query(
      "SELECT * FROM check_ins WHERE next_check_in <= CURRENT_TIMESTAMP ORDER BY next_check_in ASC"
    ),
};

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Close database connection (for graceful shutdown)
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
