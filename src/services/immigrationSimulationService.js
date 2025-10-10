const { PrismaClient } = require('@prisma/client');
const geminiApiManager = require('../utils/geminiApiManager');
const { logger } = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

const prisma = new PrismaClient();

class ImmigrationSimulationService {
  /**
   * Available immigration scenarios
   */
  static getAvailableScenarios() {
    return {
      'canada': {
        name: 'Canada',
        types: {
          'skilled_worker': {
            name: 'Travailleur qualifié',
            description: 'Programme des travailleurs qualifiés du Québec',
            duration: 45,
            questions: 15
          },
          'student': {
            name: 'Étudiant international',
            description: 'Demande de permis d\'études',
            duration: 30,
            questions: 12
          },
          'family_reunification': {
            name: 'Réunification familiale',
            description: 'Parrainage de membre de famille',
            duration: 35,
            questions: 10
          }
        }
      },
      'france': {
        name: 'France',
        types: {
          'work_permit': {
            name: 'Permis de travail',
            description: 'Demande d\'autorisation de travail',
            duration: 40,
            questions: 14
          },
          'student': {
            name: 'Visa étudiant',
            description: 'Demande de visa long séjour étudiant',
            duration: 30,
            questions: 12
          },
          'family': {
            name: 'Regroupement familial',
            description: 'Procédure de regroupement familial',
            duration: 35,
            questions: 11
          }
        }
      },
      'belgium': {
        name: 'Belgique',
        types: {
          'work': {
            name: 'Permis de travail',
            description: 'Demande de permis de travail',
            duration: 35,
            questions: 13
          },
          'student': {
            name: 'Visa étudiant',
            description: 'Demande de visa étudiant',
            duration: 25,
            questions: 10
          }
        }
      }
    };
  }

  /**
   * Create immigration simulation session
   */
  static async createImmigrationSession(userId, sessionData) {
    try {
      const { country, immigrationType, level, personalInfo, voicePreference } = sessionData;

      // Check if user has Pro subscription (immigration is Pro-only)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
      });

      if (!user || user.subscriptionTier !== 'PRO') {
        throw new ValidationError('Les simulations d\'immigration sont réservées aux abonnés Pro');
      }

