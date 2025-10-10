"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Star, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'

export default function JuniorManagerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user || user.role !== 'JUNIOR_MANAGER') {
        router.push('/manager')
      }
    }
  }, [isAuthenticated, user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Chargement...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'JUNIOR_MANAGER') {
    return null
  }

  const userName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenue, {userName}!</h2>
          <p className="text-muted-foreground">
            Gérez vos contenus pour les niveaux A1 à B1. Vous avez accès aux abonnements Gratuit et Essentiel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/junior-manager/content/create">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  Créer du contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Créez des cours, tests et corrections pour A1-B1</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/junior-manager/content">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Gérer le contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Organisez et modifiez vos contenus existants</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/junior-manager/feed">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Mon Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Consultez vos publications et interactions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Contenus créés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0</div>
              <p className="text-xs text-muted-foreground">Commencez à créer du contenu</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Étudiants actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0</div>
              <p className="text-xs text-muted-foreground">Aucun étudiant pour le moment</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Note moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                - <Star className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">Pas encore de notes</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Temps actif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0h</div>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
