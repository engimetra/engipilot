import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
import rateLimit from "express-rate-limit"

import { env } from "@/config/env"
import { errorHandler, notFoundHandler } from "@/middlewares/error.middleware"

import { authRouter }          from "@/modules/auth/auth.routes"
import { projectsRouter }      from "@/modules/projects/projects.routes"
import { tasksRouter }         from "@/modules/tasks/tasks.routes"
import { hseRouter }           from "@/modules/hse/hse.routes"
import { aiRouter }            from "@/modules/ai/ai.routes"
import { analyticsRouter }     from "@/modules/analytics/analytics.routes"
import { notificationsRouter } from "@/modules/notifications/notifications.routes"

const app = express()

// ── Security ─────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  message:  { success: false, message: "Trop de requêtes — réessayez plus tard" },
}))

// ── Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())

// ── Logging ───────────────────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"))
}

// ── Health ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ENGIPILOT API", version: "1.0.0", timestamp: new Date().toISOString() })
})

// ── API Routes ────────────────────────────────────────────────
const API = env.API_PREFIX

app.use(`${API}/auth`,          authRouter)
app.use(`${API}/projects`,      projectsRouter)
app.use(`${API}/tasks`,         tasksRouter)
app.use(`${API}/hse`,           hseRouter)
app.use(`${API}/ai`,            aiRouter)
app.use(`${API}/analytics`,     analyticsRouter)
app.use(`${API}/notifications`, notificationsRouter)

// ── 404 + Error handlers ──────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export { app }
