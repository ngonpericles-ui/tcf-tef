"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { Search, User, Mail, Calendar, Shield, Edit, Trash2, Eye } from "lucide-react"

interface ManagerInfo {
  id: number
  name: string
  email: string
  role: string
  joinDate: string
  status: string
  specialties: string[]
  password: string
  createdBy: string
  createdAt: string
}

export default function ManagerSettingsPage() {
  const { t } = useLanguage()
  const [managers, setManagers] = useState<ManagerInfo[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Load managers from localStorage
    const storedManagers = JSON.parse(localStorage.getItem("managers") || "[]")
    setManagers(storedManagers)
  }, [])

  const filteredManagers = managers.filter(
    (manager) =>
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case "senior":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "content":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "junior":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "suspended":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("Paramètres des Managers", "Manager Settings")}</h1>
          <p className="text-gray-400 mt-1">
            {t("Gérez les informations et paramètres des managers", "Manage manager information and settings")}
          </p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            {t("Managers Créés", "Created Managers")}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t(
              "Liste complète des comptes managers avec leurs informations",
              "Complete list of manager accounts with their information",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("Rechercher un manager...", "Search manager...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredManagers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  {t("Aucun manager trouvé", "No managers found")}
                </h3>
                <p className="text-gray-500">
                  {t(
                    "Créez votre premier manager depuis la page de gestion",
                    "Create your first manager from the management page",
                  )}
                </p>
              </div>
            ) : (
              filteredManagers.map((manager) => (
                <Card key={manager.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{manager.name}</h3>
                            <Badge variant="outline" className={getRoleColor(manager.role)}>
                              {manager.role === "senior"
                                ? t("Senior", "Senior")
                                : manager.role === "content"
                                  ? t("Content", "Content")
                                  : t("Junior", "Junior")}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(manager.status)}>
                              {manager.status === "active"
                                ? t("Actif", "Active")
                                : manager.status === "pending"
                                  ? t("En attente", "Pending")
                                  : t("Suspendu", "Suspended")}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-gray-400">
                              <Mail className="w-4 h-4" />
                              <span>{manager.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {t("Créé le", "Created on")} {manager.joinDate}
                              </span>
                            </div>
                          </div>

                          {manager.specialties.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-400 mb-2">{t("Spécialités", "Specialties")}:</p>
                              <div className="flex flex-wrap gap-2">
                                {manager.specialties.map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-gray-700 text-gray-300">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                            <p className="text-sm text-gray-400 mb-1">
                              {t("Identifiants de connexion", "Login Credentials")}:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">{t("Email", "Email")}: </span>
                                <span className="text-gray-300 font-mono">{manager.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">{t("Mot de passe", "Password")}: </span>
                                <span className="text-gray-300 font-mono">{manager.password}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
