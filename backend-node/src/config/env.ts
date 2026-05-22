import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

const envSchema = z.object({
  NODE_ENV:   z.enum(["development", "production", "test"]).default("development"),
  PORT:       z.string().default("3001").transform(Number),
  API_PREFIX: z.string().default("/api/v1"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET:          z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN:      z.string().default("24h"),
  JWT_REFRESH_SECRET:  z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL:   z.string().default("gpt-4o-mini"),

  UPLOAD_DIR:       z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.string().default("10").transform(Number),

  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX:       z.string().default("100").transform(Number),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:")
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
