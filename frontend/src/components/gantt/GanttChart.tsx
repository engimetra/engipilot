"use client"
import { useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react"

export type GanttLot = {
  id:          string
  nom:         string
  emoji:       string
  statut:      "TERMINE" | "EN_COURS" | "RETARD" | "PLANIFIE"
  startPct:    number
  widthPct:    number
  avancement:  number
  color:       string
  retard:      number
  responsable: string
}

type Props = {
  lots:        GanttLot[]
  todayPct:    number
  projectName?: string
}

const STATUT_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  TERMINE:  { label: "Terminé",  icon: CheckCircle2, bg: "bg-success/10", text: "text-success"  },
  EN_COURS: { label: "En cours", icon: Clock,         bg: "bg-primary/10", text: "text-primary"  },
  RETARD:   { label: "Retard",   icon: AlertTriangle, bg: "bg-danger/10",  text: "text-danger"   },
  PLANIFIE: { label: "Planifié", icon: ChevronRight,  bg: "bg-muted",      text: "text-muted-fg" },
}

export function GanttChart({ lots, todayPct, projectName }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-sm text-foreground">Diagramme de Gantt</h3>
          <p className="text-xs text-muted-fg mt-0.5">
            {projectName ?? "Projet"} · Vue relative à la durée du projet
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          {Object.entries(STATUT_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <span key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                <Icon className="w-3 h-3" strokeWidth={2.5} /> {cfg.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="p-5">
        {lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-fg gap-2">
            <ChevronRight className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">Aucune tâche avec dates dans ce projet</p>
            <p className="text-xs">Ajoutez des tâches avec startDate/endDate depuis le Kanban</p>
          </div>
        ) : (
          <>
            {/* Gantt rows */}
            <div className="space-y-1.5">
              {lots.map(lot => {
                const cfg      = STATUT_CONFIG[lot.statut]
                const Icon     = cfg.icon
                const isHovered = hoveredId === lot.id

                return (
                  <div
                    key={lot.id}
                    className="grid gap-0 items-center group cursor-pointer"
                    style={{ gridTemplateColumns: "160px 1fr" }}
                    onMouseEnter={() => setHoveredId(lot.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Label */}
                    <div className={`flex items-center gap-2 pr-3 py-1 rounded-l-xl transition-colors ${isHovered ? "bg-muted/60" : ""}`}>
                      <span className="text-sm">{lot.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{lot.nom}</p>
                        {lot.retard > 0 && (
                          <p className="text-[9px] text-danger font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> +{lot.retard}j retard
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bar track */}
                    <div className={`relative h-8 rounded-r-xl transition-colors ${isHovered ? "bg-muted/60" : "bg-muted/30"}`}>
                      {/* Today line */}
                      <div
                        className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
                        style={{ left: `${todayPct}%`, background: "#FDAB3D", opacity: 0.8 }}
                      />

                      {/* Gantt bar */}
                      <div
                        className="absolute top-1.5 bottom-1.5 rounded-lg flex items-center overflow-hidden transition-all duration-200"
                        style={{
                          left:      `${lot.startPct}%`,
                          width:     `${lot.widthPct}%`,
                          background: lot.color,
                          opacity:   isHovered ? 1 : 0.85,
                          boxShadow: isHovered ? `0 0 0 2px ${lot.color}40` : "none",
                        }}
                      >
                        {/* Progress overlay (remaining = darker) */}
                        <div
                          className="absolute inset-0 rounded-lg opacity-30"
                          style={{
                            background: "rgba(0,0,0,0.25)",
                            width:      `${100 - lot.avancement}%`,
                            left:       `${lot.avancement}%`,
                          }}
                        />
                        {lot.widthPct > 8 && (
                          <span className="relative z-10 px-2 text-[10px] font-black text-white truncate">
                            {lot.avancement}%
                          </span>
                        )}
                      </div>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div
                          className="absolute bottom-full mb-2 z-20 bg-white border border-border rounded-xl shadow-card-lg px-3 py-2 pointer-events-none min-w-[160px]"
                          style={{
                            left:      `${Math.min(lot.startPct + lot.widthPct / 2, 85)}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <p className="text-xs font-bold text-foreground">{lot.emoji} {lot.nom}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Icon className={`w-3 h-3 ${cfg.text}`} />
                            <span className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                          </div>
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-[10px] text-muted-fg">
                              Avancement : <span className="font-bold text-foreground">{lot.avancement}%</span>
                            </p>
                            <p className="text-[10px] text-muted-fg">
                              Resp. : <span className="font-bold text-foreground">{lot.responsable}</span>
                            </p>
                            {lot.retard > 0 && (
                              <p className="text-[10px] text-danger font-bold">⚠ Retard : +{lot.retard}j</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Today marker */}
            <div className="relative mt-1">
              <div className="ml-40 relative h-5">
                <div
                  className="absolute flex flex-col items-center"
                  style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
                >
                  <div className="w-px h-2 bg-warning opacity-80" />
                  <span className="bg-warning text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    Aujourd'hui
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
