export interface AdminSettings {
    general: {
        siteName: string;
        siteDescription: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        defaultLanguage: string;
        timezone: string;
    };
    users: {
        maxStudentsPerManager: number;
        autoApproveRegistrations: boolean;
        sessionTimeout: number;
        passwordPolicy: {
            minLength: number;
            requireSpecialChars: boolean;
            requireNumbers: boolean;
        };
    };
    content: {
        maxFileSize: number;
        allowedFileTypes: string[];
        autoModeration: boolean;
        contentApprovalRequired: boolean;
    };
    billing: {
        currency: string;
        taxRate: number;
        stripePublicKey: string;
        paymentMethods: string[];
    };
    notifications: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        pushEnabled: boolean;
        adminNotifications: boolean;
    };
    security: {
        twoFactorRequired: boolean;
        sessionTimeout: number;
        ipWhitelist: string[];
        auditLogging: boolean;
    };
    system: {
        backupFrequency: string;
        logLevel: string;
        cacheEnabled: boolean;
        cdnEnabled: boolean;
    };
}
export interface ManagerSettings {
    profile: {
        name: string;
        email: string;
        phone: string;
        bio: string;
        avatar: string;
    };
    notifications: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        studentMessages: boolean;
        courseUpdates: boolean;
        systemAlerts: boolean;
        weeklyReports: boolean;
        testApprovals: boolean;
        contentModeration: boolean;
        userManagement: boolean;
        analyticsReports: boolean;
        systemMaintenance: boolean;
        newFeatures: boolean;
    };
    preferences: {
        language: string;
        timezone: string;
        dateFormat: string;
        currency: string;
        theme: string;
        density: string;
        sidebar: string;
        animations: string;
        defaultLevel: string;
        defaultSubscription: string;
        autoSave: string;
        uploadQuality: string;
        autoPreview: boolean;
        validateBeforePublishing: boolean;
        aiSuggestions: boolean;
    };
}
export declare class SettingsService {
    private static defaultAdminSettings;
    private static defaultManagerSettings;
    static getAdminSettings(): Promise<AdminSettings>;
    static updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
    static getManagerSettings(userId: string): Promise<ManagerSettings>;
    static updateManagerSettings(userId: string, settings: Partial<ManagerSettings>): Promise<ManagerSettings>;
}
//# sourceMappingURL=settingsService.d.ts.map