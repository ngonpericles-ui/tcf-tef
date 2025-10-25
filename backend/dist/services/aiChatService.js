"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const aiService_1 = require("./aiService");
const questionBankService_1 = __importDefault(require("./questionBankService"));
class AiChatService {
    static async sendMessage(userId, message, chatId, context) {
        try {
            let session = chatId
                ? await prisma_1.prisma.chatSession.findUnique({ where: { id: chatId } })
                : null;
            if (!session) {
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
                    role: 'user',
                    content: message,
                    metadata: { context }
                }
            });
            const relevantQuestions = await this.getRelevantQuestions(message, context);
            const aiResponse = await this.generateAIResponse(message, context, relevantQuestions, session.id);
            await prisma_1.prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: aiResponse.message,
                    sources: aiResponse.sources,
                    confidence: aiResponse.confidence,
                    metadata: {
                        questionBankUsed: relevantQuestions.length > 0,
                        context
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
            logger_1.logger.error('Error in AiChatService.sendMessage:', error);
            throw error;
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
            const keywords = this.extractKeywords(message);
            const questions = await questionBankService_1.default.searchQuestions(message, 5);
            return questions;
        }
        catch (error) {
            logger_1.logger.error('Error getting relevant questions:', error);
            return [];
        }
    }
    static async generateAIResponse(message, context, relevantQuestions, sessionId) {
        try {
            const systemPrompt = this.buildSystemPrompt(context, relevantQuestions);
            const recentMessages = await prisma_1.prisma.chatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const response = await aiService_1.AIService.generateResponse({
                message,
                systemPrompt,
                context: {
                    userLevel: context.userLevel,
                    language: context.language,
                    relevantQuestions,
                    conversationHistory: recentMessages.reverse()
                }
            });
            return {
                message: response.content,
                sources: this.extractSources(response, relevantQuestions),
                confidence: response.confidence || 0.8
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating AI response:', error);
            return {
                message: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
                sources: [],
                confidence: 0.1
            };
        }
    }
    static buildSystemPrompt(context, relevantQuestions) {
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const basePrompt = `Tu es l'assistant IA d'Aura.ca, alimenté par Gemini AI et spécialisé dans l'aide aux étudiants pour le TCF/TEF.

INFORMATION ACTUELLE:
- Date d'aujourd'hui: ${currentDate}
- Heure actuelle: ${currentTime}

Ton rôle:
- Aider les étudiants avec leurs questions sur le français en utilisant la puissance de Gemini AI
- Fournir des explications claires et pédagogiques
- Utiliser les questions de la banque de données TCF/TEF pour enrichir tes réponses
- Adapter ton niveau de langue au niveau de l'étudiant (${context.userLevel})
- Répondre en ${context.language === 'fr' ? 'français' : 'anglais'}
- Tu as accès à la date et heure actuelles pour répondre aux questions temporelles

Contexte de l'utilisateur:
- Niveau: ${context.userLevel}
- Langue préférée: ${context.language}`;
        if (relevantQuestions.length > 0) {
            const questionsContext = `
Questions pertinentes de la banque de données:
${relevantQuestions.map((q, i) => `${i + 1}. ${q.questionText} (Niveau: ${q.level})`).join('\n')}

Utilise ces questions comme référence pour donner des exemples concrets et des exercices similaires.`;
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