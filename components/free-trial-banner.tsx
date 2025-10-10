"use client"

import { useState } from "react"
import { useLang } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { X, Sparkles } from "lucide-react"

export default function FreeTrialBanner() {
  const { lang } = useLang()
  const [isVisible, setIsVisible] = useState(true)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  if (!isVisible) return null

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white shadow-xl">
      <div className="absolute inset-0 bg-black/10"></div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-white/20 p-3">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold">🎉 {t("Essai Gratuit 1 Jour", "1 Day Free Trial")}</h3>
            <p className="text-white/90">
              {t("Accédez à tous les cours premium gratuitement", "Access all premium courses for free")}
            </p>
          </div>
        </div>

        <Button
          onClick={() => (window.location.href = "/abonnement")}
          className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
        >
          {t("Commencer", "Start Now")}
        </Button>
      </div>
    </div>
  )
}
