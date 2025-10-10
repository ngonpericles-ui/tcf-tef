"use client"

import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Checklist({
  title,
  items,
}: {
  title: string
  items: { label: string; done?: boolean }[]
}) {
  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold font-[var(--font-poppins)] mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.label}
            className={cn(
              "flex items-center gap-2 text-sm",
              it.done ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-500",
            )}
          >
            <CheckCircle2 className={cn("h-4 w-4", it.done ? "text-[#2ECC71]" : "text-neutral-300")} />
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
