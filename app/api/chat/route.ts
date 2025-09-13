import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface ChatRequest {
  message: string;
  userId: number;
}

interface JWTPayload {
  id: number;
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
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    // In a real application, you would:
    // 1. Retrieve user's learning context/goals from the database
    // 2. Use that context to personalize the AI response using Gemini API
    // 3. Save this interaction to the database for chat history
    
    // For now, we'll just send a generic response
    // This is a mock implementation - in a real app, you would use the Gemini API
    const aiResponse = `I received your message: "${message}". As an AI tutor, I'm here to help you with your learning goals. What specific topic would you like to discuss?`;
    
    // In a real application, you would save this interaction to the database
    
    return NextResponse.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      error: 'Failed to generate AI response'
    }, { status: 500 });
  }
}
