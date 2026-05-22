import { Prisma } from "@prisma/client"
import { prisma } from "@/config/database"
import { CreateProjectInput, UpdateProjectInput, ProjectFilterInput } from "./projects.dto"
import { buildPaginatedResult, getPrismaSkip } from "@/shared/utils/pagination"

const PROJECT_SELECT = {
  id: true, name: true, reference: true, description: true,
  status: true, type: true, startDate: true, endDate: true,
  budgetInitial: true, budgetActual: true, spi: true, cpi: true,
  progress: true, address: true, city: true, country: true,
  clientName: true, clientContact: true, createdAt: true, updatedAt: true,
  company: { select: { id: true, name: true } },
  _count: { select: { members: true, tasks: true, sites: true, incidents: true } },
} satisfies Prisma.ProjectSelect

export const ProjectsRepository = {

  async findAll(companyId: string, filter: ProjectFilterInput) {
    const { page, limit, search, sortBy, sortDir, status, type, city } = filter

    const where: Prisma.ProjectWhereInput = {
      companyId,
      isActive: true,
      ...(status && { status }),
      ...(type   && { type }),
      ...(city   && { city: { contains: city } }),
      ...(search && {
        OR: [
          { name:      { contains: search } },
          { reference: { contains: search } },
          { clientName: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select:  PROJECT_SELECT,
        orderBy: { [sortBy ?? "createdAt"]: sortDir ?? "desc" },
        skip:    getPrismaSkip(page, limit),
        take:    limit,
      }),
      prisma.project.count({ where }),
    ])

    return buildPaginatedResult(data, total, page, limit)
  },

  async findById(id: string, companyId: string) {
    return prisma.project.findFirst({
      where:  { id, companyId, isActive: true },
      select: {
        ...PROJECT_SELECT,
        members:  { select: { userId: true, role: true, user: { select: { firstName: true, lastName: true, email: true, avatar: true } } } },
        budgets:  { where: { isActive: true }, select: { id: true, name: true, type: true, amountPlanned: true, amountActual: true, status: true } },
        aiAlerts: { where: { isResolved: false }, orderBy: { createdAt: "desc" }, take: 5 },
      },
    })
  },

  async create(companyId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: { ...data, companyId, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
      select: PROJECT_SELECT,
    })
  },

  async update(id: string, companyId: string, data: UpdateProjectInput) {
    const project = await prisma.project.findFirst({ where: { id, companyId, isActive: true } })
    if (!project) return null

    return prisma.project.update({
      where:  { id },
      data:   {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate   && { endDate:   new Date(data.endDate) }),
      },
      select: PROJECT_SELECT,
    })
  },

  async softDelete(id: string, companyId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({ where: { id, companyId, isActive: true } })
    if (!project) return false
    await prisma.project.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } })
    return true
  },
}
