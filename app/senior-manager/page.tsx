"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'

export default function SeniorManagerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user || (user.role !== 'SENIOR_MANAGER' && user.role !== 'ADMIN')) {
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

  if (!isAuthenticated || !user || (user.role !== 'SENIOR_MANAGER' && user.role !== 'ADMIN')) {
    return null
  }

  const userName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenue, {userName}!</h2>
          <p className="text-muted-foreground">
            Gérez tous les contenus de A1 à C2. Accès complet à tous les abonnements et fonctionnalités avancées.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/manager/content/create">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  Créer du contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Créez du contenu pour tous les niveaux A1-C2</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manager/content">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Gérer le contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Organisez et modifiez tous vos contenus</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manager/create-manager">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Créer Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Créez de nouveaux managers junior et content</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manager/analytics">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Analysez les performances et statistiques</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Contenus créés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">0</div>
              <p className="text-xs text-muted-foreground">Commencez à créer du contenu</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Étudiants gérés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">0</div>
              <p className="text-xs text-muted-foreground">Aucun étudiant pour le moment</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Managers créés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">0</div>
              <p className="text-xs text-muted-foreground">Aucun manager créé</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm font-medium">Revenus générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">0 CFA</div>
              <p className="text-xs text-muted-foreground">Pas encore de revenus</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
