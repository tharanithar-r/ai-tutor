import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { analyzeGoal, GoalAnalysisInput } from "../../../../lib/gemini";
import { validateData } from "../../../../lib/validation";
import { z } from "zod";

// Validation schema for goal analysis request
const goalAnalysisSchema = z.object({
  title: z
    .string()
    .min(3, "Goal title must be at least 3 characters")
    .max(200, "Goal title must be less than 200 characters"),
  description: z
    .string()
    .min(10, "Goal description must be at least 10 characters")
    .max(1000, "Goal description must be less than 1000 characters"),
  category: z.string().optional(),
  userLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

interface JWTPayload {
  id: number;
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
    const validatedData = await validateData(goalAnalysisSchema, body);
    const { title, description, category, userLevel } = validatedData;

    // Prepare input for Gemini analysis
    const analysisInput: GoalAnalysisInput = {
      title,
      description,
      category,
      userLevel,
    };

    // Analyze goal using Gemini
    const analysis = await analyzeGoal(analysisInput);

    // Return the analysis result
    return NextResponse.json({
      success: true,
      message: "Goal analyzed successfully",
      data: {
        analysis,
        input: analysisInput,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Goal analysis error:", error);

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

    // Handle Gemini specific errors
    if (error instanceof Error) {
      if (error.message.includes("Gemini API key")) {
        return NextResponse.json(
          {
            error: "Configuration error",
            message: "AI analysis service is not properly configured",
          },
          { status: 500 }
        );
      }

      if (error.message.includes("Failed to analyze goal")) {
        return NextResponse.json(
          {
            error: "Analysis failed",
            message:
              "Unable to analyze the goal at this time. Please try again later.",
          },
          { status: 500 }
        );
      }

      if (error.message.includes("JSON")) {
        return NextResponse.json(
          {
            error: "Analysis error",
            message: "Received invalid response from AI analysis service",
          },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred during goal analysis",
      },
      { status: 500 }
    );
  }
}
