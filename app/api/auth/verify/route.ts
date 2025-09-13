import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  name?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({
        error: 'Server configuration error',
        message: 'Authentication service is not properly configured'
      }, { status: 500 });
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during token verification'
    }, { status: 500 });
  }
}
