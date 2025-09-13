import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validateData, registerSchema, type RegisterInput } from '../../../../lib/validation';
import { queryOne, query } from '../../../../lib/db';
import { sendVerificationEmail } from '../../../../lib/email';

interface User {
  id: number;
  email: string;
  name?: string;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData: RegisterInput = await validateData(
      registerSchema,
      body
    );
    const { email, password, name } = validatedData;

    // Check if user already exists
    const existingUser = await queryOne<User>(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (existingUser) {
      return NextResponse.json({
        error: "User already exists",
        message: "An account with this email address already exists",
      }, { status: 400 });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database with email_verified = false
    const newUser = await queryOne<User>(
      `INSERT INTO users (email, password, name, email_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, created_at`,
      [email, hashedPassword, name || null, false]
    );

    if (!newUser) {
      return NextResponse.json({
        error: 'Registration failed',
        message: 'Failed to create user account'
      }, { status: 500 });
    }

    // Create email verification token
    const tokenResult = await queryOne<{ token: string }>(
      `INSERT INTO email_verification_tokens (user_id) 
       VALUES ($1) 
       RETURNING token`,
      [newUser.id]
    );

    if (!tokenResult) {
      return NextResponse.json({
        error: 'Registration failed',
        message: 'Failed to create email verification token'
      }, { status: 500 });
    }

    // Send verification email
    try {
      await sendVerificationEmail({
        to: newUser.email,
        name: newUser.name,
        verificationToken: tokenResult.token
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email sending fails, but log the error
    }

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [
        newUser.id,
        "user_registered",
        "user",
        JSON.stringify({
          registration_method: "email",
          has_name: !!name,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    // Return success response without JWT token (user needs to verify email first)
    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          emailVerified: false,
          createdAt: newUser.created_at
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.startsWith("{")) {
      try {
        const validationError = JSON.parse(error.message);
        return NextResponse.json({
          error: "Validation failed",
          message: "Please check your input data",
          details: validationError.errors,
        }, { status: 400 });
      } catch {
        // Fall through to generic error handling
      }
    }

    // Handle database constraint errors
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({
        error: "User already exists",
        message: "An account with this email address already exists",
      }, { status: 400 });
    }

    // Generic error response
    return NextResponse.json({
      error: "Internal server error",
      message: "An unexpected error occurred during registration",
    }, { status: 500 });
  }
}
