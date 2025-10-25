import { Language } from './i18nService';
interface BookingRequest {
    userId: string;
    bookingType: 'MANUAL' | 'AUTO';
    preferredDates?: Date[];
    voicePreference?: string;
}
declare class VoiceSimulationService {
    private activeSessions;
    constructor();
    bookSimulation(request: BookingRequest, language?: Language): Promise<any>;
    startSimulation(simulationId: string): Promise<any>;
    endSimulation(simulationId: string): Promise<any>;
    getSimulation(simulationId: string, userId: string): Promise<any>;
    getUserSimulations(userId: string): Promise<any>;
    private getNextAvailableSlot;
    findAvailableSlots(startDate: Date, endDate: Date): Promise<Date[]>;
    private getMonthlySimulationCount;
    private sendBookingConfirmation;
    private sendResultsEmail;
    private initializeCronJobs;
    private sendReminderEmail;
    cancelSimulation(simulationId: string, userId: string, language?: Language): Promise<any>;
    rescheduleSimulation(simulationId: string, userId: string, newDate: Date, voicePreference?: string, language?: Language): Promise<any>;
    private isSlotAvailable;
    private sendCancellationEmail;
    private sendReschedulingEmail;
}
declare const _default: VoiceSimulationService;
export default _default;
//# sourceMappingURL=voiceSimulationService.d.ts.map