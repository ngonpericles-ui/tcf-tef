"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Crown, Shield, Sparkles, MoveUpIcon as Upgrade } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import type { SubscriptionTier } from "@/components/types"

interface SubscriptionAccessProps {
  requiredTier: SubscriptionTier
  userTier?: SubscriptionTier
  contentType?: "course" | "test" | "session" | "correction"
  children?: React.ReactNode
  showUpgrade?: boolean
  className?: string
}

const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
  free: ["free"],
  essential: ["free", "essential"],
  premium: ["free", "essential", "premium"],
  pro: ["free", "essential", "premium", "pro"],
}

const tierInfo = {
  free: {
    label: "Gratuit",
    labelEn: "Free",
    icon: Shield,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    bgColor: "bg-green-500",
  },
  essential: {
    label: "Essentiel",
    labelEn: "Essential",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bgColor: "bg-blue-500",
  },
  premium: {
    label: "Premium",
    labelEn: "Premium",
    icon: Crown,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    bgColor: "bg-orange-500",
  },
  pro: {
    label: "Pro+",
    labelEn: "Pro+",
    icon: Sparkles,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    bgColor: "bg-purple-500",
  },
}

export function useSubscriptionAccess() {
  const [userTier, setUserTier] = useState<SubscriptionTier>("free")

  useEffect(() => {
    const savedTier = localStorage.getItem("userSubscriptionTier") as SubscriptionTier
    if (savedTier && Object.keys(tierHierarchy).includes(savedTier)) {
      setUserTier(savedTier)
    }
  }, [])

  const canAccess = (requiredTier: SubscriptionTier): boolean => {
    return tierHierarchy[userTier].includes(requiredTier)
  }

  const getAccessibleLevels = (): string[] => {
    switch (userTier) {
      case "free":
        return ["A1", "A2"] // Free users get A1-A2
      case "essential":
        return ["A1", "A2", "B1"] // Essential users get A1-B1
      case "premium":
        return ["A1", "A2", "B1", "B2"] // Premium users get A1-B2
      case "pro":
        return ["A1", "A2", "B1", "B2", "C1", "C2"] // Pro+ users get everything A1-C2
      default:
        return ["A1", "A2"]
    }
  }

  const canAccessLevel = (level: string): boolean => {
    return getAccessibleLevels().includes(level)
  }

  const canAccessTCFTEF = (level: string): boolean => {
    const tcfTefLevels = ["B2", "C1", "C2"]
    if (!tcfTefLevels.includes(level)) return false

    // TCF/TEF papers require premium or pro subscription
    return ["premium", "pro"].includes(userTier)
  }

  const upgradeTier = (newTier: SubscriptionTier) => {
    setUserTier(newTier)
    localStorage.setItem("userSubscriptionTier", newTier)
  }

  return {
    userTier,
    canAccess,
    canAccessLevel,
    canAccessTCFTEF,
    getAccessibleLevels,
    upgradeTier,
    tierInfo,
  }
}

export default function SubscriptionAccess({
  requiredTier,
  userTier = "free",
  contentType = "course",
  children,
  showUpgrade = true,
  className = "",
}: SubscriptionAccessProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { canAccess } = useSubscriptionAccess()

  const hasAccess = canAccess(requiredTier)
  const requiredTierInfo = tierInfo[requiredTier]
  const RequiredIcon = requiredTierInfo.icon

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="relative">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-foreground text-sm bg-card/90 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-full shadow-lg">
              <Lock className="h-4 w-4" />
              <span>{t("Contenu verrouillé", "Locked content")}</span>
            </div>
          </div>
          <div className="pointer-events-none opacity-50">{children}</div>
        </div>
      )}

      {showUpgrade && (
        <Card className="mt-4 border border-orange-500/20 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500/10">
                <RequiredIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("Abonnement requis", "Subscription required")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t(
                    `Ce ${contentType === "course" ? "cours" : contentType === "test" ? "test" : contentType === "session" ? "session" : "contenu"} nécessite un abonnement ${requiredTierInfo.label}`,
                    `This ${contentType} requires a ${requiredTierInfo.labelEn} subscription`,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className={requiredTierInfo.color}>
                <RequiredIcon className="w-4 h-4 mr-2" />
                {t(requiredTierInfo.label, requiredTierInfo.labelEn)}
              </Badge>
              <Button
                onClick={() => router.push("/abonnement")}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Upgrade className="w-4 h-4 mr-2" />
                {t("Passer à", "Upgrade to")} {t(requiredTierInfo.label, requiredTierInfo.labelEn)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { tierHierarchy, tierInfo }
