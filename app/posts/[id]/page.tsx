"use client"

import { useMemo } from "react"

// Generate static params for static export
import { useParams, useRouter } from "next/navigation"
import PageShell from "@/components/page-shell"
import { managerPosts } from "@/components/manager-data"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Image from "next/image"
import { useLang } from "@/components/language-provider"

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const post = useMemo(() => managerPosts.find((p) => p.id === params.id), [params.id])
  const subscribed = false

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        {!post ? (
          <div>
            <p className="text-sm">{t("Publication introuvable.", "Post not found.")}</p>
            <Button className="mt-3" onClick={() => router.push("/")}>
              {t("Retour", "Back")}
            </Button>
          </div>
        ) : (
          <article>
            <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)]">{post.title}</h1>
            <div className="text-sm text-neutral-500 mt-1">
              {post.author} • {post.role} • {new Date(post.createdAt || "").toLocaleDateString()}
            </div>
            {post.media && (
              <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-white/10">
                <Image src={post.media || "/placeholder.svg"} alt="media" fill className="object-cover" />
                {post.visibility === "subscribers-only" && !subscribed && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] grid place-items-center text-white">
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4" />
                      <span>
                        {t(
                          "Contenu réservé aux abonnés — Passer en Premium",
                          "Subscribers-only content — Upgrade to Premium",
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <p>{post.preview}</p>
              <ul className="list-disc pl-5">
                {post.keyPoints.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex gap-2">
              <Button>{t("J’aime", "Like")}</Button>
              <Button variant="outline" className="bg-transparent">
                {t("Partager", "Share")}
              </Button>
            </div>
          </article>
        )}
      </main>
    </PageShell>
  )
}
