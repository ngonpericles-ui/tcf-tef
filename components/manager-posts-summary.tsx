"use client"

import { managerPosts } from "./manager-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLang } from "@/components/language-provider"

export default function ManagerPostsSummary() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Résumé détaillé des publications Manager", "Detailed summary of Manager posts")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {managerPosts.map((p) => (
          <div key={p.id} className="space-y-2">
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-neutral-500">{t("Objectifs", "Objectives")}:</div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {p.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <div className="text-xs text-neutral-500">{t("Points clés", "Key points")}:</div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {p.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
