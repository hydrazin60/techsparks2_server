import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
    }
  }
}

interface AuthResponse {
  success: boolean;
  message: string;
}

interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
}

// Helper function to parse cookies
const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
    return cookies;
  }, {} as Record<string, string>);
};

export const isAuthenticated = (
  req: Request,
  res: Response<AuthResponse>,
  next: NextFunction
): void | Response<AuthResponse> => {
  try {
    // 1. Parse cookies from header
    const cookies = parseCookies(req.headers.cookie);
    let token = cookies.accessToken; // Get the accessToken cookie specifically
    
    // 2. Fallback to Authorization header if no cookie
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      console.log("No token found in:", {
        cookies: req.headers.cookie,
        headers: req.headers,
      });
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // Verify the token with the correct secret
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (error: unknown) {
    console.error(
      "Authentication error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    const response: AuthResponse = {
      success: false,
      message: "Authentication failed",
    };

    if (error instanceof jwt.TokenExpiredError) {
      response.message = "Token expired - please login again";
    } else if (error instanceof jwt.JsonWebTokenError) {
      response.message = "Invalid token format";
    }

    return res.status(401).json(response);
  }
};