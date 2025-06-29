import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  details?: unknown;
  timestamp: string;
  stack?: string;
}

type ErrorDetails = Record<string, unknown> | string | unknown[];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: ErrorDetails
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific Error Classes
export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: ErrorDetails) {
    super(message, 400, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: ErrorDetails) {
    super(message, 404, true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = "You are not authorized", details?: ErrorDetails) {
    super(message, 401, true, details);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You cannot perform this action", details?: ErrorDetails) {
    super(message, 403, true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ServerError extends AppError {
  constructor(message = "Something went wrong! Please try again", details?: ErrorDetails) {
    super(message, 500, true, details);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ErrorDetails) {
    super(message, 400, true, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database error", details?: ErrorDetails) {
    super(message, 500, true, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests! Please try again later", details?: ErrorDetails) {
    super(message, 429, true, details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  const errorResponse: ErrorResponse = {
    status: "error",
    message: err.message || "Something went wrong! Please try again",
    timestamp: new Date().toISOString(),
  };

  // Handle AppError instances
  if (err instanceof AppError) {
    console.error(
      `[${req.method}] ${req.path} -> Status ${err.statusCode}: ${err.message}`,
      err.details ? `\nDetails: ${JSON.stringify(err.details, null, 2)}` : ""
    );

    errorResponse.status = err.statusCode < 500 ? "fail" : "error";
    errorResponse.message = err.message;

    if (err.details) {
      errorResponse.details = err.details;
    }

    if (process.env.NODE_ENV === "development") {
      errorResponse.stack = err.stack;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle other errors
  console.error(`[UNHANDLED ERROR] ${req.method} ${req.path}:`, err);

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  return res.status(500).json(errorResponse);
};

export const catchAsync = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Convert to AppError if it isn't already
      if (!(err instanceof AppError)) {
        err = new ServerError(err.message);
      }
      next(err);
    });
  };