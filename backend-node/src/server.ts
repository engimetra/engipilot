import { app } from "./app"
import { env } from "@/config/env"
import { connectDB, disconnectDB } from "@/config/database"

async function bootstrap(): Promise<void> {
  try {
    console.log("🚀 Starting ENGIPILOT backend...")

    // 1. Connexion DB
    await connectDB()
    console.log("✅ Database connected")

    // 2. Debug port
    console.log("PORT =", env.PORT)

    // 3. Start server
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║          ENGIPILOT API — Node.js Backend          ║
╠══════════════════════════════════════════════════╣
║  Port    : ${env.PORT}
║  Env     : ${env.NODE_ENV}
║  API     : ${env.API_PREFIX}
║  DB      : MySQL (Prisma)
╚══════════════════════════════════════════════════╝
      `.trim())
    })

    // 4. Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[${signal}] Graceful shutdown…`)
      server.close(async () => {
        await disconnectDB()
        console.log("✅ Server closed")
        process.exit(0)
      })
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled rejection:", reason)
      process.exit(1)
    })

  } catch (error) {
    console.error("❌ Bootstrap failed:", error)
    process.exit(1)
  }
}

bootstrap()
