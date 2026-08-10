import { Request, Response, NextFunction } from "express";
import { ErrorCodes, errorBody } from "./errorContract.js";

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

  const body = errorBody(
    ErrorCodes.INTERNAL_ERROR,
    isDev ? err.message : "Internal Server Error",
    // Never send stack traces to clients in production
    ...(isDev && err.stack ? [{ stack: err.stack }] : []),
  );

  // Attach request_id from res.locals (set by requestIdMiddleware)
  if (res.locals.requestId) {
    body.request_id = res.locals.requestId;
  }

  res.status(status).json(body);
};
