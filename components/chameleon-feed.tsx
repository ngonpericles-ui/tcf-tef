"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Heart, MessageSquare, Share2, Lock, CheckCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "./language-provider"

type Post = {
  id: string
  author: string
  role: "Manager" | "Admin"
  verified: boolean
  time: string
  title: string
  preview: string
  media?: string
  public: boolean
  likes: number
  comments: number
  shares: number
  avatar?: string
}

const SEED: Post[] = [
  {
    id: "1",
    author: "Aïcha",
    role: "Manager",
    verified: true,
    time: "2 h",
    title: "10 erreurs fréquentes au passé composé",
    preview: "Évitez ces pièges courants avec des exemples clairs et des astuces mémorables…",
    media:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 124,
    comments: 18,
    shares: 12,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "2",
    author: "Julien",
    role: "Manager",
    verified: true,
    time: "5 h",
    title: "Exercices d'écoute B1: comprendre l'essentiel",
    preview: "Entraînez-vous avec des dialogues réalistes et des questions ciblées…",
    media:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: false,
    likes: 89,
    comments: 10,
    shares: 4,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "3",
    author: "Admin",
    role: "Admin",
    verified: true,
    time: "1 j",
    title: "Nouveaux parcours personnalisés disponibles",
    preview: "Des recommandations basées sur vos erreurs fréquentes et vos objectifs…",
    media:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 156,
    comments: 25,
    shares: 30,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "4",
    author: "Marie",
    role: "Manager",
    verified: true,
    time: "3 h",
    title: "Stratégies pour réussir l'expression écrite",
    preview: "Découvrez les techniques qui font la différence dans vos productions écrites…",
    media:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 67,
    comments: 8,
    shares: 15,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "5",
    author: "Pierre",
    role: "Manager",
    verified: true,
    time: "6 h",
    title: "TCF: Maîtriser la compréhension orale",
    preview: "Techniques avancées pour améliorer votre score en compréhension orale au TCF…",
    media:
      "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 92,
    comments: 14,
    shares: 8,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "6",
    author: "Sophie",
    role: "Manager",
    verified: true,
    time: "8 h",
    title: "Vocabulaire essentiel pour le niveau B2",
    preview: "Enrichissez votre vocabulaire avec 200 mots indispensables pour atteindre le niveau B2…",
    media:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 78,
    comments: 12,
    shares: 6,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "7",
    author: "Admin",
    role: "Admin",
    verified: true,
    time: "12 h",
    title: "Mise à jour: Nouvelles simulations TCF/TEF",
    preview: "Découvrez nos nouvelles simulations d'examen avec feedback IA personnalisé…",
    media:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: true,
    likes: 203,
    comments: 34,
    shares: 45,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
  {
    id: "8",
    author: "Lucas",
    role: "Manager",
    verified: true,
    time: "1 j",
    title: "Prononciation française: les sons difficiles",
    preview: "Maîtrisez les sons [y], [ø], [œ] avec des exercices pratiques et des enregistrements…",
    media:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    public: false,
    likes: 45,
    comments: 7,
    shares: 3,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=56&h=56",
  },
]

export default function ChameleonFeed() {
  const { t, lang } = useLang()
  // Simulated auth/subscription state
  const loggedIn = true
  const subscribed = false

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [visible, setVisible] = useState(3)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(SEED)
      setLoading(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  const shown = useMemo(() => posts.slice(0, visible), [posts, visible])
  const remaining = Math.max(0, posts.length - shown.length)

  return (
    <section aria-labelledby="feed-title" className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h2
          id="feed-title"
          className="text-2xl md:text-3xl font-bold font-[var(--font-poppins)] bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
        >
          {lang === "fr" ? "Quoi de neuf" : "What's New"}
        </h2>
        <a
          id="notifications"
          href="#notifications"
          className="inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#007BFF] animate-pulse" aria-hidden="true" />
          <span className="font-medium">3 {t("notif.pill")}</span>
        </a>
      </div>

      <div aria-live="polite" className="space-y-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : shown.length === 0 ? (
          <EmptyState />
        ) : (
          shown.map((p, idx) => (
            <article
              key={p.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
              style={{ animation: `fadeUp 220ms ease-out ${idx * 60}ms both` as any }}
              aria-labelledby={`post-${p.id}-title`}
            >
              <div className="p-6">
                <header className="flex items-start gap-4 mb-5">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                      <Image
                        src={p.avatar || "/placeholder.svg?height=56&width=56&query=profile"}
                        alt={`${p.author} profile`}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                    {p.verified && (
                      <div
                        className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center border-2 border-background shadow-lg ${
                          p.role === "Admin"
                            ? "bg-gradient-to-r from-[#8E44AD] to-[#9B59B6]"
                            : "bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
                        }`}
                      >
                        {p.role === "Admin" ? (
                          <Shield className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-bold text-lg text-foreground hover:text-[#007BFF] transition-colors duration-200 cursor-pointer">
                        {p.author}
                      </span>
                      <Badge
                        variant={p.role === "Admin" ? "default" : "secondary"}
                        className={`font-semibold ${
                          p.role === "Admin"
                            ? "bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white shadow-md hover:shadow-lg transition-shadow duration-200"
                            : "bg-gradient-to-r from-[#007BFF]/10 to-[#0056CC]/10 text-[#007BFF] border border-[#007BFF]/20 hover:bg-gradient-to-r hover:from-[#007BFF]/20 hover:to-[#0056CC]/20 transition-all duration-200"
                        }`}
                      >
                        {p.role}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{p.time}</span>
                  </div>
                </header>

                <div className="space-y-5">
                  <div>
                    <h3
                      id={`post-${p.id}-title`}
                      className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-[#007BFF] transition-colors duration-200 cursor-pointer"
                    >
                      {p.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{p.preview}</p>
                  </div>

                  {p.media && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
                      <Image
                        src={p.media || "/placeholder.svg"}
                        alt={lang === "fr" ? "Aperçu du média" : "Media preview"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {!p.public && !subscribed && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm grid place-items-center text-foreground">
                          <div className="flex flex-col items-center gap-4 text-center p-6">
                            <div className="p-4 rounded-full bg-muted border border-gray-200 dark:border-gray-700">
                              <Lock className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                              <span className="text-lg font-bold">
                                {lang === "fr" ? "Contenu Premium" : "Premium Content"}
                              </span>
                              <span className="text-sm font-medium max-w-xs block">{t("feed.locked")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <LikeButton
                      label={t("feed.like")}
                      count={p.likes + (liked[p.id] ? 1 : 0)}
                      pressed={!!liked[p.id]}
                      onToggle={() => setLiked((s) => ({ ...s, [p.id]: !s[p.id] }))}
                      disabled={!loggedIn}
                      title={p.title}
                    />
                    <CommentButton
                      label={t("feed.comment")}
                      count={p.comments}
                      expanded={!!expanded[p.id]}
                      onToggle={() => setExpanded((s) => ({ ...s, [p.id]: !s[p.id] }))}
                      disabled={!loggedIn}
                      title={p.title}
                    />
                    <ShareButton label={t("feed.share")} count={p.shares} title={p.title} />
                  </div>
                </div>

                {expanded[p.id] && (
                  <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-card shadow-lg">
                    <Textarea
                      placeholder={t("feed.writeComment")}
                      className="min-h-[100px] resize-none border-gray-200 dark:border-gray-700 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20 transition-all duration-200"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button className="h-10 px-6 bg-gradient-to-r from-[#007BFF] to-[#0056CC] hover:from-[#0056CC] hover:to-[#004499] font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        {lang === "fr" ? "Publier" : "Post"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}

        {!loading && remaining > 0 && (
          <div className="pt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setVisible((v) => Math.min(posts.length, v + 2))}
              className="px-8 py-3 h-auto font-semibold text-base border-2 hover:bg-muted transition-all duration-200 hover:shadow-md transform hover:scale-105"
            >
              {t("feed.loadMore")} ({remaining})
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}

function LikeButton({
  label,
  count,
  pressed,
  onToggle,
  disabled,
  title,
}: {
  label: string
  count: number
  pressed: boolean
  onToggle: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${title}`}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md transform hover:scale-105 ${
        pressed
          ? "bg-gradient-to-r from-[#E74C3C]/10 to-[#FF6B6B]/10 text-[#E74C3C] hover:from-[#E74C3C]/20 hover:to-[#FF6B6B]/20 border border-[#E74C3C]/20 shadow-lg"
          : "hover:bg-muted text-muted-foreground border border-transparent hover:border-gray-200 dark:border-gray-700"
      } disabled:opacity-50`}
    >
      <Heart
        className={`h-4 w-4 transition-all duration-200 ${pressed ? "fill-[#E74C3C] text-[#E74C3C] scale-110" : ""}`}
      />
      <span>{count}</span>
    </button>
  )
}

function CommentButton({
  label,
  count,
  expanded,
  onToggle,
  disabled,
  title,
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${title}`}
      aria-expanded={expanded}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-muted text-muted-foreground disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-gray-200 dark:border-gray-700 transform hover:scale-105"
    >
      <MessageSquare className="h-4 w-4" />
      <span>{count}</span>
    </button>
  )
}

function ShareButton({ label, count, title }: { label: string; count: number; title: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${title}`}
          className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-muted text-muted-foreground transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-gray-200 dark:border-gray-700 transform hover:scale-105"
        >
          <Share2 className="h-4 w-4" />
          <span>{count}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 shadow-xl border-gray-200 dark:border-gray-700">
        <div className="text-sm space-y-1">
          <button className="w-full text-left py-3 px-4 hover:bg-muted rounded-lg transition-colors duration-200 font-medium">
            Copier le lien
          </button>
          <button className="w-full text-left py-3 px-4 hover:bg-muted rounded-lg transition-colors duration-200 font-medium">
            Partager sur X
          </button>
          <button className="w-full text-left py-3 px-4 hover:bg-muted rounded-lg transition-colors duration-200 font-medium">
            Envoyer par email
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-6 animate-pulse shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-14 w-14 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-48 w-full rounded-xl bg-muted" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground border-gray-200 dark:border-gray-700">
      Rien à afficher pour le moment.
    </div>
  )
}
