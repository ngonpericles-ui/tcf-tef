"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nService = void 0;
const translations = {
    fr: {
        'auth.invalid_credentials': '🔒 Identifiants invalides. Veuillez vérifier votre email et mot de passe.',
        'auth.account_not_found': '❌ Compte introuvable. Veuillez créer un compte ou vérifier votre adresse email.',
        'auth.account_suspended': '⚠️ Compte suspendu. Contactez le support pour plus d\'informations.',
        'auth.unauthorized': '🚫 Accès non autorisé. Veuillez vous connecter.',
        'auth.forbidden': '🔒 Accès interdit. Vous n\'avez pas les permissions nécessaires.',
        'auth.token_expired': '⏰ Session expirée. Veuillez vous reconnecter.',
        'auth.invalid_token': '🔑 Token invalide. Veuillez vous reconnecter.',
        'voice.simulation_not_found': '🔍 Simulation vocale introuvable.',
        'voice.simulation_already_active': '🎤 Une simulation vocale est déjà en cours.',
        'voice.simulation_completed': '✅ Simulation vocale terminée avec succès.',
        'voice.voice_not_found': '🗣️ Voix sélectionnée introuvable.',
        'voice.assistant_creation_failed': '🤖 Échec de création de l\'assistant vocal.',
        'voice.call_start_failed': '📞 Impossible de démarrer l\'appel vocal.',
        'voice.monthly_limit_reached': '📅 Limite mensuelle de simulations atteinte (2 maximum).',
        'voice.booking_failed': '📝 Échec de réservation de la simulation.',
        'voice.invalid_date': '📅 Date invalide pour la simulation.',
        'voice.past_date_not_allowed': '⏰ Impossible de réserver une simulation dans le passé.',
        'email.send_failed': '📧 Échec d\'envoi de l\'email.',
        'email.invalid_email': '📧 Adresse email invalide.',
        'email.template_not_found': '📄 Modèle d\'email introuvable.',
        'email.smtp_not_configured': '⚙️ Service email non configuré.',
        'questions.pdf_upload_failed': '📄 Échec du téléchargement du PDF.',
        'questions.extraction_failed': '🔍 Échec d\'extraction des questions du PDF.',
        'questions.no_questions_found': '❓ Aucune question trouvée dans le PDF.',
        'questions.invalid_pdf': '📄 Fichier PDF invalide ou corrompu.',
        'questions.processing_failed': '⚙️ Échec du traitement du PDF.',
        'error.server_error': '⚙️ Erreur serveur. Veuillez réessayer dans quelques minutes.',
        'error.network_error': '🌐 Erreur de connexion. Vérifiez votre connexion internet.',
        'error.validation_error': '📝 Données invalides. Vérifiez vos informations.',
        'error.not_found': '🔍 Ressource introuvable.',
        'error.conflict': '⚠️ Conflit détecté. Cette ressource existe déjà.',
        'error.bad_request': '❌ Requête invalide. Vérifiez vos données.',
        'error.timeout': '⏰ Délai d\'attente dépassé. Veuillez réessayer.',
        'error.file_too_large': '📁 Fichier trop volumineux.',
        'error.unsupported_format': '📄 Format de fichier non supporté.',
        'success.operation_completed': '✅ Opération terminée avec succès.',
        'success.data_saved': '💾 Données sauvegardées avec succès.',
        'success.email_sent': '📧 Email envoyé avec succès.',
        'success.simulation_booked': '📅 Simulation vocale réservée avec succès.',
        'success.simulation_completed': '🎉 Simulation vocale terminée avec succès.',
        'success.questions_extracted': '📝 Questions extraites avec succès du PDF.',
        'user.profile_updated': '👤 Profil mis à jour avec succès.',
        'user.password_changed': '🔒 Mot de passe modifié avec succès.',
        'user.email_verified': '✅ Email vérifié avec succès.',
        'user.subscription_updated': '💳 Abonnement mis à jour avec succès.'
    },
    en: {
        'auth.invalid_credentials': '🔒 Invalid credentials. Please check your email and password.',
        'auth.account_not_found': '❌ Account not found. Please create an account or check your email address.',
        'auth.account_suspended': '⚠️ Account suspended. Contact support for more information.',
        'auth.unauthorized': '🚫 Unauthorized access. Please log in.',
        'auth.forbidden': '🔒 Access forbidden. You don\'t have the necessary permissions.',
        'auth.token_expired': '⏰ Session expired. Please log in again.',
        'auth.invalid_token': '🔑 Invalid token. Please log in again.',
        'voice.simulation_not_found': '🔍 Voice simulation not found.',
        'voice.simulation_already_active': '🎤 A voice simulation is already in progress.',
        'voice.simulation_completed': '✅ Voice simulation completed successfully.',
        'voice.voice_not_found': '🗣️ Selected voice not found.',
        'voice.assistant_creation_failed': '🤖 Failed to create voice assistant.',
        'voice.call_start_failed': '📞 Unable to start voice call.',
        'voice.monthly_limit_reached': '📅 Monthly simulation limit reached (2 maximum).',
        'voice.booking_failed': '📝 Failed to book simulation.',
        'voice.invalid_date': '📅 Invalid date for simulation.',
        'voice.past_date_not_allowed': '⏰ Cannot book simulation in the past.',
        'email.send_failed': '📧 Failed to send email.',
        'email.invalid_email': '📧 Invalid email address.',
        'email.template_not_found': '📄 Email template not found.',
        'email.smtp_not_configured': '⚙️ Email service not configured.',
        'questions.pdf_upload_failed': '📄 Failed to upload PDF.',
        'questions.extraction_failed': '🔍 Failed to extract questions from PDF.',
        'questions.no_questions_found': '❓ No questions found in PDF.',
        'questions.invalid_pdf': '📄 Invalid or corrupted PDF file.',
        'questions.processing_failed': '⚙️ Failed to process PDF.',
        'error.server_error': '⚙️ Server error. Please try again in a few minutes.',
        'error.network_error': '🌐 Connection error. Check your internet connection.',
        'error.validation_error': '📝 Invalid data. Please check your information.',
        'error.not_found': '🔍 Resource not found.',
        'error.conflict': '⚠️ Conflict detected. This resource already exists.',
        'error.bad_request': '❌ Invalid request. Please check your data.',
        'error.timeout': '⏰ Request timeout. Please try again.',
        'error.file_too_large': '📁 File too large.',
        'error.unsupported_format': '📄 Unsupported file format.',
        'success.operation_completed': '✅ Operation completed successfully.',
        'success.data_saved': '💾 Data saved successfully.',
        'success.email_sent': '📧 Email sent successfully.',
        'success.simulation_booked': '📅 Voice simulation booked successfully.',
        'success.simulation_completed': '🎉 Voice simulation completed successfully.',
        'success.questions_extracted': '📝 Questions extracted successfully from PDF.',
        'user.profile_updated': '👤 Profile updated successfully.',
        'user.password_changed': '🔒 Password changed successfully.',
        'user.email_verified': '✅ Email verified successfully.',
        'user.subscription_updated': '💳 Subscription updated successfully.'
    }
};
class I18nService {
    static t(key, language = this.defaultLanguage) {
        return translations[language]?.[key] || translations[this.defaultLanguage][key] || key;
    }
    static tp(key, params, language = this.defaultLanguage) {
        let message = this.t(key, language);
        Object.entries(params).forEach(([param, value]) => {
            message = message.replace(new RegExp(`{${param}}`, 'g'), String(value));
        });
        return message;
    }
    static setDefaultLanguage(language) {
        this.defaultLanguage = language;
    }
    static getDefaultLanguage() {
        return this.defaultLanguage;
    }
    static isLanguageSupported(language) {
        return language === 'fr' || language === 'en';
    }
    static getLanguageFromRequest(req) {
        const acceptLanguage = req.headers['accept-language'];
        const userLanguage = req.headers['x-user-language'];
        if (userLanguage && this.isLanguageSupported(userLanguage)) {
            return userLanguage;
        }
        if (acceptLanguage) {
            const languages = acceptLanguage.split(',').map((lang) => lang.split(';')[0].trim());
            for (const lang of languages) {
                if (lang.startsWith('fr'))
                    return 'fr';
                if (lang.startsWith('en'))
                    return 'en';
            }
        }
        return this.defaultLanguage;
    }
}
exports.I18nService = I18nService;
I18nService.defaultLanguage = 'fr';
exports.default = I18nService;
//# sourceMappingURL=i18nService.js.map