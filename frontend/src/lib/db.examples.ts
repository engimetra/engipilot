/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Exemples d'utilisation Prisma
   Ce fichier montre les patterns recommandés pour chaque module.
   À utiliser comme référence dans les API routes Next.js.
───────────────────────────────────────────────────────────── */
import { prisma } from "./db"

// ════════════════════════════════════════════════════════════
//  AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

/** Trouver un utilisateur par email avec son rôle */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where:  { email },
    select: {
      id: true, email: true, passwordHash: true,
      firstName: true, lastName: true, status: true,
      companyId: true,
      role: { select: { name: true } },
    },
  })
}

/** Créer un compte utilisateur */
export async function createUser(data: {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  companyId: string
  roleId: string
}) {
  return prisma.user.create({ data })
}

// ════════════════════════════════════════════════════════════
//  PROJETS
// ════════════════════════════════════════════════════════════

/** Liste paginée des projets d'une entreprise */
export async function getProjects(companyId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where:   { companyId, isActive: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, name: true, reference: true, status: true, type: true,
        progress: true, spi: true, cpi: true,
        startDate: true, endDate: true, city: true,
        _count: { select: { tasks: true, members: true } },
      },
    }),
    prisma.project.count({ where: { companyId, isActive: true } }),
  ])

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

/** Détail d'un projet avec toutes ses relations */
export async function getProjectById(id: string, companyId: string) {
  return prisma.project.findFirst({
    where: { id, companyId, isActive: true },
    include: {
      members:  { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      budgets:  { where: { isActive: true } },
      aiAlerts: { where: { isResolved: false }, orderBy: { createdAt: "desc" }, take: 5 },
      sites:    { where: { isActive: true } },
    },
  })
}

/** Créer un projet */
export async function createProject(data: {
  name: string
  reference: string
  companyId: string
  startDate: Date
  endDate: Date
  budgetInitial: number
  type?: "CONSTRUCTION" | "RENOVATION" | "INFRASTRUCTURE" | "INDUSTRIAL" | "RESIDENTIAL" | "COMMERCIAL" | "OTHER"
}) {
  return prisma.project.create({ data })
}

// ════════════════════════════════════════════════════════════
//  TÂCHES (Kanban)
// ════════════════════════════════════════════════════════════

/** Tâches d'un projet groupées par statut (Kanban) */
export async function getTasksKanban(projectId: string) {
  const tasks = await prisma.task.findMany({
    where:   { projectId, isActive: true },
    orderBy: [{ columnOrder: "asc" }, { createdAt: "asc" }],
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  })

  // Grouper par statut
  return tasks.reduce((acc, task) => {
    const status = task.status
    if (!acc[status]) acc[status] = []
    acc[status].push(task)
    return acc
  }, {} as Record<string, typeof tasks>)
}

/** Mettre à jour le statut et l'ordre d'une tâche */
export async function moveTask(id: string, status: string, columnOrder: number) {
  return prisma.task.update({
    where: { id },
    data:  { status: status as never, columnOrder },
  })
}

// ════════════════════════════════════════════════════════════
//  INTELLIGENCE IA
// ════════════════════════════════════════════════════════════

/** Sauvegarder un message IA en base */
export async function saveAiMessage(data: {
  conversationId: string
  role: "user" | "assistant"
  content: string
  confidence?: number
  warning?: string | null
  sources?: string[]
}) {
  return prisma.aiMessage.create({ data })
}

/** Récupérer l'historique d'une conversation */
export async function getConversationHistory(conversationId: string, userId: string) {
  return prisma.aiConversation.findFirst({
    where:   { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
}

/** Créer une alerte IA */
export async function createAiAlert(data: {
  type: string
  level: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  message: string
  confidence?: number
  projectId: string
  value?: string
}) {
  const alert = await prisma.aiAlert.create({ data: data as never })

  // Crée une notification associée pour tous les managers du projet
  const members = await prisma.projectMember.findMany({
    where:  { projectId: data.projectId, role: { in: ["MANAGER", "ADMIN"] } },
    select: { userId: true },
  })

  if (members.length > 0) {
    await prisma.notification.createMany({
      data: members.map(m => ({
        userId:    m.userId,
        projectId: data.projectId,
        title:     `🤖 Alerte IA — ${data.type}`,
        message:   data.message,
        type:      "AI_ALERT" as const,
      })),
    })
  }

  return alert
}

// ════════════════════════════════════════════════════════════
//  ANALYTICS & KPIs EVM
// ════════════════════════════════════════════════════════════

/** Calcul et sauvegarde des KPIs EVM d'un projet */
export async function computeAndSaveEvm(projectId: string) {
  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: {
      budgets:  { where: { isActive: true } },
      tasks:    { where: { isActive: true }, select: { status: true, progress: true, estimatedHours: true, actualHours: true } },
    },
  })

  if (!project) return null

  const totalBudget  = project.budgets.reduce((s, b) => s + Number(b.amountPlanned), 0)
  const spentBudget  = project.budgets.reduce((s, b) => s + Number(b.amountActual), 0)
  const avgProgress  = project.tasks.length > 0
    ? project.tasks.reduce((s, t) => s + Number(t.progress), 0) / project.tasks.length
    : 0

  const bcwp = (avgProgress / 100) * totalBudget
  const acwp = spentBudget
  const bcws = totalBudget * 0.65  // valeur planifiée estimée (à affiner)

  const spi = bcws > 0 ? bcwp / bcws : 1
  const cpi = acwp > 0 ? bcwp / acwp : 1
  const eac = cpi > 0  ? totalBudget / cpi : totalBudget
  const vac = totalBudget - eac

  // Sauvegarde les KPIs sur le projet
  await prisma.project.update({
    where: { id: projectId },
    data:  { spi, cpi, eac, vac, bcwp, acwp, bcws, progress: avgProgress },
  })

  // Snapshot analytics du jour
  const today = new Date(); today.setHours(0, 0, 0, 0)
  await prisma.analytic.upsert({
    where:  { projectId_period_date: { projectId, period: "DAILY", date: today } },
    update: { spi, cpi, eac, vac, progress: avgProgress },
    create: { projectId, period: "DAILY", date: today, spi, cpi, eac, vac, progress: avgProgress },
  })

  return { spi, cpi, eac, vac, bcwp, acwp, bcws, progress: avgProgress }
}

// ════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════

/** Envoyer une notification à un utilisateur */
export async function notify(userId: string, data: {
  title: string
  message: string
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "AI_ALERT" | "SYSTEM"
  projectId?: string
  link?: string
}) {
  return prisma.notification.create({
    data: { userId, ...data, type: data.type ?? "INFO" },
  })
}

/** Notifications non lues d'un utilisateur */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where:   { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take:    20,
  })
}

// ════════════════════════════════════════════════════════════
//  LOGS
// ════════════════════════════════════════════════════════════

/** Journaliser une action */
export async function log(data: {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  details?: Record<string, string | number | boolean | null>
  ipAddress?: string
}) {
  const { userId, ...rest } = data
  return prisma.activityLog.create({
    data: {
      ...rest,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    },
  })
}
