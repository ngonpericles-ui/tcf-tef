"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"

export default function ManagerCreatePostPage() {
  const { t } = useLanguage()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "subscribers-only">("public")

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-6 text-foreground">
        {t("manager.poster.title", "Créer une publication")}
      </h1>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-foreground">
            {t("manager.poster.titleLabel", "Titre")}
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("manager.poster.titlePlaceholder", "Titre du post")}
            className="bg-input border-gray-200 dark:border-gray-700 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-foreground">
            {t("manager.poster.contentLabel", "Contenu")}
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("manager.poster.contentPlaceholder", "Écrivez votre contenu…")}
            className="bg-input border-gray-200 dark:border-gray-700 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground">{t("manager.poster.visibility", "Visibilité")}</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
            <SelectTrigger className="w-full bg-input border-gray-200 dark:border-gray-700 text-foreground">
              <SelectValue placeholder={t("manager.poster.choose", "Choisir…")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
              <SelectItem value="public" className="text-foreground hover:bg-muted">
                {t("manager.poster.public", "Public")}
              </SelectItem>
              <SelectItem value="subscribers-only" className="text-foreground hover:bg-muted">
                {t("manager.poster.subscribersOnly", "Abonnés uniquement")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-success hover:bg-success/90 text-success-foreground">
            {t("manager.poster.saveDraft", "Enregistrer en brouillon")}
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {t("manager.poster.publish", "Publier")}
          </Button>
        </div>
      </div>
    </main>
  )
}
