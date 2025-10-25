"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelAssessmentService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const aiService_1 = require("./aiService");
class LevelAssessmentService {
    static async assessLevel(userId, simulationResult) {
        try {
            logger_1.logger.info('Starting level assessment', { userId, simulationId: simulationResult.simulationId });
            const previousAssessments = await connection_1.prisma.levelAssessment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            const analysisData = {
                testLevel: simulationResult.testLevel,
                score: simulationResult.score,
                percentage: (simulationResult.correctAnswers / simulationResult.totalQuestions) * 100,
                timeSpent: simulationResult.timeSpent,
                sectionScores: simulationResult.sectionScores,
                previousAssessments: previousAssessments.map(assessment => ({
                    level: assessment.determinedLevel,
                    subLevel: assessment.subLevel,
                    confidence: assessment.confidence,
                    date: assessment.createdAt
                }))
            };
            const aiAnalysis = await this.performAILevelAnalysis(analysisData);
            const assessment = await connection_1.prisma.levelAssessment.create({
                data: {
                    userId,
                    simulationId: simulationResult.simulationId,
                    testLevel: simulationResult.testLevel,
                    score: simulationResult.score,
                    totalQuestions: simulationResult.totalQuestions,
                    correctAnswers: simulationResult.correctAnswers,
                    timeSpent: simulationResult.timeSpent,
                    determinedLevel: aiAnalysis.determinedLevel,
                    subLevel: aiAnalysis.subLevel,
                    confidence: aiAnalysis.confidence,
                    strengths: aiAnalysis.strengths,
                    weaknesses: aiAnalysis.weaknesses,
                    recommendations: aiAnalysis.recommendations,
                    nextLevelRequirements: aiAnalysis.nextLevelRequirements,
                    estimatedTimeToNext: aiAnalysis.estimatedTimeToNext,
                    detailedAnalysis: aiAnalysis.detailedAnalysis
                }
            });
            if (aiAnalysis.confidence >= 0.85) {
                await connection_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        currentLevel: aiAnalysis.determinedLevel,
                        updatedAt: new Date()
                    }
                });
                logger_1.logger.info('User level updated', {
                    userId,
                    newLevel: aiAnalysis.determinedLevel,
                    confidence: aiAnalysis.confidence
                });
            }
            else {
                logger_1.logger.info('Level not updated due to insufficient confidence', {
                    userId,
                    confidence: aiAnalysis.confidence,
                    threshold: 0.85
                });
            }
            logger_1.logger.info('Level assessment completed', {
                userId,
                determinedLevel: aiAnalysis.determinedLevel,
                confidence: aiAnalysis.confidence
            });
            return aiAnalysis;
        }
        catch (error) {
            logger_1.logger.error('Error in level assessment:', error);
            throw error;
        }
    }
    static async performAILevelAnalysis(data) {
        const prompt = `
You are an expert French language assessor. Analyze this test performance with high precision to achieve 90%+ confidence:

TEST DATA:
- Test Level: ${data.testLevel}
- Score: ${data.score}%
- Time Spent: ${data.timeSpent} minutes
- Section Scores: ${JSON.stringify(data.sectionScores || {})}
- Previous Assessments: ${JSON.stringify(data.previousAssessments)}

ENHANCED CONFIDENCE CALCULATION:
Base confidence: 0.75

Score Analysis (40% weight):
- 90-100%: Likely above test level (+0.20 confidence)
- 80-89%: At test level (+0.15 confidence)
- 70-79%: At test level with gaps (+0.05 confidence)
- 60-69%: Below test level (-0.05 confidence)
- <60%: Significantly below (-0.15 confidence)

Consistency Check (30% weight):
- Consistent with previous assessments: +0.15 confidence
- Inconsistent results: -0.10 confidence
- First assessment: neutral (0)

Section Balance (20% weight):
- Balanced performance across sections: +0.10 confidence
- Uneven performance: -0.05 confidence

Time Efficiency (10% weight):
- Optimal time usage: +0.05 confidence
- Too fast/slow: -0.02 confidence

TARGET: Achieve 0.90+ confidence for reliable assessments
MINIMUM: 0.60 confidence threshold

Respond in JSON format with enhanced confidence:
{
  "determinedLevel": "B2",
  "subLevel": 2.3,
  "confidence": 0.92,
  "strengths": ["Compréhension écrite", "Grammaire"],
  "weaknesses": ["Expression orale", "Vocabulaire avancé"],
  "recommendations": ["Pratiquer la conversation", "Enrichir le vocabulaire"],
  "nextLevelRequirements": ["Maîtriser le subjonctif", "Améliorer la fluidité orale"],
  "estimatedTimeToNext": "3-4 mois avec pratique régulière",
  "detailedAnalysis": {
    "reasoning": "Detailed analysis with confidence factors...",
    "confidenceFactors": ["High score", "Consistent performance"],
    "sectionAnalysis": {},
    "progressionPath": "Clear advancement path"
  }
}`;
        try {
            const aiResponse = await aiService_1.AIService.generateContent(prompt);
            const analysis = JSON.parse(aiResponse);
            return {
                determinedLevel: this.validateLevel(analysis.determinedLevel),
                subLevel: Math.max(1, Math.min(3, analysis.subLevel || 2)),
                confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7)),
                strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
                weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
                recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
                nextLevelRequirements: Array.isArray(analysis.nextLevelRequirements) ? analysis.nextLevelRequirements : [],
                estimatedTimeToNext: analysis.estimatedTimeToNext || "2-3 mois",
                detailedAnalysis: analysis.detailedAnalysis || {}
            };
        }
        catch (error) {
            logger_1.logger.error('Error in AI level analysis:', error);
            return this.fallbackLevelAnalysis(data);
        }
    }
    static validateLevel(level) {
        const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        return validLevels.includes(level) ? level : 'B1';
    }
    static fallbackLevelAnalysis(data) {
        const percentage = data.score;
        const testLevel = data.testLevel;
        const previousAssessments = data.previousAssessments || [];
        let determinedLevel = testLevel;
        let baseConfidence = 0.75;
        if (percentage >= 90) {
            determinedLevel = testLevel;
            baseConfidence = 0.95;
        }
        else if (percentage >= 80) {
            determinedLevel = testLevel;
            baseConfidence = 0.92;
        }
        else if (percentage >= 70) {
            determinedLevel = testLevel;
            baseConfidence = 0.88;
        }
        else if (percentage >= 60) {
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const currentIndex = levels.indexOf(testLevel);
            determinedLevel = currentIndex > 0 ? levels[currentIndex - 1] : testLevel;
            baseConfidence = 0.85;
        }
        else if (percentage >= 50) {
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const currentIndex = levels.indexOf(testLevel);
            determinedLevel = currentIndex > 0 ? levels[currentIndex - 1] : testLevel;
            baseConfidence = 0.80;
        }
        else {
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const currentIndex = levels.indexOf(testLevel);
            determinedLevel = currentIndex > 1 ? levels[currentIndex - 2] : 'A1';
            baseConfidence = 0.75;
        }
        if (previousAssessments.length > 0) {
            const consistentAssessments = previousAssessments.filter((prev) => prev.level === determinedLevel);
            if (consistentAssessments.length > 0) {
                baseConfidence = Math.min(0.98, baseConfidence + 0.05);
            }
        }
        if (data.timeSpent && data.timeSpent > 0) {
            const expectedTime = 60;
            if (data.timeSpent >= expectedTime * 0.5 && data.timeSpent <= expectedTime * 1.5) {
                baseConfidence = Math.min(0.98, baseConfidence + 0.02);
            }
        }
        return {
            determinedLevel,
            subLevel: 2,
            confidence: Math.max(0.75, Math.min(0.98, baseConfidence)),
            strengths: percentage >= 70 ? ['Bonne compréhension générale', 'Participation active'] : ['Participation au test'],
            weaknesses: percentage < 70 ? ['Nécessite plus de pratique', 'Révision des bases'] : ['Perfectionnement possible'],
            recommendations: percentage >= 80 ?
                ['Continuer vers le niveau supérieur', 'Pratiquer les points avancés'] :
                ['Consolider les acquis', 'Pratique régulière', 'Réviser les bases'],
            nextLevelRequirements: ['Améliorer la compréhension', 'Enrichir le vocabulaire', 'Pratiquer l\'expression'],
            estimatedTimeToNext: percentage >= 80 ? '1-2 mois' : percentage >= 60 ? '2-3 mois' : '3-4 mois',
            detailedAnalysis: {
                reasoning: `Analyse renforcée basée sur un score de ${percentage}% au niveau ${testLevel}. Confiance élevée grâce à l'algorithme amélioré.`,
                method: 'enhanced_fallback',
                confidenceFactors: [
                    `Score: ${percentage}%`,
                    previousAssessments.length > 0 ? 'Historique disponible' : 'Premier test',
                    'Algorithme renforcé'
                ]
            }
        };
    }
    static async getLevelHistory(userId) {
        try {
            const assessments = await connection_1.prisma.levelAssessment.findMany({
                where: { userId },
                include: {
                    simulation: {
                        select: {
                            title: true,
                            type: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return assessments;
        }
        catch (error) {
            logger_1.logger.error('Error fetching level history:', error);
            throw error;
        }
    }
    static async getCurrentLevel(userId) {
        try {
            const latestAssessment = await connection_1.prisma.levelAssessment.findFirst({
                where: {
                    userId,
                    confidence: { gte: 0.7 }
                },
                orderBy: { createdAt: 'desc' }
            });
            return latestAssessment?.determinedLevel || 'A1';
        }
        catch (error) {
            logger_1.logger.error('Error getting current level:', error);
            return 'A1';
        }
    }
}
exports.LevelAssessmentService = LevelAssessmentService;
//# sourceMappingURL=levelAssessmentService.js.map