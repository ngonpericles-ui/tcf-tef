"use client"

import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { BookOpen, FileText, Video, Zap, Target, Shield, Crown, ArrowRight, Plus, CheckCircle, Volume2, Play } from "lucide-react"

export default function CreateContentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/manager"

  // Get manager role from localStorage, URL params, or pathname
  const getManagerRole = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const roleFromUrl = urlParams.get("role")
      const roleFromStorage = localStorage.getItem("managerRole")
      
      // If accessing from admin path, return admin role
      if (pathname.startsWith("/admin")) {
        return "admin"
      }
      
      return roleFromUrl || roleFromStorage || "junior"
    }
    return pathname.startsWith("/admin") ? "admin" : "junior"
  }

  const managerRole = getManagerRole()

  const contentTypes = [
    {
      id: "course",
      title: t("Cours", "Course"),
      description: t(
        "Créer un cours complet avec leçons et exercices",
        "Create a complete course with lessons and exercises",
      ),
      icon: BookOpen,
      color: "blue",
      href: `${basePath}/content/upload?type=course`,
      available: true,
    },
    
    {
      id: "test",
      title: t("Test", "Test"),
      description: t("Créer un test d'évaluation", "Create an assessment test"),
      icon: FileText,
      color: "green",
      href: `${basePath}/content/upload?type=test`,
      available: true,
      limitations: managerRole === "junior" ? t("Niveaux A1-B1 uniquement", "A1-B1 levels only") : undefined,
    },
    {
      id: "video",
      title: t("Contenu Vidéo", "Video Content"),
      description: t("Télécharger et organiser du contenu vidéo", "Upload and organize video content"),
      icon: Video,
      color: "purple",
      href: `${basePath}/content/upload?type=video`,
      available: true,
    },
    {
      id: "test-corrections",
      title: t("Corrections TCF/TEF", "TCF/TEF Corrections"),
      description: t(
        "Télécharger des corrections de tests avec questions-réponses",
        "Upload test corrections with question-answer pairs",
      ),
      icon: CheckCircle,
      color: "emerald",
      href: `${basePath}/content/upload?type=test-corrections`,
      available: true,
      buttonText: t("Commencer", "Start"),
    },
    {
      id: "simulation",
      title: t("Simulation TCF/TEF", "TCF/TEF Simulation"),
      description: t("Créer une simulation d'examen complète avec builder AI", "Create complete exam simulation with AI builder"),
      icon: Zap,
      color: "orange",
      href: `${basePath}/content/simulation`,
      available: true, // Now available for all managers including junior
      limitations: managerRole === "junior" ? t("Simulation écrite uniquement", "Written simulation only") : undefined,
    },
    {
      id: "audio-simulator",
      title: t("Simulateur Audio", "Audio Simulator"),
      description: t("Créer des exercices audio interactifs avec VAPI", "Create interactive audio exercises with VAPI"),
      icon: Volume2,
      color: "indigo",
      href: `${basePath}/content/audio-simulator`,
      available: managerRole === "senior" || managerRole === "admin", // Only for senior and admin
    },
    
  ]

  const getRoleInfo = () => {
    switch (managerRole) {
      case "admin":
        return {
          title: t("Admin", "Admin"),
          description: t("Accès complet à tous les outils de création", "Full access to all creation tools"),
          icon: Shield,
          color: "red",
        }
      case "senior":
        return {
          title: t("Senior Manager", "Senior Manager"),
          description: t("Accès complet à tous les outils de création", "Full access to all creation tools"),
          icon: Crown,
          color: "purple",
        }
      case "content":
        return {
          title: t("Content Manager", "Content Manager"),
          description: t("Outils avancés de création de contenu", "Advanced content creation tools"),
          icon: BookOpen,
          color: "blue",
        }
      case "junior":
        return {
          title: t("Junior Manager", "Junior Manager"),
          description: t("Outils de base pour créer du contenu", "Basic tools for content creation"),
          icon: Plus,
          color: "green",
        }
      default:
        return {
          title: t("Manager", "Manager"),
          description: t("Créer du contenu", "Create content"),
          icon: Plus,
          color: "gray",
        }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon
  const availableTypes = contentTypes.filter((type) => type.available)

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-12 h-12 bg-${roleInfo.color}-500/10 rounded-xl flex items-center justify-center`}>
              <RoleIcon className={`w-6 h-6 text-${roleInfo.color}-400`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("Créer du contenu", "Create Content")}</h1>
              <p className="text-muted-foreground">{roleInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex justify-center">
          <div className={`px-4 py-2 rounded-full bg-${roleInfo.color}-500/10 border border-${roleInfo.color}-500/20`}>
            <span className={`text-${roleInfo.color}-400 font-medium`}>{roleInfo.title}</span>
          </div>
        </div>

        {/* Content Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentTypes.map((type) => {
            const TypeIcon = type.icon
            const isAvailable = type.available

            return (
              <Card
                key={type.id}
                className={`relative transition-all duration-200 ${
                  isAvailable
                    ? "bg-card border-gray-200 dark:border-gray-700 hover:border-muted cursor-pointer group"
                    : "bg-card/50 border-gray-200 dark:border-gray-700/50 opacity-50"
                }`}
                onClick={() => isAvailable && router.push(type.href)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 bg-${type.color}-500/10 rounded-lg flex items-center justify-center`}>
                      <TypeIcon className={`w-6 h-6 text-${type.color}-400`} />
                    </div>
                    {isAvailable && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                    {!isAvailable && (
                      <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                        {t("Verrouillé", "Locked")}
                      </div>
                    )}
                  </div>
                  <CardTitle className={`text-lg ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}>
                    {type.title}
                  </CardTitle>
                  {type.limitations && (
                    <div className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">{type.limitations}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className={isAvailable ? "text-muted-foreground" : "text-muted-foreground/60"}>
                    {type.description}
                  </CardDescription>
                  {isAvailable && (
                    <Button
                      className={`w-full mt-4 bg-${type.color}-600 hover:bg-${type.color}-700 text-white`}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(type.href)
                      }}
                    >
                      {type.buttonText || t("Commencer", "Get Started")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Limitations Notice for Junior Managers */}
        {managerRole === "junior" && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1 text-amber-400">
                    {t("Limitations du Junior Manager", "Junior Manager Limitations")}
                  </h4>
                  <p className="text-sm text-amber-300">
                    {t(
                      "Vous pouvez créer des cours et tests de base pour les niveaux A1-B1. Certains types de contenu avancés nécessitent des permissions supérieures.",
                      "You can create basic courses and tests for A1-B1 levels. Some advanced content types require higher permissions.",
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("Types disponibles", "Available Types")}</p>
                  <p className="text-xl font-bold text-foreground">{availableTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("Niveau d'accès", "Access Level")}</p>
                  <p className="text-xl font-bold text-foreground">{roleInfo.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("IA intégrée", "AI Integrated")}</p>
                  <p className="text-xl font-bold text-foreground">GPT-5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
