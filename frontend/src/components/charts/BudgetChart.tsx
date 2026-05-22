"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { mois: "Jan", prevu: 85,  reel: 92  },
  { mois: "Fév", prevu: 140, reel: 152 },
  { mois: "Mar", prevu: 200, reel: 218 },
  { mois: "Avr", prevu: 265, reel: 290 },
  { mois: "Mai", prevu: 340, reel: 375 },
]

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
}

export function BudgetChart() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-card">
      <h3 className="font-bold text-sm text-foreground mb-0.5">Budget vs Réalisé — 2025</h3>
      <p className="text-xs text-muted-fg mb-5">Cumul mensuel (M MAD)</p>
      <div className="flex gap-4 mb-4 text-xs">
        {[["#635BFF", "Budget prévu"], ["#E2445C", "Coût réel"]].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: color }} />
            <span className="text-muted-fg">{label}</span>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={175}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradPrevu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#635BFF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#635BFF" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradReel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#E2445C" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#E2445C" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="mois"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={v => `${v}M`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => [`${v}M MAD`]}
            contentStyle={tooltipStyle}
          />
          <Area
            type="monotone"
            dataKey="prevu"
            stroke="#635BFF"
            fill="url(#gradPrevu)"
            strokeWidth={2}
            name="Prévu"
          />
          <Area
            type="monotone"
            dataKey="reel"
            stroke="#E2445C"
            fill="url(#gradReel)"
            strokeWidth={2}
            strokeDasharray="5 3"
            name="Réalisé"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
