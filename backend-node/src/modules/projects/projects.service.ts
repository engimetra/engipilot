import { prisma } from "@/config/database"
import { ProjectsRepository } from "./projects.repository"
import { CreateProjectInput, UpdateProjectInput, ProjectFilterInput } from "./projects.dto"

export const ProjectsService = {

  async findAll(companyId: string, filter: ProjectFilterInput) {
    return ProjectsRepository.findAll(companyId, filter)
  },

  async findById(id: string, companyId: string) {
    const project = await ProjectsRepository.findById(id, companyId)
    if (!project) throw Object.assign(new Error("Projet introuvable"), { status: 404 })
    return project
  },

  async create(companyId: string, userId: string, data: CreateProjectInput) {
    // Vérifie unicité de la référence
    const existing = await prisma.project.findUnique({ where: { reference: data.reference } })
    if (existing) throw Object.assign(new Error("Référence projet déjà utilisée"), { status: 409 })

    const project = await ProjectsRepository.create(companyId, data)

    // Ajoute le créateur comme manager
    await prisma.projectMember.create({
      data: { projectId: project.id, userId, role: "MANAGER" },
    })

    await prisma.activityLog.create({
      data: { action: "CREATE", resource: "projects", resourceId: project.id, userId },
    })

    return project
  },

  async update(id: string, companyId: string, userId: string, data: UpdateProjectInput) {
    const project = await ProjectsRepository.update(id, companyId, data)
    if (!project) throw Object.assign(new Error("Projet introuvable"), { status: 404 })

    await prisma.activityLog.create({
      data: { action: "UPDATE", resource: "projects", resourceId: id, userId },
    })

    return project
  },

  async delete(id: string, companyId: string, userId: string) {
    const deleted = await ProjectsRepository.softDelete(id, companyId)
    if (!deleted) throw Object.assign(new Error("Projet introuvable"), { status: 404 })

    await prisma.activityLog.create({
      data: { action: "DELETE", resource: "projects", resourceId: id, userId },
    })
  },

  async getStats(id: string, companyId: string) {
    const project = await prisma.project.findFirst({
      where: { id, companyId, isActive: true },
      select: {
        budgetInitial: true, budgetActual: true, spi: true, cpi: true, progress: true,
        _count: { select: { tasks: true, members: true, incidents: true, documents: true } },
        tasks:  { where: { isActive: true }, select: { status: true } },
        incidents: { where: { isActive: true, status: { not: "CLOSED" } }, select: { severity: true } },
        budgets:   { where: { isActive: true }, select: { amountPlanned: true, amountActual: true } },
      },
    })

    if (!project) throw Object.assign(new Error("Projet introuvable"), { status: 404 })

    const totalBudget  = project.budgets.reduce((s, b) => s + Number(b.amountPlanned), 0)
    const spentBudget  = project.budgets.reduce((s, b) => s + Number(b.amountActual),  0)
    const tasksByStatus = project.tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      budget: { total: totalBudget, spent: spentBudget, remaining: totalBudget - spentBudget },
      evm:    { spi: project.spi, cpi: project.cpi, progress: project.progress },
      tasks:  { total: project._count.tasks, byStatus: tasksByStatus },
      team:   { members: project._count.members },
      hse:    { incidents: project._count.incidents },
      docs:   { total: project._count.documents },
    }
  },
}
