import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 generation attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan generate. Silakan coba lagi nanti." },
});

export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 telemetry events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan." },
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payment creates per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti." },
});
