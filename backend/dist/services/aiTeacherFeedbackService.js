"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITeacherFeedbackService = void 0;
const connection_1 = require("@/database/connection");
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = require("../utils/logger");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
class AITeacherFeedbackService {
    static async generateTeacherFeedback(request) {
        try {
            logger_1.logger.info(`Generating AI teacher feedback for user ${request.userId}, simulation ${request.simulationId}`);
            const analysis = await this.analyzeStudentWork(request);
            const aiFeedback = await this.generateAITeacherComments(request, analysis);
            const scores = this.calculateScoresAndConfidence(analysis);
            const feedbackResult = {
                id: '',
                overallScore: scores.totalScore,
                maxScore: scores.maxScore,
                confidence: scores.confidence,
                canGradeTo100Percent: scores.canGradeTo100Percent,
                overallFeedback: aiFeedback.overallFeedback,
                strengths: aiFeedback.strengths,
                weaknesses: aiFeedback.weaknesses,
                recommendations: aiFeedback.recommendations,
                detailedAnalysis: {
                    questionAnalysis: analysis.questionAnalysis,
                    sectionAnalysis: analysis.sectionAnalysis,
                    unclearResponses: aiFeedback.unclearResponses,
                    uniqueLanguageStyles: aiFeedback.uniqueLanguageStyles,
                    grammarErrors: aiFeedback.grammarErrors,
                    vocabularyNotes: aiFeedback.vocabularyNotes
                }
            };
            const savedFeedback = await this.saveFeedbackToDatabase(request, feedbackResult);
            feedbackResult.id = savedFeedback.id;
            logger_1.logger.info(`AI teacher feedback generated successfully: ${feedbackResult.id}`);
            return feedbackResult;
        }
        catch (error) {
            logger_1.logger.error('Error generating AI teacher feedback:', error);
            throw new Error('Failed to generate AI teacher feedback');
        }
    }
    static async analyzeStudentWork(request) {
        const questionAnalysis = [];
        const sectionScores = {};
        let totalScore = 0;
        let maxScore = 0;
        for (const question of request.questions) {
            const studentAnswer = request.answers[question.id] || '';
            const analysis = this.analyzeQuestion(question, studentAnswer);
            questionAnalysis.push(analysis);
            totalScore += analysis.points;
            maxScore += analysis.maxPoints;
            if (!sectionScores[question.section]) {
                sectionScores[question.section] = { score: 0, maxScore: 0, questions: 0 };
            }
            sectionScores[question.section].score += analysis.points;
            sectionScores[question.section].maxScore += analysis.maxPoints;
            sectionScores[question.section].questions += 1;
        }
        const sectionAnalysis = Object.entries(sectionScores).map(([section, data]) => ({
            section,
            score: data.score,
            maxScore: data.maxScore,
            feedback: this.generateSectionFeedback(section, data.score, data.maxScore, data.questions)
        }));
        return {
            questionAnalysis,
            sectionAnalysis,
            totalScore,
            maxScore,
            percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0
        };
    }
    static analyzeQuestion(question, studentAnswer) {
        const maxPoints = question.points || 1;
        let points = 0;
        let isCorrect = false;
        let teacherComments = '';
        let mistakeType = '';
        let correction = '';
        let explanation = '';
        if (!studentAnswer || studentAnswer.trim() === '') {
            teacherComments = 'Aucune réponse fournie. Il est important de répondre à toutes les questions.';
            mistakeType = 'NO_ANSWER';
        }
        else {
            switch (question.type) {
                case 'MCQ':
                case 'TRUE_FALSE':
                    isCorrect = studentAnswer === question.correctAnswer;
                    points = isCorrect ? maxPoints : 0;
                    if (isCorrect) {
                        teacherComments = 'Excellente réponse ! Vous avez bien compris la question.';
                    }
                    else {
                        teacherComments = `Réponse incorrecte. La bonne réponse était "${question.correctAnswer}".`;
                        correction = question.correctAnswer;
                        mistakeType = 'INCORRECT_CHOICE';
                    }
                    break;
                case 'FILL_IN':
                    const similarity = this.calculateStringSimilarity(studentAnswer.toLowerCase(), question.correctAnswer?.toLowerCase() || '');
                    isCorrect = similarity > 0.8;
                    points = isCorrect ? maxPoints : Math.max(0, Math.round(similarity * maxPoints));
                    if (isCorrect) {
                        teacherComments = 'Bonne réponse ! Votre compréhension est correcte.';
                    }
                    else {
                        teacherComments = `Réponse partiellement correcte. Réponse attendue : "${question.correctAnswer}".`;
                        correction = question.correctAnswer || '';
                        mistakeType = 'PARTIAL_ANSWER';
                    }
                    break;
                case 'ESSAY':
                case 'AUDIO_RESPONSE':
                    points = Math.round(maxPoints * 0.7);
                    isCorrect = false;
                    teacherComments = 'Réponse développée fournie. Cette réponse nécessite une évaluation humaine pour une notation précise.';
                    mistakeType = 'NEEDS_HUMAN_REVIEW';
                    break;
            }
        }
        return {
            questionId: question.id,
            studentAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            points,
            maxPoints,
            teacherComments,
            mistakeType,
            correction,
            explanation
        };
    }
    static calculateStringSimilarity(str1, str2) {
        if (str1 === str2)
            return 1;
        if (str1.length === 0 || str2.length === 0)
            return 0;
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    static generateSectionFeedback(section, score, maxScore, questions) {
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        if (percentage >= 90) {
            return `Excellente performance dans la section ${section}. Vous maîtrisez bien ce domaine.`;
        }
        else if (percentage >= 70) {
            return `Bonne performance dans la section ${section}. Quelques points à améliorer.`;
        }
        else if (percentage >= 50) {
            return `Performance moyenne dans la section ${section}. Il y a de la place pour l'amélioration.`;
        }
        else {
            return `Cette section ${section} nécessite plus de travail. Concentrez-vous sur la révision de ces concepts.`;
        }
    }
    static async generateAITeacherComments(request, analysis) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const studentWork = request.questions.map(q => ({
                question: q.questionText,
                studentAnswer: request.answers[q.id] || 'Pas de réponse',
                correctAnswer: q.correctAnswer,
                type: q.type
            }));
            const prompt = `
Tu es un professeur de français expérimenté et bienveillant qui évalue le travail d'un étudiant sur la plateforme AURA.CA.

CONTEXTE DE LA SIMULATION:
- Titre: ${request.simulationTitle}
- Temps passé: ${Math.round(request.timeSpent / 60)} minutes sur ${Math.round(request.totalDuration / 60)} minutes allouées
- Score obtenu: ${analysis.totalScore}/${analysis.maxScore} (${Math.round(analysis.percentage)}%)

TRAVAIL DE L'ÉTUDIANT:
${studentWork.map((work, index) => `
Question ${index + 1} (${work.type}): ${work.question}
Réponse de l'étudiant: ${work.studentAnswer}
${work.correctAnswer ? `Réponse attendue: ${work.correctAnswer}` : ''}
`).join('\n')}

EN TANT QUE PROFESSEUR, FOURNIS:

1. FEEDBACK GÉNÉRAL (2-3 phrases encourageantes mais honnêtes)

2. POINTS FORTS (3-4 éléments spécifiques observés)

3. POINTS À AMÉLIORER (3-4 éléments concrets avec suggestions)

4. RECOMMANDATIONS PÉDAGOGIQUES (3-4 conseils pratiques)

5. RÉPONSES PEU CLAIRES (identifie les réponses que tu n'as pas bien comprises)

6. STYLE LINGUISTIQUE UNIQUE (note les particularités du style de l'étudiant)

7. ERREURS DE GRAMMAIRE (liste les erreurs avec corrections et explications)

8. NOTES DE VOCABULAIRE (mots mal utilisés avec suggestions)

IMPORTANT:
- Sois bienveillant mais précis
- Donne des exemples concrets
- Propose des corrections constructives
- Mentionne les fonctionnalités uniques d'AURA.CA (sessions live, marketplace de tuteurs, simulations TCF/TEF)
- Utilise un ton professoral encourageant

Réponds en JSON avec cette structure:
{
  "overallFeedback": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "unclearResponses": ["...", "..."],
  "uniqueLanguageStyles": ["...", "..."],
  "grammarErrors": [{"error": "...", "correction": "...", "explanation": "..."}],
  "vocabularyNotes": [{"word": "...", "usage": "...", "suggestion": "..."}]
}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
            catch (parseError) {
                logger_1.logger.warn('Failed to parse AI response as JSON, using fallback');
            }
            return this.generateFallbackTeacherFeedback(analysis);
        }
        catch (error) {
            logger_1.logger.error('Error generating AI teacher comments:', error);
            return this.generateFallbackTeacherFeedback(analysis);
        }
    }
    static generateFallbackTeacherFeedback(analysis) {
        const percentage = analysis.percentage;
        return {
            overallFeedback: percentage >= 70
                ? "Bon travail ! Vous montrez une bonne compréhension du français. Continuez vos efforts pour progresser encore."
                : "Votre travail montre des bases solides, mais il y a des domaines à améliorer. Ne vous découragez pas, la pratique régulière vous aidera à progresser.",
            strengths: [
                "Vous avez tenté de répondre à la plupart des questions",
                "Votre engagement dans l'exercice est visible",
                "Certaines réponses montrent une bonne compréhension"
            ],
            weaknesses: [
                "Quelques erreurs dans les réponses objectives",
                "Certaines réponses manquent de précision",
                "Le temps de réflexion pourrait être mieux utilisé"
            ],
            recommendations: [
                "Pratiquez régulièrement avec les simulations AURA.CA",
                "Participez aux sessions live pour améliorer votre expression",
                "Consultez un tuteur sur notre marketplace pour un suivi personnalisé",
                "Révisez les points grammaticaux de base"
            ],
            unclearResponses: [],
            uniqueLanguageStyles: [],
            grammarErrors: [],
            vocabularyNotes: []
        };
    }
    static calculateScoresAndConfidence(analysis) {
        const percentage = analysis.percentage;
        let confidence = 0.85;
        let canGradeTo100Percent = true;
        const needsHumanReview = analysis.questionAnalysis.some((q) => q.mistakeType === 'NEEDS_HUMAN_REVIEW');
        if (needsHumanReview) {
            confidence = 0.75;
            canGradeTo100Percent = false;
        }
        if (percentage >= 90) {
            confidence = Math.min(0.95, confidence + 0.05);
        }
        else if (percentage >= 70) {
            confidence = Math.min(0.90, confidence);
        }
        else {
            confidence = Math.max(0.70, confidence - 0.05);
        }
        return {
            totalScore: analysis.totalScore,
            maxScore: analysis.maxScore,
            confidence,
            canGradeTo100Percent
        };
    }
    static async saveFeedbackToDatabase(request, feedback) {
        try {
            const savedFeedback = await connection_1.prisma.aIFeedback.create({
                data: {
                    userId: request.userId,
                    simulationResultId: null,
                    submissionType: 'SIMULATION_COMPLETION',
                    submissionContent: JSON.stringify({
                        simulationTitle: request.simulationTitle,
                        answers: request.answers,
                        timeSpent: request.timeSpent
                    }),
                    aiScore: feedback.overallScore,
                    maxScore: feedback.maxScore,
                    aiConfidence: feedback.confidence,
                    overallFeedback: feedback.overallFeedback,
                    strengths: feedback.strengths,
                    weaknesses: feedback.weaknesses,
                    recommendations: feedback.recommendations,
                    detailedAnalysis: feedback.detailedAnalysis,
                    status: feedback.canGradeTo100Percent ? 'AI_COMPLETED' : 'PENDING_HUMAN'
                }
            });
            return savedFeedback;
        }
        catch (error) {
            logger_1.logger.error('Error saving feedback to database:', error);
            throw new Error('Failed to save feedback to database');
        }
    }
    static async getTeacherFeedbackById(feedbackId, userId) {
        try {
            const feedback = await connection_1.prisma.aIFeedback.findFirst({
                where: {
                    id: feedbackId,
                    userId: userId
                }
            });
            return feedback;
        }
        catch (error) {
            logger_1.logger.error('Error fetching teacher feedback:', error);
            throw new Error('Failed to fetch teacher feedback');
        }
    }
    static async getTeacherFeedbacksForUser(userId) {
        try {
            const feedbacks = await connection_1.prisma.aIFeedback.findMany({
                where: {
                    userId: userId,
                    submissionType: 'SIMULATION_COMPLETION'
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return feedbacks;
        }
        catch (error) {
            logger_1.logger.error('Error fetching teacher feedbacks:', error);
            throw new Error('Failed to fetch teacher feedbacks');
        }
    }
}
exports.AITeacherFeedbackService = AITeacherFeedbackService;
//# sourceMappingURL=aiTeacherFeedbackService.js.map