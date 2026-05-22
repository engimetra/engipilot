import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const DEMO_USERS = [
  { email: "admin@engipilot.ma",    firstName: "Admin",   lastName: "ENGIPILOT",  roleName: "ADMIN",   password: "Engipilot2024!" },
  { email: "manager@engipilot.ma",  firstName: "Youssef", lastName: "Benali",     roleName: "MANAGER", password: "Manager2024!" },
  { email: "engineer@engipilot.ma", firstName: "Salma",   lastName: "El Fassi",   roleName: "ENGINEER",password: "Engineer2024!" },
  { email: "hse@engipilot.ma",      firstName: "Karim",   lastName: "Tazi",       roleName: "HSE",     password: "Hse2024!" },
  { email: "viewer@engipilot.ma",   firstName: "Nadia",   lastName: "Bouazza",    roleName: "VIEWER",  password: "Viewer2024!" },
]

export async function seedUsers(
  prisma: PrismaClient,
  companyId: string,
  roleMap: Map<string, string>,
) {
  console.log("  → Seeding users…")

  const users = await Promise.all(
    DEMO_USERS.map(async u => {
      const passwordHash = await bcrypt.hash(u.password, 12)
      const roleId = roleMap.get(u.roleName)!

      return prisma.user.upsert({
        where:  { email: u.email },
        update: {},
        create: {
          email: u.email,
          passwordHash,
          firstName:     u.firstName,
          lastName:      u.lastName,
          status:        "ACTIVE",
          emailVerified: true,
          companyId,
          roleId,
        },
      })
    })
  )

  console.log(`  ✅ ${users.length} utilisateurs créés`)
  return users
}
