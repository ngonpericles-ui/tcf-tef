"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { Loader2 } from "lucide-react"

interface UploadedMeta {
  id: string
  name: string
  type: string
  size: number
  title: string
  level: string
  subscription: string
  category: string
  uploadDate: string
  status: string
  contentType: string
  createdBy: string
}

export default function ReviewSection() {
  const { t } = useLanguage()
  const [items, setItems] = useState<UploadedMeta[]>([])
  const [contentType, setContentType] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("uploadedFiles")
      const ct = localStorage.getItem("contentType")
      setContentType(ct || "")
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const runAnalysis = async () => {
    setProcessing(true)
    await new Promise((res) => setTimeout(res, 1200))
    setProcessing(false)
    setDone(true)
  }

  return (
    <Card className="bg-card border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-foreground">
          {t("Fichiers à traiter", "Files to process")} <Badge variant="outline">{contentType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">{t("Aucun fichier", "No files")}</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 rounded border bg-muted">
            <div>
              <div className="text-sm text-foreground font-medium">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.name} • {Math.round(it.size / 1024)} KB • {it.category}</div>
            </div>
            <Badge variant="outline" className="text-xs">{it.level}</Badge>
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={runAnalysis} disabled={processing} className="bg-purple-600 hover:bg-purple-700 text-white">
            {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Analyse en cours...", "Analyzing...")}</>) : t("Lancer l'analyse IA", "Run AI analysis")}
          </Button>
        </div>
        {done && (
          <div className="text-sm text-green-400">{t("Extraction terminée (simulation). Vos données sont prêtes pour la construction.", "Extraction complete (mock). Your data is ready for building.")}</div>
        )}
      </CardContent>
    </Card>
  )
}