      // Check if user has reached monthly limit (2 simulations per month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await prisma.immigrationSimulation.count({
        where: {
          userId,
          createdAt: {
            gte: currentMonth
          }
        }
      });

      if (monthlyCount >= 2) {
        throw new ValidationError('Vous avez atteint la limite mensuelle de 2 simulations d\'immigration');
      }

      const scenarios = this.getAvailableScenarios();
      if (!scenarios[country] || !scenarios[country].types[immigrationType]) {
        throw new ValidationError('Invalid country or immigration type');
      }

      const scenario = scenarios[country].types[immigrationType];
      
      // Generate interview questions using Gemini AI
      const questions = await this.generateInterviewQuestions(country, immigrationType, level, personalInfo);

      // Create session in database
      const session = await prisma.immigrationSimulation.create({
        data: {
          userId,
          country,
          immigrationType,
          level,
          status: 'CREATED',
          personalInfo: JSON.stringify(personalInfo || {}),
          questions: JSON.stringify(questions),
          responses: JSON.stringify({}),
          currentQuestionIndex: 0,
          duration: scenario.duration,
          voicePreference: voicePreference || 'france_female_1',
          createdAt: new Date()
        }
      });

      logger.info('Immigration simulation session created', {
        sessionId: session.id,
        userId,
        country,
        immigrationType,
        questionCount: questions.length
      });

      return {
        id: session.id,
        country,
        immigrationType,
        scenario: scenario.name,
        description: scenario.description,
        status: 'CREATED',
        duration: scenario.duration,
        totalQuestions: questions.length,
        welcomeMessage: this.generateWelcomeMessage(country, immigrationType, level)
      };
    } catch (error) {
      logger.error('Failed to create immigration session', { userId, sessionData, error });
      throw error;
    }
  }

  /**
   * Generate interview questions using Gemini AI
   */
  static async generateInterviewQuestions(country, immigrationType, level, personalInfo) {
    try {
      const response = await geminiApiManager.makeRequest(async (model) => {
        const prompt = `
        Génère des questions d'entretien d'immigration pour:
        - Pays: ${country}
        - Type: ${immigrationType}
        - Niveau français: ${level}
        - Informations personnelles: ${JSON.stringify(personalInfo || {})}

        Crée 12-15 questions progressives d'entretien d'immigration réalistes.
        Les questions doivent être posées par un agent d'immigration.

        Format JSON:
        {
          "questions": [
            {
              "id": "q1",
              "category": "personal_info",
              "question": "Bonjour, pouvez-vous vous présenter et me dire votre nom complet?",
              "expectedElements": ["nom", "prénom", "politesse"],
              "difficulty": "easy",
              "points": 5,
              "followUpQuestions": ["Quelle est votre date de naissance?"]
            },
            {
              "id": "q2", 
              "category": "motivation",
              "question": "Pourquoi souhaitez-vous immigrer au ${country}?",
              "expectedElements": ["motivation claire", "projets", "connaissance du pays"],
              "difficulty": "medium",
              "points": 10,
              "followUpQuestions": ["Avez-vous déjà visité le ${country}?"]
            }
          ]
        }

        Catégories de questions:
        - personal_info: Informations personnelles
        - motivation: Motivations et projets
        - professional: Expérience professionnelle
        - language: Compétences linguistiques
        - integration: Intégration et adaptation
        - legal: Aspects légaux et administratifs

        Difficulté progressive: easy → medium → hard
        Questions authentiques d'entretien d'immigration.
        Adapte le vocabulaire au niveau ${level}.

        Réponds UNIQUEMENT avec le JSON valide.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Gemini response');
        }

        const questionsData = JSON.parse(jsonMatch[0]);
        
        if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
          throw new Error('Invalid questions format from Gemini');
        }

        return questionsData.questions;
      });

      return response || this.getDefaultQuestions(country, immigrationType);
    } catch (error) {
      logger.error('Failed to generate immigration questions', { country, immigrationType, error });
      return this.getDefaultQuestions(country, immigrationType);
    }
  }

  /**
   * Start immigration interview session
   */
  static async startSession(sessionId, userId) {
    try {
      const session = await prisma.immigrationSimulation.findFirst({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new NotFoundError('Immigration session not found');
      }

      if (session.status !== 'CREATED') {
        throw new ValidationError('Session has already been started');
      }

      const updatedSession = await prisma.immigrationSimulation.update({
        where: { id: sessionId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });

      const questions = JSON.parse(session.questions);
      
      logger.info('Immigration interview started', { sessionId, userId });

      return {
        id: updatedSession.id,
        status: 'IN_PROGRESS',
        currentQuestion: questions[0],
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        timeRemaining: session.duration * 60 // Convert to seconds
      };
    } catch (error) {
      logger.error('Failed to start immigration session', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Process user response and generate AI follow-up
   */
  static async processResponse(sessionId, userId, responseData) {
    try {
      const { questionId, response, timeSpent } = responseData;

      const session = await prisma.immigrationSimulation.findFirst({
        where: { id: sessionId, userId, status: 'IN_PROGRESS' }
      });

      if (!session) {
        throw new NotFoundError('Active immigration session not found');
      }

      const questions = JSON.parse(session.questions);
      const responses = JSON.parse(session.responses);
      
      const currentQuestion = questions.find(q => q.id === questionId);
      if (!currentQuestion) {
        throw new NotFoundError('Question not found');
      }

      // Analyze response using Gemini AI
      const analysis = await this.analyzeResponse(currentQuestion, response, session.level);

      // Store response
      responses[questionId] = {
        response,
        timeSpent,
        submittedAt: new Date(),
        analysis
      };

      // Determine next question or follow-up
      const nextAction = await this.determineNextAction(
        currentQuestion, 
        response, 
        analysis, 
        questions, 
        session.currentQuestionIndex
      );

      // Update session
      await prisma.immigrationSimulation.update({
        where: { id: sessionId },
        data: {
          responses: JSON.stringify(responses),
          currentQuestionIndex: nextAction.nextIndex,
          timeRemaining: Math.max(0, session.timeRemaining - timeSpent)
        }
      });

      logger.info('Immigration response processed', {
        sessionId,
        userId,
        questionId,
        score: analysis.score
      });

      return {
        analysis,
        feedback: nextAction.feedback,
        nextQuestion: nextAction.nextQuestion,
        isFollowUp: nextAction.isFollowUp,
        progress: {
          current: nextAction.nextIndex,
          total: questions.length,
          percentage: Math.round((nextAction.nextIndex / questions.length) * 100)
        }
      };
    } catch (error) {
      logger.error('Failed to process immigration response', { sessionId, userId, responseData, error });
      throw error;
    }
  }

  /**
   * Analyze user response using Gemini AI
   */
  static async analyzeResponse(question, userResponse, level) {
    try {
      const response = await geminiApiManager.makeRequest(async (model) => {
        const prompt = `
        Analyse cette réponse d'entretien d'immigration comme un agent d'immigration expérimenté.

        QUESTION: "${question.question}"
        ÉLÉMENTS ATTENDUS: ${JSON.stringify(question.expectedElements)}
        RÉPONSE DE L'UTILISATEUR: "${userResponse}"
        NIVEAU FRANÇAIS: ${level}

        Évalue la réponse selon ces critères:
        1. Pertinence (répond à la question)
        2. Complétude (éléments attendus présents)
        3. Clarté et cohérence
        4. Niveau de français
        5. Crédibilité

        Format JSON:
        {
          "score": 85,
          "maxScore": 100,
          "criteria": {
            "relevance": {"score": 90, "comment": "Répond bien à la question"},
            "completeness": {"score": 80, "comment": "Manque quelques détails"},
            "clarity": {"score": 85, "comment": "Expression claire"},
            "language": {"score": 80, "comment": "Bon niveau de français"},
            "credibility": {"score": 90, "comment": "Réponse crédible"}
          },
          "strengths": ["Réponse structurée", "Motivation claire"],
          "improvements": ["Ajouter plus de détails", "Préciser les dates"],
          "followUpNeeded": true,
          "suggestedFollowUp": "Pouvez-vous me donner plus de détails sur..."
        }

        Sois professionnel mais bienveillant dans l'évaluation.
        Réponds UNIQUEMENT avec le JSON valide.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Gemini response');
        }

        return JSON.parse(jsonMatch[0]);
      });

      return response || this.getDefaultAnalysis();
    } catch (error) {
      logger.error('Failed to analyze immigration response', { question, userResponse, error });
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Determine next action (follow-up or next question)
   */
  static async determineNextAction(currentQuestion, userResponse, analysis, questions, currentIndex) {
    // If follow-up is needed and suggested
    if (analysis.followUpNeeded && analysis.suggestedFollowUp) {
      return {
        nextIndex: currentIndex, // Stay on same question
        isFollowUp: true,
        nextQuestion: {
          id: `${currentQuestion.id}_followup`,
          question: analysis.suggestedFollowUp,
          category: currentQuestion.category,
          isFollowUp: true
        },
        feedback: `Score: ${analysis.score}/${analysis.maxScore}. ${analysis.improvements.join(' ')}`
      };
    }

    // Move to next question
    const nextIndex = currentIndex + 1;
    const nextQuestion = nextIndex < questions.length ? questions[nextIndex] : null;

    return {
      nextIndex,
      isFollowUp: false,
      nextQuestion,
      feedback: `Score: ${analysis.score}/${analysis.maxScore}. ${analysis.strengths.join(' ')}`
    };
  }

  /**
   * Complete immigration interview and generate final report
   */
  static async completeSession(sessionId, userId) {
    try {
      const session = await prisma.immigrationSimulation.findFirst({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new NotFoundError('Immigration session not found');
      }

      const questions = JSON.parse(session.questions);
      const responses = JSON.parse(session.responses);

      // Calculate final results
      const results = this.calculateFinalResults(questions, responses);

      // Generate immigration report
      const report = await this.generateImmigrationReport(session, results);

      // Update session
      await prisma.immigrationSimulation.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          finalScore: results.totalScore,
          finalReport: JSON.stringify(report)
        }
      });

      logger.info('Immigration simulation completed', {
        sessionId,
        userId,
        finalScore: results.totalScore,
        recommendation: report.recommendation
      });

      return {
        ...results,
        report,
        sessionSummary: {
          duration: Math.round((new Date() - new Date(session.startedAt)) / 1000 / 60),
          questionsAnswered: Object.keys(responses).length,
          country: session.country,
          immigrationType: session.immigrationType
        }
      };
    } catch (error) {
      logger.error('Failed to complete immigration session', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Get immigration session details
   */
  static async getSession(sessionId, userId) {
    try {
      const session = await prisma.immigrationSimulation.findFirst({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new NotFoundError('Immigration session not found');
      }

      return session;
    } catch (error) {
      logger.error('Failed to get immigration session', { sessionId, userId, error });
      throw error;
    }
  }

  /**
   * Helper methods
   */
  static calculateFinalResults(questions, responses) {
    let totalScore = 0;
    let maxScore = 0;
    const categoryResults = {};

    questions.forEach(question => {
      maxScore += question.points;
      
      if (!categoryResults[question.category]) {
        categoryResults[question.category] = {
          score: 0,
          maxScore: 0,
          questions: 0
        };
      }

      categoryResults[question.category].maxScore += question.points;
      categoryResults[question.category].questions += 1;

      const response = responses[question.id];
      if (response && response.analysis) {
        const score = (response.analysis.score / 100) * question.points;
        totalScore += score;
        categoryResults[question.category].score += score;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      totalScore: Math.round(totalScore),
      maxScore,
      percentage,
      categoryResults,
      recommendation: this.getRecommendation(percentage)
    };
  }

  static getRecommendation(percentage) {
    if (percentage >= 85) return 'EXCELLENT';
    if (percentage >= 70) return 'GOOD';
    if (percentage >= 55) return 'SATISFACTORY';
    return 'NEEDS_IMPROVEMENT';
  }

  static async generateImmigrationReport(session, results) {
    // This would generate a detailed immigration report
    // For now, return a structured report
    return {
      recommendation: results.recommendation,
      strengths: ['Communication claire', 'Motivation évidente'],
      improvements: ['Améliorer les détails techniques', 'Préparer plus de documents'],
      nextSteps: ['Préparer les documents requis', 'Améliorer le niveau de français'],
      likelihood: results.percentage >= 70 ? 'HIGH' : results.percentage >= 55 ? 'MEDIUM' : 'LOW'
    };
  }

  static generateWelcomeMessage(country, immigrationType, level) {
    const messages = {
      'canada': {
        'skilled_worker': 'Bonjour et bienvenue à cet entretien pour le Programme des travailleurs qualifiés du Québec. Je vais vous poser quelques questions sur votre profil et vos motivations.',
        'student': 'Bonjour, nous allons procéder à l\'entretien pour votre demande de permis d\'études au Canada.',
        'family_reunification': 'Bonjour, cet entretien concerne votre demande de parrainage familial.'
      },
      'france': {
        'work_permit': 'Bonjour, nous allons examiner votre demande d\'autorisation de travail en France.',
        'student': 'Bonjour, cet entretien concerne votre demande de visa étudiant pour la France.',
        'family': 'Bonjour, nous allons discuter de votre demande de regroupement familial.'
      }
    };

    return messages[country]?.[immigrationType] || 'Bonjour et bienvenue à cet entretien d\'immigration.';
  }

  static getDefaultQuestions(country, immigrationType) {
    return [
      {
        id: 'default_q1',
        category: 'personal_info',
        question: 'Bonjour, pouvez-vous vous présenter et me dire votre nom complet?',
        expectedElements: ['nom', 'prénom', 'politesse'],
        difficulty: 'easy',
        points: 5
      },
      {
        id: 'default_q2',
        category: 'motivation',
        question: `Pourquoi souhaitez-vous immigrer au ${country}?`,
        expectedElements: ['motivation', 'projets', 'connaissance du pays'],
        difficulty: 'medium',
        points: 10
      }
    ];
  }

  static getDefaultAnalysis() {
    return {
      score: 75,
      maxScore: 100,
      criteria: {
        relevance: { score: 75, comment: 'Réponse pertinente' },
        completeness: { score: 70, comment: 'Réponse acceptable' },
        clarity: { score: 80, comment: 'Expression claire' },
        language: { score: 75, comment: 'Niveau de français correct' },
        credibility: { score: 75, comment: 'Réponse crédible' }
      },
      strengths: ['Réponse structurée'],
      improvements: ['Ajouter plus de détails'],
      followUpNeeded: false
    };
  }

  /**
   * Get monthly immigration simulation count for user
   */
  static async getMonthlySimulationCount(userId) {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      return await prisma.immigrationSimulation.count({
        where: {
          userId,
          createdAt: {
            gte: currentMonth
          }
        }
      });
    } catch (error) {
      console.error('Error getting monthly simulation count:', error);
      throw error;
    }
  }

  /**
   * Get user's immigration simulation history
   */
  static async getUserSimulations(userId) {
    try {
      const simulations = await prisma.immigrationSimulation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          country: true,
          immigrationType: true,
          level: true,
          status: true,
          finalScore: true,
          duration: true,
          voicePreference: true,
          createdAt: true,
          startedAt: true,
          completedAt: true
        }
      });

      const monthlyCount = await this.getMonthlySimulationCount(userId);

      return {
        simulations,
        monthlyCount
      };
    } catch (error) {
      console.error('Error getting user simulations:', error);
      throw error;
    }
  }
}

module.exports = ImmigrationSimulationService;
