import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { validateData, createGoalSchema } from "../../../lib/validation";
import { queryOne, query } from "../../../lib/db";
import { analyzeGoal } from "../../../lib/gemini";

// Database interfaces
interface Goal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category?: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_weeks: number;
  timeline: Record<string, unknown>;
  ai_analysis: Record<string, unknown>;
  status: "active" | "completed" | "paused" | "archived";
  created_at: Date;
  updated_at: Date;
}

interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  description: string;
  milestone_order: number;
  due_date?: Date;
  completed: boolean;
  completed_at?: Date;
  depends_on_milestone_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface JWTPayload {
  userId: number;
  email: string;
  name?: string;
}

async function authenticateRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Get all goals for the authenticated user
    const goals = await query<Goal>(
      `SELECT * FROM goals 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.userId]
    );

    // Get milestones for each goal
    const goalsWithMilestones = await Promise.all(
      goals.map(async (goal) => {
        const milestones = await query<Milestone>(
          `SELECT * FROM milestones 
           WHERE goal_id = $1 
           ORDER BY milestone_order ASC`,
          [goal.id]
        );

        return {
          ...goal,
          milestones: milestones || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: goalsWithMilestones,
    });
  } catch (err) {
    console.error("Goals fetch error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch goals",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = await validateData(createGoalSchema, body);
    const { title, description, category } = validatedData;

    // Analyze goal using AI to generate timeline and milestones
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeGoal({
        title,
        description: description || "",
        category,
      });
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      // Continue without AI analysis if it fails
      aiAnalysis = null;
    }

    // Create goal in database
    const newGoal = await queryOne<Goal>(
      `INSERT INTO goals (
        user_id, title, description, category, 
        difficulty_level, estimated_duration_weeks, 
        timeline, ai_analysis, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        user.userId,
        title,
        description,
        category || null,
        aiAnalysis?.difficulty_level || "beginner",
        aiAnalysis?.estimated_duration_weeks || 4,
        JSON.stringify(aiAnalysis?.timeline || []),
        JSON.stringify(aiAnalysis || {}),
        "active",
      ]
    );

    if (!newGoal) {
      return NextResponse.json(
        {
          error: "Goal creation failed",
          message: "Failed to create goal in database",
        },
        { status: 500 }
      );
    }

    // Create milestones from AI analysis
    const milestones: Milestone[] = [];
    if (aiAnalysis?.milestones) {
      for (let i = 0; i < aiAnalysis.milestones.length; i++) {
        const milestone = aiAnalysis.milestones[i];

        // Calculate due date based on milestone week
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + milestone.week * 7);

        const newMilestone = await queryOne<Milestone>(
          `INSERT INTO milestones (
            goal_id, title, description, milestone_order, due_date
          ) VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`,
          [newGoal.id, milestone.title, milestone.description, i + 1, dueDate]
        );

        if (newMilestone) {
          milestones.push(newMilestone);
        }
      }
    }

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        "goal_created",
        "goal",
        newGoal.id,
        JSON.stringify({
          title,
          category,
          has_ai_analysis: !!aiAnalysis,
          milestones_count: milestones.length,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Goal created successfully",
        data: {
          goal: newGoal,
          milestones,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating goal:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.startsWith("{")) {
      try {
        const validationError = JSON.parse(error.message);
        return NextResponse.json(
          {
            error: "Validation failed",
            message: "Please check your input data",
            details: validationError.errors,
          },
          { status: 400 }
        );
      } catch {
        // Fall through to generic error handling
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to create goal",
      },
      { status: 500 }
    );
  }
}
