export declare function checkSimulationLimit(userId: string): Promise<{
    canCreate: boolean;
    remaining: number;
    maxSimulations: number;
    periodStartDate: Date;
    periodEndDate: Date;
    subscriptionTier: string;
    totalSimulationsUsed: number;
    error?: string;
}>;
//# sourceMappingURL=simulationLimitService.d.ts.map