import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { queryOne } from "./db";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: AuthenticatedUser;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Authentication middleware for Next.js API routes
 * Validates JWT token and attaches user data to request
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Missing or invalid authorization header",
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET environment variable is not set");
        return res.status(500).json({
          error: "Server configuration error",
          message: "Authentication service is not properly configured",
        });
      }

      let decoded: jwt.JwtPayload & {
        userId: number;
        email: string;
        name?: string;
      };
      try {
        decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & {
          userId: number;
          email: string;
          name?: string;
        };
      } catch {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or expired token",
        });
      }

      // Validate token payload
      if (!decoded.userId || !decoded.email) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token payload",
        });
      }

      // Verify user still exists in database
      const user = await queryOne<AuthenticatedUser>(
        "SELECT id, email, name FROM users WHERE id = $1 AND email = $2",
        [decoded.userId, decoded.email]
      );

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User not found or token invalid",
        });
      }

      // Attach user to request object
      (req as AuthenticatedRequest).user = user;

      // Call the protected handler
      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Authentication failed due to server error",
      });
    }
  };
}

/**
 * Extract user from JWT token without database validation
 * Useful for WebSocket authentication where database calls should be minimal
 */
export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & {
      userId: number;
      email: string;
      name?: string;
    };

    if (!decoded.userId || !decoded.email) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Generate JWT token for user
 * Used by both registration and login endpoints
 */
export function generateToken(user: AuthenticatedUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

export function withOptionalAuth(
  handler: (
    req: NextApiRequest & { user?: AuthenticatedUser },
    res: NextApiResponse
  ) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const user = verifyToken(token);

        if (user) {
          // Verify user exists in database
          const dbUser = await queryOne<AuthenticatedUser>(
            "SELECT id, email, name FROM users WHERE id = $1",
            [user.id]
          );

          if (dbUser) {
            (req as NextApiRequest & { user?: AuthenticatedUser }).user =
              dbUser;
          }
        }
      }

      return handler(req as NextApiRequest & { user?: AuthenticatedUser }, res);
    } catch (error) {
      console.error("Optional auth middleware error:", error);
      // Continue without authentication on error
      return handler(req as NextApiRequest & { user?: AuthenticatedUser }, res);
    }
  };
}

/**
 * Express middleware for WebSocket authentication
 * Used by the Express server for Socket.io connections
 */
export function authenticateSocket(
  token: string
): Promise<AuthenticatedUser | null> {
  return new Promise(async (resolve) => {
    try {
      const user = verifyToken(token);
      if (!user) {
        resolve(null);
        return;
      }

      // Verify user exists in database
      const dbUser = await queryOne<AuthenticatedUser>(
        "SELECT id, email, name FROM users WHERE id = $1",
        [user.id]
      );

      resolve(dbUser);
    } catch (error) {
      console.error("Socket authentication error:", error);
      resolve(null);
    }
  });
}
