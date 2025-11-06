"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("@/database/connection");
const vapiService_1 = __importDefault(require("./vapiService"));
const emailService_1 = require("./emailService");
const i18nService_1 = __importDefault(require("./i18nService"));
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
class VoiceSimulationService {
    constructor() {
        this.activeSessions = new Map();
        this.initializeCronJobs();
    }
    async bookSimulation(request, language = 'fr') {
        try {
            const { checkSimulationLimit } = await Promise.resolve().then(() => __importStar(require('./simulationLimitService')));
            const limitCheck = await checkSimulationLimit(request.userId);
            if (!limitCheck.canCreate) {
                throw new Error(language === 'fr'
                    ? limitCheck.error || `Vous avez atteint votre limite de simulations (${limitCheck.maxSimulations}). Veuillez attendre le prochain cycle de facturation.`
                    : limitCheck.error || `You have reached your simulation limit (${limitCheck.maxSimulations}). Please wait for the next billing cycle.`);
            }
            let assignedDate;
            if (request.bookingType === 'AUTO') {
                assignedDate = await this.getNextAvailableSlot();
            }
            else {
                if (request.preferredDates && request.preferredDates.length > 0) {
                    assignedDate = request.preferredDates[0];
                }
                else {
                    assignedDate = await this.getNextAvailableSlot();
                }
            }
            const booking = await connection_1.prisma.simulationBooking.create({
                data: {
                    userId: request.userId,
                    bookingType: request.bookingType || 'MANUAL',
                    preferredDates: request.preferredDates || [],
                    assignedDate
                }
            });
            let voicePreference = request.voicePreference;
            if (!voicePreference) {
                const user = await connection_1.prisma.user.findUnique({
                    where: { id: request.userId },
                    select: { preferences: true }
                });
                const preferences = user?.preferences || {};
                const savedVoicePreference = preferences?.voice?.voiceId;
                if (savedVoicePreference) {
                    const { default: vapiService } = await Promise.resolve().then(() => __importStar(require('./vapiService')));
                    const availableVoices = vapiService.getVoiceOptions();
                    const voiceExists = availableVoices.some(v => v.id === savedVoicePreference);
                    if (voiceExists) {
                        voicePreference = savedVoicePreference;
                        console.log('✅ Using saved voice preference:', savedVoicePreference);
                    }
                }
                if (!voicePreference) {
                    const { default: vapiService } = await Promise.resolve().then(() => __importStar(require('./vapiService')));
                    const availableVoices = vapiService.getVoiceOptions();
                    const randomVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
                    voicePreference = randomVoice.id;
                    console.log('🎲 Using random voice (no preference found):', voicePreference);
                }
            }
            let voiceType = 'FEMALE';
            if (voicePreference) {
                const gender = voicePreference.toLowerCase().includes('male') ? 'MALE' : 'FEMALE';
                voiceType = gender;
            }
            const questionsData = voicePreference ? { voiceId: voicePreference } : null;
            const simulation = await connection_1.prisma.voiceSimulation.create({
                data: {
                    userId: request.userId,
                    scheduledDate: assignedDate,
                    voicePreference: voiceType,
                    questionsData: questionsData,
                    status: 'SCHEDULED',
                    duration: 300
                }
            });
            const user = await connection_1.prisma.user.findUnique({
                where: { id: simulation.userId },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });
            if (user) {
                try {
                    await this.sendBookingConfirmation({ ...simulation, user });
                    console.log('✅ Booking confirmation email sent successfully');
                }
                catch (emailError) {
                    console.error('❌ Error sending booking confirmation email:', {
                        error: emailError?.message,
                        simulationId: simulation.id,
                        userEmail: user.email
                    });
                }
            }
            else {
                console.warn('⚠️ User not found, cannot send booking confirmation email');
            }
            return {
                booking,
                simulation,
                message: 'Voice simulation booked successfully',
                voiceId: voicePreference
            };
        }
        catch (error) {
            console.error('❌ Error booking simulation:', {
                message: error?.message,
                code: error?.code,
                name: error?.name,
                stack: error?.stack,
                userId: request.userId,
                bookingType: request.bookingType,
                preferredDates: request.preferredDates
            });
            if (error?.code === 'P2002') {
                throw new Error('Une réservation existe déjà pour cette date et cette heure');
            }
            if (error?.code === 'P2003') {
                throw new Error('Données invalides pour la réservation');
            }
            if (error?.code === 'P2025') {
                throw new Error('Enregistrement non trouvé');
            }
            throw error;
        }
    }
    async startSimulation(simulationId) {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.findUnique({
                where: { id: simulationId }
            });
            if (!simulation) {
                throw new Error('Simulation not found');
            }
            if (simulation.status !== 'SCHEDULED') {
                throw new Error('Simulation is not in scheduled status');
            }
            const progressiveQuestions = await vapiService_1.default.getProgressiveQuestions();
            let voiceId;
            if (simulation.questionsData && typeof simulation.questionsData === 'object') {
                const questionsData = simulation.questionsData;
                voiceId = questionsData.voiceId;
            }
            if (!voiceId || typeof voiceId !== 'string' || !voiceId.includes('_')) {
                const availableVoices = vapiService_1.default.getVoiceOptions();
                const genderPreference = simulation.voicePreference || 'FEMALE';
                const matchingVoices = availableVoices.filter(v => v.gender === genderPreference);
                const voicesToChoose = matchingVoices.length > 0 ? matchingVoices : availableVoices;
                const randomVoice = voicesToChoose[Math.floor(Math.random() * voicesToChoose.length)];
                voiceId = randomVoice.id;
                console.log(`🎲 Using ${matchingVoices.length > 0 ? 'gender-matched' : 'random'} voice:`, voiceId);
            }
            const assistant = await vapiService_1.default.createFrenchAssistant(voiceId, progressiveQuestions);
            const questionsForStorage = {
                personalInfo: progressiveQuestions.personalInfo,
                byLevel: {
                    A1: progressiveQuestions.byLevel.A1.slice(0, 10),
                    A2: progressiveQuestions.byLevel.A2.slice(0, 10),
                    B1: progressiveQuestions.byLevel.B1.slice(0, 10),
                    B2: progressiveQuestions.byLevel.B2.slice(0, 10)
                },
                byCategory: Object.keys(progressiveQuestions.byCategory).reduce((acc, cat) => {
                    acc[cat] = progressiveQuestions.byCategory[cat].slice(0, 10);
                    return acc;
                }, {})
            };
            const call = await vapiService_1.default.startVoiceSimulation(simulationId, assistant.id);
            const session = {
                simulationId,
                userId: simulation.userId,
                assistantId: assistant.id,
                callId: call.id,
                askedQuestions: new Map(),
                questionResponses: new Map(),
                currentLevel: 'A1',
                questionCount: 0,
                performanceScores: {
                    fluency: [],
                    grammar: [],
                    vocabulary: [],
                    pronunciation: [],
                    coherence: []
                },
                startTime: new Date()
            };
            this.activeSessions.set(simulationId, session);
            await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    questionsData: questionsForStorage,
                    status: 'ACTIVE'
                }
            });
            return {
                simulation,
                call,
                assistant,
                questions: questionsForStorage,
                message: 'Voice simulation started successfully with progressive difficulty system'
            };
        }
        catch (error) {
            console.error('Error starting simulation:', error);
            throw error;
        }
    }
    async endSimulation(simulationId) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            if (session.callId) {
                await vapiService_1.default.endCall(session.callId);
            }
            const results = await vapiService_1.default.processCallResults(session.callId, simulationId);
            this.activeSessions.delete(simulationId);
            await this.sendResultsEmail(results);
            return {
                results,
                message: 'Voice simulation completed successfully'
            };
        }
        catch (error) {
            console.error('Error ending simulation:', error);
            throw error;
        }
    }
    async getSimulation(simulationId, userId) {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.findFirst({
                where: {
                    id: simulationId,
                    userId: userId
                },
                include: {
                    aiFeedbacks: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        select: {
                            id: true,
                            aiScore: true,
                            aiConfidence: true,
                            overallFeedback: true,
                            strengths: true,
                            weaknesses: true,
                            recommendations: true,
                            status: true,
                            createdAt: true,
                            humanScore: true,
                            humanFeedback: true
                        }
                    }
                }
            });
            if (!simulation) {
                throw new Error('Simulation not found or access denied');
            }
            return simulation;
        }
        catch (error) {
            console.error('Error getting simulation:', error);
            throw error;
        }
    }
    async getUserSimulations(userId) {
        try {
            console.log('📋 getUserSimulations: Fetching simulations for user:', userId);
            const simulations = await connection_1.prisma.voiceSimulation.findMany({
                where: { userId },
                orderBy: { scheduledDate: 'desc' },
                include: {
                    aiFeedbacks: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1,
                        select: {
                            id: true,
                            aiScore: true,
                            aiConfidence: true,
                            overallFeedback: true,
                            strengths: true,
                            weaknesses: true,
                            recommendations: true,
                            status: true,
                            createdAt: true,
                            humanScore: true,
                            humanFeedback: true
                        }
                    }
                }
            });
            simulations.sort((a, b) => {
                const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
                const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
                if (dateA !== dateB) {
                    return dateB - dateA;
                }
                const createdA = new Date(a.createdAt).getTime();
                const createdB = new Date(b.createdAt).getTime();
                return createdB - createdA;
            });
            console.log('📋 getUserSimulations: Found simulations:', {
                count: simulations.length,
                simulations: simulations.map((s) => ({
                    id: s.id,
                    scheduledDate: s.scheduledDate,
                    status: s.status,
                    createdAt: s.createdAt,
                    hasFeedback: s.aiFeedbacks?.length > 0
                }))
            });
            const bookings = await connection_1.prisma.simulationBooking.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            console.log('📋 getUserSimulations: Found bookings:', bookings.length);
            return {
                simulations,
                bookings,
                monthlyCount: await this.getMonthlySimulationCount(userId)
            };
        }
        catch (error) {
            console.error('❌ Error getting user simulations:', error);
            throw error;
        }
    }
    async getNextAvailableSlot() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() + 7);
        maxDate.setHours(17, 0, 0, 0);
        let candidateDate = new Date(tomorrow);
        while (candidateDate <= maxDate) {
            if (candidateDate.getDay() === 0 || candidateDate.getDay() === 6) {
                candidateDate.setDate(candidateDate.getDate() + 1);
                candidateDate.setHours(9, 0, 0, 0);
                continue;
            }
            const hourStart = new Date(candidateDate);
            const hourEnd = new Date(candidateDate);
            hourEnd.setHours(hourEnd.getHours() + 1);
            const existingCount = await connection_1.prisma.voiceSimulation.count({
                where: {
                    scheduledDate: {
                        gte: hourStart,
                        lt: hourEnd
                    },
                    status: {
                        in: ['SCHEDULED', 'ACTIVE']
                    }
                }
            });
            if (existingCount < 10) {
                return candidateDate;
            }
            candidateDate.setHours(candidateDate.getHours() + 1);
            if (candidateDate.getHours() >= 18) {
                candidateDate.setDate(candidateDate.getDate() + 1);
                candidateDate.setHours(9, 0, 0, 0);
            }
        }
        throw new Error('Aucun créneau disponible dans les 7 prochains jours. Veuillez réessayer plus tard.');
    }
    async findAvailableSlots(startDate, endDate) {
        const availableSlots = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate.setHours(9, 0, 0, 0);
                continue;
            }
            for (let hour = 9; hour < 18; hour++) {
                const slotTime = new Date(currentDate);
                slotTime.setHours(hour, 0, 0, 0);
                const hourStart = new Date(slotTime);
                const hourEnd = new Date(slotTime);
                hourEnd.setHours(hourEnd.getHours() + 1);
                const existingCount = await connection_1.prisma.voiceSimulation.count({
                    where: {
                        scheduledDate: {
                            gte: hourStart,
                            lt: hourEnd
                        },
                        status: {
                            in: ['SCHEDULED', 'ACTIVE']
                        }
                    }
                });
                if (existingCount < 10) {
                    availableSlots.push(new Date(slotTime));
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(9, 0, 0, 0);
        }
        return availableSlots;
    }
    async getMonthlySimulationCount(userId) {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        return await connection_1.prisma.voiceSimulation.count({
            where: {
                userId,
                createdAt: {
                    gte: currentMonth
                }
            }
        });
    }
    async sendBookingConfirmation(simulation) {
        try {
            console.log('📧 Preparing to send booking confirmation email...', {
                simulationId: simulation.id,
                userEmail: simulation.user?.email
            });
            const { default: TemporaryTokenService } = await Promise.resolve().then(() => __importStar(require('./temporaryTokenService')));
            const scheduledDate = new Date(simulation.scheduledDate);
            const durationInSeconds = simulation.duration || 300;
            const estimatedEndTime = new Date(scheduledDate.getTime() + durationInSeconds * 1000);
            const now = new Date();
            const hoursUntilEstimatedEnd = Math.max(1, (estimatedEndTime.getTime() - now.getTime()) / (1000 * 60 * 60) + (2 / 60));
            const temporaryToken = await TemporaryTokenService.generateToken(simulation.userId, simulation.id, 'voice', hoursUntilEstimatedEnd);
            const simulationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/simulation-vocale/${simulation.id}?token=${temporaryToken}`;
            let voiceDisplayName = simulation.voicePreference === 'MALE' ? 'Voix masculine' : 'Voix féminine';
            if (simulation.questionsData && typeof simulation.questionsData === 'object') {
                const questionsData = simulation.questionsData;
                const voiceId = questionsData.voiceId;
                if (voiceId) {
                    const { default: vapiService } = await Promise.resolve().then(() => __importStar(require('./vapiService')));
                    const availableVoices = vapiService.getVoiceOptions();
                    const voice = availableVoices.find(v => v.id === voiceId);
                    if (voice) {
                        voiceDisplayName = voice.name;
                    }
                }
            }
            const emailData = {
                firstName: simulation.user.firstName,
                email: simulation.user.email,
                scheduledDate: new Date(simulation.scheduledDate),
                voicePreference: voiceDisplayName,
                duration: '5 minutes',
                simulationId: simulation.id,
                accessUrl: simulationUrl
            };
            console.log('📧 Sending booking confirmation email to:', emailData.email);
            const emailSent = await emailService_1.EmailService.sendVoiceSimulationBookingEmail(emailData);
            if (emailSent) {
                console.log('✅ Booking confirmation email sent successfully to:', emailData.email);
            }
            else {
                console.error('❌ Failed to send booking confirmation email to:', emailData.email);
                throw new Error('Email service returned false');
            }
        }
        catch (error) {
            console.error('❌ Error sending booking confirmation email:', {
                error: error?.message,
                stack: error?.stack,
                simulationId: simulation.id,
                userEmail: simulation.user?.email
            });
            throw error;
        }
    }
    async sendResultsEmail(simulation) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: simulation.userId }
            });
            if (!user)
                return;
            const emailData = {
                firstName: user.firstName,
                email: user.email,
                overallScore: simulation.overallScore,
                fluencyScore: simulation.fluencyScore,
                grammarScore: simulation.grammarScore,
                vocabularyScore: simulation.vocabularyScore,
                pronunciationScore: simulation.pronunciationScore,
                coherenceScore: simulation.coherenceScore,
                feedback: simulation.feedback,
                completedAt: simulation.updatedAt
            };
            await emailService_1.EmailService.sendVoiceSimulationResultsEmail(emailData);
        }
        catch (error) {
            console.error('Error sending results email:', error);
        }
    }
    initializeCronJobs() {
        node_cron_1.default.schedule('*/5 * * * *', async () => {
            try {
                const thirtyMinutesFromNow = new Date();
                thirtyMinutesFromNow.setMinutes(thirtyMinutesFromNow.getMinutes() + 30);
                const upcomingSimulations = await connection_1.prisma.voiceSimulation.findMany({
                    where: {
                        scheduledDate: {
                            lte: thirtyMinutesFromNow,
                            gte: new Date()
                        },
                        status: 'SCHEDULED',
                        notificationSent: false
                    }
                });
                for (const simulation of upcomingSimulations) {
                    const user = await connection_1.prisma.user.findUnique({
                        where: { id: simulation.userId },
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    });
                    if (user) {
                        await this.sendReminderEmail({ ...simulation, user });
                    }
                    await connection_1.prisma.voiceSimulation.update({
                        where: { id: simulation.id },
                        data: { notificationSent: true }
                    });
                }
            }
            catch (error) {
                console.error('Error in reminder cron job:', error);
            }
        });
        node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                const expiredSimulations = await connection_1.prisma.voiceSimulation.findMany({
                    where: {
                        status: 'ACTIVE',
                        scheduledDate: {
                            lt: new Date(Date.now() - 30 * 60 * 1000)
                        }
                    }
                });
                for (const simulation of expiredSimulations) {
                    await connection_1.prisma.voiceSimulation.update({
                        where: { id: simulation.id },
                        data: { status: 'CANCELLED' }
                    });
                    this.activeSessions.delete(simulation.id);
                }
            }
            catch (error) {
                console.error('Error in cleanup cron job:', error);
            }
        });
    }
    async sendReminderEmail(simulation) {
        try {
            const simulationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/voice-simulation/${simulation.id}`;
            const emailData = {
                firstName: simulation.user.firstName,
                email: simulation.user.email,
                scheduledDate: new Date(simulation.scheduledDate),
                simulationId: simulation.id,
                userId: simulation.userId
            };
            await emailService_1.EmailService.sendVoiceSimulationReminderEmail(emailData);
            console.log(`Reminder email sent to ${simulation.user.email} for simulation ${simulation.id}`);
        }
        catch (error) {
            console.error('Error sending reminder email:', error);
        }
    }
    getActiveSession(simulationId) {
        return this.activeSessions.get(simulationId);
    }
    async handleFetchNextQuestion(simulationId, level, category, excludeQuestionIds = []) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            const questions = await vapiService_1.default.getRandomQuestions(level, 20);
            let filteredQuestions = questions;
            if (category) {
                filteredQuestions = questions.filter((q) => {
                    const qCategory = (q.category || 'GENERAL').toString();
                    return qCategory === category;
                });
            }
            const availableQuestions = filteredQuestions.filter((q) => {
                const qId = q.id || q.questionId || JSON.stringify(q);
                return !excludeQuestionIds.includes(qId) && !session.askedQuestions.has(qId);
            });
            if (availableQuestions.length === 0) {
                const allQuestions = await vapiService_1.default.getProgressiveQuestions();
                const levelQuestions = allQuestions.byLevel[level] || [];
                const fallbackQuestions = levelQuestions.filter((q) => {
                    const qId = q.id || q.questionId || JSON.stringify(q);
                    return !excludeQuestionIds.includes(qId) && !session.askedQuestions.has(qId);
                });
                if (fallbackQuestions.length > 0) {
                    const selectedQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
                    return {
                        question: selectedQuestion.question || selectedQuestion.text || selectedQuestion.questionText || '',
                        questionId: selectedQuestion.id || selectedQuestion.questionId || JSON.stringify(selectedQuestion),
                        level: selectedQuestion.level || level,
                        category: selectedQuestion.category || category || 'GENERAL',
                        availableCount: fallbackQuestions.length
                    };
                }
            }
            const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
            const questionId = selectedQuestion.id || selectedQuestion.questionId || JSON.stringify(selectedQuestion);
            session.askedQuestions.set(questionId, {
                question: selectedQuestion.question || selectedQuestion.text || selectedQuestion.questionText,
                level: selectedQuestion.level || level,
                category: selectedQuestion.category || category || 'GENERAL',
                timestamp: new Date()
            });
            session.questionCount++;
            return {
                question: selectedQuestion.question || selectedQuestion.text || selectedQuestion.questionText || '',
                questionId: questionId,
                level: selectedQuestion.level || level,
                category: selectedQuestion.category || category || 'GENERAL',
                availableCount: availableQuestions.length
            };
        }
        catch (error) {
            console.error('Error fetching next question:', error);
            throw error;
        }
    }
    async handleStoreQuestionResponse(simulationId, questionId, questionText, questionLevel, questionCategory, studentResponse, timestamp) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            const responseData = {
                questionId,
                questionText,
                questionLevel: questionLevel || session.currentLevel,
                questionCategory: questionCategory || 'GENERAL',
                studentResponse,
                timestamp: timestamp ? new Date(timestamp) : new Date()
            };
            session.questionResponses.set(questionId, responseData);
            const currentQuestionsData = session.questionsData || {};
            if (!currentQuestionsData.responses) {
                currentQuestionsData.responses = [];
            }
            currentQuestionsData.responses.push(responseData);
            await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    questionsData: currentQuestionsData
                }
            });
            console.log(`✅ Stored question-response: ${questionId}`);
            return {
                success: true,
                message: 'Question-response stored successfully',
                questionId,
                responseCount: session.questionResponses.size
            };
        }
        catch (error) {
            console.error('Error storing question-response:', error);
            throw error;
        }
    }
    async handleAnalyzeResponse(simulationId, questionId, studentResponse, questionLevel, conversationContext) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            const analysis = await this.analyzeResponseRealTime(studentResponse, questionLevel, conversationContext);
            const responseData = session.questionResponses.get(questionId);
            if (responseData) {
                responseData.analysis = analysis;
                session.questionResponses.set(questionId, responseData);
            }
            session.performanceScores.fluency.push(analysis.fluencyScore);
            session.performanceScores.grammar.push(analysis.grammarScore);
            session.performanceScores.vocabulary.push(analysis.vocabularyScore);
            session.performanceScores.pronunciation.push(analysis.pronunciationScore);
            session.performanceScores.coherence.push(analysis.coherenceScore);
            const avgScore = (analysis.fluencyScore +
                analysis.grammarScore +
                analysis.vocabularyScore +
                analysis.pronunciationScore +
                analysis.coherenceScore) / 5;
            if (avgScore >= 75 && session.currentLevel === 'A1') {
                session.currentLevel = 'A2';
            }
            else if (avgScore >= 75 && session.currentLevel === 'A2') {
                session.currentLevel = 'B1';
            }
            else if (avgScore >= 80 && session.currentLevel === 'B1') {
                session.currentLevel = 'B2';
            }
            else if (avgScore < 50 && session.currentLevel !== 'A1') {
                const levels = ['A1', 'A2', 'B1', 'B2'];
                const currentIndex = levels.indexOf(session.currentLevel);
                if (currentIndex > 0) {
                    session.currentLevel = levels[currentIndex - 1];
                }
            }
            console.log(`✅ Analyzed response: ${questionId}`, {
                avgScore: avgScore.toFixed(1),
                newLevel: session.currentLevel
            });
            return {
                success: true,
                analysis: {
                    fluencyScore: analysis.fluencyScore,
                    grammarScore: analysis.grammarScore,
                    vocabularyScore: analysis.vocabularyScore,
                    pronunciationScore: analysis.pronunciationScore,
                    coherenceScore: analysis.coherenceScore,
                    overallScore: analysis.overallScore,
                    strengths: analysis.strengths || [],
                    weaknesses: analysis.weaknesses || [],
                    recommendations: analysis.recommendations || [],
                    suggestedNextLevel: session.currentLevel
                }
            };
        }
        catch (error) {
            console.error('Error analyzing response:', error);
            throw error;
        }
    }
    async handleGetNextDifficultyLevel(simulationId, currentLevel, performanceScores) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            const levels = ['A1', 'A2', 'B1', 'B2'];
            const currentIndex = levels.indexOf(currentLevel);
            const avgScore = ((performanceScores.fluency || 0) +
                (performanceScores.grammar || 0) +
                (performanceScores.vocabulary || 0) +
                (performanceScores.pronunciation || 0) +
                (performanceScores.coherence || 0)) / 5;
            let nextLevel = currentLevel;
            if (avgScore >= 80 && currentIndex < levels.length - 1) {
                nextLevel = levels[currentIndex + 1];
            }
            else if (avgScore >= 65 && currentIndex < levels.length - 1) {
                nextLevel = levels[currentIndex + 1];
            }
            else if (avgScore < 50 && currentIndex > 0) {
                nextLevel = levels[currentIndex - 1];
            }
            session.currentLevel = nextLevel;
            return {
                nextLevel,
                currentLevel,
                averageScore: avgScore.toFixed(1),
                recommendation: avgScore >= 75
                    ? 'Augmenter la difficulté'
                    : avgScore < 50
                        ? 'Maintenir ou diminuer la difficulté'
                        : 'Maintenir la difficulté actuelle'
            };
        }
        catch (error) {
            console.error('Error determining next difficulty level:', error);
            throw error;
        }
    }
    async handleGetQuestionCount(simulationId) {
        try {
            const session = this.activeSessions.get(simulationId);
            if (!session) {
                throw new Error('Active session not found');
            }
            const elapsedTime = (new Date().getTime() - session.startTime.getTime()) / 1000;
            const remainingTime = 300 - elapsedTime;
            const timePerQuestion = elapsedTime / session.questionCount || 30;
            const estimatedQuestionsRemaining = Math.floor(remainingTime / Math.max(timePerQuestion, 15));
            const targetQuestions = 8;
            const maxQuestions = 12;
            return {
                questionCount: session.questionCount,
                elapsedTime: Math.round(elapsedTime),
                remainingTime: Math.round(remainingTime),
                estimatedQuestionsRemaining,
                shouldAskMore: session.questionCount < targetQuestions,
                isOnTrack: session.questionCount >= targetQuestions && session.questionCount <= maxQuestions,
                recommendation: session.questionCount < targetQuestions
                    ? `Posez plus de questions rapidement. Objectif: ${targetQuestions} questions minimum.`
                    : session.questionCount >= maxQuestions
                        ? 'Vous avez atteint le nombre maximum recommandé de questions.'
                        : `Continuez au rythme actuel. Objectif: ${maxQuestions} questions maximum.`
            };
        }
        catch (error) {
            console.error('Error getting question count:', error);
            throw error;
        }
    }
    async analyzeResponseRealTime(studentResponse, questionLevel, conversationContext) {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const analysisPrompt = `
Analysez cette réponse d'un candidat à une question de niveau ${questionLevel} en français et fournissez une évaluation détaillée en temps réel.

RÉPONSE DU CANDIDAT:
${studentResponse}

${conversationContext ? `CONTEXTE DE LA CONVERSATION:\n${conversationContext}\n` : ''}

Évaluez selon ces 5 critères (score de 0 à 100 pour chaque):

1. FLUIDITÉ: Capacité à parler sans hésitations excessives, rythme naturel, aisance
2. GRAMMAIRE: Correction grammaticale, structures complexes, accords
3. VOCABULAIRE: Richesse, précision, registre approprié, variété lexicale
4. PRONONCIATION: Clarté, accent, intonation (basé sur la transcription)
5. COHÉRENCE: Logique du discours, organisation des idées, pertinence

Fournissez également:
- Forces (points forts) - liste de 2-3 points
- Faiblesses (points à améliorer) - liste de 2-3 points
- Recommandations spécifiques - 2-3 recommandations concrètes

RÉPONDEZ UNIQUEMENT avec un JSON dans ce format exact:
{
  "overallScore": number,
  "fluencyScore": number,
  "grammarScore": number,
  "vocabularyScore": number,
  "pronunciationScore": number,
  "coherenceScore": number,
  "strengths": ["force 1", "force 2", "force 3"],
  "weaknesses": ["faiblesse 1", "faiblesse 2", "faiblesse 3"],
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3"],
  "feedback": "Commentaire constructif et encourageant en français"
}`;
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un expert en évaluation de français pour les tests TCF/TEF/FLS/FLE. Analyse les réponses en temps réel et fournis des évaluations précises et constructives.'
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 800
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const analysisText = response.data.choices[0].message.content;
            const analysis = JSON.parse(analysisText);
            return analysis;
        }
        catch (error) {
            console.error('Error in real-time analysis:', error);
            return {
                overallScore: 50,
                fluencyScore: 50,
                grammarScore: 50,
                vocabularyScore: 50,
                pronunciationScore: 50,
                coherenceScore: 50,
                strengths: [],
                weaknesses: [],
                recommendations: [],
                feedback: 'Analyse en cours...'
            };
        }
    }
    async cancelSimulation(simulationId, userId, language = 'fr') {
        try {
            console.log('🗑️ cancelSimulation called:', {
                simulationId,
                userId,
                simulationIdType: typeof simulationId,
                simulationIdLength: simulationId?.length,
                userIdType: typeof userId
            });
            const cleanSimulationId = simulationId?.trim();
            const cleanUserId = userId?.trim();
            console.log('🔍 Cleaned IDs:', {
                simulationId: cleanSimulationId,
                userId: cleanUserId
            });
            let simulation = await connection_1.prisma.voiceSimulation.findFirst({
                where: {
                    id: cleanSimulationId,
                    userId: cleanUserId
                }
            });
            if (!simulation) {
                simulation = await connection_1.prisma.voiceSimulation.findFirst({
                    where: { id: simulationId, userId }
                });
            }
            console.log('🔍 Simulation lookup result:', {
                found: !!simulation,
                simulationId: cleanSimulationId,
                userId: cleanUserId,
                triedOriginalIds: !simulation
            });
            if (!simulation) {
                const anySimulation = await connection_1.prisma.voiceSimulation.findUnique({
                    where: { id: cleanSimulationId || simulationId },
                    select: {
                        id: true,
                        userId: true,
                        status: true
                    }
                });
                console.log('🔍 Simulation exists (any user):', {
                    found: !!anySimulation,
                    simulationId: cleanSimulationId || simulationId,
                    actualUserId: anySimulation?.userId,
                    actualUserIdType: typeof anySimulation?.userId,
                    actualUserIdLength: anySimulation?.userId?.length,
                    requestedUserId: cleanUserId || userId,
                    requestedUserIdType: typeof (cleanUserId || userId),
                    requestedUserIdLength: (cleanUserId || userId)?.length,
                    belongsToUser: anySimulation?.userId === cleanUserId || anySimulation?.userId === userId,
                    userIdsMatch: anySimulation?.userId === cleanUserId || anySimulation?.userId === userId,
                    exactComparison: anySimulation?.userId === (cleanUserId || userId),
                    stringComparison: String(anySimulation?.userId) === String(cleanUserId || userId)
                });
                if (anySimulation) {
                    const errorMessage = language === 'fr'
                        ? `Cette simulation appartient à un autre utilisateur. Simulation: ${anySimulation.userId}, Token: ${cleanUserId || userId}`
                        : `This simulation belongs to another user. Simulation: ${anySimulation.userId}, Token: ${cleanUserId || userId}`;
                    console.log('❌ SIMULATION FOUND BUT USER ID MISMATCH!');
                    console.log('   Simulation belongs to:', anySimulation.userId);
                    console.log('   Token claims userId:', cleanUserId || userId);
                    console.log('   This means the user is trying to cancel a simulation they don\'t own!');
                    throw new Error(errorMessage);
                }
                throw new Error(i18nService_1.default.t('voice.simulation_not_found', language));
            }
            if (simulation.status === 'COMPLETED' || simulation.status === 'CANCELLED') {
                throw new Error(language === 'fr'
                    ? 'Cette simulation ne peut pas être annulée'
                    : 'This simulation cannot be cancelled');
            }
            const updatedSimulation = await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            });
            await this.sendCancellationEmail(simulation, language);
            return updatedSimulation;
        }
        catch (error) {
            console.error('Error cancelling simulation:', error);
            throw error;
        }
    }
    async rescheduleSimulation(simulationId, userId, newDate, voicePreference, language = 'fr') {
        try {
            console.log('📅 rescheduleSimulation called:', {
                simulationId,
                userId,
                newDate: newDate.toISOString(),
                simulationIdType: typeof simulationId,
                simulationIdLength: simulationId?.length,
                userIdType: typeof userId
            });
            const cleanSimulationId = simulationId?.trim();
            const cleanUserId = userId?.trim();
            console.log('🔍 Cleaned IDs (reschedule):', {
                simulationId: cleanSimulationId,
                userId: cleanUserId
            });
            let simulation = await connection_1.prisma.voiceSimulation.findFirst({
                where: {
                    id: cleanSimulationId,
                    userId: cleanUserId
                }
            });
            if (!simulation) {
                simulation = await connection_1.prisma.voiceSimulation.findFirst({
                    where: { id: simulationId, userId }
                });
            }
            console.log('🔍 Simulation lookup result (reschedule):', {
                found: !!simulation,
                simulationId: cleanSimulationId,
                userId: cleanUserId,
                triedOriginalIds: !simulation
            });
            if (!simulation) {
                const anySimulation = await connection_1.prisma.voiceSimulation.findUnique({
                    where: { id: cleanSimulationId || simulationId }
                });
                console.log('🔍 Simulation exists (any user) - reschedule:', {
                    found: !!anySimulation,
                    belongsToUser: anySimulation?.userId === cleanUserId || anySimulation?.userId === userId,
                    actualUserId: anySimulation?.userId,
                    requestedUserId: cleanUserId || userId,
                    userIdsMatch: anySimulation?.userId === cleanUserId || anySimulation?.userId === userId
                });
                throw new Error(i18nService_1.default.t('voice.simulation_not_found', language));
            }
            if (simulation.status === 'COMPLETED' || simulation.status === 'CANCELLED') {
                throw new Error(language === 'fr'
                    ? 'Cette simulation ne peut pas être reprogrammée'
                    : 'This simulation cannot be rescheduled');
            }
            const isAvailable = await this.isSlotAvailable(newDate);
            if (!isAvailable) {
                throw new Error(language === 'fr'
                    ? 'Ce créneau n\'est pas disponible'
                    : 'This time slot is not available');
            }
            const updateData = {
                scheduledDate: newDate,
                updatedAt: new Date()
            };
            if (voicePreference) {
                updateData.voicePreference = voicePreference;
            }
            const updatedSimulation = await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: updateData
            });
            await this.sendReschedulingEmail(updatedSimulation, language);
            return updatedSimulation;
        }
        catch (error) {
            console.error('Error rescheduling simulation:', error);
            throw error;
        }
    }
    async isSlotAvailable(date) {
        const hourStart = new Date(date);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);
        const existingCount = await connection_1.prisma.voiceSimulation.count({
            where: {
                scheduledDate: {
                    gte: hourStart,
                    lt: hourEnd
                },
                status: {
                    in: ['SCHEDULED', 'ACTIVE']
                }
            }
        });
        return existingCount < 10;
    }
    async sendCancellationEmail(simulation, language) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: simulation.userId },
                select: { firstName: true, email: true }
            });
            if (user) {
                console.log(`Cancellation email would be sent to ${user.email}`);
            }
        }
        catch (error) {
            console.error('Error sending cancellation email:', error);
        }
    }
    async sendReschedulingEmail(simulation, language) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: simulation.userId },
                select: { firstName: true, email: true }
            });
            if (user) {
                console.log(`Rescheduling email would be sent to ${user.email}`);
            }
        }
        catch (error) {
            console.error('Error sending rescheduling email:', error);
        }
    }
}
exports.default = new VoiceSimulationService();
//# sourceMappingURL=voiceSimulationService.js.map