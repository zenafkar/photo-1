import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { isDatabaseUnavailable, prisma } from "../config/prisma.js";
import { createTicket, consumeTicket } from "../services/userTicketStore.js";
import { dashboardEvents, type DashboardEvent } from "../services/dashboardEvents.js";

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        credits: { select: { remainingCredits: true, planType: true, version: true } },
        generations: {
          where: { status: "completed", processedUrl: { not: null } },
          take: 15,
          orderBy: { createdAt: "desc" },
          select: { id: true, processedUrl: true, preset: true, status: true, createdAt: true },
        },
      },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            clerkId,
            email: `${clerkId}@placeholder.com`,
            credits: { create: { remainingCredits: 3, planType: "free" } },
          },
          include: {
            credits: { select: { remainingCredits: true, planType: true, version: true } },
            generations: {
              where: { status: "completed", processedUrl: { not: null } },
              take: 15,
              orderBy: { createdAt: "desc" },
              select: { id: true, processedUrl: true, preset: true, status: true, createdAt: true },
            },
          },
        });
      } catch (createError) {
        user = await prisma.user.findUnique({
          where: { clerkId },
          include: {
            credits: { select: { remainingCredits: true, planType: true, version: true } },
            generations: {
              where: { status: "completed", processedUrl: { not: null } },
              take: 15,
              orderBy: { createdAt: "desc" },
              select: { id: true, processedUrl: true, preset: true, status: true, createdAt: true },
            },
          },
        });
        if (!user) throw createError;
      }
    } else if (!user.credits) {
      const newCredits = await prisma.userCredit.create({
        data: { userId: user.id, remainingCredits: 3, planType: "free" },
        select: { remainingCredits: true, planType: true, version: true },
      });
      user.credits = newCredits;
    }

    const generationsLatestTs =
      user.generations.length > 0
        ? user.generations[0].createdAt.toISOString()
        : null;

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        generationsLatestTs,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user /user/me:", error?.message || error);
    if (isDatabaseUnavailable(error)) {
      res.setHeader("Retry-After", "5");
      return res.status(503).json({
        success: false,
        code: "DATABASE_UNAVAILABLE",
        message: "Database sedang menyala. Data dashboard akan dicoba kembali otomatis.",
        retryable: true,
        retryAfter: 5,
      });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createEventTicket = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const ticket = createTicket(clerkId);
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (error: any) {
    console.error("Error creating event ticket:", error?.message || error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const streamUserEvents = async (req: Request, res: Response): Promise<any> => {
  const ticket = req.params.ticket as string;
  if (!ticket) {
    return res.status(400).json({ success: false, message: "Ticket required" });
  }

  const clerkId = consumeTicket(ticket);
  if (!clerkId) {
    return res.status(401).json({ success: false, message: "Ticket invalid or expired" });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.id })}\n\n`);

  const onEvent = (event: DashboardEvent) => {
    if (event.userId !== user.id) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 20_000);

  dashboardEvents.on("event", onEvent);

  req.on("close", () => {
    clearInterval(heartbeat);
    dashboardEvents.off("event", onEvent);
  });
};
