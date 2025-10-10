"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useLang } from "./language-provider"

export default function PromoRibbon() {
  const { t, lang } = useLang()
  const [show, setShow] = useState(true)
  const [expired] = useState(false) // toggle to preview states

  useEffect(() => {
    const dismissed = localStorage.getItem("promo-dismissed")
    if (dismissed === "1") setShow(false)
  }, [])
  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem("promo-dismissed", "1")
    } catch {}
  }
  if (!show) return null

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-background">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="text-sm">
          <span className="mr-3 inline-block h-2 w-2 rounded-full bg-[#2ECC71]" aria-hidden="true" />
          <span className="font-medium text-foreground">
            {lang === "fr" ? "Promo de rentrée: -20% sur Premium" : "Back-to-school promo: -20% on Premium"}
          </span>
          <span className="ml-3 text-muted-foreground">
            {lang === "fr" ? "Valable jusqu'au 30 sept." : "Valid until Sept 30"}
          </span>
          {expired && (
            <span className="ml-3 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs text-muted-foreground">
              {t("promo.expired")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#pricing"
            className="text-sm font-medium text-[#007BFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] rounded"
          >
            {t("promo.view")}
          </a>
          <button
            aria-label={lang === "fr" ? "Fermer la promotion" : "Close promotion"}
            onClick={dismiss}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-[#2ECC71] via-[#007BFF] to-[#8E44AD]" />
    </div>
  )
}
