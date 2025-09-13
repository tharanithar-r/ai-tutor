import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateData,
  loginSchema,
  type LoginInput,
} from "../../../../lib/validation";
import { queryOne, query } from "../../../../lib/db";

interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  email_verified: boolean;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData: LoginInput = await validateData(loginSchema, body);
    const { email, password } = validatedData;

    const user = await queryOne<User>(
      "SELECT id, email, password, name, email_verified, created_at FROM users WHERE email = $1",
      [email]
    );

    if (!user) {
      return NextResponse.json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      }, { status: 401 });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json({
        error: "Email not verified",
        message: "Please verify your email address before logging in. Check your inbox for the verification email.",
        requiresVerification: true
      }, { status: 403 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return NextResponse.json({
        error: "Server configuration error",
        message: "Authentication service is not properly configured",
      }, { status: 500 });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Get client IP and user agent
    const forwardedFor = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");
    const clientIP = forwardedFor || "unknown";

    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        "user_login",
        "user",
        JSON.stringify({
          login_method: "email",
          ip_address: clientIP,
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
        },
        token,
        expiresIn: "7d",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

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

    return NextResponse.json({
      error: "Internal server error",
      message: "An unexpected error occurred during login",
    }, { status: 500 });
  }
}
