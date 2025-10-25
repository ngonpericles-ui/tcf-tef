import { prisma } from '@/database/connection';
import vapiService from './vapiService';
import { EmailService } from './emailService';
import I18nService, { Language } from './i18nService';
import cron from 'node-cron';

interface BookingRequest {
  userId: string;
  bookingType: 'MANUAL' | 'AUTO';
  preferredDates?: Date[];
  voicePreference?: string; // Now accepts voice IDs like 'france_male_1', 'quebec_female_1', etc.
}

interface SimulationSession {
  simulationId: string;
  userId: string;
  assistantId: string;
  callId?: string;
}

class VoiceSimulationService {
  private activeSessions: Map<string, SimulationSession> = new Map();

  constructor() {
    this.initializeCronJobs();
  }

  // Book a voice simulation
  async bookSimulation(request: BookingRequest, language: Language = 'fr'): Promise<any> {
    try {
      // Check if user has reached monthly limit (2 simulations per month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await prisma.voiceSimulation.count({
        where: {
          userId: request.userId,
          createdAt: {
            gte: currentMonth
          }
        }
      });

      if (monthlyCount >= 2) {
        throw new Error(I18nService.t('voice.monthly_limit_reached', language));
      }

      let assignedDate: Date;

      if (request.bookingType === 'AUTO') {
        // Auto-assign next available slot
        assignedDate = await this.getNextAvailableSlot();
      } else {
        // Manual booking - use first preferred date or next available
        if (request.preferredDates && request.preferredDates.length > 0) {
          assignedDate = request.preferredDates[0];
        } else {
          assignedDate = await this.getNextAvailableSlot();
        }
      }

      // Create simulation booking
      const booking = await prisma.simulationBooking.create({
        data: {
          userId: request.userId,
          bookingType: 'MANUAL', // Use valid BookingType enum value
          preferredDates: request.preferredDates || [],
          assignedDate
        }
      });

      // Create voice simulation
      const simulation = await prisma.voiceSimulation.create({
        data: {
          userId: request.userId,
          scheduledDate: assignedDate,
          voicePreference: (request.voicePreference || 'france_female_1') as any,
          status: 'SCHEDULED'
        }
      });

      // Get user data for confirmation email
      const user = await prisma.user.findUnique({
        where: { id: simulation.userId },
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      });

      // Send confirmation email
      if (user) {
        await this.sendBookingConfirmation({ ...simulation, user });
      }

