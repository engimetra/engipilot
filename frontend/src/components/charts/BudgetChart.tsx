"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Project {
  id: string
  name: string
  budgetInitial: number | string
  budgetActual?: number | string
}

interface Props {
  projects?: Project[]
  isLoading?: boolean
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
}

function shortName(name: string) {
  return name.length > 14 ? name.slice(0, 12) + "\u2026" : name
}

function toM(v: number | string) {
  return Math.round(Number(v) / 1_000) / 1_000
}

export function BudgetChart({ projects = [], isLoading }: Props) {
  const data = projects
    .filter(p => Number(p.budgetInitial) > 0)
    .slice(0, 8)
    .map(p => ({
      name:  shortName(p.name),
      prevu: toM(p.budgetInitial),
      reel:  p.budgetActual ? toM(p.budgetActual) : 0,
    }))

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-card">
      <h3 className="font-bold text-sm text-foreground mb-0.5">Budget prevu vs Cout reel</h3>
      <p className="text-xs text-muted-fg mb-4">Par projet - en millions MAD</p>

      {isLoading && (
        <div className="h-[175px] flex items-center justify-center text-muted-fg text-xs animate-pulse">
          Chargement\u2026
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="h-[175px] flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <span className="text-lg">\U0001F4CA</span>
          </div>
          <p className="text-sm font-medium text-muted-fg">Aucune donnee budgetaire</p>
          <p className="text-xs text-muted-fg/60">Les donnees apparaitront des que des projets seront crees.</p>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <>
          <div className="flex gap-4 mb-4 text-xs">
            {[["#635BFF", "Budget prevu"], ["#E2445C", "Cout reel"]].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: color }} />
                <span className="text-muted-fg">{label}</span>
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} tickFormatter={v => `${v}M`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M MAD`]} contentStyle={tooltipStyle} />
              <Bar dataKey="prevu" fill="#635BFF" radius={[4,4,0,0]} maxBarSize={20} name="Prevu" fillOpacity={0.85} />
              <Bar dataKey="reel"  fill="#E2445C" radius={[4,4,0,0]} maxBarSize={20} name="Realise" fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
