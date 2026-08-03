import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

// Create a global event emitter for telemetry events
export const telemetryEmitter = new EventEmitter();

// Middleware to track request latency and catch unhandled 5xx errors
export const telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Intercept the finish event to log latency and status
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 500;
    
    // Detect slow requests (> 2000ms)
    const isSlow = duration > 2000;

    if (isError || isSlow) {
      telemetryEmitter.emit('anomaly', {
        type: isError ? 'HTTP_5XX' : 'HIGH_LATENCY',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
        // Never include raw request body/query — may contain base64 images or PII
        bodySize: parseInt(req.headers["content-length"] || "0", 10) || 0,
        queryKeys: req.query ? Object.keys(req.query) : [],
      });
    }
  });

  next();
};

// Global error handler wrapper for Express
export const telemetryErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  telemetryEmitter.emit('anomaly', {
    type: 'UNHANDLED_EXCEPTION',
    method: req.method,
    url: req.originalUrl,
    errorName: err.name,
    errorMessage: err.message,
    stackTrace: err.stack,
    timestamp: new Date().toISOString(),
    // Only include size metadata, never raw body/query content
    bodySize: parseInt(req.headers["content-length"] || "0", 10) || 0,
    queryKeys: req.query ? Object.keys(req.query) : [],
  });

  next(err);
};

// Listen for global unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  telemetryEmitter.emit('anomaly', {
    type: 'UNHANDLED_PROMISE_REJECTION',
    errorMessage: reason?.message || String(reason),
    stackTrace: reason?.stack || 'No stack trace',
    timestamp: new Date().toISOString(),
  });
});

// Listen for uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  telemetryEmitter.emit('anomaly', {
    type: 'UNCAUGHT_EXCEPTION',
    errorName: err.name,
    errorMessage: err.message,
    stackTrace: err.stack,
    timestamp: new Date().toISOString(),
  });

  // Exit the process after emitting telemetry so PM2 can restart it cleanly.
  // Node leaves the process in an undefined state after uncaughtException.
  setTimeout(() => process.exit(1), 500);
});
