"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { Upload, Hammer, Settings, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
export const dynamic = "force-dynamic"


export default function CertificationWizardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/manager/content/create")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t("Retour", "Back")}
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{t("Certification", "Certification")}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={step === 1 ? "default" : "outline"} className={cn(step === 1 && "bg-primary text-primary-foreground")}>1. {t("Uploader épreuve", "Upload")}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={step === 2 ? "default" : "outline"} className={cn(step === 2 && "bg-primary text-primary-foreground")}>2. {t("Paramétrage", "Setup")}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Upload className="w-5 h-5" /> {t("Uploader vos fichiers", "Upload your files")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed rounded-lg p-16 text-center text-muted-foreground">
                    {t("Zone d'upload multi-fichiers (PDF/DOCX/MP3/WAV) — à brancher sur l'extracteur GPT-5.", "Multi-file upload area (PDF/DOCX/MP3/WAV) — to be wired to GPT-5 extractor.")}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep(2)}>
                      {t("Extraire avec GPT-5", "Extract with GPT-5")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5" /> {t("Construction & Paramétrage", "Build & Setup")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-muted-foreground text-sm">
                    {t("Editeur de sections (Lecture, Écoute, Grammaire/Vocabulaire, Écriture, Expression orale), minuteries, items, barème.", "Sections editor (Reading, Listening, Grammar/Vocab, Writing, Speaking), timers, items, rubric.")}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="border-gray-200 dark:border-gray-700">{t("Aperçu", "Preview")}</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">{t("Publier", "Publish")}</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hammer className="w-4 h-4" />
                  <span className="text-sm">{t("Brouillon — prêt pour configuration", "Draft — ready for setup")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


