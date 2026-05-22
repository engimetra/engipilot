import { app }            from "./app"
import { env }            from "@/config/env"
import { connectDB, disconnectDB } from "@/config/database"

async function bootstrap(): Promise<void> {
  await connectDB()

  const server = app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║          ENGIPILOT API — Node.js Backend          ║
╠══════════════════════════════════════════════════╣
║  Port    : ${env.PORT}                                  ║
║  Env     : ${env.NODE_ENV.padEnd(12)}                       ║
║  API     : ${env.API_PREFIX.padEnd(12)}                       ║
║  DB      : MySQL (Prisma)                        ║
╚══════════════════════════════════════════════════╝
    `.trim())
  })

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[${signal}] Graceful shutdown…`)
    server.close(async () => {
      await disconnectDB()
      console.log("✅ Server closed")
      process.exit(0)
    })
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT",  () => shutdown("SIGINT"))

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason)
    process.exit(1)
  })
}

bootstrap().catch(err => {
  console.error("❌ Bootstrap failed:", err)
  process.exit(1)
})
