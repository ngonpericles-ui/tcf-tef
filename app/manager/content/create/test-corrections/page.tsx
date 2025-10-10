"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  User,
  Crown,
  BookOpen,
  Save,
  Eye,
  Settings,
  AlertCircle,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TestCorrection {
  id: string
  questionText: string
  correctAnswer: string
  explanation: string
  level: string
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  points: number
}

interface TestCorrectionSettings {
  title: string
  description: string
  testType: "TCF" | "TEF"
  level: string
  category: string
  subscription: string
  targetAudience: string
  estimatedDuration: number
  totalQuestions: number
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  levelRestrictions: string[]
  subscriptionRestrictions: string[]
  canCreateTestCorrections: boolean
}

export default function TestCorrectionsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [corrections, setCorrections] = useState<TestCorrection[]>([])
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [settings, setSettings] = useState<TestCorrectionSettings>({
    title: "",
    description: "",
    testType: "TCF",
    level: "B2",
    category: "Général",
    subscription: "Premium",
    targetAudience: "Étudiants préparant le TCF",
    estimatedDuration: 120,
    totalQuestions: 0,
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const roleParam = urlParams.get("role") || localStorage.getItem("managerRole") || "junior"

    const mockManagers = {
      junior: {
        role: "junior" as const,
        levelRestrictions: ["B2", "C1", "C2"], // TCF/TEF papers start from B2
        subscriptionRestrictions: ["Premium", "Pro+"],
        canCreateTestCorrections: true,
      },
      content: {
        role: "content" as const,
        levelRestrictions: ["B2", "C1", "C2"],
        subscriptionRestrictions: ["Premium", "Pro+"],
        canCreateTestCorrections: true,
      },
      senior: {
        role: "senior" as const,
        levelRestrictions: ["B2", "C1", "C2"],
        subscriptionRestrictions: ["Premium", "Pro+"],
        canCreateTestCorrections: true,
      },
    }

    const manager = mockManagers[roleParam as keyof typeof mockManagers] || mockManagers.junior
    setCurrentManager(manager)
    setSettings((prev) => ({
      ...prev,
      level: manager.levelRestrictions[0],
      subscription: manager.subscriptionRestrictions[0],
    }))
  }, [])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      default:
        return {
          label: t("Manager", "Manager"),
          icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        }
    }
  }

  const addCorrection = () => {
    const newCorrection: TestCorrection = {
      id: Math.random().toString(36).substr(2, 9),
      questionText: "",
      correctAnswer: "",
      explanation: "",
      level: settings.level,
      category: settings.category,
      difficulty: 3,
      points: 1,
    }
    setCorrections([...corrections, newCorrection])
    setSettings((prev) => ({ ...prev, totalQuestions: prev.totalQuestions + 1 }))
  }

  const updateCorrection = (id: string, updates: Partial<TestCorrection>) => {
    setCorrections(corrections.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const removeCorrection = (id: string) => {
    setCorrections(corrections.filter((c) => c.id !== id))
    setSettings((prev) => ({ ...prev, totalQuestions: Math.max(0, prev.totalQuestions - 1) }))
  }

  const saveTestCorrections = () => {
    const testCorrectionData = {
      settings,
      corrections,
      createdBy: currentManager?.role,
      createdAt: new Date().toISOString(),
      status: "draft",
      type: "test-corrections",
    }

    // Save to localStorage for now
    const existingHistory = JSON.parse(localStorage.getItem("contentHistory") || "[]")
    const newHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: settings.title,
      type: "application/pdf",
      level: settings.level,
      subscription: settings.subscription,
      category: "Corrections TCF/TEF",
      uploadDate: new Date().toISOString(),
      status: "published",
      contentType: "test-corrections",
      testType: settings.testType,
      questionCount: corrections.length,
    }

    localStorage.setItem("contentHistory", JSON.stringify([...existingHistory, newHistoryItem]))
    localStorage.setItem("testCorrectionsData", JSON.stringify(testCorrectionData))

    router.push("/manager/content/success")
  }

  const previewCorrections = () => {
    console.log("Preview test corrections:", { settings, corrections })
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!currentManager.canCreateTestCorrections) {
    const roleInfo = getRoleInfo(currentManager.role)
    const RoleIcon = roleInfo.icon

    return (
      <div className="min-h-screen p-6 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">{t("Accès restreint", "Access Restricted")}</h2>
              <p className="text-gray-400 mb-4">
                {t(
                  "Votre rôle ne vous permet pas de créer des corrections de test.",
                  "Your role does not allow creating test corrections.",
                )}
              </p>
              <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
                <RoleIcon className="w-4 h-4 mr-2" />
                {roleInfo.label}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

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
              <h1 className="text-3xl font-bold text-white">{t("Corrections TCF/TEF", "TCF/TEF Test Corrections")}</h1>
              <p className="text-sm mt-1 text-gray-400">
                {t(
                  "Créez des corrections détaillées pour les examens TCF/TEF",
                  "Create detailed corrections for TCF/TEF exams",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
              <RoleIcon className="w-4 h-4 mr-2" />
              {roleInfo.label}
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
              <Brain className="w-4 h-4 mr-2" />
              {t("Premium uniquement", "Premium only")}
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              {corrections.length} {t("corrections", "corrections")}
            </Badge>
          </div>
        </div>

        {/* Subscription Notice */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{t("Contenu Premium", "Premium Content")}</h3>
                <p className="text-gray-300 text-sm">
                  {t(
                    "Les corrections TCF/TEF sont disponibles uniquement pour les abonnés Premium et Pro+. Les étudiants avec un abonnement Essential ou inférieur n'y auront pas accès.",
                    "TCF/TEF corrections are available only for Premium and Pro+ subscribers. Students with Essential or lower subscriptions will not have access.",
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Paramètres", "Settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Titre", "Title")}</Label>
                  <Input
                    value={settings.title}
                    onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder={t("Corrections TCF B2 - Session 2024", "TCF B2 Corrections - 2024 Session")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Description", "Description")}</Label>
                  <Textarea
                    value={settings.description}
                    onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder={t(
                      "Corrections détaillées avec explications...",
                      "Detailed corrections with explanations...",
                    )}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t("Type de test", "Test Type")}</Label>
                  <Select
                    value={settings.testType}
                    onValueChange={(value: "TCF" | "TEF") => setSettings((prev) => ({ ...prev, testType: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="TCF" className="text-white hover:bg-gray-700">
                        TCF - Test de Connaissance du Français
                      </SelectItem>
                      <SelectItem value="TEF" className="text-white hover:bg-gray-700">
                        TEF - Test d'Évaluation de Français
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t("Niveau", "Level")}</Label>
                  <Select
                    value={settings.level}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {currentManager.levelRestrictions.map((level) => (
                        <SelectItem key={level} value={level} className="text-white hover:bg-gray-700">
                          {level} -{" "}
                          {level === "B2"
                            ? t("Intermédiaire supérieur", "Upper Intermediate")
                            : level === "C1"
                              ? t("Avancé", "Advanced")
                              : t("Maîtrise", "Mastery")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{t("Catégorie", "Category")}</Label>
                  <Select
                    value={settings.category}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Général" className="text-white hover:bg-gray-700">
                        {t("Général", "General")}
                      </SelectItem>
                      <SelectItem value="Compréhension orale" className="text-white hover:bg-gray-700">
                        {t("Compréhension orale", "Listening Comprehension")}
                      </SelectItem>
                      <SelectItem value="Compréhension écrite" className="text-white hover:bg-gray-700">
                        {t("Compréhension écrite", "Reading Comprehension")}
                      </SelectItem>
                      <SelectItem value="Expression écrite" className="text-white hover:bg-gray-700">
                        {t("Expression écrite", "Written Expression")}
                      </SelectItem>
                      <SelectItem value="Expression orale" className="text-white hover:bg-gray-700">
                        {t("Expression orale", "Oral Expression")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Durée estimée (min)", "Estimated Duration (min)")}</Label>
                  <Select
                    value={settings.estimatedDuration.toString()}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, estimatedDuration: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="60" className="text-white hover:bg-gray-700">
                        60 {t("minutes", "minutes")}
                      </SelectItem>
                      <SelectItem value="90" className="text-white hover:bg-gray-700">
                        90 {t("minutes", "minutes")}
                      </SelectItem>
                      <SelectItem value="120" className="text-white hover:bg-gray-700">
                        120 {t("minutes", "minutes")}
                      </SelectItem>
                      <SelectItem value="180" className="text-white hover:bg-gray-700">
                        180 {t("minutes", "minutes")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Public cible", "Target Audience")}</Label>
                  <Textarea
                    value={settings.targetAudience}
                    onChange={(e) => setSettings((prev) => ({ ...prev, targetAudience: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder={t("Étudiants préparant le TCF...", "Students preparing for TCF...")}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 space-y-3">
                <Button onClick={addCorrection} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Ajouter correction", "Add Correction")}
                </Button>
                <Button
                  onClick={previewCorrections}
                  variant="outline"
                  className="w-full border-gray-700 bg-transparent text-white hover:bg-gray-800"
                  disabled={corrections.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t("Aperçu", "Preview")}
                </Button>
                <Button
                  onClick={saveTestCorrections}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={corrections.length === 0 || !settings.title}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t("Publier corrections", "Publish Corrections")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Corrections List */}
          <div className="lg:col-span-3 space-y-6">
            {corrections.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {t("Aucune correction ajoutée", "No corrections added")}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {t(
                      "Commencez par ajouter des corrections question-réponse pour votre test TCF/TEF",
                      "Start by adding question-answer corrections for your TCF/TEF test",
                    )}
                  </p>
                  <Button onClick={addCorrection} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("Ajouter première correction", "Add First Correction")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {corrections.map((correction, index) => (
                  <Card key={correction.id} className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {t("Question", "Question")} {index + 1}
                          </Badge>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                            {settings.testType} {correction.level}
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                            {correction.points} {t("pt", "pt")}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-400">{t("Difficulté:", "Difficulty:")}</span>
                            {Array.from({ length: correction.difficulty }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-orange-500" />
                            ))}
                            {Array.from({ length: 5 - correction.difficulty }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-gray-700" />
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCorrection(correction.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">{t("Texte de la question", "Question Text")}</Label>
                        <Textarea
                          value={correction.questionText}
                          onChange={(e) => updateCorrection(correction.id, { questionText: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder={t(
                            "Tapez ou collez la question du test TCF/TEF...",
                            "Type or paste the TCF/TEF test question...",
                          )}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">{t("Réponse correcte", "Correct Answer")}</Label>
                        <Textarea
                          value={correction.correctAnswer}
                          onChange={(e) => updateCorrection(correction.id, { correctAnswer: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder={t("Réponse correcte détaillée...", "Detailed correct answer...")}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">{t("Explication détaillée", "Detailed Explanation")}</Label>
                        <Textarea
                          value={correction.explanation}
                          onChange={(e) => updateCorrection(correction.id, { explanation: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder={t(
                            "Explication complète avec règles grammaticales, contexte culturel, etc...",
                            "Complete explanation with grammar rules, cultural context, etc...",
                          )}
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">{t("Points", "Points")}</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={correction.points}
                            onChange={(e) =>
                              updateCorrection(correction.id, { points: Number.parseInt(e.target.value) || 1 })
                            }
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">{t("Difficulté", "Difficulty")}</Label>
                          <Select
                            value={correction.difficulty.toString()}
                            onValueChange={(value) =>
                              updateCorrection(correction.id, {
                                difficulty: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue className="text-white" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="1" className="text-white hover:bg-gray-700">
                                1 - {t("Très facile", "Very Easy")}
                              </SelectItem>
                              <SelectItem value="2" className="text-white hover:bg-gray-700">
                                2 - {t("Facile", "Easy")}
                              </SelectItem>
                              <SelectItem value="3" className="text-white hover:bg-gray-700">
                                3 - {t("Moyen", "Medium")}
                              </SelectItem>
                              <SelectItem value="4" className="text-white hover:bg-gray-700">
                                4 - {t("Difficile", "Hard")}
                              </SelectItem>
                              <SelectItem value="5" className="text-white hover:bg-gray-700">
                                5 - {t("Très difficile", "Very Hard")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">{t("Catégorie", "Category")}</Label>
                          <Select
                            value={correction.category}
                            onValueChange={(value) => updateCorrection(correction.id, { category: value })}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue className="text-white" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="Général" className="text-white hover:bg-gray-700">
                                {t("Général", "General")}
                              </SelectItem>
                              <SelectItem value="Compréhension orale" className="text-white hover:bg-gray-700">
                                {t("Compréhension orale", "Listening")}
                              </SelectItem>
                              <SelectItem value="Compréhension écrite" className="text-white hover:bg-gray-700">
                                {t("Compréhension écrite", "Reading")}
                              </SelectItem>
                              <SelectItem value="Expression écrite" className="text-white hover:bg-gray-700">
                                {t("Expression écrite", "Writing")}
                              </SelectItem>
                              <SelectItem value="Expression orale" className="text-white hover:bg-gray-700">
                                {t("Expression orale", "Speaking")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
