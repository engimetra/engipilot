import { z } from "zod"

export const RegisterDto = z.object({
  email:     z.string().email("Email invalide"),
  password:  z.string().min(8, "Mot de passe minimum 8 caractères"),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  phone:     z.string().optional(),
  companyName: z.string().min(1, "Nom de l'entreprise requis"),
})

export const LoginDto = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
})

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
})

export type RegisterInput  = z.infer<typeof RegisterDto>
export type LoginInput     = z.infer<typeof LoginDto>
export type RefreshInput   = z.infer<typeof RefreshTokenDto>
export type ChangePassInput = z.infer<typeof ChangePasswordDto>
