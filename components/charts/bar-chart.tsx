"use client"

import { Bar, BarChart as RBarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Item = { name: string; score: number; id: string }

export default function BarChart({
  data,
  onBarClick,
}: {
  data: Item[]
  onBarClick?: (id: string) => void
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend />
          <Bar
            name="Overall Score"
            dataKey="score"
            radius={[6, 6, 0, 0]}
            onClick={(data) => onBarClick?.((data?.payload as Item).id)}
          >
            {/* Default color applied via fill on each bar */}
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}
