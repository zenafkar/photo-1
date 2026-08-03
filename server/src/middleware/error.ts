import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent double-write when headers already sent (e.g., mid-stream SSE)
  if (res.headersSent) {
    return next(err);
  }

  console.error("[Error]:", err.stack);

  const isDev = process.env.NODE_ENV === "development";
  res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal Server Error",
    // Never send stack traces to clients in production
    ...(isDev && { stack: err.stack }),
  });
};
