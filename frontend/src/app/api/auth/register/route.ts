import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { signJwt } from "@/lib/jwt"
import { hash } from "bcryptjs"
import { z } from "zod"

const RegisterSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8, "Mot de passe minimum 8 caractères"),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  phone:     z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { email, password, firstName, lastName, phone } = parsed.data

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    // Utiliser la company démo pour l'instant — en production: créer une nouvelle company
    const company = await prisma.company.findFirst({ where: { slug: "engipilot-demo" } })
    if (!company) {
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
    }

    const memberRole = await prisma.role.findFirst({ where: { name: "MEMBER" } })
    if (!memberRole) {
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email:         email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone:         phone ?? null,
        status:        "ACTIVE",
        emailVerified: false,
        companyId:     company.id,
        roleId:        memberRole.id,
      },
      include: { role: true, company: { select: { id: true, name: true, slug: true, plan: true } } },
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
    }, { status: 201 })

    res.cookies.set("engipilot_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   8 * 60 * 60,
    })

    return res
  } catch (err) {
    console.error("[auth/register]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
