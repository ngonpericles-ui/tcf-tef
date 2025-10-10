"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Announcement = { id: string; title: string; body: string }

export default function ManagerAnnouncementsPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [list, setList] = useState<Announcement[]>([])

  function add() {
    if (!title.trim() || !body.trim()) return
    setList((prev) => [{ id: `${Date.now()}`, title, body }, ...prev])
    setTitle("")
    setBody("")
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-6">
        {t("Annonces", "Announcements")}
      </h1>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t("Titre", "Title")}</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">{t("Message", "Message")}</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button onClick={add}>{t("Publier l’annonce", "Publish announcement")}</Button>
      </div>

      <div className="mt-8 grid gap-3">
        {list.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">{a.body}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
