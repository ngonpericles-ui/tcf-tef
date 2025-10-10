import { apiClient } from '@/lib/api-client'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

export interface ChatHistory {
  messages: ChatMessage[]
  totalCount: number
}

export interface AIChatResponse {
  message: string
  suggestions?: string[]
  timestamp: string
}

class AIChatService {
  private chatHistory: ChatMessage[] = []

  /**
   * Send a message to Aura.CA and get response
   */
  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      const response = await apiClient.sendChatMessage(message)
      
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          suggestions: response.data.suggestions || []
        }

        // Add to local history
        this.chatHistory.push(assistantMessage)
        
        return assistantMessage
      } else {
        throw new Error(response.message || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('AI Chat Service Error:', error)
      
      // Return fallback response
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: "Désolée, je rencontre un problème technique. Pouvez-vous réessayer dans quelques instants ? 🤖",
        timestamp: new Date(),
        suggestions: [
          "🔄 Réessayer ma question",
          "📚 Voir les cours disponibles", 
          "🎯 Passer un test de niveau",
          "💬 Contacter le support"
        ]
      }
    }
  }

  /**
   * Get chat history from backend
   */
  async getChatHistory(limit: number = 10): Promise<ChatHistory> {
    try {
      const response = await apiClient.getChatHistory(limit)
      
      if (response.success && response.data) {
        return {
          messages: response.data.history || [],
          totalCount: response.data.count || 0
        }
      }
      
      return {
        messages: this.chatHistory.slice(-limit),
        totalCount: this.chatHistory.length
      }
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return {
        messages: this.chatHistory.slice(-limit),
        totalCount: this.chatHistory.length
      }
    }
  }

  /**
   * Clear chat history
   */
  async clearChatHistory(): Promise<boolean> {
    try {
      const response = await apiClient.clearChatHistory()
      
      if (response.success) {
        this.chatHistory = []
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      return false
    }
  }

  /**
   * Get contextual suggestions
   */
  async getSuggestions(): Promise<string[]> {
    try {
      const response = await apiClient.getChatSuggestions()
      
      if (response.success && response.data) {
        return response.data.suggestions || []
      }
      
      return this.getDefaultSuggestions()
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return this.getDefaultSuggestions()
    }
  }

  /**
   * Get default suggestions when API is unavailable
   */
  private getDefaultSuggestions(): string[] {
    return [
      "Comment puis-je améliorer mon niveau de français ?",
      "Quels sont les conseils pour réussir le TCF ?",
      "Comment préparer la section expression orale ?",
      "Quelle est la différence entre TCF et TEF ?",
      "Comment gérer le stress pendant l'examen ?",
      "Quels sont les points grammaticaux essentiels ?",
      "Comment enrichir mon vocabulaire français ?",
      "Quelles ressources recommandez-vous pour étudier ?"
    ]
  }

  /**
   * Add user message to local history
   */
  addUserMessage(content: string): ChatMessage {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    this.chatHistory.push(userMessage)
    return userMessage
  }

  /**
   * Get local chat history
   */
  getLocalHistory(): ChatMessage[] {
    return [...this.chatHistory]
  }

  /**
   * Clear local history
   */
  clearLocalHistory(): void {
    this.chatHistory = []
  }

  /**
   * Check if AI service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await apiClient.getChatSuggestions()
      return response.success
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const aiChatService = new AIChatService()
export default aiChatService
