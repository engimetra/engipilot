import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { signJwt } from "@/lib/jwt"
import { compare } from "bcryptjs"
import { z } from "zod"

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email ou mot de passe invalide" }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where:  { email: email.toLowerCase() },
      include: { role: true, company: { select: { id: true, name: true, slug: true, plan: true } } },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Compte désactivé — contactez votre administrateur" }, { status: 403 })
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    // Mettre à jour lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    })

    const token = signJwt({
      sub:       user.id,
      email:     user.email,
      role:      user.role.name,
      companyId: user.companyId,
    })

    const res = NextResponse.json({
      user: {
        id:        user.id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        avatar:    user.avatar,
        role:      user.role.name,
        company:   user.company,
      },
    })

    const maxAge = 8 * 60 * 60
    res.cookies.set("engipilot_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge,
    })

    return res
  } catch (err) {
    console.error("[auth/login]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
