import { z } from "zod"
import { TaskStatus, Priority } from "@prisma/client"

export const CreateTaskDto = z.object({
  title:          z.string().min(1).max(300),
  description:    z.string().optional(),
  projectId:      z.string().uuid(),
  siteId:         z.string().uuid().optional(),
  assigneeId:     z.string().uuid().optional(),
  parentId:       z.string().uuid().optional(),
  priority:       z.nativeEnum(Priority).default("MEDIUM"),
  startDate:      z.string().datetime().optional(),
  endDate:        z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
})

export const UpdateTaskDto = CreateTaskDto.omit({ projectId: true }).partial().extend({
  status:      z.nativeEnum(TaskStatus).optional(),
  progress:    z.number().min(0).max(100).optional(),
  actualHours: z.number().positive().optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskDto>
export type UpdateTaskInput = z.infer<typeof UpdateTaskDto>
