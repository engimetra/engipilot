import { z } from "zod"
import { AiMode, AlertLevel } from "@prisma/client"

export const CreateConversationDto = z.object({
  mode:      z.nativeEnum(AiMode).default("CHAT"),
  title:     z.string().optional(),
  projectId: z.string().uuid().optional(),
})

export const SendMessageDto = z.object({
  content:        z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  mode:           z.nativeEnum(AiMode).default("CHAT"),
  projectId:      z.string().uuid().optional(),
})

export const CreateAlertDto = z.object({
  type:       z.string().min(1),
  level:      z.nativeEnum(AlertLevel).default("MEDIUM"),
  message:    z.string().min(1),
  value:      z.string().optional(),
  confidence: z.number().int().min(0).max(100).default(75),
  projectId:  z.string().uuid(),
})

export type CreateConversationInput = z.infer<typeof CreateConversationDto>
export type SendMessageInput        = z.infer<typeof SendMessageDto>
export type CreateAlertInput        = z.infer<typeof CreateAlertDto>
