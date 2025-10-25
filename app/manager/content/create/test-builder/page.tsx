"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/components/language-provider"
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  CheckCircle,
  Circle,
  Square,
  Type,
  User,
  Crown,
  BookOpen,
  Save,
  Eye,
  Settings,
  Sparkles,
  Loader,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "fill-blank" | "short-answer"
  // Bilingual question text
  questionFr: string
  questionEn: string
  // Bilingual options for MC/TF
  options?: { fr: string; en: string }[]
  // Index for MC/TF or string for text-based
  correctAnswer: string | number
  points: number
  // Bilingual explanation
  explanationFr?: string
  explanationEn?: string
  level: string
  category: string
}

interface TestSettings {
  title: string
  description: string
  // Support multiple levels selection for a test
  levels: string[]
  // Keep a primary level for backward compatibility (first of levels)
  level: string
  category: string
  subscription: string
  duration: number
  passingScore: number
  randomizeQuestions: boolean
  showResults: boolean
  allowRetake: boolean
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  levelRestrictions: string[]
  subscriptionRestrictions: string[]
}

function TestBuilderPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [testSettings, setTestSettings] = useState<TestSettings>({
    title: "",
    description: "",
    levels: ["A1"],
    level: "A1",
    category: "Compréhension écrite",
    subscription: "Gratuit",
    duration: 30,
    passingScore: 60,
    randomizeQuestions: false,
    showResults: true,
    allowRetake: true,
  })
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [questionCount, setQuestionCount] = useState(5)
  const [activeTab, setActiveTab] = useState("settings")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const roleParam = urlParams.get("role") || localStorage.getItem("managerRole") || "junior"

    const mockManagers = {
      junior: {
        role: "junior" as const,
        levelRestrictions: ["A1", "A2", "B1"],
        subscriptionRestrictions: ["Gratuit"],
      },
      content: {
        role: "content" as const,
        levelRestrictions: ["A1", "A2", "B1", "B2", "C1"],
        subscriptionRestrictions: ["Gratuit", "Essentiel", "Premium"],
      },
      senior: {
        role: "senior" as const,
        levelRestrictions: ["A1", "A2", "B1", "B2", "C1", "C2"],
        subscriptionRestrictions: ["Gratuit", "Essentiel", "Premium", "Pro+"],
      },
    }

    const manager = mockManagers[roleParam as keyof typeof mockManagers] || mockManagers.junior
    setCurrentManager(manager)
    setTestSettings((prev) => ({
      ...prev,
      levels: [manager.levelRestrictions[0]],
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
          color: "bg-gray-500/10 text-muted-foreground border-gray-500/20",
        }
    }
  }

  const questionTypes = [
    {
      type: "multiple-choice" as const,
      label: t("Choix multiple", "Multiple Choice"),
      icon: CheckCircle,
      description: t("Question avec plusieurs options", "Question with multiple options"),
      available: true,
    },
    {
      type: "true-false" as const,
      label: t("Vrai/Faux", "True/False"),
      icon: Circle,
      description: t("Question vrai ou faux", "True or false question"),
      available: true,
    },
    {
      type: "fill-blank" as const,
      label: t("Texte à trous", "Fill in the Blank"),
      icon: Square,
      description: t("Compléter les mots manquants", "Complete missing words"),
      available: true,
    },
    {
      type: "short-answer" as const,
      label: t("Réponse courte", "Short Answer"),
      icon: Type,
      description: t("Réponse libre courte", "Short free response"),
      available: true,
    },
  ]

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      questionFr: "",
      questionEn: "",
      options:
        type === "multiple-choice"
          ? [
              { fr: "", en: "" },
              { fr: "", en: "" },
              { fr: "", en: "" },
              { fr: "", en: "" },
            ]
          : type === "true-false"
            ? [
                { fr: "Vrai", en: "True" },
                { fr: "Faux", en: "False" },
              ]
            : undefined,
      correctAnswer: type === "multiple-choice" ? 0 : type === "true-false" ? 0 : "",
      points: 1,
      explanationFr: "",
      explanationEn: "",
      level: (testSettings.levels && testSettings.levels[0]) || testSettings.level || "A1",
      category: testSettings.category,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleGenerateQuestionsWithAI = async () => {
    try {
      if (!testSettings.title.trim()) {
        toast.error(t("Veuillez saisir un titre pour le test", "Please enter a test title"))
        return
      }

      if (!testSettings.description.trim()) {
        toast.error(t("Veuillez saisir une description pour le test", "Please enter a test description"))
        return
      }

      if (!aiPrompt.trim()) {
        toast.error(t("Veuillez saisir une description pour générer les questions", "Please enter a description to generate questions"))
        return
      }

      setIsGeneratingQuestions(true)

      // Call AI API to generate questions
      const response = await apiClient.post('/ai/generate-questions', {
        content: aiPrompt,
        lessonTitle: testSettings.title,
        courseTitle: testSettings.description,
        level: testSettings.level,
        category: testSettings.category,
        questionCount: questionCount,
        questionTypes: ["multiple-choice", "true-false", "short-answer"]
      })

      if (!response.success) {
        throw new Error((response as any).message || 'Failed to generate questions')
      }

      // Parse generated questions and add them to the list
      const generatedQuestions = (response.data as any)?.questions || []

      if (generatedQuestions.length === 0) {
        toast.error(t("Aucune question n'a pu être générée. Veuillez réessayer.", "No questions could be generated. Please try again."))
        return
      }

      // Add generated questions to the questions list with bilingual support
      const newQuestions = generatedQuestions.map((q: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: q.type || "multiple-choice",
        questionFr: q.questionText || q.question || "",
        questionEn: q.questionText || q.question || "", // Use same text for both languages
        options: q.options ? q.options.map((opt: string) => ({ fr: opt, en: opt })) : (q.type === "multiple-choice" ? [{ fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" }] : []),
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
        explanationFr: q.explanation || "",
        explanationEn: q.explanation || "",
        points: q.points || 1,
        level: testSettings.level,
        category: testSettings.category,
      }))

      setQuestions([...questions, ...newQuestions])
      setAiPrompt("")
      toast.success(t(`✅ ${newQuestions.length} questions générées avec succès!`, `✅ ${newQuestions.length} questions generated successfully!`))
    } catch (error: any) {
      console.error("Error generating questions:", error)
      toast.error(t(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`, `Error generating: ${error.message || 'Unknown error'}`))
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const updateOption = (questionId: string, optionIndex: number, value: string, lang: "fr" | "en") => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.map((opt, idx) => (idx === optionIndex ? { ...opt, [lang]: value } : opt)),
            }
          : q,
      ),
    )
  }

  const saveTest = () => {
    const testData = {
      settings: testSettings,
      questions,
      createdBy: currentManager?.role,
      createdAt: new Date().toISOString(),
      status: "draft",
    }

    localStorage.setItem("testData", JSON.stringify(testData))
    router.push("/manager/content/process?type=test")
  }

  const previewTest = () => {
    // Implementation for test preview
    console.log("Preview test:", { testSettings, questions })
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon
  const availableQuestionTypes = questionTypes.filter((type) => type.available)

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("Créateur de test", "Test Builder")}</h1>
              <p className="text-sm mt-1 text-muted-foreground">
                {t(
                  "Créez des tests adaptés à votre niveau de permission",
                  "Create tests adapted to your permission level",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
              <RoleIcon className="w-4 h-4 mr-2" />
              {roleInfo.label}
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              {questions.length} {t("questions", "questions")}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Test Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Paramètres du test", "Test Settings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("Titre", "Title")}</Label>
                  <Input
                    value={testSettings.title}
                    onChange={(e) => setTestSettings((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-input border-input text-foreground"
                    placeholder={t("Nom du test", "Test name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("Description", "Description")}</Label>
                  <Textarea
                    value={testSettings.description}
                    onChange={(e) => setTestSettings((prev) => ({ ...prev, description: e.target.value }))}
                    className="bg-input border-input text-foreground"
                    placeholder={t("Description du test", "Test description")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("Niveaux", "Levels")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {currentManager.levelRestrictions.map((level) => {
                      const active = testSettings.levels.includes(level)
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setTestSettings((prev) => {
                              const exists = prev.levels.includes(level)
                              const levels = exists
                                ? prev.levels.filter((l) => l !== level)
                                : [...prev.levels, level]
                              return { ...prev, levels, level: levels[0] || prev.level }
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Sélectionnez un ou plusieurs niveaux pour ce test",
                      "Select one or multiple levels for this test",
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                  <Select
                    value={testSettings.category}
                    onValueChange={(value) => setTestSettings((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-input border-input text-foreground">
                      <SelectValue className="text-foreground" />
                    </SelectTrigger>
                    <SelectContent className="bg-input border-input">
                      <SelectItem value="Compréhension écrite" className="text-foreground hover:bg-accent">
                        {t("Compréhension écrite", "Reading Comprehension")}
                      </SelectItem>
                      <SelectItem value="Compréhension orale" className="text-foreground hover:bg-accent">
                        {t("Compréhension orale", "Listening Comprehension")}
                      </SelectItem>
                      <SelectItem value="Expression écrite" className="text-foreground hover:bg-accent">
                        {t("Expression écrite", "Written Expression")}
                      </SelectItem>
                      <SelectItem value="Expression orale" className="text-foreground hover:bg-accent">
                        {t("Expression orale", "Oral Expression")}
                      </SelectItem>
                      <SelectItem value="Vocabulaire" className="text-foreground hover:bg-accent">
                        {t("Vocabulaire", "Vocabulary")}
                      </SelectItem>
                      <SelectItem value="Grammaire" className="text-foreground hover:bg-accent">
                        {t("Grammaire", "Grammar")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("Durée (minutes)", "Duration (minutes)")}</Label>
                  <Select
                    value={testSettings.duration.toString()}
                    onValueChange={(value) =>
                      setTestSettings((prev) => ({ ...prev, duration: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="bg-input border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 {t("minutes", "minutes")}</SelectItem>
                      <SelectItem value="30">30 {t("minutes", "minutes")}</SelectItem>
                      <SelectItem value="45">45 {t("minutes", "minutes")}</SelectItem>
                      <SelectItem value="60">60 {t("minutes", "minutes")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("Score de réussite (%)", "Passing Score (%)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={testSettings.passingScore}
                    onChange={(e) =>
                      setTestSettings((prev) => ({ ...prev, passingScore: Number.parseInt(e.target.value) || 60 }))
                    }
                    className="bg-input border-input text-foreground"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="randomize"
                      checked={testSettings.randomizeQuestions}
                      onCheckedChange={(checked) =>
                        setTestSettings((prev) => ({ ...prev, randomizeQuestions: !!checked }))
                      }
                    />
                    <Label htmlFor="randomize" className="text-muted-foreground text-sm">
                      {t("Mélanger les questions", "Randomize questions")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showResults"
                      checked={testSettings.showResults}
                      onCheckedChange={(checked) => setTestSettings((prev) => ({ ...prev, showResults: !!checked }))}
                    />
                    <Label htmlFor="showResults" className="text-muted-foreground text-sm">
                      {t("Afficher les résultats", "Show results")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowRetake"
                      checked={testSettings.allowRetake}
                      onCheckedChange={(checked) => setTestSettings((prev) => ({ ...prev, allowRetake: !!checked }))}
                    />
                    <Label htmlFor="allowRetake" className="text-muted-foreground text-sm">
                      {t("Autoriser les reprises", "Allow retakes")}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Types */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Plus className="w-5 h-5 mr-2" />
                  {t("Ajouter une question", "Add Question")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questionTypes.map((type) => {
                  const TypeIcon = type.icon
                  return (
                    <Button
                      key={type.type}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-auto p-3",
                        type.available
                          ? "border-gray-200 dark:border-gray-700 bg-muted/50 hover:bg-muted text-foreground"
                          : "border-gray-200 dark:border-gray-700 bg-muted/20 text-muted-foreground cursor-not-allowed",
                      )}
                      onClick={() => type.available && addQuestion(type.type)}
                      disabled={!type.available}
                    >
                      <div className="flex items-start space-x-3">
                        <TypeIcon className="w-5 h-5 mt-0.5" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                          {!type.available && (
                            <div className="text-xs text-amber-400 mt-1">
                              {t("Nécessite des permissions avancées", "Requires advanced permissions")}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

            {/* AI Generation */}
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 dark:border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                  {t("Générer avec IA", "Generate with AI")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">{t("Description du contenu", "Content Description")}</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t("Ex: Générez des questions sur les temps du passé...", "Ex: Generate questions about past tenses...")}
                    className="bg-background border-input text-foreground min-h-[80px] text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">{t("Nombre de questions", "Number of Questions")}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                    className="bg-background border-input text-foreground text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateQuestionsWithAI}
                  disabled={isGeneratingQuestions || !aiPrompt.trim()}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {t("Génération...", "Generating...")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t("Générer", "Generate")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={previewTest}
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 bg-transparent text-foreground hover:bg-muted"
                  disabled={questions.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t("Aperçu", "Preview")}
                </Button>
                <Button
                  onClick={saveTest}
                  className="w-full bg-green-600 hover:bg-green-700 text-foreground"
                  disabled={questions.length === 0 || !testSettings.title}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t("Sauvegarder le test", "Save Test")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-3 space-y-6">
            {questions.length === 0 ? (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {t("Aucune question ajoutée", "No questions added")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("Commencez par ajouter des questions à votre test", "Start by adding questions to your test")}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableQuestionTypes.map((type) => {
                      const TypeIcon = type.icon
                      return (
                        <Button
                          key={type.type}
                          onClick={() => addQuestion(type.type)}
                          className="bg-blue-600 hover:bg-blue-700 text-foreground"
                        >
                          <TypeIcon className="w-4 h-4 mr-2" />
                          {type.label}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id} className="bg-card border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {t("Question", "Question")} {index + 1}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-500/10 text-muted-foreground border-gray-500/20">
                            {questionTypes.find((t) => t.type === question.type)?.label}
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                            {question.points} {t("pt", "pt")}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Question (FR)", "Question (FR)")}</Label>
                          <Textarea
                            value={question.questionFr}
                            onChange={(e) => updateQuestion(question.id, { questionFr: e.target.value })}
                            className="bg-input border-input text-foreground"
                            placeholder={t("Saisissez la question en français", "Enter the question in French")}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Question (EN)", "Question (EN)")}</Label>
                          <Textarea
                            value={question.questionEn}
                            onChange={(e) => updateQuestion(question.id, { questionEn: e.target.value })}
                            className="bg-input border-input text-foreground"
                            placeholder={t("Saisissez la question en anglais", "Enter the question in English")}
                            rows={2}
                          />
                        </div>
                      </div>

                      {question.type === "multiple-choice" && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Options", "Options")}</Label>
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateQuestion(question.id, { correctAnswer: optionIndex })}
                                className="text-green-500"
                              />
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <Input
                                  value={option.fr}
                                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value, "fr")}
                                  className="bg-input border-input text-foreground"
                                  placeholder={`${t("Option", "Option")} ${optionIndex + 1} (FR)`}
                                />
                                <Input
                                  value={option.en}
                                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value, "en")}
                                  className="bg-input border-input text-foreground"
                                  placeholder={`${t("Option", "Option")} ${optionIndex + 1} (EN)`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Réponse correcte", "Correct Answer")}</Label>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`tf-${question.id}`}
                                checked={question.correctAnswer === 0}
                                onChange={() => updateQuestion(question.id, { correctAnswer: 0 })}
                                className="text-green-500"
                              />
                              <span className="text-foreground">{t("Vrai", "True")}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`tf-${question.id}`}
                                checked={question.correctAnswer === 1}
                                onChange={() => updateQuestion(question.id, { correctAnswer: 1 })}
                                className="text-green-500"
                              />
                              <span className="text-foreground">{t("Faux", "False")}</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {question.type === "fill-blank" && (
                        <div className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            {t(
                              "Avant la réponse: ajoutez le texte avec __ pour marquer les trous",
                              "Before the answer: write the text and use __ to mark blanks",
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Textarea
                              value={question.questionFr}
                              onChange={(e) => updateQuestion(question.id, { questionFr: e.target.value })}
                              className="bg-input border-input text-foreground"
                              placeholder={t("Texte de l'exercice (FR)", "Exercise text (FR)")}
                              rows={3}
                            />
                            <Textarea
                              value={question.questionEn}
                              onChange={(e) => updateQuestion(question.id, { questionEn: e.target.value })}
                              className="bg-input border-input text-foreground"
                              placeholder={t("Texte de l'exercice (EN)", "Exercise text (EN)")}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">{t("Réponses attendues (séparées par ;)", "Expected answers (separated by ;)")}</Label>
                            <Input
                              value={(question.correctAnswer as string) || ""}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="bg-input border-input text-foreground"
                              placeholder={t("ex: Paris;France;Eiffel", "e.g., Paris;France;Eiffel")}
                            />
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "Saisissez les réponses dans l'ordre des trous, séparées par un point-virgule",
                                "Enter answers in blank order, separated by semicolons",
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {(question.type === "fill-blank" || question.type === "short-answer") && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Réponse correcte", "Correct Answer")}</Label>
                          <Input
                            value={question.correctAnswer as string}
                            onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                            className="bg-input border-input text-foreground"
                            placeholder={t("Réponse attendue", "Expected answer")}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Points", "Points")}</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(question.id, { points: Number.parseInt(e.target.value) || 1 })
                            }
                            className="bg-input border-input text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                          <Select
                            value={question.category}
                            onValueChange={(value) => updateQuestion(question.id, { category: value })}
                          >
                            <SelectTrigger className="bg-input border-input text-foreground">
                              <SelectValue className="text-foreground" />
                            </SelectTrigger>
                            <SelectContent className="bg-input border-input">
                              <SelectItem value="Compréhension écrite" className="text-foreground hover:bg-accent">
                                {t("Compréhension écrite", "Reading Comprehension")}
                              </SelectItem>
                              <SelectItem value="Compréhension orale" className="text-foreground hover:bg-accent">
                                {t("Compréhension orale", "Listening Comprehension")}
                              </SelectItem>
                              <SelectItem value="Expression écrite" className="text-foreground hover:bg-accent">
                                {t("Expression écrite", "Written Expression")}
                              </SelectItem>
                              <SelectItem value="Expression orale" className="text-foreground hover:bg-accent">
                                {t("Expression orale", "Oral Expression")}
                              </SelectItem>
                              <SelectItem value="Vocabulaire" className="text-foreground hover:bg-accent">
                                {t("Vocabulaire", "Vocabulary")}
                              </SelectItem>
                              <SelectItem value="Grammaire" className="text-foreground hover:bg-accent">
                                {t("Grammaire", "Grammar")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Explication (FR)", "Explanation (FR)")}</Label>
                          <Textarea
                            value={question.explanationFr || ""}
                            onChange={(e) => updateQuestion(question.id, { explanationFr: e.target.value })}
                            className="bg-input border-input text-foreground"
                            placeholder={t("Explication en français", "Explanation in French")}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">{t("Explication (EN)", "Explanation (EN)")}</Label>
                          <Textarea
                            value={question.explanationEn || ""}
                            onChange={(e) => updateQuestion(question.id, { explanationEn: e.target.value })}
                            className="bg-input border-input text-foreground"
                            placeholder={t("Explication en anglais", "Explanation in English")}
                            rows={2}
                          />
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

export default function TestBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <TestBuilderPageContent />
    </Suspense>
  )
}
