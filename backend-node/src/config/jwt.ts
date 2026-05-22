import jwt from "jsonwebtoken"
import { env } from "./env"

export interface JwtPayload {
  sub:       string  // userId
  email:     string
  roleId:    string
  companyId: string
  iat?:      number
  exp?:      number
}

export const jwtConfig = {
  sign(payload: Omit<JwtPayload, "iat" | "exp">): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
  },

  signRefresh(payload: Omit<JwtPayload, "iat" | "exp">): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN })
  },

  verify(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  },

  verifyRefresh(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
  },
}
