import { Request, Response, NextFunction } from "express";
import { requireAuth as clerkRequireAuth } from "@clerk/express";

// This middleware automatically checks for the Authorization header
// with a valid Clerk JWT. If invalid, it returns a 401 response.
export const requireAuth = clerkRequireAuth({
  signInUrl: undefined,
});

// Helper type to extend Request with Clerk Auth
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    getToken: () => Promise<string>;
  };
}
