"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const data = [
  { lot: "Gros Œuvre",   avancement: 100, couleur: "#00C875" },
  { lot: "Structure BA", avancement: 78,  couleur: "#635BFF" },
  { lot: "Maçonnerie",   avancement: 55,  couleur: "#FDAB3D" },
  { lot: "Électricité",  avancement: 32,  couleur: "#E2445C" },
  { lot: "Plomberie",    avancement: 28,  couleur: "#E2445C" },
  { lot: "Finitions",    avancement: 12,  couleur: "#8b5cf6" },
]

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
}

export function AvancementChart() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-card">
      <h3 className="font-bold text-sm text-foreground mb-0.5">Avancement par lot de travaux</h3>
      <p className="text-xs text-muted-fg mb-5">Semaine 21 — Mise à jour hebdomadaire</p>
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
            width={84}
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
    </div>
  )
}
