import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";
import {
  validateData,
  loginSchema,
  type LoginInput,
} from "../../../../lib/validation";

interface User {
  userid: number;
  email: string;
  name?: string;
  email_verified: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate request body (we only need email)
    const validatedData: LoginInput = await validateData(loginSchema, body);
    const { email } = validatedData;

    // Find the user
    const user = await queryOne<User>(
      "SELECT id, email, name, email_verified FROM users WHERE email = $1",
      [email]
    );

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message:
          "If an account with this email exists and is not verified, a verification email has been sent.",
      });
    }

    // Check if user is already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          error: "Email already verified",
          message:
            "This email address is already verified. You can log in to your account.",
        },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await query("DELETE FROM email_verification_tokens WHERE user_id = $1", [
      user.userid,
    ]);

    // Create new verification token
    const tokenResult = await queryOne<{ token: string }>(
      `INSERT INTO email_verification_tokens (user_id) 
       VALUES ($1) 
       RETURNING token`,
      [user.userid]
    );

    if (!tokenResult) {
      return NextResponse.json(
        {
          error: "Server error",
          message: "Failed to create verification token",
        },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationToken: tokenResult.token,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        {
          error: "Email sending failed",
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    // Log user activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, entity_type, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.userid,
        "verification_email_resent",
        "user",
        JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        "Verification email has been sent. Please check your inbox and spam folder.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

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
        message:
          "An unexpected error occurred while resending verification email",
      },
      { status: 500 }
    );
  }
}
