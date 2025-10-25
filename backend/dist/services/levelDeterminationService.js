"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelDeterminationService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class LevelDeterminationService {
    static async determineStudentLevel(userId) {
        try {
            const testAttempts = await connection_1.prisma.testAttempt.findMany({
                where: {
                    userId,
                    status: 'COMPLETED'
                },
                select: {
                    id: true,
                    userId: true,
                    testId: true,
                    score: true,
                    status: true,
                    completedAt: true,
                    answers: true,
                    test: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            level: true,
                            category: true
                        }
                    }
                },
                orderBy: {
                    completedAt: 'desc'
                },
                take: 10
            });
            if (testAttempts.length === 0) {
                return this.getDefaultAssessment();
            }
            const weightedScores = this.calculateWeightedScores(testAttempts);
            const skillAnalysis = this.analyzeSkillPerformance(testAttempts);
            const currentLevel = this.calculateLevel(weightedScores.overall);
            const subLevel = this.calculateSubLevel(weightedScores.overall, skillAnalysis);
            const confidence = this.calculateConfidence(testAttempts, currentLevel);
            const assessment = this.generateAssessment(currentLevel, subLevel, confidence, skillAnalysis, weightedScores);
            await this.storeAssessment(userId, assessment);
            return assessment;
        }
        catch (error) {
            logger_1.logger.error('Error determining student level:', error);
            return this.getDefaultAssessment();
        }
    }
    static calculateWeightedScores(testAttempts) {
        let totalWeight = 0;
        let weightedSum = 0;
        const skillScores = {};
        const levelScores = {};
        testAttempts.forEach((attempt, index) => {
            const recencyWeight = Math.exp(-index * 0.1);
            const levelWeight = this.getLevelWeight(attempt.test?.level || 'A1');
            const weight = recencyWeight * levelWeight;
            const score = attempt.score || 0;
            totalWeight += weight;
            weightedSum += score * weight;
            const skill = attempt.test?.category || 'general';
            if (!skillScores[skill]) {
                skillScores[skill] = { sum: 0, weight: 0 };
            }
            skillScores[skill].sum += score * weight;
            skillScores[skill].weight += weight;
            const level = attempt.test?.level || 'A1';
            if (!levelScores[level]) {
                levelScores[level] = { sum: 0, weight: 0 };
            }
            levelScores[level].sum += score * weight;
            levelScores[level].weight += weight;
        });
        const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const bySkill = {};
        Object.keys(skillScores).forEach(skill => {
            bySkill[skill] = skillScores[skill].weight > 0
                ? skillScores[skill].sum / skillScores[skill].weight
                : 0;
        });
        const byLevel = {};
        Object.keys(levelScores).forEach(level => {
            byLevel[level] = levelScores[level].weight > 0
                ? levelScores[level].sum / levelScores[level].weight
                : 0;
        });
        return { overall, bySkill, byLevel };
    }
    static analyzeSkillPerformance(testAttempts) {
        const skills = ['grammar', 'vocabulary', 'listening', 'reading', 'writing', 'speaking'];
        const skillAnalysis = {};
        skills.forEach(skill => {
            const skillAttempts = testAttempts.filter(attempt => attempt.test?.category?.toLowerCase().includes(skill) ||
                attempt.answers?.some((answer) => answer.question?.category?.toLowerCase().includes(skill)));
            if (skillAttempts.length > 0) {
                const scores = skillAttempts.map(attempt => attempt.score || 0);
                const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
                const consistency = Math.max(0, 100 - Math.sqrt(variance));
                skillAnalysis[skill] = {
                    score: avgScore,
                    level: this.calculateLevel(avgScore),
                    consistency
                };
            }
            else {
                skillAnalysis[skill] = {
                    score: 0,
                    level: 'A1',
                    consistency: 0
                };
            }
        });
        return skillAnalysis;
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
    static calculateSubLevel(percentage, skillAnalysis) {
        const level = this.calculateLevel(percentage);
        const levelRanges = {
            'A1': [0, 50],
            'A2': [50, 60],
            'B1': [60, 70],
            'B2': [70, 80],
            'C1': [80, 90],
            'C2': [90, 100]
        };
        const [min, max] = levelRanges[level];
        const midpoint = (min + max) / 2;
        return percentage >= midpoint ? 2 : 1;
    }
    static calculateConfidence(testAttempts, currentLevel) {
        if (testAttempts.length < 2)
            return 50;
        const scores = testAttempts.map(attempt => attempt.score || 0);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);
        const confidence = Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
        return Math.round(confidence);
    }
    static generateAssessment(currentLevel, subLevel, confidence, skillAnalysis, weightedScores) {
        const strengths = [];
        const weaknesses = [];
        const recommendations = [];
        Object.keys(skillAnalysis).forEach(skill => {
            const skillData = skillAnalysis[skill];
            if (skillData.score >= 70) {
                strengths.push(`Excellent ${skill} skills`);
            }
            else if (skillData.score < 50) {
                weaknesses.push(`${skill} needs improvement`);
                recommendations.push(`Focus on ${skill} exercises and practice`);
            }
        });
        const levelRecommendations = this.getLevelRecommendations(currentLevel, subLevel);
        recommendations.push(...levelRecommendations);
        const nextLevelRequirements = this.getNextLevelRequirements(currentLevel);
        const estimatedTime = this.estimateTimeToNextLevel(currentLevel, weightedScores.overall, confidence);
        return {
            currentLevel: `${currentLevel}.${subLevel}`,
            subLevel,
            confidence,
            strengths,
            weaknesses,
            recommendations,
            nextLevelRequirements,
            estimatedTimeToNextLevel: estimatedTime
        };
    }
    static getLevelRecommendations(level, subLevel) {
        const recommendations = {
            'A1': [
                'Master basic greetings and introductions',
                'Learn numbers, days, and months',
                'Practice present tense of common verbs',
                'Build basic vocabulary for daily activities'
            ],
            'A2': [
                'Study past tense (passé composé)',
                'Learn future tense (futur proche)',
                'Practice describing past experiences',
                'Expand vocabulary for travel and shopping'
            ],
            'B1': [
                'Master subjunctive mood',
                'Practice expressing opinions and preferences',
                'Learn complex sentence structures',
                'Develop argumentation skills'
            ],
            'B2': [
                'Refine argumentation and debate skills',
                'Study formal and informal registers',
                'Practice complex text analysis',
                'Master advanced grammar structures'
            ],
            'C1': [
                'Perfect nuanced expression',
                'Master idiomatic expressions',
                'Develop academic writing skills',
                'Practice sophisticated discourse'
            ],
            'C2': [
                'Achieve native-like fluency',
                'Master literary and cultural references',
                'Perfect all language registers',
                'Develop expertise in specialized domains'
            ]
        };
        return recommendations[level] || recommendations['A1'];
    }
    static getNextLevelRequirements(currentLevel) {
        const nextLevel = this.getNextLevel(currentLevel);
        const requirements = {
            'A2': ['Score 60%+ consistently', 'Master basic grammar', 'Vocabulary: 1000+ words'],
            'B1': ['Score 70%+ consistently', 'Use complex sentences', 'Vocabulary: 2000+ words'],
            'B2': ['Score 80%+ consistently', 'Express abstract ideas', 'Vocabulary: 4000+ words'],
            'C1': ['Score 85%+ consistently', 'Master all registers', 'Vocabulary: 8000+ words'],
            'C2': ['Score 90%+ consistently', 'Native-like proficiency', 'Vocabulary: 16000+ words']
        };
        return requirements[nextLevel] || ['Continue practicing'];
    }
    static estimateTimeToNextLevel(currentLevel, currentScore, confidence) {
        const nextLevelThreshold = this.getNextLevelThreshold(currentLevel);
        const gap = nextLevelThreshold - currentScore;
        if (gap <= 0)
            return '0-1 months';
        const baseTime = gap / 10;
        const confidenceMultiplier = confidence < 70 ? 1.5 : 1.0;
        const estimatedMonths = Math.ceil(baseTime * confidenceMultiplier);
        if (estimatedMonths <= 1)
            return '0-1 months';
        if (estimatedMonths <= 3)
            return '1-3 months';
        if (estimatedMonths <= 6)
            return '3-6 months';
        if (estimatedMonths <= 12)
            return '6-12 months';
        return '12+ months';
    }
    static getLevelWeight(level) {
        const weights = { 'A1': 1, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.0, 'C2': 2.2 };
        return weights[level] || 1;
    }
    static getNextLevel(currentLevel) {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2';
    }
    static getNextLevelThreshold(currentLevel) {
        const thresholds = { 'A1': 50, 'A2': 60, 'B1': 70, 'B2': 80, 'C1': 90, 'C2': 95 };
        return thresholds[this.getNextLevel(currentLevel)] || 100;
    }
    static getDefaultAssessment() {
        return {
            currentLevel: 'A1.1',
            subLevel: 1,
            confidence: 50,
            strengths: [],
            weaknesses: ['No test data available'],
            recommendations: ['Take a placement test to assess your level'],
            nextLevelRequirements: ['Complete basic French assessment'],
            estimatedTimeToNextLevel: 'Unknown'
        };
    }
    static async storeAssessment(userId, assessment) {
        try {
            logger_1.logger.info('Level assessment stored successfully', { userId, level: assessment.currentLevel });
        }
        catch (error) {
            logger_1.logger.error('Error storing level assessment:', error);
        }
    }
}
exports.LevelDeterminationService = LevelDeterminationService;
//# sourceMappingURL=levelDeterminationService.js.map