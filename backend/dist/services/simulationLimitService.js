"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSimulationLimit = checkSimulationLimit;
const database_1 = require("../config/database");
async function checkSimulationLimit(userId) {
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
    });
    const subscriptionTier = user?.subscriptionTier || 'FREE';
    const activeSubscription = await database_1.prisma.subscription.findFirst({
        where: {
            userId,
            status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
    });
    let periodStartDate;
    if (subscriptionTier === 'FREE') {
        periodStartDate = new Date();
        periodStartDate.setDate(periodStartDate.getDate() - 30);
    }
    else if (activeSubscription?.currentPeriodStart) {
        periodStartDate = new Date(activeSubscription.currentPeriodStart);
    }
    else if (activeSubscription?.startDate) {
        periodStartDate = new Date(activeSubscription.startDate);
        const now = new Date();
        const daysSinceStart = Math.floor((now.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceStart > 30) {
            periodStartDate = new Date();
            periodStartDate.setDate(periodStartDate.getDate() - 30);
        }
    }
    else {
        periodStartDate = new Date();
        periodStartDate.setDate(periodStartDate.getDate() - 30);
    }
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 30);
    const activePlan = await database_1.prisma.subscriptionPlan.findFirst({
        where: {
            tier: subscriptionTier,
            isActive: true,
            billingCycle: activeSubscription?.billingCycle || 'monthly'
        },
        orderBy: { sortOrder: 'asc' }
    });
    console.log('🔍 Simulation Limit Check:', {
        userId,
        subscriptionTier,
        activePlanFound: !!activePlan,
        planMaxSimulations: activePlan?.maxSimulations,
        billingCycle: activeSubscription?.billingCycle || 'monthly'
    });
    const getDefaultLimit = (tier) => {
        switch (tier) {
            case 'FREE': return 5;
            case 'ESSENTIAL': return 25;
            case 'PREMIUM': return 40;
            case 'PRO': return 60;
            default: return 5;
        }
    };
    let maxSimulations;
    if (activePlan?.maxSimulations !== null && activePlan?.maxSimulations !== undefined) {
        if (activePlan.maxSimulations === -1) {
            maxSimulations = Infinity;
            console.log('✅ Using admin-set UNLIMITED limit (-1)');
        }
        else {
            maxSimulations = activePlan.maxSimulations;
            console.log('✅ Using admin-set limit:', maxSimulations);
        }
    }
    else {
        maxSimulations = getDefaultLimit(subscriptionTier);
        console.log('⚠️ Plan found but maxSimulations is NULL. Using default limit for tier:', subscriptionTier, '=', maxSimulations);
    }
    const [testAttempts, voiceSimulationsWithFeedback, immigrationSimulations] = await Promise.all([
        database_1.prisma.testAttempt.count({
            where: {
                userId,
                createdAt: { gte: periodStartDate }
            }
        }),
        database_1.prisma.voiceSimulation.count({
            where: {
                userId,
                createdAt: { gte: periodStartDate },
                status: 'COMPLETED',
                aiFeedbacks: {
                    some: {}
                }
            }
        }),
        database_1.prisma.immigrationSimulation.count({
            where: {
                userId,
                createdAt: { gte: periodStartDate },
                status: 'COMPLETED'
            }
        })
    ]);
    const totalSimulationsUsed = testAttempts + voiceSimulationsWithFeedback + immigrationSimulations;
    const remaining = maxSimulations === Infinity ? Infinity : Math.max(0, maxSimulations - totalSimulationsUsed);
    const canCreate = maxSimulations === Infinity ? true : totalSimulationsUsed < maxSimulations;
    return {
        canCreate,
        remaining: remaining === Infinity ? -1 : remaining,
        maxSimulations: maxSimulations === Infinity ? -1 : maxSimulations,
        periodStartDate,
        periodEndDate,
        subscriptionTier,
        totalSimulationsUsed,
        error: !canCreate
            ? `You have reached your simulation limit. You have used ${totalSimulationsUsed} out of ${maxSimulations === Infinity ? 'unlimited' : maxSimulations} simulations for this billing period (${Math.ceil((periodEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining).`
            : undefined
    };
}
//# sourceMappingURL=simulationLimitService.js.map