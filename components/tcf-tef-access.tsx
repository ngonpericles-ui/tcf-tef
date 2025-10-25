"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Crown, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { useSubscriptionAccess } from "@/components/subscription-access"

interface TCFTEFAccessProps {
  level: string
  children?: React.ReactNode
  contentType?: "paper" | "correction" | "simulation"
  className?: string
}

export default function TCFTEFAccess({ level, children, contentType = "paper", className = "" }: TCFTEFAccessProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { canAccessTCFTEF, userTier } = useSubscriptionAccess()

  const hasAccess = canAccessTCFTEF(level)
  const tcfTefLevels = ["B2", "C1", "C2"]
  const isValidTCFTEFLevel = tcfTefLevels.includes(level)

  if (!isValidTCFTEFLevel) {
    return (
      <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t("Niveau non disponible", "Level not available")}</h3>
              <p className="text-gray-300 text-sm">
                {t("Les examens TCF/TEF commencent au niveau B2", "TCF/TEF exams start from B2 level")}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              {t("Niveaux disponibles", "Available levels")}: B2, C1, C2
            </Badge>
            <Button
              onClick={() => router.push("/tcf-tef-simulation")}
              variant="outline"
              className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
            >
              {t("Voir simulations", "View simulations")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="relative">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-white text-sm bg-black/60 px-3 py-2 rounded-full">
              <Lock className="h-4 w-4" />
              <span>{t("TCF/TEF Premium", "TCF/TEF Premium")}</span>
            </div>
          </div>
          <div className="pointer-events-none opacity-50">{children}</div>
        </div>
      )}

      <Card className="mt-4 border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {t("Contenu TCF/TEF Premium", "TCF/TEF Premium Content")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t(
                  `Les ${contentType === "paper" ? "sujets" : contentType === "correction" ? "corrections" : "simulations"} TCF/TEF ${level} nécessitent un abonnement Premium ou Pro+`,
                  `TCF/TEF ${level} ${contentType === "paper" ? "papers" : contentType === "correction" ? "corrections" : "simulations"} require Premium or Pro+ subscription`,
                )}
              </p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">
              {t("Accès par abonnement", "Access by subscription")}:
            </h4>
            <div className="space-y-1 text-xs text-gray-300">
              <div>
                • {t("Essentiel", "Essential")}: A1-B1 {t("uniquement", "only")}
              </div>
              <div>• {t("Premium", "Premium")}: A1-B2 + TCF/TEF B2-C2</div>
              <div>
                • {t("Pro+", "Pro+")}: {t("Accès complet A1-C2", "Full access A1-C2")}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
              <Crown className="w-4 h-4 mr-2" />
              {t("Premium requis", "Premium required")}
            </Badge>
            <Button onClick={() => router.push("/abonnement")} className="bg-orange-600 hover:bg-orange-700 text-white">
              {t("Passer à Premium", "Upgrade to Premium")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
