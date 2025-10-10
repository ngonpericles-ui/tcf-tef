"use client"

import { useAuth } from "@/hooks/useAuth"
import { redirect } from "next/navigation"
import ChatRoom from "@/components/chat/chat-room"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Bot, Users } from "lucide-react"

export default function ChatPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    redirect('/connexion')
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💬 Chat & Assistance
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Échangez avec la communauté et obtenez de l'aide personnalisée d'Aura.CA, 
          votre assistante IA spécialisée TCF/TEF
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardHeader className="pb-3">
            <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Chat Communautaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Échangez avec d'autres étudiants et les professeurs en temps réel
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-3">
            <Bot className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Aura.CA Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Assistance IA personnalisée pour votre préparation TCF/TEF
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-3">
            <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Salles Privées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {user.role === 'ADMIN' || user.role.includes('MANAGER') 
                ? 'Créez des salles de discussion privées'
                : 'Accédez aux salles de discussion spécialisées'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Room Component */}
      <ChatRoom />

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comment utiliser le chat ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">💬 Chat Communautaire</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sélectionnez une salle de discussion</li>
                <li>• Tapez votre message et appuyez sur Entrée</li>
                <li>• Respectez les autres participants</li>
                <li>• Partagez vos expériences d'apprentissage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">🤖 Aura.CA Assistant</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cliquez sur l'onglet "Aura.CA"</li>
                <li>• Posez vos questions en français</li>
                <li>• Utilisez les suggestions proposées</li>
                <li>• Obtenez des conseils personnalisés</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
