"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const vapiService_1 = __importDefault(require("./vapiService"));
const emailService_1 = require("./emailService");
const i18nService_1 = __importDefault(require("./i18nService"));
const node_cron_1 = __importDefault(require("node-cron"));
class VoiceSimulationService {
    constructor() {
        this.activeSessions = new Map();
        this.initializeCronJobs();
    }
    async bookSimulation(request, language = 'fr') {
        try {
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const monthlyCount = await connection_1.prisma.voiceSimulation.count({
                where: {
                    userId: request.userId,
                    createdAt: {
                        gte: currentMonth
                    }
                }
            });
            if (monthlyCount >= 2) {
                throw new Error(i18nService_1.default.t('voice.monthly_limit_reached', language));
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
                    bookingType: 'MANUAL',
                    preferredDates: request.preferredDates || [],
                    assignedDate
                }
            });
            const simulation = await connection_1.prisma.voiceSimulation.create({
                data: {
                    userId: request.userId,
                    scheduledDate: assignedDate,
                    voicePreference: (request.voicePreference || 'france_female_1'),
                    status: 'SCHEDULED'
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
                await this.sendBookingConfirmation({ ...simulation, user });
            }
            return {
                booking,
                simulation,
                message: 'Voice simulation booked successfully'
            };
        }
        catch (error) {
            console.error('Error booking simulation:', error);
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
            const questions = await vapiService_1.default.getRandomQuestions('B1', 8);
            const voiceId = simulation.voicePreference || 'france_male_1';
            const assistant = await vapiService_1.default.createFrenchAssistant(voiceId, questions);
            const call = await vapiService_1.default.startVoiceSimulation(simulationId, assistant.id);
            const session = {
                simulationId,
                userId: simulation.userId,
                assistantId: assistant.id,
                callId: call.id
            };
            this.activeSessions.set(simulationId, session);
            await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    questionsData: questions,
                    status: 'ACTIVE'
                }
            });
            return {
                simulation,
                call,
                assistant,
                questions,
                message: 'Voice simulation started successfully'
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
            const simulations = await connection_1.prisma.voiceSimulation.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            const bookings = await connection_1.prisma.simulationBooking.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            return {
                simulations,
                bookings,
                monthlyCount: await this.getMonthlySimulationCount(userId)
            };
        }
        catch (error) {
            console.error('Error getting user simulations:', error);
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
            const simulationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/voice-simulation/${simulation.id}`;
            const emailData = {
                firstName: simulation.user.firstName,
                email: simulation.user.email,
                scheduledDate: new Date(simulation.scheduledDate),
                voicePreference: simulation.voicePreference === 'MALE' ? 'Voix masculine' : 'Voix féminine',
                duration: '7 minutes'
            };
            await emailService_1.EmailService.sendVoiceSimulationBookingEmail(emailData);
        }
        catch (error) {
            console.error('Error sending booking confirmation:', error);
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
    async cancelSimulation(simulationId, userId, language = 'fr') {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.findFirst({
                where: { id: simulationId, userId }
            });
            if (!simulation) {
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
            const simulation = await connection_1.prisma.voiceSimulation.findFirst({
                where: { id: simulationId, userId }
            });
            if (!simulation) {
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