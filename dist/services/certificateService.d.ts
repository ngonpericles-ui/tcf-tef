export interface CertificateData {
    id: string;
    userId: string;
    type: 'COURSE_COMPLETION' | 'TEST_ACHIEVEMENT' | 'LEVEL_CERTIFICATION' | 'SIMULATION_COMPLETION';
    title: string;
    description: string;
    level?: string;
    score?: number;
    percentage?: number;
    courseName?: string;
    testName?: string;
    instructorName?: string;
    issuedAt: Date;
    validUntil?: Date;
    certificateUrl: string;
    verificationCode: string;
    metadata: Record<string, any>;
}
export interface GenerateCertificateRequest {
    userId: string;
    type: 'COURSE_COMPLETION' | 'TEST_ACHIEVEMENT' | 'LEVEL_CERTIFICATION' | 'SIMULATION_COMPLETION';
    title: string;
    description: string;
    level?: string;
    score?: number;
    percentage?: number;
    courseName?: string;
    testName?: string;
    instructorName?: string;
    validityPeriod?: number;
    metadata?: Record<string, any>;
}
export declare class CertificateService {
    static generateCertificate(request: GenerateCertificateRequest): Promise<CertificateData>;
    private static createPDFCertificate;
    private static sendCertificateEmail;
    private static generateVerificationCode;
    static verifyCertificate(verificationCode: string): Promise<CertificateData | null>;
    static getUserCertificates(userId: string, page?: number, limit?: number): Promise<{
        certificates: CertificateData[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static checkAndGenerateAutoCertificates(userId: string): Promise<void>;
}
//# sourceMappingURL=certificateService.d.ts.map