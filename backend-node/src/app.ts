import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "@/middlewares/error.middleware";

import { authRouter } from "@/modules/auth/auth.routes";
import { projectsRouter } from "@/modules/projects/projects.routes";
import { tasksRouter } from "@/modules/tasks/tasks.routes";
import { hseRouter } from "@/modules/hse/hse.routes";
import { aiRouter } from "@/modules/ai/ai.routes";
import { analyticsRouter } from "@/modules/analytics/analytics.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.routes";
import { dashboardRouter } from "@/modules/dashboard/diagnostics.routes";
import { reportsRouter } from "@/modules/reports/reports.routes";
import { documentsRouter } from "@/modules/documents/documents.routes";

const app = express();

app.set("trust proxy", 1);

// ── Security & CORS ──────────────────────────────────────────
app.use(cors({
  origin: env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(helmet());

app.use(rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: Number(env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Trop de requêtes, réessayez plus tard." },
}));

// ── Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── Logging ───────────────────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ENGIPILOT API", timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
const API = env.API_PREFIX || "/api/v1";

app.use(`${API}/auth`, authRouter);
app.use(`${API}/projects`, projectsRouter);
app.use(`${API}/tasks`, tasksRouter);
app.use(`${API}/hse`, hseRouter);
app.use(`${API}/ai`, aiRouter);
app.use(`${API}/analytics`, analyticsRouter);
app.use(`${API}/notifications`, notificationsRouter);
app.use(`${API}/dashboard`, dashboardRouter);
app.use(`${API}/reports`, reportsRouter);
app.use(`${API}/documents`, documentsRouter);

// ── 404 + Error handlers ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { app };