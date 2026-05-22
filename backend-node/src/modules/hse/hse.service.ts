import { prisma } from "@/config/database"
import { CreateIncidentInput, UpdateIncidentInput } from "./hse.dto"

export const HseService = {

  async findAll(companyId: string, query: Record<string, string>) {
    const page   = Math.max(1, Number(query.page)  || 1)
    const limit  = Math.min(100, Number(query.limit) || 20)
    const where  = {
      isActive:       true,
      project:        { companyId },
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.type      && { type:      query.type as never }),
      ...(query.severity  && { severity:  query.severity as never }),
      ...(query.status    && { status:    query.status as never }),
      ...(query.search    && { title:     { contains: query.search } }),
    }

    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, type: true, severity: true, status: true,
          date: true, location: true, injuredCount: true, lostDays: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
          site:    { select: { id: true, name: true } },
        },
      }),
      prisma.incident.count({ where }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string, companyId: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, isActive: true, project: { companyId } },
    })
    if (!incident) throw Object.assign(new Error("Incident introuvable"), { status: 404 })
    return incident
  },

  async create(userId: string, data: CreateIncidentInput) {
    const incident = await prisma.incident.create({
      data: { ...data, date: new Date(data.date) },
    })

    // Notification automatique si sévérité critique
    if (data.severity === "CRITICAL" || data.severity === "HIGH") {
      await prisma.notification.create({
        data: {
          title:   `🔴 Incident ${data.severity} — ${data.title}`,
          message: `Incident HSE déclaré sur projet. Traitement immédiat requis.`,
          type:    "WARNING",
          userId,
          projectId: data.projectId,
        },
      })
    }

    await prisma.activityLog.create({ data: { action: "CREATE", resource: "incidents", resourceId: incident.id, userId } })
    return incident
  },

  async update(id: string, companyId: string, userId: string, data: UpdateIncidentInput) {
    const existing = await prisma.incident.findFirst({ where: { id, isActive: true, project: { companyId } } })
    if (!existing) throw Object.assign(new Error("Incident introuvable"), { status: 404 })

    return prisma.incident.update({
      where: { id },
      data: {
        ...data,
        ...(data.date     && { date:     new Date(data.date) }),
        ...(data.closedAt && { closedAt: new Date(data.closedAt) }),
      },
    })
  },

  async getHseStats(companyId: string, projectId?: string) {
    const where = {
      isActive: true,
      project: { companyId },
      ...(projectId && { projectId }),
    }

    const [incidents, byType, bySeverity] = await Promise.all([
      prisma.incident.aggregate({
        where,
        _count: true,
        _sum:   { injuredCount: true, lostDays: true },
      }),
      prisma.incident.groupBy({ by: ["type"],     where, _count: true }),
      prisma.incident.groupBy({ by: ["severity"], where, _count: true }),
    ])

    const totalIncidents = incidents._count
    const totalHours     = 200000 // heures travaillées (à récupérer dynamiquement)
    const tf = totalIncidents > 0 ? (incidents._count / totalHours) * 1_000_000 : 0

    return {
      total:        totalIncidents,
      injuredTotal: incidents._sum.injuredCount ?? 0,
      lostDays:     incidents._sum.lostDays ?? 0,
      tf:           Math.round(tf * 100) / 100,
      byType:       byType.map(b => ({ type: b.type, count: b._count })),
      bySeverity:   bySeverity.map(b => ({ severity: b.severity, count: b._count })),
    }
  },
}
