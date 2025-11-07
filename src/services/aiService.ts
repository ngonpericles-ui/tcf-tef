import { logger } from '../utils/logger'
import geminiApiManager from '../utils/geminiApiManager'

export class AIService {
  // Generate personalized greeting message
  static async generateGreeting(firstName: string, lastName: string): Promise<string> {
    try {
      const hour = new Date().getHours()
      let timeOfDay = ''
      
      if (hour >= 5 && hour < 12) {
        timeOfDay = 'matin'
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'après-midi'
      } else if (hour >= 17 && hour < 21) {
        timeOfDay = 'soir'
      } else {
        timeOfDay = 'nuit'
      }

      const greetings = [
        `Bon ${timeOfDay}, ${firstName}! Prêt pour une nouvelle session d'apprentissage?`,
        `Salut ${firstName}! Comment allez-vous aujourd'hui?`,
        `Bonjour ${firstName}! Votre parcours français vous attend.`,
        `Coucou ${firstName}! Prêt à progresser en français?`,
        `Bon ${timeOfDay} ${firstName}! Continuons votre apprentissage.`
      ]

      return greetings[Math.floor(Math.random() * greetings.length)]
    } catch (error) {
      logger.error('Error generating greeting:', error)
      return `Bonjour ${firstName}!`
    }
  }

  // Generate motivational message
  static async generateMotivation(firstName: string): Promise<string> {
    try {
      const motivationalQuotes = [
        "Chaque mot appris vous rapproche de vos rêves.",
        "Votre persévérance en français porte déjà ses fruits.",
        "Chaque erreur est une opportunité d'apprendre.",
        "Votre accent n'est pas un défaut, c'est votre signature unique.",
        "Aujourd'hui est une nouvelle chance de progresser.",
        "Le français vous ouvre les portes du monde.",
        "Votre détermination inspire les autres.",
        "Chaque session d'étude vous rend plus fort.",
        "Vos efforts d'aujourd'hui sont les succès de demain.",
        "La maîtrise du français est à votre portée."
      ]

      return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    } catch (error) {
      logger.error('Error generating motivation:', error)
      return "Chaque mot appris vous rapproche de vos rêves."
    }
  }

  // Generate weather-based message
  static async generateWeatherMessage(country: string): Promise<string> {
    try {
      const weatherMessages = {
        'Canada': [
          "Il fait frais au Canada aujourd'hui, parfait pour étudier à l'intérieur!",
          "Le temps canadien est idéal pour une session d'étude confortable.",
          "Profitez du temps pour vous concentrer sur votre français."
        ],
        'France': [
          "Le temps en France est magnifique pour apprendre le français!",
          "Quel beau jour pour pratiquer votre français!",
          "Le climat français inspire l'apprentissage."
        ],
        'Belgium': [
          "Le temps belge est parfait pour une session d'étude.",
          "Profitez du temps pour améliorer votre français.",
          "Le climat belge favorise la concentration."
        ],
        'Switzerland': [
          "Le temps suisse est idéal pour apprendre le français.",
          "Profitez de l'air frais pour étudier.",
          "Le climat suisse favorise l'apprentissage."
        ],
        'default': [
          "Bonne journée pour apprendre le français!",
          "Le temps est parfait pour une session d'étude.",
          "Profitez de cette belle journée pour progresser."
        ]
      }

      const messages = weatherMessages[country as keyof typeof weatherMessages] || weatherMessages.default
      return messages[Math.floor(Math.random() * messages.length)]
    } catch (error) {
      logger.error('Error generating weather message:', error)
      return "Bonne journée pour apprendre le français!"
    }
  }

  // Generate personalized study recommendations
  static async generateStudyRecommendations(userId: string): Promise<any[]> {
    try {
      // This would integrate with actual AI service in production
      // For now, return mock recommendations
      return [
        {
          id: 1,
          type: 'test',
          title: 'Test de vocabulaire avancé',
          description: 'Améliorez votre vocabulaire avec des mots complexes',
          difficulty: 'Intermédiaire',
          time: '15 min',
          reward: '50 XP'
        },
        {
          id: 2,
          type: 'course',
          title: 'Grammaire française',
          description: 'Maîtrisez les règles de grammaire essentielles',
          difficulty: 'Débutant',
          time: '20 min',
          reward: '75 XP'
        },
        {
          id: 3,
          type: 'practice',
          title: 'Expression orale',
          description: 'Pratiquez votre prononciation française',
          difficulty: 'Avancé',
          time: '10 min',
          reward: '100 XP'
        }
      ]
    } catch (error) {
      logger.error('Error generating study recommendations:', error)
      return []
    }
  }

  // Generate daily tip
  static async generateDailyTip(): Promise<string> {
    try {
      const tips = [
        "Pratiquez l'expression orale 10 minutes par jour pour améliorer votre fluidité de 40% en 2 semaines.",
        "Écoutez de la musique française pour améliorer votre compréhension orale naturellement.",
        "Lisez un article de journal français chaque jour pour enrichir votre vocabulaire.",
        "Pratiquez avec un partenaire de conversation pour gagner en confiance.",
        "Utilisez des flashcards pour mémoriser efficacement le vocabulaire.",
        "Regardez des films français avec sous-titres pour améliorer votre écoute.",
        "Écrivez un journal en français pour pratiquer l'expression écrite.",
        "Rejoignez des groupes de conversation française pour pratiquer régulièrement."
      ]

      return tips[Math.floor(Math.random() * tips.length)]
    } catch (error) {
      logger.error('Error generating daily tip:', error)
      return "Pratiquez l'expression orale 10 minutes par jour pour améliorer votre fluidité."
    }
  }

  // Generate AI response using Gemini
  static async generateResponse(params: {
    message: string
    systemPrompt: string
    context: {
      userLevel: string
      language: string
      relevantQuestions: any[]
      conversationHistory: any[]
    }
  }): Promise<{ content: string; confidence?: number }> {
    try {
      const { message, systemPrompt, context } = params
      
      // Use Gemini API Manager for AI response
      const response = await geminiApiManager.makeRequest(async (model) => {
        const prompt = `${systemPrompt}

Message: ${message}

Réponds directement et utilement en français.`

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      })

      return {
        content: response,
        confidence: 0.9
      }
    } catch (error) {
      logger.error('Error generating AI response:', error)

      // Fallback response
      return {
        content: "Je suis désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?",
        confidence: 0.5
      }
    }
  }

  /**
   * Generate content using AI
   */
  static async generateContent(prompt: string): Promise<string> {
    try {
      return await geminiApiManager.generateContent(async (model) => {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      })
    } catch (error) {
      logger.error('Error generating AI content:', error)
      throw new Error('Failed to generate AI content')
    }
  }
}
