interface PDFUploadRequest {
    managerId: string;
    title: string;
    description?: string;
    level: string;
    category: string;
    filePath: string;
}
declare class QuestionBankService {
    uploadPDF(request: PDFUploadRequest): Promise<any>;
    private extractQuestionsFromText;
    private aiExtractQuestions;
    private simpleQuestionExtraction;
    private isQuestionLine;
    private categorizeQuestion;
    private assessLevel;
    private assessComplexity;
    private determineQuestionType;
    private extractKeywords;
    private assessDifficulty;
    private cleanText;
    getManagerQuestionBanks(managerId: string): Promise<any>;
    getAllQuestionBanks(): Promise<any>;
    updateQuestionBankStatus(questionBankId: string, isActive: boolean, userId: string): Promise<any>;
    getQuestionBankStats(): Promise<any>;
    searchQuestions(query: string, limit?: number): Promise<any[]>;
}
declare const _default: QuestionBankService;
export default _default;
//# sourceMappingURL=questionBankService.d.ts.map