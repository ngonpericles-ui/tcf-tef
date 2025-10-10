"use client"

import { useMemo, useState } from "react"
import { useReportWebVitals } from "next/web-vitals"
import { Activity, Timer, MousePointerClick, ScanLine } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// A lightweight widget that listens to Web Vitals and displays the latest key metrics.
// Best practice is to isolate this client component; in production you may move it into the root layout to minimize client boundaries [^1][^2][^5].
type Metric = {
  name: string
  value: number
  rating?: "good" | "needs-improvement" | "poor"
}

export default function WebVitalsWidget() {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({})

  useReportWebVitals((metric) => {
    setMetrics((prev) => ({
      ...prev,
      [metric.name]: { name: metric.name, value: metric.value, rating: metric.rating as any },
    }))
    // You can also send to your endpoint using navigator.sendBeacon or fetch as shown in Next.js docs. [^1][^2][^5]
    // console.log(metric)
  })

  const items = useMemo(() => {
    // Pick common Web Vitals if present
    const keys = ["LCP", "CLS", "INP", "TTFB", "FCP"]
    return keys.filter((k) => metrics[k]).map((k) => metrics[k]!)
  }, [metrics])

  if (items.length === 0) return null

  const iconFor = (name: string) =>
    name === "LCP" ? (
      <Timer className="h-4 w-4" />
    ) : name === "CLS" ? (
      <ScanLine className="h-4 w-4" />
    ) : name === "INP" ? (
      <MousePointerClick className="h-4 w-4" />
    ) : (
      <Activity className="h-4 w-4" />
    )

  const badgeVariant = (rating?: string) =>
    rating === "good" ? "default" : rating === "needs-improvement" ? "secondary" : "destructive"

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Web Vitals (live)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                {iconFor(m.name)}
                <span className="text-sm font-medium">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">{m.value.toFixed(m.name === "CLS" ? 3 : 0)}</span>
                <Badge variant={badgeVariant(m.rating)} className="capitalize">
                  {m.rating || "–"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
