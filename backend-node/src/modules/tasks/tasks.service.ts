import { prisma } from "@/config/database"
import { CreateTaskInput, UpdateTaskInput } from "./tasks.dto"

const TASK_SELECT = {
  id: true, title: true, description: true, status: true, priority: true,
  startDate: true, endDate: true, progress: true, estimatedHours: true, actualHours: true,
  createdAt: true, updatedAt: true,
  assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  site:     { select: { id: true, name: true } },
  _count:   { select: { subtasks: true } },
}

export const TasksService = {

  async findAll(projectId: string, companyId: string, query: Record<string, string>) {
    const page  = Math.max(1, Number(query.page)  || 1)
    const limit = Math.min(100, Number(query.limit) || 50)

    const where = {
      projectId,
      isActive: true,
      project:  { companyId },
      ...(query.status     && { status:   query.status as never }),
      ...(query.priority   && { priority: query.priority as never }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
      ...(query.search     && { title: { contains: query.search } }),
      parentId: query.parentId ?? null, // only root tasks by default
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({ where, select: TASK_SELECT, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.task.count({ where }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string, companyId: string) {
    const task = await prisma.task.findFirst({
      where:  { id, isActive: true, project: { companyId } },
      select: { ...TASK_SELECT, subtasks: { where: { isActive: true }, select: TASK_SELECT } },
    })
    if (!task) throw Object.assign(new Error("Tâche introuvable"), { status: 404 })
    return task
  },

  async create(userId: string, data: CreateTaskInput) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } })
    if (!project) throw Object.assign(new Error("Projet introuvable"), { status: 404 })

    const task = await prisma.task.create({
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate   && { endDate:   new Date(data.endDate) }),
      },
      select: TASK_SELECT,
    })

    await prisma.activityLog.create({ data: { action: "CREATE", resource: "tasks", resourceId: task.id, userId } })
    return task
  },

  async update(id: string, companyId: string, userId: string, data: UpdateTaskInput) {
    const existing = await prisma.task.findFirst({ where: { id, isActive: true, project: { companyId } } })
    if (!existing) throw Object.assign(new Error("Tâche introuvable"), { status: 404 })

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === "DONE" && !existing.completedAt ? { completedAt: new Date() } : {}),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate   && { endDate:   new Date(data.endDate) }),
      },
      select: TASK_SELECT,
    })

    await prisma.activityLog.create({ data: { action: "UPDATE", resource: "tasks", resourceId: id, userId } })
    return task
  },

  async delete(id: string, companyId: string, userId: string) {
    const existing = await prisma.task.findFirst({ where: { id, isActive: true, project: { companyId } } })
    if (!existing) throw Object.assign(new Error("Tâche introuvable"), { status: 404 })
    await prisma.task.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } })
    await prisma.activityLog.create({ data: { action: "DELETE", resource: "tasks", resourceId: id, userId } })
  },
}
