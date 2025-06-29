import { Request, Response, NextFunction } from "express";
import { AppError } from "./index";

interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  details?: unknown;
  timestamp: string;
  stack?: string;
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
    message: "Something went wrong! Please try again",
    timestamp: new Date().toISOString(),
  };

  // Handle AppError instances
  if (err instanceof AppError) {
    console.error(
      `[${req.method}] ${req.path} -> ${err.message} (${err.statusCode})`,
      err.details ? `\nDetails: ${JSON.stringify(err.details, null, 2)}` : ""
    );

    errorResponse.status = err.statusCode < 500 ? "fail" : "error";
    errorResponse.message = err.message;

    if (err.details) {
      errorResponse.details = err.details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === "development") {
      errorResponse.stack = err.stack;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle unexpected errors
  console.error("Unhandled error:", err);

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  return res.status(500).json(errorResponse);
};

// Error handler wrapper for async functions
export const catchAsync =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
