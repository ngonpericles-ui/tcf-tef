"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import {
  ArrowLeft,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  Crown,
  Brain,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react"

interface TestCorrectionItem {
  id: string
  title: string
  testType: "TCF" | "TEF"
  level: string
  category: string
  questionCount: number
  createdBy: string
  createdAt: string
  status: "published" | "draft" | "archived"
  views: number
  subscriptionTier: string
  estimatedDuration: number
}

export default function AdminTestCorrectionsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [corrections, setCorrections] = useState<TestCorrectionItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    // Load existing test corrections from localStorage
    const existingHistory = JSON.parse(localStorage.getItem("contentHistory") || "[]")
    const testCorrections = existingHistory.filter((item: any) => item.contentType === "test-corrections")

    const mockCorrections: TestCorrectionItem[] = [
      {
        id: "tc-1",
        title: "Corrections TCF B2 - Session Officielle 2024",
        testType: "TCF",
        level: "B2",
        category: "Général",
        questionCount: 76,
        createdBy: "Admin Principal",
        createdAt: "2024-01-15T10:30:00Z",
        status: "published",
        views: 1247,
        subscriptionTier: "Premium",
        estimatedDuration: 180,
      },
      {
        id: "tc-2",
        title: "Corrections TEF C1 - Compréhension Orale",
        testType: "TEF",
        level: "C1",
        category: "Compréhension orale",
        questionCount: 40,
        createdBy: "Manager Senior",
        createdAt: "2024-01-12T14:20:00Z",
        status: "published",
        views: 892,
        subscriptionTier: "Pro+",
        estimatedDuration: 120,
      },
      {
        id: "tc-3",
        title: "Corrections TCF C2 - Expression Écrite",
        testType: "TCF",
        level: "C2",
        category: "Expression écrite",
        questionCount: 25,
        createdBy: "Manager Junior",
        createdAt: "2024-01-10T09:15:00Z",
        status: "draft",
        views: 0,
        subscriptionTier: "Pro+",
        estimatedDuration: 90,
      },
    ]

    const combinedCorrections = [
      ...mockCorrections,
      ...testCorrections.map((item: any) => ({
        id: item.id,
        title: item.title,
        testType: item.testType || "TCF",
        level: item.level,
        category: item.category,
        questionCount: item.questionCount || 0,
        createdBy: "Manager",
        createdAt: item.uploadDate,
        status: item.status,
        views: Math.floor(Math.random() * 500) + 50,
        subscriptionTier: item.subscription,
        estimatedDuration: 120,
      })),
    ]

    setCorrections(combinedCorrections)
  }, [])

  const filteredCorrections = corrections.filter((correction) => {
    const matchesSearch =
      searchQuery === "" ||
      correction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      correction.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === "all" || correction.testType === filterType
    const matchesLevel = filterLevel === "all" || correction.level === filterLevel
    const matchesStatus = filterStatus === "all" || correction.status === filterStatus

    return matchesSearch && matchesType && matchesLevel && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "draft":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "archived":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Premium":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "Pro+":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/content/test-corrections/edit/${id}`)
  }

  const handleDelete = (id: string) => {
    setCorrections(corrections.filter((c) => c.id !== id))
  }

  const handleView = (id: string) => {
    router.push(`/admin/content/test-corrections/view/${id}`)
  }

  const createNew = () => {
    router.push("/admin/content/test-corrections/create")
  }

  const totalStats = {
    total: corrections.length,
    published: corrections.filter((c) => c.status === "published").length,
    totalViews: corrections.reduce((acc, c) => acc + c.views, 0),
    totalQuestions: corrections.reduce((acc, c) => acc + c.questionCount, 0),
  }

  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-gray-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t("Gestion des Corrections TCF/TEF", "TCF/TEF Corrections Management")}
              </h1>
              <p className="text-sm mt-1 text-gray-400">
                {t(
                  "Gérez toutes les corrections de tests pour les abonnés premium",
                  "Manage all test corrections for premium subscribers",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Crown className="w-4 h-4 mr-2" />
              {t("Admin", "Admin")}
            </Badge>
            <Button onClick={createNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t("Nouvelle correction", "New Correction")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalStats.total}</p>
                  <p className="text-sm text-white">{t("Corrections totales", "Total Corrections")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalStats.published}</p>
                  <p className="text-sm text-white">{t("Publiées", "Published")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalStats.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-white">{t("Vues totales", "Total Views")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalStats.totalQuestions}</p>
                  <p className="text-sm text-white">{t("Questions totales", "Total Questions")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t("Rechercher des corrections...", "Search corrections...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white hover:bg-gray-700">
                      {t("Tous types", "All Types")}
                    </SelectItem>
                    <SelectItem value="TCF" className="text-white hover:bg-gray-700">
                      TCF
                    </SelectItem>
                    <SelectItem value="TEF" className="text-white hover:bg-gray-700">
                      TEF
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white hover:bg-gray-700">
                      {t("Tous niveaux", "All Levels")}
                    </SelectItem>
                    <SelectItem value="B2" className="text-white hover:bg-gray-700">
                      B2
                    </SelectItem>
                    <SelectItem value="C1" className="text-white hover:bg-gray-700">
                      C1
                    </SelectItem>
                    <SelectItem value="C2" className="text-white hover:bg-gray-700">
                      C2
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white hover:bg-gray-700">
                      {t("Tous statuts", "All Status")}
                    </SelectItem>
                    <SelectItem value="published" className="text-white hover:bg-gray-700">
                      {t("Publié", "Published")}
                    </SelectItem>
                    <SelectItem value="draft" className="text-white hover:bg-gray-700">
                      {t("Brouillon", "Draft")}
                    </SelectItem>
                    <SelectItem value="archived" className="text-white hover:bg-gray-700">
                      {t("Archivé", "Archived")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corrections List */}
        <div className="space-y-4">
          {filteredCorrections.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {t("Aucune correction trouvée", "No corrections found")}
                </h3>
                <p className="text-gray-400 mb-6">
                  {t("Commencez par créer des corrections TCF/TEF", "Start by creating TCF/TEF corrections")}
                </p>
                <Button onClick={createNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Créer première correction", "Create First Correction")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCorrections.map((correction) => (
              <Card key={correction.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-8 h-8 text-orange-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{correction.title}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            {t("Créé par", "Created by")} {correction.createdBy} •{" "}
                            {new Date(correction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(correction.id)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(correction.id)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(correction.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 mb-4">
                        <Badge variant="outline" className="text-xs text-white">
                          {correction.testType} {correction.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs text-white ${getTierColor(correction.subscriptionTier)}`}
                        >
                          {correction.subscriptionTier}
                        </Badge>
                        <Badge variant="outline" className={`text-xs text-white ${getStatusColor(correction.status)}`}>
                          {correction.status === "published"
                            ? t("Publié", "Published")
                            : correction.status === "draft"
                              ? t("Brouillon", "Draft")
                              : t("Archivé", "Archived")}
                        </Badge>
                        <span className="text-xs text-gray-500">{correction.category}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{correction.questionCount} questions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{correction.estimatedDuration} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{correction.views} vues</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(correction.id)}
                            className="border-gray-700 bg-transparent text-white hover:bg-gray-800"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t("Voir", "View")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(correction.id)}
                            className="border-gray-700 bg-transparent text-white hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("Modifier", "Edit")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
