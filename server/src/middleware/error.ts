import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent double-write when headers already sent (e.g., mid-stream SSE)
  if (res.headersSent) {
    return next(err);
  }

  console.error("[Error]:", err.stack);

  // Respect status code set on the error (e.g., body-parser sets 400/413/415)
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";

  res.status(status).json({
    success: false,
    message: isDev ? err.message : "Internal Server Error",
    // Never send stack traces to clients in production
    ...(isDev && { stack: err.stack }),
  });
};
