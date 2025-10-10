"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import RoleGuard from "@/components/role-guard"
import EnhancedAnalyticsDashboard from "@/components/enhanced-analytics-dashboard"
import { AlertCircle } from "lucide-react"

export default function Analytics() {
  const { t } = useLanguage()
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  // Get current user role from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("managerRole")
      setCurrentRole(role)
    }
  }, [])

  // Show loading while determining role
  if (currentRole === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  // Map role to system roles
  const userRole = currentRole === "admin" ? "ADMIN" :
                   currentRole === "senior" ? "SENIOR_MANAGER" :
                   "JUNIOR_MANAGER"

  return (
    <RoleGuard allowedRoles={["admin", "senior", "junior"]} currentRole={currentRole}>
      <div className="min-h-screen bg-background">
        {/* Enhanced Analytics Dashboard */}
        <EnhancedAnalyticsDashboard
          userRole={userRole}
          className="p-6"
        />

        {/* Legacy Notice */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("Analyses en temps réel maintenant disponibles ci-dessus", "Real-time analytics now available above")}
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
