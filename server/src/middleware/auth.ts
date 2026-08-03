import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

// Ensure API requests return 401 JSON instead of 302 redirect when unauthenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    // Log only metadata, never the auth object (contains PII/session claims)
    console.warn(
      "[Auth] requireAuth failed —",
      `hasAuth: ${!!auth},`,
      `hasUserId: ${!!auth?.userId},`,
      `hasToken: ${req.headers.authorization ? "yes" : "no"},`,
      `ip: ${req.ip}`
    );
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Silakan login terlebih dahulu.",
    });
  }
  next();
};

// Helper type to extend Request with Clerk Auth
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
  };
}
