import bcrypt from "bcryptjs"
import { prisma } from "@/config/database"
import { jwtConfig } from "@/config/jwt"
import { RegisterInput, LoginInput } from "./auth.dto"

const BCRYPT_ROUNDS = 12
const DEFAULT_ROLE  = "MEMBER"

export const AuthService = {

  async register(data: RegisterInput) {
    // Vérification email unique
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw Object.assign(new Error("Email déjà utilisé"), { status: 409 })

    // Création de l'entreprise + rôle par défaut
    const [company, role] = await Promise.all([
      prisma.company.create({ data: { name: data.companyName } }),
      prisma.role.upsert({
        where:  { name: DEFAULT_ROLE },
        update: {},
        create: { name: DEFAULT_ROLE, description: "Membre standard" },
      }),
    ])

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email:     data.email,
        passwordHash,
        firstName: data.firstName,
        lastName:  data.lastName,
        phone:     data.phone,
        companyId: company.id,
        roleId:    role.id,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        companyId: true, roleId: true,
      },
    })

    const tokenPayload = { sub: user.id, email: user.email, roleId: user.roleId, companyId: user.companyId }
    return {
      user,
      accessToken:  jwtConfig.sign(tokenPayload),
      refreshToken: jwtConfig.signRefresh(tokenPayload),
    }
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where:  { email: data.email },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        passwordHash: true, isActive: true, companyId: true, roleId: true,
        role: { select: { name: true } },
      },
    })

    if (!user || !user.isActive)
      throw Object.assign(new Error("Identifiants invalides"), { status: 401 })

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid)
      throw Object.assign(new Error("Identifiants invalides"), { status: 401 })

    const tokenPayload = { sub: user.id, email: user.email, roleId: user.roleId, companyId: user.companyId }
    const { passwordHash: _, ...safeUser } = user

    // Log de connexion
    await prisma.activityLog.create({
      data: { action: "LOGIN", resource: "auth", userId: user.id },
    })

    return {
      user: safeUser,
      accessToken:  jwtConfig.sign(tokenPayload),
      refreshToken: jwtConfig.signRefresh(tokenPayload),
    }
  },

  async refreshToken(token: string) {
    try {
      const payload = jwtConfig.verifyRefresh(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, roleId: true, companyId: true, isActive: true },
      })
      if (!user || !user.isActive) throw new Error("Utilisateur inactif")

      const tokenPayload = { sub: user.id, email: user.email, roleId: user.roleId, companyId: user.companyId }
      return {
        accessToken:  jwtConfig.sign(tokenPayload),
        refreshToken: jwtConfig.signRefresh(tokenPayload),
      }
    } catch {
      throw Object.assign(new Error("Refresh token invalide"), { status: 401 })
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatar: true, phone: true, isActive: true, createdAt: true,
        company: { select: { id: true, name: true, plan: true, logoUrl: true } },
        role:    { select: { id: true, name: true } },
      },
    })
    if (!user) throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 })
    return user
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })
    if (!user) throw Object.assign(new Error("Utilisateur introuvable"), { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw Object.assign(new Error("Mot de passe actuel incorrect"), { status: 400 })

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  },
}
