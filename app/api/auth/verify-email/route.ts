import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '../../../../lib/db';

interface VerificationToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
}

interface User {
  id: number;
  email: string;
  name?: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Verification token is required'
      }, { status: 400 });
    }

    // Find the verification token
    const verificationToken = await queryOne<VerificationToken>(
      'SELECT id, user_id, token, expires_at FROM email_verification_tokens WHERE token = $1',
      [token]
    );

    if (!verificationToken) {
      return NextResponse.json({
        error: 'Invalid token',
        message: 'The verification token is invalid or has already been used'
      }, { status: 400 });
    }

    // Check if token has expired
    if (new Date() > new Date(verificationToken.expires_at)) {
      // Clean up expired token
      await query(
        'DELETE FROM email_verification_tokens WHERE id = $1',
        [verificationToken.id]
      );

      return NextResponse.json({
        error: 'Token expired',
        message: 'The verification token has expired. Please request a new verification email'
      }, { status: 400 });
    }

    // Get user details
    const user = await queryOne<User>(
      'SELECT id, email, name, email_verified FROM users WHERE id = $1',
      [verificationToken.user_id]
    );

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        message: 'The user associated with this token was not found'
      }, { status: 400 });
    }

    // Check if user is already verified
    if (user.email_verified) {
      // Clean up token since user is already verified
      await query(
        'DELETE FROM email_verification_tokens WHERE id = $1',
        [verificationToken.id]
      );

      return NextResponse.redirect(new URL('/login?already-verified=true', request.url));
    }

    // Update user's email_verified status
    await query(
      'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Delete the verification token (one-time use)
    await query(
      'DELETE FROM email_verification_tokens WHERE id = $1',
      [verificationToken.id]
    );

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'email_verified',
        'user',
        JSON.stringify({
          verification_method: 'email_link',
          timestamp: new Date().toISOString()
        })
      ]
    );

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during email verification'
    }, { status: 500 });
  }
}
