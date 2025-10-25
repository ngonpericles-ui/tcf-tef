"use client"

import { Edit, Eye, Lock, Trash2, UploadCloud } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { managerPosts } from "@/components/manager-data"
import { useLang } from "@/components/language-provider"

export default function ManagerMyPostsPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)]">
          {t("Mes publications", "My posts")}
        </h1>
        <Link href="/manager/poster">
          <Button className="gap-2">
            <UploadCloud className="h-4 w-4" />
            {t("Créer un post", "Create post")}
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Titre", "Title")}</TableHead>
              <TableHead>{t("Statut", "Status")}</TableHead>
              <TableHead>{t("Visibilité", "Visibility")}</TableHead>
              <TableHead>{t("J’aime", "Likes")}</TableHead>
              <TableHead>{t("Commentaires", "Comments")}</TableHead>
              <TableHead>{t("Partages", "Shares")}</TableHead>
              <TableHead className="text-right">{t("Actions", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managerPosts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status === "published" ? t("Publié", "Published") : t("Brouillon", "Draft")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.visibility === "public" ? (
                    <Badge variant="outline">{t("Public", "Public")}</Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                      <Lock className="h-3 w-3" />
                      {t("Abonnés", "Subscribers")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{p.likes}</TableCell>
                <TableCell className="tabular-nums">{p.comments}</TableCell>
                <TableCell className="tabular-nums">{p.shares}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" title={t("Aperçu", "Preview")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("Éditer", "Edit")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("Supprimer", "Delete")}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
