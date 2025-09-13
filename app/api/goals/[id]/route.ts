import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryOne, query } from '../../../../lib/db';
import { validateData } from '../../../../lib/validation';
import { z } from 'zod';

// Validation schemas
const updateGoalSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(1000).optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'archived']).optional(),
});

const updateMilestoneSchema = z.object({
  milestoneId: z.number(),
  completed: z.boolean().optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(500).optional(),
});

// Database interfaces
interface Goal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_weeks: number;
  timeline: Record<string, unknown>;
  ai_analysis: Record<string, unknown>;
  status: 'active' | 'completed' | 'paused' | 'archived';
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

interface ProgressMetrics {
  completion_rate: number;
  learning_velocity: number;
  streak_days: number;
  total_time_spent_hours: number;
  milestones_completed: number;
}

interface CheckIn {
  id: number;
  frequency: string;
  assessment_data: Record<string, unknown>;
  notes: string;
  mood_rating: number;
  confidence_rating: number;
  last_check_in: string;
  next_check_in: string;
}

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        error: 'Invalid goal ID',
        message: 'Goal ID must be a valid number'
      }, { status: 400 });
    }

    // Get goal details
    const goal = await queryOne<Goal>(
      `SELECT * FROM goals 
       WHERE id = $1 AND user_id = $2`,
      [goalId, user.userId]
    );

    if (!goal) {
      return NextResponse.json({
        error: 'Goal not found',
        message: 'The requested goal was not found or you do not have access to it'
      }, { status: 404 });
    }

    // Get milestones for this goal
    const milestones = await query<Milestone>(
      `SELECT * FROM milestones 
       WHERE goal_id = $1 
       ORDER BY milestone_order ASC`,
      [goalId]
    );

    // Get progress metrics (mock data for now)
    const progressMetrics: ProgressMetrics = {
      completion_rate: milestones.length > 0 ? (milestones.filter(m => m.completed).length / milestones.length) * 100 : 0,
      learning_velocity: 1.2,
      streak_days: 5,
      total_time_spent_hours: 24,
      milestones_completed: milestones.filter(m => m.completed).length
    };

    // Get recent check-ins (mock data for now)
    const recentCheckIns: CheckIn[] = [];

    return NextResponse.json({
      success: true,
      data: {
        goal,
        milestones,
        progressMetrics,
        recentCheckIns
      }
    });
  } catch (error) {
    console.error('Error fetching goal details:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch goal details'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        error: 'Invalid goal ID',
        message: 'Goal ID must be a valid number'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = await validateData(updateGoalSchema, body);

    // Check if goal exists and belongs to user
    const existingGoal = await queryOne<Goal>(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, user.userId]
    );

    if (!existingGoal) {
      return NextResponse.json({
        error: 'Goal not found',
        message: 'The requested goal was not found or you do not have access to it'
      }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(validatedData.title);
    }
    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(validatedData.description);
    }
    if (validatedData.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(validatedData.category);
    }
    if (validatedData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(validatedData.status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        error: 'No updates provided',
        message: 'At least one field must be provided for update'
      }, { status: 400 });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(goalId, user.userId);

    const updatedGoal = await queryOne<Goal>(
      `UPDATE goals 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
       RETURNING *`,
      updateValues
    );

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        'goal_updated',
        'goal',
        goalId,
        JSON.stringify({
          updated_fields: Object.keys(validatedData),
          timestamp: new Date().toISOString()
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Goal updated successfully',
      data: updatedGoal
    });
  } catch (error) {
    console.error('Error updating goal:', error);

    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        const validationError = JSON.parse(error.message);
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Please check your input data',
          details: validationError.errors
        }, { status: 400 });
      } catch {
        // Fall through to generic error handling
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update goal'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        error: 'Invalid goal ID',
        message: 'Goal ID must be a valid number'
      }, { status: 400 });
    }

    // Check if goal exists and belongs to user
    const existingGoal = await queryOne<Goal>(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, user.userId]
    );

    if (!existingGoal) {
      return NextResponse.json({
        error: 'Goal not found',
        message: 'The requested goal was not found or you do not have access to it'
      }, { status: 404 });
    }

    // Delete associated milestones first (due to foreign key constraints)
    await query(
      `DELETE FROM milestones WHERE goal_id = $1`,
      [goalId]
    );

    // Delete the goal
    await query(
      `DELETE FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, user.userId]
    );

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        'goal_deleted',
        'goal',
        goalId,
        JSON.stringify({
          goal_title: existingGoal.title,
          timestamp: new Date().toISOString()
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to delete goal'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        error: 'Invalid goal ID',
        message: 'Goal ID must be a valid number'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = await validateData(updateMilestoneSchema, body);

    // Check if goal exists and belongs to user
    const existingGoal = await queryOne<Goal>(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, user.userId]
    );

    if (!existingGoal) {
      return NextResponse.json({
        error: 'Goal not found',
        message: 'The requested goal was not found or you do not have access to it'
      }, { status: 404 });
    }

    // Update milestone
    const { milestoneId, completed, title, description } = validatedData;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (completed !== undefined) {
      updateFields.push(`completed = $${paramIndex++}`);
      updateValues.push(completed);
      
      if (completed) {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      } else {
        updateFields.push(`completed_at = NULL`);
      }
    }
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(milestoneId, goalId);

    const updatedMilestone = await queryOne<Milestone>(
      `UPDATE milestones 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex++} AND goal_id = $${paramIndex++} 
       RETURNING *`,
      updateValues
    );

    if (!updatedMilestone) {
      return NextResponse.json({
        error: 'Milestone not found',
        message: 'The requested milestone was not found'
      }, { status: 404 });
    }

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, entity_id, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.userId,
        completed !== undefined ? (completed ? 'milestone_completed' : 'milestone_uncompleted') : 'milestone_updated',
        'milestone',
        milestoneId,
        JSON.stringify({
          goal_id: goalId,
          milestone_title: updatedMilestone.title,
          timestamp: new Date().toISOString()
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Milestone updated successfully',
      data: updatedMilestone
    });
  } catch (error) {
    console.error('Error updating milestone:', error);

    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        const validationError = JSON.parse(error.message);
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Please check your input data',
          details: validationError.errors
        }, { status: 400 });
      } catch {
        // Fall through to generic error handling
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update milestone'
    }, { status: 500 });
  }
}
