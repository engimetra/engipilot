"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Project {
  id: string
  name: string
  progress: number | string
}

interface Props {
  projects?: Project[]
  isLoading?: boolean
}

function colorFor(progress: number) {
  if (progress >= 80) return "#00C875"
  if (progress >= 50) return "#635BFF"
  if (progress >= 30) return "#FDAB3D"
  return "#E2445C"
}

function shortName(name: string) {
  return name.length > 16 ? name.slice(0, 14) + "\u2026" : name
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
}

export function AvancementChart({ projects = [], isLoading }: Props) {
  const data = projects
    .slice(0, 8)
    .map(p => ({
      lot:        shortName(p.name),
      avancement: Math.round(Number(p.progress)),
      couleur:    colorFor(Math.round(Number(p.progress))),
    }))

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-card">
      <h3 className="font-bold text-sm text-foreground mb-0.5">Avancement par projet</h3>
      <p className="text-xs text-muted-fg mb-4">Progression physique globale (%)</p>

      {isLoading && (
        <div className="h-[210px] flex items-center justify-center text-muted-fg text-xs animate-pulse">
          Chargement\u2026
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="h-[210px] flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <span className="text-lg">\U0001F4C8</span>
          </div>
          <p className="text-sm font-medium text-muted-fg">Aucun projet en cours</p>
          <p className="text-xs text-muted-fg/60">Les donnees d avancement apparaitront des que des projets seront crees.</p>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={v => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="lot"
              tick={{ fill: "#6B7280", fontSize: 11 }}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Avancement"]}
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar dataKey="avancement" radius={[0, 6, 6, 0]} maxBarSize={16}>
              {data.map((entry, i) => <Cell key={i} fill={entry.couleur} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
