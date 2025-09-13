import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/db';

interface JWTPayload {
  userId: number;
  email: string;
  name?: string;
}

async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return null;
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const goalId = searchParams.get('goal_id');

    // Get user's progress analytics
    const analytics = await getUserAnalytics(user.userId, parseInt(timeframe), goalId);

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}

interface ActivityRow {
  activity_type: string;
  count: string;
  date: string;
}

interface GoalRow {
  id: string;
  title: string;
  status: string;
  progress: number;
  target_date: string;
  created_at: string;
  completed_at: string;
  total_milestones: string;
  completed_milestones: string;
}

interface VelocityRow {
  date: string;
  activities_count: string;
}

async function getUserAnalytics(userId: number, timeframeDays: number, goalId?: string | null) {
  const pool = getDatabase();
  const timeframeCondition = `AND created_at >= NOW() - INTERVAL '${timeframeDays} days'`;
  const goalCondition = goalId ? `AND entity_type = 'goal' AND entity_id = ${goalId}` : '';

  // Overall activity stats
  const activityStatsQuery = `
    SELECT 
      activity_type,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM user_activities
    WHERE user_id = $1 ${timeframeCondition} ${goalCondition}
    GROUP BY activity_type, DATE(created_at)
    ORDER BY date DESC
  `;

  const activityStats = await pool.query<ActivityRow>(activityStatsQuery, [userId]);

  // Goal completion rates
  const goalStatsQuery = `
    SELECT 
      g.id,
      g.title,
      g.status,
      COALESCE(
        (SELECT COUNT(*) FROM milestones WHERE goal_id = g.id AND completed = true)::float / 
        NULLIF((SELECT COUNT(*) FROM milestones WHERE goal_id = g.id), 0) * 100, 
        0
      ) as progress,
      g.timeline->>'target_date' as target_date,
      g.created_at,
      CASE WHEN g.status = 'completed' THEN g.updated_at ELSE NULL END as completed_at,
      COUNT(m.id) as total_milestones,
      COUNT(CASE WHEN m.completed = true THEN 1 END) as completed_milestones
    FROM goals g
    LEFT JOIN milestones m ON g.id = m.goal_id
    WHERE g.user_id = $1 ${goalId ? `AND g.id = '${goalId}'` : ''}
    GROUP BY g.id, g.title, g.status, g.created_at, g.updated_at, g.timeline
    ORDER BY g.created_at DESC
  `;

  const goalStats = await pool.query<GoalRow>(goalStatsQuery, [userId]);

  // Learning velocity (activities per day)
  const velocityQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as activities_count
    FROM user_activities
    WHERE user_id = $1 ${timeframeCondition} ${goalCondition}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  const velocity = await pool.query<VelocityRow>(velocityQuery, [userId]);

  // Chat engagement stats
  const chatStatsQuery = `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT DATE(created_at)) as active_days,
      AVG(LENGTH(message)) as avg_message_length
    FROM chat_messages
    WHERE user_id = $1 AND sender = 'user' ${timeframeCondition}
  `;

  const chatStats = await pool.query(chatStatsQuery, [userId]);

  // Streak calculation
  const streakQuery = `
    WITH daily_activity AS (
      SELECT DISTINCT DATE(created_at) as activity_date
      FROM user_activities
      WHERE user_id = $1 ${goalCondition}
      ORDER BY activity_date DESC
    ),
    streak_calc AS (
      SELECT 
        activity_date,
        activity_date - ROW_NUMBER() OVER (ORDER BY activity_date DESC)::integer as streak_group
      FROM daily_activity
    )
    SELECT COUNT(*) as current_streak
    FROM streak_calc
    WHERE streak_group = (
      SELECT streak_group 
      FROM streak_calc 
      WHERE activity_date = CURRENT_DATE
      LIMIT 1
    )
  `;

  const streak = await pool.query(streakQuery, [userId]);

  // Calculate learning velocity average
  const avgVelocity = velocity.rows.length > 0 
    ? velocity.rows.reduce((sum: number, day: VelocityRow) => sum + parseInt(day.activities_count), 0) / velocity.rows.length 
    : 0;

  // Calculate completion rate
  const totalGoals = goalStats.rows.length;
  const completedGoals = goalStats.rows.filter((g: GoalRow) => g.status === 'completed').length;
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return {
    summary: {
      total_activities: activityStats.rows.reduce((sum: number, row: ActivityRow) => sum + parseInt(row.count), 0),
      active_days: velocity.rows.length,
      current_streak: streak.rows[0]?.current_streak || 0,
      avg_daily_velocity: Math.round(avgVelocity * 100) / 100,
      goal_completion_rate: Math.round(completionRate * 100) / 100,
      total_goals: totalGoals,
      completed_goals: completedGoals
    },
    activity_breakdown: activityStats.rows.reduce((acc: Record<string, number>, row: ActivityRow) => {
      acc[row.activity_type] = (acc[row.activity_type] || 0) + parseInt(row.count);
      return acc;
    }, {}),
    daily_velocity: velocity.rows,
    goal_progress: goalStats.rows.map((goal: GoalRow) => ({
      id: goal.id,
      title: goal.title,
      status: goal.status,
      progress: goal.progress,
      target_date: goal.target_date,
      total_milestones: parseInt(goal.total_milestones),
      completed_milestones: parseInt(goal.completed_milestones),
      completion_rate: parseInt(goal.total_milestones) > 0 
        ? Math.round((parseInt(goal.completed_milestones) / parseInt(goal.total_milestones)) * 100) 
        : 0,
      days_since_created: Math.floor((new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      is_overdue: goal.target_date && new Date(goal.target_date) < new Date() && goal.status !== 'completed'
    })),
    chat_engagement: {
      total_messages: parseInt(chatStats.rows[0]?.total_messages || 0),
      active_chat_days: parseInt(chatStats.rows[0]?.active_days || 0),
      avg_message_length: Math.round(parseFloat(chatStats.rows[0]?.avg_message_length || 0))
    },
    timeframe_days: timeframeDays
  };
}
