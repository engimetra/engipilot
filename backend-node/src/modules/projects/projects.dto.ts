import { z } from "zod"
import { ProjectStatus, ProjectType } from "@prisma/client"

export const CreateProjectDto = z.object({
  name:          z.string().min(1).max(200),
  reference:     z.string().min(1).max(50),
  description:   z.string().optional(),
  type:          z.nativeEnum(ProjectType).default("CONSTRUCTION"),
  startDate:     z.string().datetime(),
  endDate:       z.string().datetime(),
  budgetInitial: z.number().positive(),
  address:       z.string().optional(),
  city:          z.string().optional(),
  country:       z.string().default("MA"),
  latitude:      z.number().optional(),
  longitude:     z.number().optional(),
  clientName:    z.string().optional(),
  clientContact: z.string().optional(),
})

export const UpdateProjectDto = CreateProjectDto.partial().extend({
  status:   z.nativeEnum(ProjectStatus).optional(),
  progress: z.number().min(0).max(100).optional(),
  spi:      z.number().optional(),
  cpi:      z.number().optional(),
})

export const ProjectFilterDto = z.object({
  status:  z.nativeEnum(ProjectStatus).optional(),
  type:    z.nativeEnum(ProjectType).optional(),
  city:    z.string().optional(),
  search:  z.string().optional(),
  page:    z.string().optional().transform(v => Number(v) || 1),
  limit:   z.string().optional().transform(v => Math.min(100, Number(v) || 20)),
  sortBy:  z.string().optional().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
})

export type CreateProjectInput  = z.infer<typeof CreateProjectDto>
export type UpdateProjectInput  = z.infer<typeof UpdateProjectDto>
export type ProjectFilterInput  = z.infer<typeof ProjectFilterDto>
