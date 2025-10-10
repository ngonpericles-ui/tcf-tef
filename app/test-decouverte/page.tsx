"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Play, 
  Clock, 
  Target, 
  BookOpen, 
  Headphones, 
  PenTool, 
  MessageCircle, 
  GraduationCap,
  Award,
  Star,
  Lock,
  ArrowRight,
  X,
  Volume2,
  FileText,
  Brain,
  CheckCircle
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useRouter } from "next/navigation"

const availableTests = [
  {
    id: "comprehension_orale_starter",
    name: { fr: "Compréhension Orale - Niveau A1-A2", en: "Listening Comprehension - Level A1-A2" },
    category: "comprehension_orale",
    duration: 5,
    questions: 10,
    difficulty: "A1-A2",
    description: { fr: "Testez votre compréhension orale avec des dialogues simples et des questions basiques", en: "Test your listening comprehension with simple dialogues and basic questions" },
    icon: Volume2,
    color: "#007BFF",
    isFree: true
  },
  {
    id: "comprehension_ecrite_starter",
    name: { fr: "Compréhension Écrite - Niveau A1-A2", en: "Reading Comprehension - Level A1-A2" },
    category: "comprehension_ecrite",
    duration: 7,
    questions: 15,
    difficulty: "A1-A2",
    description: { fr: "Évaluez votre compréhension écrite avec des textes courts et des questions simples", en: "Evaluate your reading comprehension with short texts and simple questions" },
    icon: FileText,
    color: "#16A085",
    isFree: true
  },
  {
    id: "grammaire_starter",
    name: { fr: "Grammaire - Niveau A1-A2", en: "Grammar - Level A1-A2" },
    category: "grammaire",
    duration: 3,
    questions: 5,
    difficulty: "A1-A2",
    description: { fr: "Testez vos connaissances grammaticales de base avec des exercices simples", en: "Test your basic grammar knowledge with simple exercises" },
    icon: GraduationCap,
    color: "#8E44AD",
    isFree: true
  },
  {
    id: "vocabulaire_starter",
    name: { fr: "Vocabulaire - Niveau A1-A2", en: "Vocabulary - Level A1-A2" },
    category: "vocabulaire",
    duration: 4,
    questions: 8,
    difficulty: "A1-A2",
    description: { fr: "Enrichissez votre vocabulaire avec des mots et expressions de base", en: "Enrich your vocabulary with basic words and expressions" },
    icon: Brain,
    color: "#2ECC71",
    isFree: true
  },
  {
    id: "expression_ecrite_starter",
    name: { fr: "Expression Écrite - Niveau A1-A2", en: "Written Expression - Level A1-A2" },
    category: "expression_ecrite",
    duration: 6,
    questions: 3,
    difficulty: "A1-A2",
    description: { fr: "Pratiquez l'écriture avec des exercices guidés et des corrections", en: "Practice writing with guided exercises and corrections" },
    icon: PenTool,
    color: "#E74C3C",
    isFree: true
  }
]

const categories = [
  { id: "all", name: { fr: "Tous les tests", en: "All tests" }, icon: Target },
  { id: "comprehension_orale", name: { fr: "Compréhension Orale", en: "Listening Comprehension" }, icon: Volume2 },
  { id: "comprehension_ecrite", name: { fr: "Compréhension Écrite", en: "Reading Comprehension" }, icon: FileText },
  { id: "grammaire", name: { fr: "Grammaire", en: "Grammar" }, icon: GraduationCap },
  { id: "vocabulaire", name: { fr: "Vocabulaire", en: "Vocabulary" }, icon: Brain },
  { id: "expression_ecrite", name: { fr: "Expression Écrite", en: "Written Expression" }, icon: PenTool }
]

export default function TestDecouvertePage() {
  const { lang } = useLang()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const filteredTests = useMemo(() => {
    return availableTests.filter(test => {
      const matchesSearch = test.name[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
                           test.description[lang].toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || test.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, lang])

  const handleStartTest = (testId: string) => {
    router.push(`/tcf-simulation?type=starter&section=${testId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/30 py-20">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2ECC71]/10 text-[#2ECC71] rounded-full text-sm font-medium mb-6">
            <Target className="h-4 w-4" />
            {t("Test Découverte", "Discovery Test")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-[var(--font-poppins)] mb-6 bg-gradient-to-r from-[#007BFF] to-[#8E44AD] bg-clip-text text-transparent">
            {t("Tests de Niveau A1-A2", "A1-A2 Level Tests")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {t("Évaluez vos compétences de base en français avec nos tests gratuits et adaptatifs", "Evaluate your basic French skills with our free and adaptive tests")}
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Rechercher un test...", "Search for a test...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-gray-200 dark:border-gray-700"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => {
                const Icon = category.icon
                const isActive = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name[lang]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-[var(--font-poppins)] mb-4">
              {t("Tests Disponibles", "Available Tests")}
            </h2>
            <p className="text-muted-foreground">
              {t("Choisissez le test qui correspond à vos besoins", "Choose the test that matches your needs")}
            </p>
          </div>

          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("Aucun test trouvé", "No tests found")}
              </h3>
              <p className="text-muted-foreground">
                {t("Essayez de modifier vos critères de recherche", "Try adjusting your search criteria")}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => {
                const Icon = test.icon
                return (
                  <Card key={test.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${test.color}20` }}>
                          <Icon className="h-6 w-6" style={{ color: test.color }} />
                        </div>
                        <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-foreground">
                          {test.isFree ? t("GRATUIT", "FREE") : t("PREMIUM", "PREMIUM")}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-foreground">
                        {test.name[lang]}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {test.description[lang]}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Test Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{test.duration} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{test.questions} {t("questions", "questions")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{test.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{t("Niveau débutant", "Beginner level")}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#2ECC71]" />
                          <span className="text-sm text-foreground">{t("Test adaptatif", "Adaptive test")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#2ECC71]" />
                          <span className="text-sm text-foreground">{t("Résultats immédiats", "Immediate results")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#2ECC71]" />
                          <span className="text-sm text-foreground">{t("Conseils personnalisés", "Personalized advice")}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        onClick={() => handleStartTest(test.id)}
                        className="w-full gap-2 transition-all hover:scale-105"
                        style={{ backgroundColor: test.color }}
                      >
                        <Play className="h-4 w-4" />
                        {t("Commencer le test", "Start the test")}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-[#007BFF] to-[#8E44AD]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            {t("Prêt à évaluer votre niveau ?", "Ready to assess your level?")}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t("Commencez par un test gratuit et découvrez vos forces et faiblesses", "Start with a free test and discover your strengths and weaknesses")}
          </p>
          <Button 
            onClick={() => router.push("/test-niveau")}
            variant="secondary"
            size="lg"
            className="gap-2"
          >
            <ArrowRight className="h-5 w-5" />
            {t("Retour aux tests", "Back to tests")}
          </Button>
        </div>
      </section>
    </div>
  )
}
