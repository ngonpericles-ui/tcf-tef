"use client"

import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Upload, Zap, ArrowRight, Shield } from "lucide-react"

export default function SimulationChooserPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  // Simple role check - allow access for now
  const isAdmin = pathname.startsWith("/admin")

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("Simulation TCF/TEF", "TCF/TEF Simulation")}</h1>
          <p className="text-muted-foreground">{t("Choisissez votre type de simulation", "Choose your simulation type")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-muted transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="w-5 h-5" /> {t("Uploader épreuve TCF", "Upload TCF paper")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("Déposez un PDF/Word/Audio. Les apprenants le consulteront en mode entraînement libre.", "Drop a PDF/Word/Audio. Learners can practice freely without timers.")}
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/manager/content/upload?type=simulation-paper")}> 
                {t("Commencer", "Start")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-muted transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Zap className="w-5 h-5" /> {t("Simulation avancée", "Advanced simulation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("Uploader multi-fichiers, extraction IA, sections TCF, minuteurs et conditions réelles.", "Multi-file upload, AI extraction, TCF sections, timers and real exam conditions.")}
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => router.push("/manager/content/simulation/builder")}> 
                {t("Construire la simulation", "Build simulation")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


