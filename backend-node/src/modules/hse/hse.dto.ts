import { z } from "zod"
import { IncidentType, Severity, IncidentStatus } from "@prisma/client"

export const CreateIncidentDto = z.object({
  title:             z.string().min(1).max(300),
  description:       z.string().min(1),
  type:              z.nativeEnum(IncidentType).default("ACCIDENT"),
  severity:          z.nativeEnum(Severity).default("MEDIUM"),
  projectId:         z.string().uuid(),
  siteId:            z.string().uuid().optional(),
  date:              z.string().datetime(),
  location:          z.string().optional(),
  injuredCount:      z.number().int().min(0).default(0),
  lostDays:          z.number().int().min(0).default(0),
  reportedBy:        z.string().optional(),
  rootCause:         z.string().optional(),
  correctiveActions: z.string().optional(),
  preventiveMeasures: z.string().optional(),
})

export const UpdateIncidentDto = CreateIncidentDto.omit({ projectId: true }).partial().extend({
  status:         z.nativeEnum(IncidentStatus).optional(),
  investigatedBy: z.string().optional(),
  closedAt:       z.string().datetime().optional(),
})

export type CreateIncidentInput = z.infer<typeof CreateIncidentDto>
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentDto>
