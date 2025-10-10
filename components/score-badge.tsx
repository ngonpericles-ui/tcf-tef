"use client"

import { cn } from "@/lib/utils"
import { scoreRing } from "./model-data"

export default function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const angle = Math.round((score / 100) * 360)
  const ringColor = scoreRing(score)
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        aria-label={`Score ${score} out of 100`}
        className="relative h-10 w-10 rounded-full"
        style={{
          background: `conic-gradient(${ringColor} ${angle}deg, #e5e7eb ${angle}deg 360deg)`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-white grid place-items-center text-sm font-semibold text-neutral-800">
          {score}
        </div>
      </div>
      <div className={cn("h-2 w-24 rounded-full bg-neutral-200 overflow-hidden")}>
        <div
          className={cn(
            "h-full",
            score >= 85
              ? "bg-emerald-500"
              : score >= 70
                ? "bg-lime-500"
                : score >= 55
                  ? "bg-amber-500"
                  : score >= 40
                    ? "bg-orange-500"
                    : "bg-rose-500",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
