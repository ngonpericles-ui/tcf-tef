"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Shield, Crown, Sparkles, Info } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { useSubscriptionAccess } from "@/components/subscription-access"

interface LevelAccessControlProps {
  level: string
  children?: React.ReactNode
  contentType?: "course" | "test" | "session"
  showInfo?: boolean
  className?: string
}

export default function LevelAccessControl({
  level,
  children,
  contentType = "course",
  showInfo = true,
  className = "",
}: LevelAccessControlProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { canAccessLevel, userTier, getAccessibleLevels } = useSubscriptionAccess()

  const hasAccess = canAccessLevel(level)
  const accessibleLevels = getAccessibleLevels()

  const getRequiredTierForLevel = (level: string) => {
    if (["A1", "A2"].includes(level)) return "free"
    if (level === "B1") return "essential"
    if (level === "B2") return "premium"
    if (["C1", "C2"].includes(level)) return "pro"
    return "free"
  }

  const requiredTier = getRequiredTierForLevel(level)
  const tierIcons = {
    free: Shield,
    essential: Shield,
    premium: Crown,
    pro: Sparkles,
  }

  const tierColors = {
    free: "bg-green-500/10 text-green-400 border-green-500/20",
    essential: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    premium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pro: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  }

  const tierLabels = {
    free: { fr: "Gratuit", en: "Free" },
    essential: { fr: "Essentiel", en: "Essential" },
    premium: { fr: "Premium", en: "Premium" },
    pro: { fr: "Pro+", en: "Pro+" },
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  const RequiredIcon = tierIcons[requiredTier as keyof typeof tierIcons]
  const tierLabel = tierLabels[requiredTier as keyof typeof tierLabels]

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="relative">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-white text-sm bg-black/60 px-3 py-2 rounded-full">
              <Lock className="h-4 w-4" />
              <span>
                {t("Niveau", "Level")} {level}
              </span>
            </div>
          </div>
          <div className="pointer-events-none opacity-50">{children}</div>
        </div>
      )}

      <Card className="mt-4 border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <RequiredIcon className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t("Niveau non accessible", "Level not accessible")}</h3>
              <p className="text-gray-300 text-sm">
                {t(
                  `Le niveau ${level} nécessite un abonnement ${tierLabel.fr}`,
                  `Level ${level} requires a ${tierLabel.en} subscription`,
                )}
              </p>
            </div>
          </div>

          {showInfo && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-white">
                  {t("Vos niveaux accessibles", "Your accessible levels")}:
                </h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {accessibleLevels.map((accessibleLevel) => (
                  <Badge
                    key={accessibleLevel}
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                  >
                    {accessibleLevel}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={tierColors[requiredTier as keyof typeof tierColors]}>
              <RequiredIcon className="w-4 h-4 mr-2" />
              {t(tierLabel.fr, tierLabel.en)}
            </Badge>
            <Button onClick={() => router.push("/abonnement")} className="bg-orange-600 hover:bg-orange-700 text-white">
              {t("Passer à", "Upgrade to")} {t(tierLabel.fr, tierLabel.en)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
