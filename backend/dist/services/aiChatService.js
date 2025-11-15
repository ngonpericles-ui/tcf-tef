"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = void 0;
const prisma_1 = require("@/lib/prisma");
const logger_1 = require("@/utils/logger");
const aiService_1 = require("./aiService");
const questionBankService_1 = __importDefault(require("./questionBankService"));
class AiChatService {
    static async sendMessage(userId, message, chatId, context) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { currentLevel: true, preferences: true }
            });
            const safeContext = {
                userLevel: context?.userLevel || user?.currentLevel || 'BASIC',
                language: context?.language || 'fr',
                previousMessages: context?.previousMessages || [],
                ...context
            };
            let session = null;
            if (chatId) {
                session = await prisma_1.prisma.chatSession.findFirst({
                    where: {
                        id: chatId,
                        userId: userId
                    }
                });
                if (!session) {
                    session = await prisma_1.prisma.chatSession.create({
                        data: {
                            userId,
                            title: this.generateSessionTitle(message),
                            isActive: true
                        }
                    });
                }
            }
            else {
                session = await prisma_1.prisma.chatSession.create({
                    data: {
                        userId,
                        title: this.generateSessionTitle(message),
                        isActive: true
                    }
                });
            }
            await prisma_1.prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'USER',
                    content: message,
                    metadata: { context: safeContext }
                }
            });
            const relevantQuestions = await this.getRelevantQuestions(message, safeContext).then(questions => questions.slice(0, 2)).catch(() => []);
            const aiResponse = await this.generateAIResponse(message, safeContext, relevantQuestions, session.id);
            await prisma_1.prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'ASSISTANT',
                    content: aiResponse.message,
                    sources: aiResponse.sources,
                    confidence: aiResponse.confidence,
                    metadata: {
                        questionBankUsed: relevantQuestions.length > 0,
                        context: safeContext
                    }
                }
            });
            return {
                message: aiResponse.message,
                sources: aiResponse.sources,
                confidence: aiResponse.confidence,
                chatId: session.id
            };
        }
        catch (error) {
            logger_1.logger.error('Error in AiChatService.sendMessage:', {
                error: error?.message || error,
                stack: error?.stack,
                name: error?.name,
                code: error?.code,
                status: error?.status || error?.statusCode,
                fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            if (error?.message?.includes('QUOTA_EXCEEDED') || error?.message?.includes('AUTH_ERROR')) {
                throw error;
            }
            const errorMsg = error?.message || error?.toString() || 'Failed to process message';
            throw new Error(`AI_SERVICE_ERROR: ${errorMsg}`);
        }
    }
    static async getChatHistory(userId, limit = 10) {
        try {
            const sessions = await prisma_1.prisma.chatSession.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                take: limit,
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 50
                    }
                }
            });
            return sessions;
        }
        catch (error) {
            logger_1.logger.error('Error getting chat history:', error);
            throw error;
        }
    }
    static async getChatSession(chatId, userId) {
        try {
            const session = await prisma_1.prisma.chatSession.findFirst({
                where: {
                    id: chatId,
                    userId
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Error getting chat session:', error);
            throw error;
        }
    }
    static async deleteChatSession(chatId, userId) {
        try {
            await prisma_1.prisma.chatSession.deleteMany({
                where: {
                    id: chatId,
                    userId
                }
            });
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error deleting chat session:', error);
            throw error;
        }
    }
    static async getRelevantQuestions(message, context) {
        try {
            const messageLower = message.toLowerCase().trim();
            if (messageLower.length < 15) {
                return [];
            }
            const simplePatterns = [
                'salut', 'bonjour', 'bonsoir', 'hey', 'hi', 'hello', 'ça va', 'ca va',
                'ton nom', 'your name', 'comment tu t\'appelles', 'what is your name',
                'que sais tu', 'what can you', 'que peux tu', 'what do you',
                'quel jour', 'what day', 'quelle date', 'what date', 'aujourd\'hui', 'today',
                'comment allez', 'how are you', 'comment ça va'
            ];
            if (simplePatterns.some(pattern => messageLower.includes(pattern))) {
                return [];
            }
            const tcfTefKeywords = [
                'tcf', 'tef', 'examen', 'test', 'simulation', 'épreuve',
                'grammaire', 'grammar', 'vocabulaire', 'vocabulary',
                'compréhension', 'comprehension', 'expression', 'speaking',
                'écoute', 'listening', 'écrit', 'writing', 'oral',
                'niveau', 'level', 'exercice', 'exercise', 'pratique', 'practice',
                'conjugaison', 'conjugation', 'accord', 'agreement', 'temps', 'tense',
                'subjonctif', 'subjunctive', 'conditionnel', 'conditional',
                'immigration', 'canada', 'france', 'belgique', 'suisse'
            ];
            const isTcfTefRelated = tcfTefKeywords.some(keyword => messageLower.includes(keyword));
            if (!isTcfTefRelated) {
                return [];
            }
            const isDifficult = messageLower.length > 30 ||
                ['explique', 'explain', 'différence', 'difference', 'pourquoi', 'why', 'comment', 'how'].some(w => messageLower.includes(w));
            if (!isDifficult) {
                return [];
            }
            const questions = await questionBankService_1.default.searchQuestions(message, 2);
            return questions;
        }
        catch (error) {
            logger_1.logger.error('Error getting relevant questions:', error);
            return [];
        }
    }
    static async generateAIResponse(message, context, relevantQuestions, sessionId) {
        try {
            const systemPrompt = this.buildSystemPrompt(context, relevantQuestions || []);
            let recentMessages = [];
            try {
                recentMessages = await prisma_1.prisma.chatMessage.findMany({
                    where: { sessionId },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                });
            }
            catch (dbError) {
                logger_1.logger.warn('Error fetching conversation history, continuing without it:', dbError);
                recentMessages = [];
            }
            let response;
            try {
                response = await aiService_1.AIService.generateResponse({
                    message,
                    systemPrompt,
                    context: {
                        userLevel: context.userLevel || 'BASIC',
                        language: context.language || 'fr',
                        relevantQuestions: relevantQuestions || [],
                        conversationHistory: recentMessages.reverse()
                    }
                });
            }
            catch (aiError) {
                logger_1.logger.error('Error calling AIService.generateResponse:', {
                    error: aiError?.message || aiError,
                    status: aiError?.status || aiError?.statusCode,
                    code: aiError?.code
                });
                const errorMessage = aiError?.message || '';
                if (errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('AUTH_ERROR')) {
                    throw aiError;
                }
                logger_1.logger.warn('AI service unavailable, returning fallback response');
                return {
                    message: 'Désolé, le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.',
                    sources: [],
                    confidence: 0.5
                };
            }
            if (!response || !response.content) {
                logger_1.logger.warn('AI response is empty, returning fallback');
                return {
                    message: 'Désolé, je n\'ai pas pu générer de réponse. Veuillez réessayer.',
                    sources: [],
                    confidence: 0.5
                };
            }
            return {
                message: response.content.trim() || 'Désolé, je n\'ai pas pu générer de réponse. Veuillez réessayer.',
                sources: this.extractSources(response, relevantQuestions || []),
                confidence: response.confidence || 0.8
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating AI response:', {
                error: error?.message || error,
                message,
                sessionId,
                context: { userLevel: context.userLevel, language: context.language }
            });
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('rate limit')) {
                throw new Error("QUOTA_EXCEEDED: Désolé, j'ai atteint ma limite de requêtes pour ce mois. Veuillez réessayer le mois prochain ou contactez le support pour plus d'informations.");
            }
            else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
                throw new Error("AUTH_ERROR: Désolé, je rencontre un problème d'authentification avec le service IA. Veuillez contacter le support technique.");
            }
            else {
                return {
                    message: 'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
                    sources: [],
                    confidence: 0.5
                };
            }
        }
    }
    static buildSystemPrompt(context, relevantQuestions) {
        const currentDate = new Date();
        const currentHour = currentDate.getHours();
        const currentDay = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let greetingInstruction = '';
        if (currentHour >= 5 && currentHour < 12) {
            greetingInstruction = 'Matin: Utilise "Bonjour" de manière naturelle. Varie tes salutations.';
        }
        else if (currentHour >= 12 && currentHour < 17) {
            greetingInstruction = 'Après-midi: Utilise "Bonjour" ou "Salut" naturellement. Varie tes réponses.';
        }
        else if (currentHour >= 17 && currentHour < 21) {
            greetingInstruction = 'Soir: Utilise "Bonsoir" naturellement. Varie tes réponses.';
        }
        else {
            greetingInstruction = 'Nuit: Utilise "Bonsoir" naturellement. Varie tes réponses.';
        }
        const userLevel = context?.userLevel || 'BASIC';
        const language = context?.language || 'fr';
        const basePrompt = `Tu es Aura, l'assistant IA intelligent de Aura.ca, spécialisé dans la préparation TCF/TEF pour les Camerounais et Africains.

CONTEXTE:
- Date actuelle: ${currentDay}
- Niveau de l'utilisateur: ${userLevel}
- Langue: ${language === 'fr' ? 'français' : 'anglais'}

RÈGLES IMPORTANTES:
1. Salutations: ${greetingInstruction} NE RÉPÈTE PAS toujours "Salut!" au début. Varie tes réponses naturellement.
2. Personnalité: Sois amical, professionnel et encourageant. Réponds de manière naturelle et variée.
3. Formatage: JAMAIS d'astérisques (*) ou de markdown. Écris naturellement comme dans une conversation.
4. Longueur: Adapte-toi à la question. Questions simples: réponse courte et directe. Questions complexes: réponse détaillée.
5. Informations: Si on te demande la date/jour, utilise la date réelle: ${currentDay}
6. Variété: Change tes formulations. Ne commence pas toujours par "Salut!".`;
        if (relevantQuestions.length > 0) {
            const questionsContext = `

QUESTIONS TCF/TEF PERTINENTES (utilise-les comme référence pour des exemples concrets):
${relevantQuestions.map((q, i) => `${i + 1}. ${q.questionText || q.title} (Niveau: ${q.level || 'N/A'})`).join('\n')}

IMPORTANT: Utilise ces questions uniquement comme référence pour donner des exemples similaires et des exercices pratiques. Ne les répète pas mot pour mot.`;
            return basePrompt + questionsContext;
        }
        return basePrompt;
    }
    static extractKeywords(message) {
        const commonWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi'];
        return message
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 5);
    }
    static detectCategory(message) {
        const messageLower = message.toLowerCase();
        if (messageLower.includes('grammaire') || messageLower.includes('grammar'))
            return 'GRAMMAR';
        if (messageLower.includes('vocabulaire') || messageLower.includes('vocabulary'))
            return 'VOCABULARY';
        if (messageLower.includes('écoute') || messageLower.includes('listening'))
            return 'LISTENING';
        if (messageLower.includes('expression') || messageLower.includes('speaking'))
            return 'SPEAKING';
        if (messageLower.includes('compréhension') || messageLower.includes('reading'))
            return 'READING';
        return 'GENERAL';
    }
    static extractSources(response, relevantQuestions) {
        const sources = [];
        if (relevantQuestions.length > 0) {
            sources.push('Banque de questions TCF/TEF');
        }
        if (response.sources) {
            sources.push(...response.sources);
        }
        return [...new Set(sources)];
    }
    static generateSessionTitle(message) {
        const words = message.split(' ').slice(0, 5);
        return words.join(' ') + (message.split(' ').length > 5 ? '...' : '');
    }
}
exports.AiChatService = AiChatService;
//# sourceMappingURL=aiChatService.js.map