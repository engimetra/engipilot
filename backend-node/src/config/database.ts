import { PrismaClient } from "@prisma/client"
import { env } from "./env"

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  })

if (env.NODE_ENV !== "production") global.__prisma = prisma

export async function connectDB(): Promise<void> {
  await prisma.$connect()
  console.log("✅ MySQL connected via Prisma")
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect()
}
