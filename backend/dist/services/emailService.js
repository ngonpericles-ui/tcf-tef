"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
const temporaryTokenService_1 = __importDefault(require("./temporaryTokenService"));
class EmailService {
    static async sendEmail(options) {
        try {
            const mailOptions = {
                from: this.fromAddress,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments
            };
            const result = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info('Email sent successfully', {
                to: options.to,
                subject: options.subject,
                messageId: result.messageId
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send email', {
                to: options.to,
                subject: options.subject,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    static async sendWelcomeEmail(data) {
        const subject = '🎉 Bienvenue sur TCF/TEF Learning Platform!';
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
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature { margin: 15px 0; padding: 10px; border-left: 4px solid #667eea; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Bienvenue ${data.firstName}!</h1>
                <p>Votre parcours d'apprentissage du français commence maintenant</p>
            </div>
            <div class="content">
                <h2>Bonjour ${data.firstName} ${data.lastName},</h2>
                
                <p>Félicitations! Votre compte sur <strong>TCF/TEF Learning Platform</strong> a été créé avec succès. Nous sommes ravis de vous accompagner dans votre préparation aux examens TCF et TEF.</p>
                
                <div class="features">
                    <h3>🚀 Ce qui vous attend:</h3>
                    <div class="feature">
                        <strong>📚 Cours interactifs</strong> - Accédez à des centaines de leçons structurées
                    </div>
                    <div class="feature">
                        <strong>🎥 Sessions en direct</strong> - Participez à des cours en temps réel avec nos instructeurs
                    </div>
                    <div class="feature">
                        <strong>📝 Tests de simulation</strong> - Entraînez-vous avec des examens blancs TCF/TEF
                    </div>
                    <div class="feature">
                        <strong>🤖 Assistant IA</strong> - Obtenez de l'aide personnalisée 24h/24
                    </div>
                    <div class="feature">
                        <strong>📊 Suivi des progrès</strong> - Visualisez votre évolution en temps réel
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${data.loginUrl}" class="button">🎯 Commencer maintenant</a>
                </div>

                <p><strong>Vos informations de connexion:</strong></p>
                <ul>
                    <li>Email: ${data.email}</li>
                    <li>Plateforme: <a href="${data.loginUrl}">TCF/TEF Learning Platform</a></li>
                </ul>

                <p>💡 <strong>Conseil:</strong> Commencez par passer notre test de niveau pour obtenir un parcours personnalisé!</p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="font-size: 14px; color: #666;">
                    Besoin d'aide? Contactez notre équipe support à <a href="mailto:support@tcf-tef-platform.com">support@tcf-tef-platform.com</a>
                </p>
                
                <p style="font-size: 12px; color: #999;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                </p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async sendCourseEnrollmentEmail(data) {
        const subject = `✅ Inscription confirmée: ${data.courseName}`;
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #4CAF50; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Inscription Confirmée!</h1>
                <p>Vous êtes maintenant inscrit(e) au cours</p>
            </div>
            <div class="content">
                <h2>Bonjour ${data.firstName},</h2>
                
                <p>Félicitations! Votre inscription au cours <strong>"${data.courseName}"</strong> a été confirmée avec succès.</p>
                
                <div class="course-info">
                    <h3>📚 Détails du cours:</h3>
                    <p><strong>Cours:</strong> ${data.courseName}</p>
                    <p><strong>Instructeur:</strong> ${data.instructorName}</p>
                    <p><strong>Statut:</strong> ✅ Inscrit(e)</p>
                </div>

                <p>🚀 <strong>Prochaines étapes:</strong></p>
                <ul>
                    <li>Accédez à votre cours via le lien ci-dessous</li>
                    <li>Consultez le programme et les ressources</li>
                    <li>Commencez votre première leçon</li>
                    <li>Rejoignez la communauté d'apprenants</li>
                </ul>

                <div style="text-align: center;">
                    <a href="${data.courseUrl}" class="button">📖 Accéder au cours</a>
                </div>

                <p>💡 <strong>Astuce:</strong> Activez les notifications pour ne manquer aucune mise à jour du cours!</p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="font-size: 14px; color: #666;">
                    Questions? Contactez votre instructeur ou notre équipe support.
                </p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async sendLiveSessionReminderEmail(data) {
        const subject = `🎥 Rappel: Session en direct "${data.sessionTitle}" dans 1 heure`;
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B6B 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .session-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #FF6B6B; }
            .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Session en Direct</h1>
                <p>Votre session commence bientôt!</p>
            </div>
            <div class="content">
                <h2>Bonjour ${data.firstName},</h2>
                
                <div class="urgent">
                    <strong>🚨 Rappel Important:</strong> Votre session en direct commence dans <strong>1 heure</strong>!
                </div>
                
                <div class="session-info">
                    <h3>📅 Détails de la session:</h3>
                    <p><strong>Titre:</strong> ${data.sessionTitle}</p>
                    <p><strong>Date:</strong> ${data.sessionDate}</p>
                    <p><strong>Heure:</strong> ${data.sessionTime}</p>
                    <p><strong>Durée:</strong> ${data.duration} minutes</p>
                </div>

                <p>🎯 <strong>Préparation recommandée:</strong></p>
                <ul>
                    <li>Testez votre connexion internet</li>
                    <li>Vérifiez votre micro et caméra</li>
                    <li>Préparez vos questions</li>
                    <li>Ayez un carnet et un stylo à portée de main</li>
                </ul>

                <div style="text-align: center;">
                    <a href="${data.joinUrl}" class="button">🎥 Rejoindre la session</a>
                </div>

                <p>💡 <strong>Conseil:</strong> Rejoignez la session 5 minutes avant le début pour éviter tout problème technique!</p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="font-size: 14px; color: #666;">
                    Problème technique? Contactez le support: <a href="mailto:support@tcf-tef-platform.com">support@tcf-tef-platform.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async sendTestResultsEmail(data) {
        const subject = `📊 Résultats de votre test: ${data.testName}`;
        const passColor = data.percentage >= 70 ? '#4CAF50' : data.percentage >= 50 ? '#FF9800' : '#F44336';
        const passStatus = data.percentage >= 70 ? '🎉 Excellent!' : data.percentage >= 50 ? '👍 Bien!' : '💪 À améliorer';
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${passColor} 0%, ${passColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: ${passColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .results { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${passColor}; }
            .score-circle { width: 100px; height: 100px; border-radius: 50%; background: ${passColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 20px auto; }
            .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Résultats de Test</h1>
                <p>${passStatus}</p>
            </div>
            <div class="content">
                <h2>Bonjour ${data.firstName},</h2>
                
                <p>Voici les résultats de votre test <strong>"${data.testName}"</strong>:</p>
                
                <div class="results">
                    <div style="text-align: center;">
                        <div class="score-circle">${data.percentage}%</div>
                    </div>
                    
                    <h3>📈 Détails des résultats:</h3>
                    <p><strong>Score:</strong> ${data.score}/${data.totalQuestions}</p>
                    <p><strong>Pourcentage:</strong> ${data.percentage}%</p>
                    <p><strong>Niveau:</strong> ${data.level}</p>
                    <p><strong>Statut:</strong> ${passStatus}</p>
                </div>

                ${data.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h3>💡 Recommandations personnalisées:</h3>
                    <ul>
                        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <p>🎯 <strong>Prochaines étapes:</strong></p>
                <ul>
                    <li>Consultez le détail de vos réponses</li>
                    <li>Travaillez sur les points à améliorer</li>
                    <li>Passez au niveau suivant si éligible</li>
                    <li>Planifiez votre prochain test</li>
                </ul>

                <div style="text-align: center;">
                    <a href="#" class="button">📝 Voir le détail</a>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="font-size: 14px; color: #666;">
                    Continuez vos efforts! Chaque test vous rapproche de votre objectif.
                </p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async testEmailConfiguration() {
        try {
            await this.transporter.verify();
            logger_1.logger.info('Email configuration is valid');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Email configuration is invalid', { error });
            return false;
        }
    }
    static async sendVoiceSimulationBookingEmail(data) {
        const subject = 'Confirmation de votre simulation vocale TCF/TEF';
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
            .highlight { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎤 Simulation Vocale Confirmée</h1>
            </div>
            <div class="content">
                <p>Bonjour ${data.firstName},</p>

                <p>Votre simulation vocale TCF/TEF a été confirmée avec succès !</p>

                <div class="highlight">
                    <h3>📅 Détails de votre simulation :</h3>
                    <p><strong>Date et heure :</strong> ${new Date(data.scheduledDate).toLocaleString('fr-FR')}</p>
                    <p><strong>Durée :</strong> ${data.duration}</p>
                    <p><strong>Voix préférée :</strong> ${data.voicePreference === 'MALE' ? 'Masculine' : 'Féminine'}</p>
                </div>

                <h3>📋 Ce qui vous attend :</h3>
                <ul>
                    <li>Entretien oral interactif avec IA</li>
                    <li>Questions adaptées à votre niveau</li>
                    <li>Évaluation complète de vos compétences orales</li>
                    <li>Rapport détaillé envoyé par email</li>
                </ul>

                <h3>💡 Conseils pour bien vous préparer :</h3>
                <ul>
                    <li>Testez votre microphone et connexion internet</li>
                    <li>Trouvez un endroit calme</li>
                    <li>Préparez-vous mentalement en français</li>
                    <li>Arrivez 5 minutes avant l'heure</li>
                </ul>

                <p><strong>Rappel :</strong> Vous recevrez un email de rappel 30 minutes avant votre simulation.</p>

                <p>Bonne préparation et à bientôt !</p>

                <p>L'équipe TCF/TEF Learning Platform</p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async sendVoiceSimulationReminderEmail(data) {
        try {
            const temporaryToken = await temporaryTokenService_1.default.generateToken(data.userId, data.simulationId, 'voice', 2);
            const directAccessLink = `${process.env.FRONTEND_URL || 'http://localhost:3004'}/voice-simulation/${data.simulationId}?token=${temporaryToken}`;
            const subject = '⏰ Rappel : Votre simulation vocale commence dans 30 minutes';
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
              .access-section { background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>⏰ Simulation dans 30 minutes !</h1>
              </div>
              <div class="content">
                  <p>Bonjour ${data.firstName},</p>

                  <div class="urgent">
                      <h3>🚨 Votre simulation vocale commence bientôt !</h3>
                      <p><strong>Heure de début :</strong> ${new Date(data.scheduledDate).toLocaleString('fr-FR')}</p>
                      <p><strong>Dans :</strong> 30 minutes</p>
                  </div>

                  <div class="access-section">
                      <h3>🚀 Accès direct à votre simulation</h3>
                      <p>Cliquez sur le lien ci-dessous pour accéder directement à votre simulation (aucune connexion requise) :</p>
                      <a href="${directAccessLink}" class="button">🎤 Commencer la simulation</a>
                      <p><small>⚠️ Ce lien est valide pendant 2 heures et à usage unique</small></p>
                  </div>

                  <h3>✅ Dernières vérifications :</h3>
                  <ul>
                      <li>Microphone fonctionnel</li>
                      <li>Connexion internet stable</li>
                      <li>Environnement calme</li>
                      <li>Navigateur à jour</li>
                  </ul>

                  <p>Bonne chance !</p>

                  <p>L'équipe TCF/TEF Learning Platform</p>
              </div>
          </div>
      </body>
      </html>`;
            return this.sendEmail({
                to: data.email,
                subject,
                html
            });
        }
        catch (error) {
            console.error('Error sending voice simulation reminder email:', error);
            return false;
        }
    }
    static async sendVoiceSimulationResultsEmail(data) {
        const subject = '📊 Résultats de votre simulation vocale TCF/TEF';
        const getScoreColor = (score) => {
            if (score >= 80)
                return '#27ae60';
            if (score >= 60)
                return '#f39c12';
            return '#e74c3c';
        };
        const getScoreLevel = (score) => {
            if (score >= 90)
                return 'Excellent';
            if (score >= 80)
                return 'Très bien';
            if (score >= 70)
                return 'Bien';
            if (score >= 60)
                return 'Satisfaisant';
            if (score >= 50)
                return 'Passable';
            return 'À améliorer';
        };
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .score-card { background: white; padding: 20px; border-radius: 10px; margin: 15px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .overall-score { text-align: center; font-size: 48px; font-weight: bold; color: ${getScoreColor(data.overallScore)}; }
            .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .score-item { background: white; padding: 15px; border-radius: 8px; text-align: center; }
            .score-value { font-size: 24px; font-weight: bold; margin: 5px 0; }
            .feedback { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Vos Résultats</h1>
                <p>Simulation vocale TCF/TEF</p>
            </div>
            <div class="content">
                <p>Bonjour ${data.firstName},</p>

                <p>Félicitations ! Vous avez terminé votre simulation vocale. Voici vos résultats détaillés :</p>

                <div class="score-card">
                    <h3 style="text-align: center; margin-bottom: 20px;">Score Global</h3>
                    <div class="overall-score">${data.overallScore.toFixed(1)}/100</div>
                    <p style="text-align: center; font-size: 18px; color: ${getScoreColor(data.overallScore)};">
                        ${getScoreLevel(data.overallScore)}
                    </p>
                </div>

                <div class="score-grid">
                    <div class="score-item">
                        <h4>🗣️ Fluidité</h4>
                        <div class="score-value" style="color: ${getScoreColor(data.fluencyScore)}">${data.fluencyScore.toFixed(1)}</div>
                    </div>
                    <div class="score-item">
                        <h4>📝 Grammaire</h4>
                        <div class="score-value" style="color: ${getScoreColor(data.grammarScore)}">${data.grammarScore.toFixed(1)}</div>
                    </div>
                    <div class="score-item">
                        <h4>📚 Vocabulaire</h4>
                        <div class="score-value" style="color: ${getScoreColor(data.vocabularyScore)}">${data.vocabularyScore.toFixed(1)}</div>
                    </div>
                    <div class="score-item">
                        <h4>🔊 Prononciation</h4>
                        <div class="score-value" style="color: ${getScoreColor(data.pronunciationScore)}">${data.pronunciationScore.toFixed(1)}</div>
                    </div>
                </div>

                <div class="score-card">
                    <h4>🎯 Cohérence du discours</h4>
                    <div class="score-value" style="color: ${getScoreColor(data.coherenceScore)}; text-align: center;">${data.coherenceScore.toFixed(1)}/100</div>
                </div>

                <div class="feedback">
                    <h3>💬 Commentaires personnalisés</h3>
                    <p>${data.feedback}</p>
                </div>

                <h3>📈 Prochaines étapes recommandées :</h3>
                <ul>
                    <li>Continuez à pratiquer régulièrement</li>
                    <li>Concentrez-vous sur vos points faibles</li>
                    <li>Utilisez nos cours ciblés</li>
                    <li>Planifiez votre prochaine simulation</li>
                </ul>

                <p><small>Simulation terminée le ${new Date(data.completedAt).toLocaleString('fr-FR')}</small></p>

                <p>Continuez vos efforts, vous progressez bien !</p>

                <p>L'équipe TCF/TEF Learning Platform</p>
            </div>
        </div>
    </body>
    </html>`;
        return this.sendEmail({
            to: data.email,
            subject,
            html
        });
    }
    static async sendImmigrationSimulationConfirmationEmail(data) {
        try {
            const temporaryToken = await temporaryTokenService_1.default.generateToken(data.userId, data.simulationId, 'immigration', 24);
            const directAccessLink = `${process.env.FRONTEND_URL || 'http://localhost:3004'}/immigration-simulation/${data.simulationId}?token=${temporaryToken}`;
            const countryNames = {
                'canada': 'Canada',
                'france': 'France',
                'belgium': 'Belgique'
            };
            const typeNames = {
                'skilled_worker': 'Travailleur qualifié',
                'student': 'Étudiant international',
                'family_reunification': 'Réunification familiale',
                'work_permit': 'Permis de travail',
                'family': 'Regroupement familial',
                'work': 'Permis de travail'
            };
            const countryName = countryNames[data.country] || data.country;
            const typeName = typeNames[data.immigrationType] || data.immigrationType;
            const subject = `✅ Confirmation : Simulation d'immigration ${countryName}`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
              .access-section { background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🌍 Simulation d'Immigration Confirmée</h1>
              </div>
              <div class="content">
                  <p>Bonjour ${data.firstName},</p>

                  <div class="info-box">
                      <h3>✅ Votre simulation d'immigration est confirmée !</h3>
                      <p><strong>Pays de destination :</strong> ${countryName}</p>
                      <p><strong>Type de demande :</strong> ${typeName}</p>
                      <p><strong>Date prévue :</strong> ${new Date(data.scheduledDate).toLocaleString('fr-FR')}</p>
                  </div>

                  <div class="access-section">
                      <h3>🚀 Accès direct à votre simulation</h3>
                      <p>Cliquez sur le lien ci-dessous pour accéder directement à votre simulation (aucune connexion requise) :</p>
                      <a href="${directAccessLink}" class="button">🎯 Commencer la simulation</a>
                      <p><small>⚠️ Ce lien est valide pendant 24 heures et à usage unique</small></p>
                  </div>

                  <h3>📋 Préparation recommandée :</h3>
                  <ul>
                      <li>Préparez vos documents d'identité</li>
                      <li>Révisez les procédures d'immigration de ${countryName}</li>
                      <li>Préparez vos motivations et votre projet</li>
                      <li>Assurez-vous d'avoir un environnement calme</li>
                      <li>Vérifiez votre connexion internet</li>
                  </ul>

                  <p>Bonne chance pour votre simulation !</p>

                  <p>L'équipe TCF/TEF Learning Platform</p>
              </div>
          </div>
      </body>
      </html>`;
            return this.sendEmail({
                to: data.email,
                subject,
                html
            });
        }
        catch (error) {
            console.error('Error sending immigration simulation confirmation email:', error);
            return false;
        }
    }
    static async sendImmigrationSimulationReminderEmail(data) {
        try {
            const temporaryToken = await temporaryTokenService_1.default.generateToken(data.userId, data.simulationId, 'immigration', 2);
            const directAccessLink = `${process.env.FRONTEND_URL || 'http://localhost:3004'}/immigration-simulation/${data.simulationId}?token=${temporaryToken}`;
            const countryNames = {
                'canada': 'Canada',
                'france': 'France',
                'belgium': 'Belgique'
            };
            const typeNames = {
                'skilled_worker': 'Travailleur qualifié',
                'student': 'Étudiant international',
                'family_reunification': 'Réunification familiale',
                'work_permit': 'Permis de travail',
                'family': 'Regroupement familial',
                'work': 'Permis de travail'
            };
            const countryName = countryNames[data.country] || data.country;
            const typeName = typeNames[data.immigrationType] || data.immigrationType;
            const subject = `⏰ Rappel : Simulation d'immigration ${countryName} dans 30 minutes`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
              .access-section { background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>⏰ Simulation dans 30 minutes !</h1>
              </div>
              <div class="content">
                  <p>Bonjour ${data.firstName},</p>

                  <div class="urgent">
                      <h3>🚨 Votre simulation d'immigration commence bientôt !</h3>
                      <p><strong>Pays :</strong> ${countryName}</p>
                      <p><strong>Type :</strong> ${typeName}</p>
                      <p><strong>Heure de début :</strong> ${new Date(data.scheduledDate).toLocaleString('fr-FR')}</p>
                      <p><strong>Dans :</strong> 30 minutes</p>
                  </div>

                  <div class="access-section">
                      <h3>🚀 Accès direct à votre simulation</h3>
                      <p>Cliquez sur le lien ci-dessous pour accéder directement à votre simulation :</p>
                      <a href="${directAccessLink}" class="button">🎯 Commencer la simulation</a>
                      <p><small>⚠️ Ce lien est valide pendant 2 heures et à usage unique</small></p>
                  </div>

                  <h3>✅ Dernières vérifications :</h3>
                  <ul>
                      <li>Documents d'identité à portée de main</li>
                      <li>Environnement calme et professionnel</li>
                      <li>Connexion internet stable</li>
                      <li>Microphone fonctionnel</li>
                      <li>Navigateur à jour</li>
                  </ul>

                  <p>Bonne chance pour votre entretien d'immigration !</p>

                  <p>L'équipe TCF/TEF Learning Platform</p>
              </div>
          </div>
      </body>
      </html>`;
            return this.sendEmail({
                to: data.email,
                subject,
                html
            });
        }
        catch (error) {
            console.error('Error sending immigration simulation reminder email:', error);
            return false;
        }
    }
    static async sendImmigrationSimulationResultsEmail(data) {
        try {
            const countryNames = {
                'canada': 'Canada',
                'france': 'France',
                'belgium': 'Belgique'
            };
            const typeNames = {
                'skilled_worker': 'Travailleur qualifié',
                'student': 'Étudiant international',
                'family_reunification': 'Réunification familiale',
                'work_permit': 'Permis de travail',
                'family': 'Regroupement familial',
                'work': 'Permis de travail'
            };
            const countryName = countryNames[data.country] || data.country;
            const typeName = typeNames[data.immigrationType] || data.immigrationType;
            const subject = `📊 Résultats : Simulation d'immigration ${countryName}`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .score-box { background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
              .feedback-box { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .score { font-size: 2em; font-weight: bold; color: #27ae60; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📊 Résultats de votre Simulation</h1>
              </div>
              <div class="content">
                  <p>Bonjour ${data.firstName},</p>

                  <p>Voici les résultats de votre simulation d'immigration pour <strong>${countryName}</strong> (${typeName}) :</p>

                  <div class="score-box">
                      <h3>🎯 Score Final</h3>
                      <div class="score">${data.finalScore}/100</div>
                      <p>Simulation terminée le ${new Date(data.completedAt).toLocaleString('fr-FR')}</p>
                  </div>

                  <div class="feedback-box">
                      <h3>💬 Évaluation détaillée :</h3>
                      <p>${data.feedback}</p>
                  </div>

                  <h3>📈 Prochaines étapes recommandées :</h3>
                  <ul>
                      <li>Analysez les points à améliorer</li>
                      <li>Préparez mieux votre dossier d'immigration</li>
                      <li>Renforcez vos connaissances du pays</li>
                      <li>Pratiquez vos entretiens d'immigration</li>
                      <li>Consultez nos ressources spécialisées</li>
                  </ul>

                  <p>Continuez à vous préparer pour maximiser vos chances de succès !</p>

                  <p>L'équipe TCF/TEF Learning Platform</p>
              </div>
          </div>
      </body>
      </html>`;
            return this.sendEmail({
                to: data.email,
                subject,
                html
            });
        }
        catch (error) {
            console.error('Error sending immigration simulation results email:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
EmailService.transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
EmailService.fromAddress = `${process.env.EMAIL_FROM_NAME || 'TCF/TEF Learning Platform'} <${process.env.SMTP_USER}>`;
exports.default = new EmailService();
//# sourceMappingURL=emailService.js.map