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

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { activity_type, goal_id, milestone_id, metadata } = await request.json();

    if (!activity_type) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }

    // Record user activity
    const pool = getDatabase();
    const result = await pool.query(
      `INSERT INTO user_activities (
        user_id, activity_type, goal_id, milestone_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW()) 
      RETURNING id, created_at`,
      [user.userId, activity_type, goal_id || null, milestone_id || null, metadata || {}]
    );

    // Update goal progress if applicable
    if (goal_id && activity_type === 'milestone_completed') {
      await updateGoalProgress(user.userId, goal_id);
    }

    return NextResponse.json({
      success: true,
      activity_id: result.rows[0].id,
      timestamp: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to record progress' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goal_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        ua.id,
        ua.activity_type,
        ua.goal_id,
        ua.milestone_id,
        ua.metadata,
        ua.created_at,
        g.title as goal_title,
        m.title as milestone_title
      FROM user_activities ua
      LEFT JOIN goals g ON ua.goal_id = g.id
      LEFT JOIN milestones m ON ua.milestone_id = m.id
      WHERE ua.user_id = $1
    `;
    
    const params = [user.userId];
    
    if (goalId) {
      query += ` AND ua.goal_id = $${params.length + 1}`;
      params.push(parseInt(goalId));
    }
    
    query += ` ORDER BY ua.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const pool = getDatabase();
    const result = await pool.query(query, params);

    return NextResponse.json({
      activities: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Progress retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress' },
      { status: 500 }
    );
  }
}

async function updateGoalProgress(userId: number, goalId: string) {
  try {
    const pool = getDatabase();
    
    // Get total milestones for the goal
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM milestones WHERE goal_id = $1',
      [goalId]
    );
    
    // Get completed milestones for the goal
    const completedResult = await pool.query(
      `SELECT COUNT(DISTINCT milestone_id) as completed 
       FROM user_activities 
       WHERE user_id = $1 AND goal_id = $2 AND activity_type = 'milestone_completed'`,
      [userId, goalId]
    );
    
    const total = parseInt(totalResult.rows[0].total);
    const completed = parseInt(completedResult.rows[0].completed);
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update goal progress
    await pool.query(
      'UPDATE goals SET progress = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [progressPercentage, goalId, userId]
    );
    
    // Mark goal as completed if all milestones are done
    if (progressPercentage === 100) {
      await pool.query(
        'UPDATE goals SET status = $1, completed_at = NOW() WHERE id = $2 AND user_id = $3',
        ['completed', goalId, userId]
      );
    }
    
  } catch (error) {
    console.error('Error updating goal progress:', error);
  }
}
