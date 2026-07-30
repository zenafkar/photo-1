import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[Error]:", err.stack);
  
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // In production, we typically don't send the full stack trace to the client
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
