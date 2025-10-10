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
  X
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useRouter } from "next/navigation"

const availableTests: any[] = []

export default function TestSelectionPage() {
  const { lang } = useLang()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const filteredTests = useMemo(() => {
    return availableTests.filter(test => {
      const matchesSearch = test.name[lang as keyof typeof test.name]
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || test.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, lang])

  const handleTestSelection = (test: any) => {
    if (test.price === "free") {
      if (test.id.includes("starter")) {
        router.push("/tcf-simulation?type=starter")
      } else if (test.id.includes("intermediate")) {
        router.push("/tcf-simulation?type=intermediate")
      } else if (test.id.includes("advanced")) {
        router.push("/tcf-simulation?type=advanced")
      }
    } else {
      router.push("/abonnement")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "#2ECC71"
      case "medium": return "#F39C12"
      case "hard": return "#E74C3C"
      default: return "#6C757D"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/30 py-20">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2ECC71]/10 text-[#2ECC71] dark:bg-[#2ECC71]/20 dark:text-[#2ECC71] rounded-full text-sm font-medium mb-6">
            <Target className="h-4 w-4" />
            {t("Sélection de tests", "Test selection")}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-[var(--font-poppins)] mb-6 bg-gradient-to-r from-[#007BFF] to-[#8E44AD] bg-clip-text text-transparent">
            {t("Choisissez votre test", "Choose your test")}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {t(
              "Explorez notre collection complète de tests adaptés à tous les niveaux et besoins",
              "Explore our complete collection of tests adapted to all levels and needs"
            )}
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Rechercher un test...", "Search for a test...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">{t("Toutes les catégories", "All categories")}</option>
                <option value="comprehension_orale">{t("Compréhension Orale", "Listening")}</option>
                <option value="comprehension_ecrite">{t("Compréhension Écrite", "Reading")}</option>
                <option value="grammaire">{t("Grammaire", "Grammar")}</option>
              </select>

              {(selectedCategory !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("Effacer", "Clear")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Test Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-[var(--font-poppins)] mb-4">
              {t("Tests disponibles", "Available tests")}
            </h2>
            <p className="text-muted-foreground">
              {t(
                `Trouvé ${filteredTests.length} test${filteredTests.length > 1 ? 's' : ''}`,
                `Found ${filteredTests.length} test${filteredTests.length > 1 ? 's' : ''}`
              )}
            </p>
          </div>

          {filteredTests.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">
                {t("Aucun test trouvé", "No tests found")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t("Essayez d'ajuster vos filtres ou votre recherche", "Try adjusting your filters or search")}
              </p>
              <Button onClick={clearFilters} variant="outline">
                {t("Effacer tous les filtres", "Clear all filters")}
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => (
                <Card 
                  key={test.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-gray-200 dark:border-gray-700 bg-card"
                  onClick={() => handleTestSelection(test)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="p-3 rounded-xl bg-opacity-10"
                        style={{ backgroundColor: `${getDifficultyColor(test.difficulty)}20` }}
                      >
                        <Target className="h-6 w-6" style={{ color: getDifficultyColor(test.difficulty) }} />
                      </div>
                      <div className="flex items-center gap-2">
                        {test.price === "free" ? (
                          <Badge className="bg-[#2ECC71] text-black font-medium">
                            {t("GRATUIT", "FREE")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-200 dark:border-gray-700 bg-background">
                            {test.price === "essential" ? "Essential" : "Premium"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {t(test.name.fr, test.name.en)}
                    </CardTitle>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {t(test.description.fr, test.description.en)}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.questions} {t("questions", "questions")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{test.popularity}%</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full gap-2 transition-all hover:scale-105 group-hover:bg-primary"
                      variant={test.price === "free" ? "default" : "outline"}
                      disabled={test.price !== "free"}
                    >
                      {test.price === "free" ? (
                        <>
                          <Play className="h-4 w-4" />
                          {t("Commencer le test", "Start test")}
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          {t("Débloquer avec", "Unlock with")} {test.price === "essential" ? "Essential" : "Premium"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#007BFF] to-[#8E44AD]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            {t("Prêt à commencer ?", "Ready to start?")}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t("Choisissez votre test et commencez votre évaluation dès maintenant", "Choose your test and start your assessment now")}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#007BFF] hover:bg-gray-100 gap-2"
            onClick={() => router.push("/test-niveau")}
          >
            <ArrowRight className="h-5 w-5" />
            {t("Retour au test de niveau", "Back to level test")}
          </Button>
        </div>
      </section>
    </div>
  )
}
