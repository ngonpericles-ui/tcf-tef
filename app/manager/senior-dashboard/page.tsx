"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Star, Shield, LogOut, UserPlus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SeniorManagerDashboard() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    router.push("/manager")
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Manager Senior</h1>
              <p className="text-sm text-gray-400">Tableau de bord - Accès complet A1-C2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
              Senior Manager
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenue, Manager Senior!</h2>
            <p className="text-gray-300">
              Accès complet à tous les niveaux A1-C2 et tous les abonnements. Gérez votre équipe et créez du contenu
              avancé.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/manager/content/create">
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Créer du contenu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">Créez du contenu pour tous les niveaux</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/create-manager">
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-400" />
                    Créer un manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">Ajoutez des managers junior ou content</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/moderation">
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Modération
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">Gérez les sessions et utilisateurs</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/analytics/stats">
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">Analysez les performances</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats Overview - Now fetched from backend */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Contenus créés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">-</div>
                <p className="text-xs text-gray-400">Chargement...</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Équipe gérée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">-</div>
                <p className="text-xs text-gray-400">Chargement...</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Étudiants totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">-</div>
                <p className="text-xs text-gray-400">Chargement...</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400 flex items-center gap-1">
                  - <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-xs text-gray-400">Chargement...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
