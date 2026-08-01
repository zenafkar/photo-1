import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy and running",
    timestamp: new Date().toISOString(),
  });
});

import { getAuth } from "@clerk/express";

router.get("/auth-debug", (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const authHeader = req.headers.authorization;
    res.json({
      success: true,
      auth: auth,
      hasAuthHeader: !!authHeader,
      headerLength: authHeader?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
