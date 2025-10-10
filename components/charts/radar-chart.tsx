"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type RadarMetric = {
  metric: string
  [series: string]: number | string
}

export default function RadarChart({
  data,
  seriesKeys,
  colors,
}: {
  data: RadarMetric[]
  seriesKeys: string[]
  colors: string[]
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RRadarChart data={data} outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          {seriesKeys.map((key, idx) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.25}
            />
          ))}
        </RRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
