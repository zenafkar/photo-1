import dotenv from 'dotenv';
dotenv.config();

// Simple in-memory rate limiter for specific actions
const actionHistory: Record<string, number[]> = {};

export const guardrails = {
  // Check if feature is enabled in .env
  isFeatureEnabled(featureFlag: string): boolean {
    return process.env[featureFlag] === 'true';
  },

  // Check rate limit for an action
  // maxAttempts in windowMs
  checkRateLimit(actionName: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    if (!actionHistory[actionName]) {
      actionHistory[actionName] = [];
    }
    
    // Clean up old entries
    actionHistory[actionName] = actionHistory[actionName].filter(time => now - time < windowMs);
    
    if (actionHistory[actionName].length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Record new attempt
    actionHistory[actionName].push(now);
    return true;
  },
  
  // Sanitize data before sending it out
  sanitizeData(data: any): any {
    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    if (!stringified) return data;
    
    // Simple regex to mask basic secrets (naive implementation for demonstration)
    return stringified.replace(/(password|secret|token|key)["'\s:=]+([^"',\s}]+)/gi, '$1" : "***MASKED***"');
  }
};
