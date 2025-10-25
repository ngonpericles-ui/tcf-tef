"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function FreeTrialTeaser({ className = "" }: { className?: string }) {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  return (
    <div className={`mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-[#2ECC71]" />
        <div className="text-sm">
          <span className="font-medium text-foreground">1‑day free trial</span> —{" "}
          <span className="text-foreground">
            {t("Accédez à toutes les fonctionnalités pendant 24 h.", "Access all features for 24 hours.")}
          </span>
        </div>
      </div>
      <Link
        href="/abonnement"
        className="text-sm rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] transition-colors text-foreground"
      >
        {t("Activer l'essai", "Activate trial")}
      </Link>
    </div>
  )
}