      return {
        booking,
        simulation,
        message: 'Voice simulation booked successfully'
      };
    } catch (error) {
      console.error('Error booking simulation:', error);
      throw error;
    }
  }

  // Start a voice simulation session
  async startSimulation(simulationId: string): Promise<any> {
    try {
      const simulation = await prisma.voiceSimulation.findUnique({
        where: { id: simulationId }
      });

      if (!simulation) {
        throw new Error('Simulation not found');
      }

      if (simulation.status !== 'SCHEDULED') {
        throw new Error('Simulation is not in scheduled status');
      }

      // Get random questions for the simulation
      const questions = await vapiService.getRandomQuestions('B1', 8);

      // Use voice preference or default to first French voice
      const voiceId = simulation.voicePreference || 'france_male_1';

      // Create VAPI assistant with selected voice
      const assistant = await vapiService.createFrenchAssistant(
        voiceId,
        questions
      );

      // Start VAPI call
      const call = await vapiService.startVoiceSimulation(simulationId, assistant.id!);

      // Store session info
      const session: SimulationSession = {
        simulationId,
        userId: simulation.userId,
        assistantId: assistant.id!,
        callId: call.id
      };

      this.activeSessions.set(simulationId, session);

      // Update simulation with questions data
      await prisma.voiceSimulation.update({
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
    } catch (error) {
      console.error('Error starting simulation:', error);
      throw error;
    }
  }

  // End a voice simulation session
  async endSimulation(simulationId: string): Promise<any> {
    try {
      const session = this.activeSessions.get(simulationId);
      if (!session) {
        throw new Error('Active session not found');
      }

      // End VAPI call
      if (session.callId) {
        await vapiService.endCall(session.callId);
      }

      // Process results
      const results = await vapiService.processCallResults(session.callId!, simulationId);

      // Remove from active sessions
      this.activeSessions.delete(simulationId);

      // Send results email
      await this.sendResultsEmail(results);

      return {
        results,
        message: 'Voice simulation completed successfully'
      };
    } catch (error) {
      console.error('Error ending simulation:', error);
      throw error;
    }
  }

  // Get a specific simulation
  async getSimulation(simulationId: string, userId: string): Promise<any> {
    try {
      const simulation = await prisma.voiceSimulation.findFirst({
        where: {
          id: simulationId,
          userId: userId
        },
        // Note: VoiceSimulation model doesn't have direct user relation
        // User details will be fetched separately if needed
      });

      if (!simulation) {
        throw new Error('Simulation not found or access denied');
      }

      return simulation;
    } catch (error) {
      console.error('Error getting simulation:', error);
      throw error;
    }
  }

  // Get user's simulation history
  async getUserSimulations(userId: string): Promise<any> {
    try {
      const simulations = await prisma.voiceSimulation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        // Note: VoiceSimulation model doesn't have direct user relation
        // User details will be fetched separately if needed
      });

      const bookings = await prisma.simulationBooking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return {
        simulations,
        bookings,
        monthlyCount: await this.getMonthlySimulationCount(userId)
      };
    } catch (error) {
      console.error('Error getting user simulations:', error);
      throw error;
    }
  }

  // Get next available time slot within 7 days
  private async getNextAvailableSlot(): Promise<Date> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Start at 9 AM

    // Set 7-day limit
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(17, 0, 0, 0); // End at 5 PM on the 7th day

    // Find next available slot within 7 days
    let candidateDate = new Date(tomorrow);

    while (candidateDate <= maxDate) {
      // Skip weekends
      if (candidateDate.getDay() === 0 || candidateDate.getDay() === 6) {
        candidateDate.setDate(candidateDate.getDate() + 1);
        candidateDate.setHours(9, 0, 0, 0);
        continue;
      }

      // Check if slot is available (max 10 simulations per hour)
      const hourStart = new Date(candidateDate);
      const hourEnd = new Date(candidateDate);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const existingCount = await prisma.voiceSimulation.count({
        where: {
          scheduledDate: {
            gte: hourStart,
            lt: hourEnd
          },
          status: {
            in: ['SCHEDULED', 'ACTIVE'] // Only count active bookings
          }
        }
      });

      if (existingCount < 10) {
        return candidateDate;
      }

      // Move to next hour
      candidateDate.setHours(candidateDate.getHours() + 1);

      // If past business hours (6 PM), move to next day
      if (candidateDate.getHours() >= 18) {
        candidateDate.setDate(candidateDate.getDate() + 1);
        candidateDate.setHours(9, 0, 0, 0);
      }
    }

    // If no slot found within 7 days, throw error
    throw new Error('Aucun créneau disponible dans les 7 prochains jours. Veuillez réessayer plus tard.');
  }

  // Find available slots for a specific date range (enhanced method)
  async findAvailableSlots(startDate: Date, endDate: Date): Promise<Date[]> {
    const availableSlots: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
        continue;
      }

      // Check each hour from 9 AM to 6 PM
      for (let hour = 9; hour < 18; hour++) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, 0, 0, 0);

        const hourStart = new Date(slotTime);
        const hourEnd = new Date(slotTime);
        hourEnd.setHours(hourEnd.getHours() + 1);

        const existingCount = await prisma.voiceSimulation.count({
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

  // Get monthly simulation count for user
  private async getMonthlySimulationCount(userId: string): Promise<number> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    return await prisma.voiceSimulation.count({
      where: {
        userId,
        createdAt: {
          gte: currentMonth
        }
      }
    });
  }

  // Send booking confirmation email
  private async sendBookingConfirmation(simulation: any): Promise<void> {
    try {
      const simulationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/voice-simulation/${simulation.id}`;

      const emailData = {
        firstName: simulation.user.firstName,
        email: simulation.user.email,
        scheduledDate: new Date(simulation.scheduledDate),
        voicePreference: simulation.voicePreference === 'MALE' ? 'Voix masculine' : 'Voix féminine',
        duration: '7 minutes'
      };

      await EmailService.sendVoiceSimulationBookingEmail(emailData);
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  }

  // Send results email
  private async sendResultsEmail(simulation: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: simulation.userId }
      });

      if (!user) return;

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

      await EmailService.sendVoiceSimulationResultsEmail(emailData);
    } catch (error) {
      console.error('Error sending results email:', error);
    }
  }

  // Initialize cron jobs for notifications and cleanup
  private initializeCronJobs(): void {
    // Send reminder emails 30 minutes before simulation
    cron.schedule('*/5 * * * *', async () => {
      try {
        const thirtyMinutesFromNow = new Date();
        thirtyMinutesFromNow.setMinutes(thirtyMinutesFromNow.getMinutes() + 30);

        const upcomingSimulations = await prisma.voiceSimulation.findMany({
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
          // Get user data separately
          const user = await prisma.user.findUnique({
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

          await prisma.voiceSimulation.update({
            where: { id: simulation.id },
            data: { notificationSent: true }
          });
        }
      } catch (error) {
        console.error('Error in reminder cron job:', error);
      }
    });

    // Cleanup expired sessions
    cron.schedule('0 * * * *', async () => {
      try {
        const expiredSimulations = await prisma.voiceSimulation.findMany({
          where: {
            status: 'ACTIVE',
            scheduledDate: {
              lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
            }
          }
        });

        for (const simulation of expiredSimulations) {
          await prisma.voiceSimulation.update({
            where: { id: simulation.id },
            data: { status: 'CANCELLED' }
          });

          this.activeSessions.delete(simulation.id);
        }
      } catch (error) {
        console.error('Error in cleanup cron job:', error);
      }
    });
  }

  // Send reminder email
  private async sendReminderEmail(simulation: any): Promise<void> {
    try {
      const simulationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/voice-simulation/${simulation.id}`;

      const emailData = {
        firstName: simulation.user.firstName,
        email: simulation.user.email,
        scheduledDate: new Date(simulation.scheduledDate),
        simulationId: simulation.id,
        userId: simulation.userId
      };

      await EmailService.sendVoiceSimulationReminderEmail(emailData);
      console.log(`Reminder email sent to ${simulation.user.email} for simulation ${simulation.id}`);
    } catch (error) {
      console.error('Error sending reminder email:', error);
    }
  }

  // Cancel a voice simulation
  async cancelSimulation(simulationId: string, userId: string, language: Language = 'fr'): Promise<any> {
    try {
      // Find the simulation
      const simulation = await prisma.voiceSimulation.findFirst({
        where: { id: simulationId, userId }
      });

      if (!simulation) {
        throw new Error(I18nService.t('voice.simulation_not_found', language));
      }

      if (simulation.status === 'COMPLETED' || simulation.status === 'CANCELLED') {
        throw new Error(language === 'fr'
          ? 'Cette simulation ne peut pas être annulée'
          : 'This simulation cannot be cancelled');
      }

      // Update simulation status
      const updatedSimulation = await prisma.voiceSimulation.update({
        where: { id: simulationId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // Send cancellation email
      await this.sendCancellationEmail(simulation, language);

      return updatedSimulation;
    } catch (error) {
      console.error('Error cancelling simulation:', error);
      throw error;
    }
  }

  // Reschedule a voice simulation
  async rescheduleSimulation(
    simulationId: string,
    userId: string,
    newDate: Date,
    voicePreference?: string,
    language: Language = 'fr'
  ): Promise<any> {
    try {
      // Find the simulation
      const simulation = await prisma.voiceSimulation.findFirst({
        where: { id: simulationId, userId }
      });

      if (!simulation) {
        throw new Error(I18nService.t('voice.simulation_not_found', language));
      }

      if (simulation.status === 'COMPLETED' || simulation.status === 'CANCELLED') {
        throw new Error(language === 'fr'
          ? 'Cette simulation ne peut pas être reprogrammée'
          : 'This simulation cannot be rescheduled');
      }

      // Check if new date is available
      const isAvailable = await this.isSlotAvailable(newDate);
      if (!isAvailable) {
        throw new Error(language === 'fr'
          ? 'Ce créneau n\'est pas disponible'
          : 'This time slot is not available');
      }

      // Update simulation
      const updateData: any = {
        scheduledDate: newDate,
        updatedAt: new Date()
      };

      if (voicePreference) {
        updateData.voicePreference = voicePreference;
      }

      const updatedSimulation = await prisma.voiceSimulation.update({
        where: { id: simulationId },
        data: updateData
      });

      // Send rescheduling confirmation email
      await this.sendReschedulingEmail(updatedSimulation, language);

      return updatedSimulation;
    } catch (error) {
      console.error('Error rescheduling simulation:', error);
      throw error;
    }
  }

  // Check if a time slot is available
  private async isSlotAvailable(date: Date): Promise<boolean> {
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);

    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const existingCount = await prisma.voiceSimulation.count({
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

    return existingCount < 10; // Max 10 simulations per hour
  }

  // Send cancellation email
  private async sendCancellationEmail(simulation: any, language: Language): Promise<void> {
    try {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: simulation.userId },
        select: { firstName: true, email: true }
      });

      if (user) {
        // This would be implemented in EmailService
        console.log(`Cancellation email would be sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  }

  // Send rescheduling email
  private async sendReschedulingEmail(simulation: any, language: Language): Promise<void> {
    try {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: simulation.userId },
        select: { firstName: true, email: true }
      });

      if (user) {
        // This would be implemented in EmailService
        console.log(`Rescheduling email would be sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Error sending rescheduling email:', error);
    }
  }
}

export default new VoiceSimulationService();
