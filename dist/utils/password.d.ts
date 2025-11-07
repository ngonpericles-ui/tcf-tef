export declare class PasswordService {
    private static readonly ADMIN_SALT_ROUNDS;
    private static readonly STUDENT_SALT_ROUNDS;
    private static getSaltRounds;
    static hashPassword(password: string, role?: string): Promise<string>;
    static verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
        score: number;
    };
    static generateRandomPassword(length?: number): string;
    static generateTemporaryPassword(): string;
}
//# sourceMappingURL=password.d.ts.map