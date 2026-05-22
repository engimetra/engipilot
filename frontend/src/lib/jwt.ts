import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.JWT_SECRET ?? "engipilot_jwt_secret_dev_minimum_32_chars_ok"
const EXPIRES_IN = 8 * 60 * 60 // 8h en secondes

function base64url(input: string | Buffer): string {
  const b64 = Buffer.isBuffer(input)
    ? input.toString("base64")
    : Buffer.from(input).toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64urlDecode(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(b64, "base64").toString("utf8")
}

export interface JwtPayload {
  sub: string       // userId
  email: string
  role: string
  companyId: string
  iat: number
  exp: number
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + EXPIRES_IN }
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body   = base64url(JSON.stringify(fullPayload))
  const sig    = base64url(createHmac("sha256", SECRET).update(`${header}.${body}`).digest())
  return `${header}.${body}.${sig}`
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const [header, body, sig] = token.split(".")
    if (!header || !body || !sig) return null

    const expectedSig = base64url(createHmac("sha256", SECRET).update(`${header}.${body}`).digest())
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null

    const payload = JSON.parse(base64urlDecode(body)) as JwtPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
