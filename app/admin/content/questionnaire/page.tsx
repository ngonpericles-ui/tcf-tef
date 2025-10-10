"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Eye, ArrowLeft, BookOpen, CheckCircle } from "lucide-react"

export default function QuestionnaireCreator() {
  const router = useRouter()
  const [questionnaire, setQuestionnaire] = useState({
    title: "",
    description: "",
    level: "",
    subscription: "",
    duration: "",
    category: "",
    instructions: "",
  })

  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      points: 1,
    },
  ])

  const [activeTab, setActiveTab] = useState("settings")

  const addQuestion = (type: string) => {
    const newQuestion = {
      id: Date.now(),
      type,
      question: "",
      options: type === "multiple-choice" ? ["", "", "", ""] : [],
      correctAnswer: type === "multiple-choice" ? 0 : "",
      explanation: "",
      points: 1,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSave = () => {
    console.log("Saving questionnaire:", { questionnaire, questions })
    // Save logic here
  }

  const handlePreview = () => {
    console.log("Previewing questionnaire")
    // Preview logic here
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Créateur de Questionnaire</h1>
              <p className="text-gray-400">Créez des questionnaires interactifs et personnalisés</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handlePreview} className="border-gray-600 text-gray-300 bg-transparent">
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800">
              <BookOpen className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-gray-800">
              <CheckCircle className="w-4 h-4 mr-2" />
              Questions ({questions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Configuration du Questionnaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Titre du questionnaire
                    </Label>
                    <Input
                      id="title"
                      value={questionnaire.title}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, title: e.target.value })}
                      placeholder="Ex: Test de Grammaire Française A2"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-gray-300">
                      Durée (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={questionnaire.duration}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, duration: e.target.value })}
                      placeholder="30"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={questionnaire.description}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, description: e.target.value })}
                    placeholder="Décrivez le contenu et les objectifs de ce questionnaire..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Niveau</Label>
                    <Select
                      value={questionnaire.level}
                      onValueChange={(value) => setQuestionnaire({ ...questionnaire, level: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="A1">A1 - Débutant</SelectItem>
                        <SelectItem value="A2">A2 - Élémentaire</SelectItem>
                        <SelectItem value="B1">B1 - Intermédiaire</SelectItem>
                        <SelectItem value="B2">B2 - Intermédiaire Avancé</SelectItem>
                        <SelectItem value="C1">C1 - Avancé</SelectItem>
                        <SelectItem value="C2">C2 - Maîtrise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Abonnement requis</Label>
                    <Select
                      value={questionnaire.subscription}
                      onValueChange={(value) => setQuestionnaire({ ...questionnaire, subscription: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Sélectionner un abonnement" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="gratuit">Gratuit</SelectItem>
                        <SelectItem value="essentiel">Essentiel</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="pro">Pro+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Catégorie</Label>
                    <Select
                      value={questionnaire.category}
                      onValueChange={(value) => setQuestionnaire({ ...questionnaire, category: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="grammaire">Grammaire</SelectItem>
                        <SelectItem value="vocabulaire">Vocabulaire</SelectItem>
                        <SelectItem value="comprehension">Compréhension</SelectItem>
                        <SelectItem value="expression">Expression</SelectItem>
                        <SelectItem value="tcf">TCF</SelectItem>
                        <SelectItem value="tef">TEF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-gray-300">
                    Instructions pour les étudiants
                  </Label>
                  <Textarea
                    id="instructions"
                    value={questionnaire.instructions}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, instructions: e.target.value })}
                    placeholder="Consignes et instructions pour réaliser ce questionnaire..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <div className="space-y-6">
              {/* Add Question Buttons */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Ajouter une Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      onClick={() => addQuestion("multiple-choice")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      QCM
                    </Button>
                    <Button
                      onClick={() => addQuestion("true-false")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Vrai/Faux
                    </Button>
                    <Button
                      onClick={() => addQuestion("short-answer")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Réponse Courte
                    </Button>
                    <Button
                      onClick={() => addQuestion("essay")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Rédaction
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              {questions.map((question, index) => (
                <Card key={question.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-lg">
                      Question {index + 1}
                      <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                        {question.type === "multiple-choice" && "QCM"}
                        {question.type === "true-false" && "Vrai/Faux"}
                        {question.type === "short-answer" && "Réponse Courte"}
                        {question.type === "essay" && "Rédaction"}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Question</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                        placeholder="Tapez votre question ici..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    {question.type === "multiple-choice" && (
                      <div className="space-y-3">
                        <Label className="text-gray-300">Options de réponse</Label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(question.id, "correctAnswer", optionIndex)}
                              className="text-blue-600"
                            />
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optionIndex] = e.target.value
                                updateQuestion(question.id, "options", newOptions)
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="bg-gray-800 border-gray-700 text-white flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "true-false" && (
                      <div className="space-y-2">
                        <Label className="text-gray-300">Réponse correcte</Label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 text-gray-300">
                            <input
                              type="radio"
                              name={`tf-${question.id}`}
                              checked={question.correctAnswer === "true"}
                              onChange={() => updateQuestion(question.id, "correctAnswer", "true")}
                              className="text-blue-600"
                            />
                            <span>Vrai</span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-300">
                            <input
                              type="radio"
                              name={`tf-${question.id}`}
                              checked={question.correctAnswer === "false"}
                              onChange={() => updateQuestion(question.id, "correctAnswer", "false")}
                              className="text-blue-600"
                            />
                            <span>Faux</span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Explication (optionnel)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                          placeholder="Expliquez la réponse correcte..."
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, "points", Number.parseInt(e.target.value) || 1)}
                          min="1"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Aucune question ajoutée</h3>
                    <p className="text-gray-500 mb-6">Commencez par ajouter des questions à votre questionnaire</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
