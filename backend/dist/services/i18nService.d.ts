export type Language = 'fr' | 'en';
export interface TranslationMessages {
    'auth.invalid_credentials': string;
    'auth.account_not_found': string;
    'auth.account_suspended': string;
    'auth.unauthorized': string;
    'auth.forbidden': string;
    'auth.token_expired': string;
    'auth.invalid_token': string;
    'voice.simulation_not_found': string;
    'voice.simulation_already_active': string;
    'voice.simulation_completed': string;
    'voice.voice_not_found': string;
    'voice.assistant_creation_failed': string;
    'voice.call_start_failed': string;
    'voice.monthly_limit_reached': string;
    'voice.booking_failed': string;
    'voice.invalid_date': string;
    'voice.past_date_not_allowed': string;
    'email.send_failed': string;
    'email.invalid_email': string;
    'email.template_not_found': string;
    'email.smtp_not_configured': string;
    'questions.pdf_upload_failed': string;
    'questions.extraction_failed': string;
    'questions.no_questions_found': string;
    'questions.invalid_pdf': string;
    'questions.processing_failed': string;
    'error.server_error': string;
    'error.network_error': string;
    'error.validation_error': string;
    'error.not_found': string;
    'error.conflict': string;
    'error.bad_request': string;
    'error.timeout': string;
    'error.file_too_large': string;
    'error.unsupported_format': string;
    'success.operation_completed': string;
    'success.data_saved': string;
    'success.email_sent': string;
    'success.simulation_booked': string;
    'success.simulation_completed': string;
    'success.questions_extracted': string;
    'user.profile_updated': string;
    'user.password_changed': string;
    'user.email_verified': string;
    'user.subscription_updated': string;
}
export declare class I18nService {
    private static defaultLanguage;
    static t(key: keyof TranslationMessages, language?: Language): string;
    static tp(key: keyof TranslationMessages, params: Record<string, string | number>, language?: Language): string;
    static setDefaultLanguage(language: Language): void;
    static getDefaultLanguage(): Language;
    static isLanguageSupported(language: string): language is Language;
    static getLanguageFromRequest(req: any): Language;
}
export default I18nService;
//# sourceMappingURL=i18nService.d.ts.map