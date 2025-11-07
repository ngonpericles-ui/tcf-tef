"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmailService = void 0;
const connection_1 = require("../database/connection");
const emailService_1 = require("./emailService");
const logger_1 = require("../utils/logger");
class EventEmailService {
    static async handleUserLogin(event) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastLogin = await connection_1.prisma.user.findUnique({
                where: { id: event.userId },
                select: { lastLoginAt: true }
            });
            const isFirstLoginToday = !lastLogin?.lastLoginAt ||
                lastLogin.lastLoginAt < today;
            if (isFirstLoginToday) {
                const subject = '👋 Bon retour sur TCF/TEF Learning Platform!';
                const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👋 Bon retour ${event.firstName}!</h1>
                    <p>Continuons votre parcours d'apprentissage</p>
                </div>
                <div class="content">
                    <h2>Bonjour ${event.firstName},</h2>
                    
                    <p>Nous sommes ravis de vous revoir sur <strong>TCF/TEF Learning Platform</strong>!</p>
                    
                    <div class="stats">
                        <h3>📊 Votre session d'aujourd'hui:</h3>
                        <p><strong>Connexion:</strong> ${event.loginTime.toLocaleString('fr-FR')}</p>
                        <p><strong>Statut:</strong> ✅ Connecté(e)</p>
                    </div>

                    <p>🎯 <strong>Suggestions pour aujourd'hui:</strong></p>
                    <ul>
                        <li>Continuez votre cours en cours</li>
                        <li>Passez un test de niveau</li>
                        <li>Rejoignez une session en direct</li>
                        <li>Consultez vos résultats récents</li>
                    </ul>

                    <div style="text-align: center;">
                        <a href="http://localhost:3000/dashboard" class="button">🎓 Accéder au tableau de bord</a>
                    </div>

                    <p>💡 <strong>Astuce du jour:</strong> La régularité est la clé du succès en apprentissage des langues!</p>
                </div>
            </div>
        </body>
        </html>`;
                await emailService_1.EmailService.sendEmail({
                    to: event.email,
                    subject,
                    html
                });
                logger_1.logger.info('Login welcome email sent', { userId: event.userId, email: event.email });
            }
            await connection_1.prisma.user.update({
                where: { id: event.userId },
                data: { lastLoginAt: event.loginTime }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle user login event', { event, error });
        }
    }
    static async handleCourseEnrollment(event) {
        try {
            await emailService_1.EmailService.sendCourseEnrollmentEmail({
                firstName: event.firstName,
                email: event.email,
                courseName: event.courseName,
                courseUrl: `http://localhost:3000/courses/${event.courseId}`,
                instructorName: event.instructorName
            });
            logger_1.logger.info('Course enrollment email sent', {
                userId: event.userId,
                courseId: event.courseId,
                email: event.email
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle course enrollment event', { event, error });
        }
    }
    static async handleTestCompletion(event) {
        try {
            const recommendations = this.generateTestRecommendations(event.percentage, event.level);
            await emailService_1.EmailService.sendTestResultsEmail({
                firstName: event.firstName,
                email: event.email,
                testName: event.testName,
                score: event.score,
                totalQuestions: event.totalQuestions,
                percentage: event.percentage,
                level: event.level,
                recommendations
            });
            logger_1.logger.info('Test completion email sent', {
                userId: event.userId,
                testId: event.testId,
                email: event.email,
                score: event.score
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle test completion event', { event, error });
        }
    }
    static async handleLiveSessionReminder(event) {
        try {
            await emailService_1.EmailService.sendLiveSessionReminderEmail({
                firstName: event.firstName,
                email: event.email,
                sessionTitle: event.sessionTitle,
                sessionDate: event.scheduledAt.toLocaleDateString('fr-FR'),
                sessionTime: event.scheduledAt.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                joinUrl: `http://localhost:3000/live/${event.sessionId}`,
                duration: event.duration
            });
            logger_1.logger.info('Live session reminder email sent', {
                userId: event.userId,
                sessionId: event.sessionId,
                email: event.email
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle live session reminder event', { event, error });
        }
    }
    static async handleNotificationEvent(event) {
        try {
            if (!['HIGH', 'URGENT'].includes(event.priority)) {
                return;
            }
            const subject = event.priority === 'URGENT' ?
                `🚨 URGENT: ${event.notificationTitle}` :
                `⚠️ Important: ${event.notificationTitle}`;
            const priorityColor = event.priority === 'URGENT' ? '#F44336' : '#FF9800';
            const priorityIcon = event.priority === 'URGENT' ? '🚨' : '⚠️';
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: ${priorityColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .notification { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${priorityColor}; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${priorityIcon} Notification Importante</h1>
                  <p>Priorité: ${event.priority}</p>
              </div>
              <div class="content">
                  <h2>Bonjour ${event.firstName},</h2>
                  
                  <div class="notification">
                      <h3>${event.notificationTitle}</h3>
                      <p>${event.notificationMessage}</p>
                  </div>

                  ${event.actionUrl ? `
                  <div style="text-align: center;">
                      <a href="${event.actionUrl}" class="button">Voir les détails</a>
                  </div>
                  ` : ''}

                  <p><strong>Cette notification nécessite votre attention.</strong></p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  
                  <p style="font-size: 14px; color: #666;">
                      Si vous avez des questions, contactez notre équipe support.
                  </p>
              </div>
          </div>
      </body>
      </html>`;
            await emailService_1.EmailService.sendEmail({
                to: event.email,
                subject,
                html
            });
            logger_1.logger.info('Notification email sent', {
                userId: event.userId,
                priority: event.priority,
                email: event.email
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle notification event', { event, error });
        }
    }
    static generateTestRecommendations(percentage, level) {
        const recommendations = [];
        if (percentage >= 90) {
            recommendations.push("Excellent travail! Vous maîtrisez parfaitement ce niveau.");
            recommendations.push("Passez au niveau supérieur pour continuer votre progression.");
            recommendations.push("Considérez passer l'examen officiel TCF/TEF.");
        }
        else if (percentage >= 70) {
            recommendations.push("Très bon résultat! Vous avez une bonne maîtrise du niveau.");
            recommendations.push("Travaillez sur les points faibles identifiés.");
            recommendations.push("Pratiquez avec des exercices supplémentaires.");
        }
        else if (percentage >= 50) {
            recommendations.push("Résultat correct, mais il y a de la marge d'amélioration.");
            recommendations.push("Révisez les concepts fondamentaux de ce niveau.");
            recommendations.push("Participez à des sessions en direct pour plus de pratique.");
        }
        else {
            recommendations.push("Ce niveau nécessite plus de travail.");
            recommendations.push("Reprenez les cours de base de ce niveau.");
            recommendations.push("Demandez de l'aide à votre instructeur.");
            recommendations.push("Pratiquez régulièrement avec des exercices simples.");
        }
        switch (level) {
            case 'A1':
                recommendations.push("Concentrez-vous sur le vocabulaire de base et les phrases simples.");
                break;
            case 'A2':
                recommendations.push("Travaillez sur les temps du passé et les expressions courantes.");
                break;
            case 'B1':
                recommendations.push("Améliorez votre expression écrite et la compréhension de textes complexes.");
                break;
            case 'B2':
                recommendations.push("Perfectionnez votre argumentation et votre vocabulaire spécialisé.");
                break;
            case 'C1':
                recommendations.push("Travaillez sur les nuances linguistiques et l'expression sophistiquée.");
                break;
            case 'C2':
                recommendations.push("Perfectionnez votre maîtrise native du français.");
                break;
        }
        return recommendations;
    }
    static async scheduleLiveSessionReminders(sessionId) {
        try {
            const session = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    firstName: true
                                }
                            }
                        }
                    }
                }
            });
            if (!session) {
                logger_1.logger.warn('Session not found for reminder scheduling', { sessionId });
                return;
            }
            for (const participant of session.participants) {
                const reminderEvent = {
                    userId: participant.user.id,
                    sessionId: session.id,
                    email: participant.user.email,
                    firstName: participant.user.firstName,
                    sessionTitle: session.title,
                    scheduledAt: session.date,
                    duration: session.duration
                };
                const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
                if (session.date <= oneHourFromNow) {
                    await this.handleLiveSessionReminder(reminderEvent);
                }
            }
            logger_1.logger.info('Live session reminders scheduled', {
                sessionId,
                participantCount: session.participants.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule live session reminders', { sessionId, error });
        }
    }
}
exports.EventEmailService = EventEmailService;
//# sourceMappingURL=eventEmailService.js.map