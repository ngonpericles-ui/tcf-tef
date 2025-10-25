"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const eventEmailService_1 = require("./eventEmailService");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBIXbgZ3EE043v9RLa0Z_h93-BArAF-Hr4');
class SimulationService {
    static async createSimulation(userId, request) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true, email: true }
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const questions = await this.generateQuestionsWithGemini(request.type, request.level, request.sections);
            const totalDuration = request.duration || this.getDefaultDuration(request.level);
            const session = {
                id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                type: request.type,
                level: request.level,
                status: 'CREATED',
                currentSection: request.sections[0],
                currentQuestionIndex: 0,
                questions,
                answers: {},
                startedAt: new Date(),
                timeRemaining: totalDuration * 60,
                maxScore: questions.reduce((sum, q) => sum + q.points, 0)
            };
            await connection_1.prisma.simulation.create({
                data: {
                    id: session.id,
                    userId: session.userId,
                    type: session.type,
                    level: session.level,
                    status: session.status,
                    currentSection: session.currentSection,
                    currentQuestionIndex: session.currentQuestionIndex,
                    questions: JSON.stringify(session.questions),
                    answers: JSON.stringify(session.answers),
                    startedAt: session.startedAt,
                    timeRemaining: session.timeRemaining,
                    maxScore: session.maxScore
                }
            });
            logger_1.logger.info('Simulation session created', {
                sessionId: session.id,
                userId,
                type: request.type,
                level: request.level,
                questionCount: questions.length
            });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Failed to create simulation', { userId, request, error });
            throw error;
        }
    }
    static async generateQuestionsWithGemini(type, level, sections) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const levelMapping = {
                'starter': 'A1-A2',
                'intermediate': 'B1-B2',
                'advanced': 'C1-C2'
            };
            const cefrLevel = levelMapping[level] || 'B1-B2';
            const prompt = `
      Génère exactement 5 questions pour un examen ${type} de niveau ${cefrLevel}.
      
      Sections demandées: ${sections.join(', ')}
      
      Pour chaque question, fournis EXACTEMENT ce format JSON:
      {
        "questions": [
          {
            "id": "q1",
            "type": "multiple_choice",
            "section": "comprehension_ecrite",
            "level": "B1",
            "question": "Question en français",
            "context": "Texte de contexte si nécessaire",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Explication de la réponse correcte",
            "points": 2,
            "timeLimit": 120
          }
        ]
      }
      
      RÈGLES IMPORTANTES:
      - Utilise uniquement les sections: comprehension_orale, comprehension_ecrite, grammaire, expression_orale, expression_ecrite
      - Types de questions: multiple_choice, text_input, audio_response, reading_comprehension
      - Niveaux CECR: A1, A2, B1, B2, C1, C2
      - Questions authentiques et réalistes pour ${type}
      - Difficulté appropriée au niveau ${cefrLevel}
      - Points: 1-3 selon la difficulté
      - Temps limite: 60-300 secondes selon le type
      
      Réponds UNIQUEMENT avec le JSON valide, sans texte supplémentaire.
      `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            let questionsData;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    questionsData = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error('No JSON found in response');
                }
            }
            catch (parseError) {
                logger_1.logger.error('Failed to parse Gemini response', { text, parseError });
                return this.getDefaultQuestions(type, level, sections);
            }
            if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
                logger_1.logger.warn('Invalid questions format from Gemini, using fallback');
                return this.getDefaultQuestions(type, level, sections);
            }
            logger_1.logger.info('Questions generated successfully with Gemini', {
                type,
                level,
                sections,
                questionCount: questionsData.questions.length
            });
            return questionsData.questions;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate questions with Gemini', { type, level, sections, error });
            return this.getDefaultQuestions(type, level, sections);
        }
    }
    static getDefaultQuestions(type, level, sections) {
        const defaultQuestions = [
            {
                id: 'q1',
                type: 'multiple_choice',
                section: 'comprehension_ecrite',
                level: 'B1',
                question: 'Quel est le thème principal de ce texte?',
                context: 'La France est un pays riche en histoire et en culture. Ses monuments, ses musées et ses traditions attirent des millions de visiteurs chaque année.',
                options: [
                    'La géographie française',
                    'Le tourisme en France',
                    'L\'histoire de France',
                    'La cuisine française'
                ],
                correctAnswer: 'Le tourisme en France',
                explanation: 'Le texte parle des attractions touristiques de la France.',
                points: 2,
                timeLimit: 120
            },
            {
                id: 'q2',
                type: 'multiple_choice',
                section: 'grammaire',
                level: 'B1',
                question: 'Complétez la phrase: "Je _____ au cinéma hier soir."',
                options: [
                    'vais',
                    'suis allé',
                    'irai',
                    'allais'
                ],
                correctAnswer: 'suis allé',
                explanation: 'Le passé composé est utilisé pour exprimer une action accomplie dans le passé.',
                points: 1,
                timeLimit: 60
            },
            {
                id: 'q3',
                type: 'text_input',
                section: 'expression_ecrite',
                level: 'B1',
                question: 'Rédigez une phrase décrivant vos loisirs préférés (minimum 10 mots).',
                points: 3,
                timeLimit: 180
            },
            {
                id: 'q4',
                type: 'multiple_choice',
                section: 'comprehension_orale',
                level: 'B1',
                question: 'Que dit la personne dans l\'enregistrement?',
                audioUrl: '/audio/sample-b1.mp3',
                options: [
                    'Elle parle de ses vacances',
                    'Elle commande au restaurant',
                    'Elle demande des directions',
                    'Elle présente sa famille'
                ],
                correctAnswer: 'Elle commande au restaurant',
                explanation: 'L\'enregistrement contient une conversation dans un restaurant.',
                points: 2,
                timeLimit: 90
            },
            {
                id: 'q5',
                type: 'audio_response',
                section: 'expression_orale',
                level: 'B1',
                question: 'Décrivez votre ville natale en 30 secondes.',
                points: 4,
                timeLimit: 45
            }
        ];
        return defaultQuestions.filter(q => sections.includes(q.section));
    }
    static async startSimulation(sessionId, userId) {
        try {
            const simulation = await connection_1.prisma.simulation.findFirst({
                where: { id: sessionId, userId }
            });
            if (!simulation) {
                throw new errors_1.NotFoundError('Simulation session not found');
            }
            if (simulation.status !== 'CREATED') {
                throw new errors_1.ValidationError('Simulation has already been started');
            }
            const updatedSimulation = await connection_1.prisma.simulation.update({
                where: { id: sessionId },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date()
                }
            });
            const session = {
                id: updatedSimulation.id,
                userId: updatedSimulation.userId,
                type: updatedSimulation.type,
                level: updatedSimulation.level,
                status: updatedSimulation.status,
                currentSection: updatedSimulation.currentSection,
                currentQuestionIndex: updatedSimulation.currentQuestionIndex,
                questions: JSON.parse(updatedSimulation.questions),
                answers: JSON.parse(updatedSimulation.answers),
                startedAt: updatedSimulation.startedAt,
                timeRemaining: updatedSimulation.timeRemaining,
                maxScore: updatedSimulation.maxScore
            };
            logger_1.logger.info('Simulation started', { sessionId, userId });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Failed to start simulation', { sessionId, userId, error });
            throw error;
        }
    }
    static async submitAnswer(sessionId, userId, request) {
        try {
            const simulation = await connection_1.prisma.simulation.findFirst({
                where: { id: sessionId, userId, status: 'IN_PROGRESS' }
            });
            if (!simulation) {
                throw new errors_1.NotFoundError('Active simulation session not found');
            }
            const questions = JSON.parse(simulation.questions);
            const answers = JSON.parse(simulation.answers);
            const question = questions.find(q => q.id === request.questionId);
            if (!question) {
                throw new errors_1.NotFoundError('Question not found');
            }
            answers[request.questionId] = {
                answer: request.answer,
                timeSpent: request.timeSpent,
                submittedAt: new Date()
            };
            const isCorrect = this.checkAnswer(question, request.answer);
            const currentIndex = questions.findIndex(q => q.id === request.questionId);
            const nextIndex = currentIndex + 1;
            const nextQuestion = nextIndex < questions.length ? questions[nextIndex] : undefined;
            await connection_1.prisma.simulation.update({
                where: { id: sessionId },
                data: {
                    answers: JSON.stringify(answers),
                    currentQuestionIndex: nextIndex,
                    timeRemaining: Math.max(0, simulation.timeRemaining - request.timeSpent)
                }
            });
            logger_1.logger.info('Answer submitted', {
                sessionId,
                userId,
                questionId: request.questionId,
                correct: isCorrect
            });
            return {
                correct: isCorrect,
                explanation: question.explanation,
                nextQuestion
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to submit answer', { sessionId, userId, request, error });
            throw error;
        }
    }
    static async completeSimulation(sessionId, userId) {
        try {
            const simulation = await connection_1.prisma.simulation.findFirst({
                where: { id: sessionId, userId }
            });
            if (!simulation) {
                throw new errors_1.NotFoundError('Simulation session not found');
            }
            const questions = JSON.parse(simulation.questions);
            const answers = JSON.parse(simulation.answers);
            let score = 0;
            const results = [];
            for (const question of questions) {
                const userAnswer = answers[question.id];
                if (userAnswer) {
                    const isCorrect = this.checkAnswer(question, userAnswer.answer);
                    if (isCorrect) {
                        score += question.points;
                    }
                    results.push({
                        questionId: question.id,
                        question: question.question,
                        userAnswer: userAnswer.answer,
                        correctAnswer: question.correctAnswer,
                        isCorrect,
                        points: isCorrect ? question.points : 0,
                        explanation: question.explanation
                    });
                }
            }
            const maxScore = simulation.maxScore || questions.reduce((sum, q) => sum + q.points, 0);
            const percentage = Math.round((score / maxScore) * 100);
            const levelAchieved = this.calculateLevel(percentage);
            await connection_1.prisma.simulation.update({
                where: { id: sessionId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    score,
                    percentage,
                    levelAchieved
                }
            });
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true }
            });
            if (user) {
                await eventEmailService_1.EventEmailService.handleTestCompletion({
                    userId,
                    testId: sessionId,
                    email: user.email,
                    firstName: user.firstName,
                    testName: `Simulation ${simulation.type} - ${simulation.level}`,
                    score,
                    totalQuestions: questions.length,
                    percentage,
                    level: levelAchieved
                });
            }
            logger_1.logger.info('Simulation completed', {
                sessionId,
                userId,
                score,
                maxScore,
                percentage,
                levelAchieved
            });
            return {
                score,
                maxScore,
                percentage,
                levelAchieved,
                results
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to complete simulation', { sessionId, userId, error });
            throw error;
        }
    }
    static checkAnswer(question, userAnswer) {
        if (!question.correctAnswer)
            return false;
        switch (question.type) {
            case 'multiple_choice':
                return userAnswer === question.correctAnswer;
            case 'text_input':
                return userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
            case 'audio_response':
                return true;
            default:
                return false;
        }
    }
    static calculateLevel(percentage) {
        if (percentage >= 90)
            return 'C2';
        if (percentage >= 80)
            return 'C1';
        if (percentage >= 70)
            return 'B2';
        if (percentage >= 60)
            return 'B1';
        if (percentage >= 50)
            return 'A2';
        return 'A1';
    }
    static getDefaultDuration(level) {
        const durations = {
            'starter': 15,
            'intermediate': 25,
            'advanced': 35
        };
        return durations[level] || 25;
    }
    static async getSimulation(sessionId, userId) {
        try {
            const simulation = await connection_1.prisma.simulation.findFirst({
                where: { id: sessionId, userId }
            });
            if (!simulation) {
                throw new errors_1.NotFoundError('Simulation session not found');
            }
            return {
                id: simulation.id,
                userId: simulation.userId,
                type: simulation.type,
                level: simulation.level,
                status: simulation.status,
                currentSection: simulation.currentSection,
                currentQuestionIndex: simulation.currentQuestionIndex,
                questions: JSON.parse(simulation.questions),
                answers: JSON.parse(simulation.answers),
                startedAt: simulation.startedAt,
                completedAt: simulation.completedAt || undefined,
                timeRemaining: simulation.timeRemaining,
                score: simulation.score || undefined,
                maxScore: simulation.maxScore || undefined,
                percentage: simulation.percentage || undefined,
                levelAchieved: simulation.levelAchieved || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get simulation', { sessionId, userId, error });
            throw error;
        }
    }
}
exports.SimulationService = SimulationService;
//# sourceMappingURL=simulationService.js.map