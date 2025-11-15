"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
class QuestionBankService {
    async uploadPDF(request) {
        try {
            const manager = await connection_1.prisma.user.findUnique({
                where: { id: request.managerId }
            });
            if (!manager || !['SENIOR_MANAGER', 'ADMIN'].includes(manager.role)) {
                throw new Error('Insufficient permissions to upload question banks');
            }
            const pdfBuffer = fs_1.default.readFileSync(request.filePath);
            const pdfData = await (0, pdf_parse_1.default)(pdfBuffer);
            const extraction = await this.extractQuestionsFromText(pdfData.text);
            const fileName = `questionbank_${Date.now()}_${path_1.default.basename(request.filePath)}`;
            const permanentPath = path_1.default.join(process.env.UPLOAD_DIR || './uploads', fileName);
            fs_1.default.copyFileSync(request.filePath, permanentPath);
            const questionBank = await connection_1.prisma.questionBank.create({
                data: {
                    managerId: request.managerId,
                    title: request.title,
                    description: request.description,
                    pdfUrl: permanentPath,
                    extractedQuestions: JSON.parse(JSON.stringify(extraction.questions)),
                    level: request.level,
                    category: request.category,
                    isActive: true
                },
            });
            if (fs_1.default.existsSync(request.filePath)) {
                fs_1.default.unlinkSync(request.filePath);
            }
            return {
                questionBank,
                extraction,
                message: 'PDF uploaded and processed successfully'
            };
        }
        catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    }
    async extractQuestionsFromText(text) {
        try {
            const cleanText = this.cleanText(text);
            const extraction = await this.aiExtractQuestions(cleanText);
            return extraction;
        }
        catch (error) {
            console.error('Error extracting questions:', error);
            return this.simpleQuestionExtraction(text);
        }
    }
    async aiExtractQuestions(text) {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const prompt = `
    Analyze the following French language learning content and extract questions suitable for TCF/TEF oral assessment.
    
    For each question found, provide:
    1. The question text in French
    2. Category (GENERAL, IMMIGRATION, WORK, DAILY_LIFE, ACADEMIC, BUSINESS)
    3. Level (A1, A2, B1, B2, C1, C2)
    4. Type (open, multiple_choice, true_false)
    5. Keywords for the question
    6. Difficulty score (1-10)
    
    Return the result as a JSON object with this structure:
    {
      "questions": [
        {
          "id": "unique_id",
          "text": "question text",
          "category": "category",
          "level": "level",
          "type": "type",
          "keywords": ["keyword1", "keyword2"],
          "difficulty": number
        }
      ],
      "metadata": {
        "totalQuestions": number,
        "categories": ["category1", "category2"],
        "levels": ["level1", "level2"]
      }
    }
    
    Content to analyze:
    ${text.substring(0, 4000)} // Limit to avoid token limits
    `;
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in French language assessment and TCF/TEF test preparation. Extract relevant questions from the provided content.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = JSON.parse(response.data.choices[0].message.content);
            result.metadata.extractionDate = new Date();
            return result;
        }
        catch (error) {
            console.error('Error with OpenAI extraction:', error);
            throw error;
        }
    }
    simpleQuestionExtraction(text) {
        const questions = [];
        const lines = text.split('\n');
        let questionId = 1;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (this.isQuestionLine(trimmedLine)) {
                const question = {
                    id: `q_${questionId++}`,
                    text: trimmedLine,
                    category: this.categorizeQuestion(trimmedLine),
                    level: this.assessLevel(trimmedLine),
                    type: this.determineQuestionType(trimmedLine),
                    keywords: this.extractKeywords(trimmedLine),
                    difficulty: this.assessDifficulty(trimmedLine)
                };
                questions.push(question);
            }
        }
        const categories = [...new Set(questions.map(q => q.category))];
        const levels = [...new Set(questions.map(q => q.level))];
        return {
            questions,
            metadata: {
                totalQuestions: questions.length,
                categories,
                levels,
                extractionDate: new Date()
            }
        };
    }
    isQuestionLine(line) {
        const questionPatterns = [
            /\?$/,
            /^(Comment|Pourquoi|Que|Quoi|Où|Quand|Qui|Combien)/i,
            /^(Décrivez|Expliquez|Parlez|Racontez)/i,
            /^(Pouvez-vous|Pourriez-vous)/i
        ];
        return questionPatterns.some(pattern => pattern.test(line)) && line.length > 10;
    }
    categorizeQuestion(question) {
        const categoryKeywords = {
            IMMIGRATION: ['canada', 'immigration', 'visa', 'résidence', 'citoyenneté'],
            WORK: ['travail', 'emploi', 'profession', 'métier', 'carrière', 'bureau'],
            DAILY_LIFE: ['quotidien', 'famille', 'maison', 'loisirs', 'vacances'],
            ACADEMIC: ['études', 'université', 'école', 'formation', 'diplôme'],
            BUSINESS: ['entreprise', 'affaires', 'commerce', 'économie', 'marché']
        };
        const lowerQuestion = question.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
                return category;
            }
        }
        return 'GENERAL';
    }
    assessLevel(question) {
        const complexity = this.assessComplexity(question);
        if (complexity <= 2)
            return 'A1';
        if (complexity <= 4)
            return 'A2';
        if (complexity <= 6)
            return 'B1';
        if (complexity <= 8)
            return 'B2';
        if (complexity <= 9)
            return 'C1';
        return 'C2';
    }
    assessComplexity(question) {
        let complexity = 1;
        if (question.length > 50)
            complexity += 1;
        if (question.length > 100)
            complexity += 1;
        const complexPatterns = [
            /subjonctif/i,
            /conditionnel/i,
            /bien que/i,
            /afin que/i,
            /pourvu que/i
        ];
        complexity += complexPatterns.filter(pattern => pattern.test(question)).length;
        const advancedWords = ['néanmoins', 'cependant', 'toutefois', 'par conséquent'];
        complexity += advancedWords.filter(word => question.toLowerCase().includes(word)).length;
        return Math.min(complexity, 10);
    }
    determineQuestionType(question) {
        if (question.includes('vrai ou faux') || question.includes('true or false')) {
            return 'true_false';
        }
        if (question.includes('a)') || question.includes('1)') || question.includes('choix')) {
            return 'multiple_choice';
        }
        return 'open';
    }
    extractKeywords(question) {
        const words = question.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
        const stopWords = ['dans', 'avec', 'pour', 'vous', 'votre', 'cette', 'comment', 'pourquoi'];
        return words
            .filter(word => !stopWords.includes(word))
            .slice(0, 5);
    }
    assessDifficulty(question) {
        return Math.min(this.assessComplexity(question), 10);
    }
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\?\.!,;:]/g, ' ')
            .trim();
    }
    async getManagerQuestionBanks(managerId) {
        try {
            const questionBanks = await connection_1.prisma.questionBank.findMany({
                where: { managerId },
                orderBy: { createdAt: 'desc' },
            });
            return questionBanks;
        }
        catch (error) {
            console.error('Error getting question banks:', error);
            throw error;
        }
    }
    async getAllQuestionBanks() {
        try {
            const questionBanks = await connection_1.prisma.questionBank.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });
            return questionBanks;
        }
        catch (error) {
            console.error('Error getting all question banks:', error);
            throw error;
        }
    }
    async updateQuestionBankStatus(questionBankId, isActive, userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user || !['SENIOR_MANAGER', 'ADMIN'].includes(user.role)) {
                throw new Error('Insufficient permissions');
            }
            const questionBank = await connection_1.prisma.questionBank.update({
                where: { id: questionBankId },
                data: { isActive }
            });
            return questionBank;
        }
        catch (error) {
            console.error('Error updating question bank status:', error);
            throw error;
        }
    }
    async getQuestionBankStats() {
        try {
            const totalBanks = await connection_1.prisma.questionBank.count();
            const activeBanks = await connection_1.prisma.questionBank.count({
                where: { isActive: true }
            });
            const categoryStats = await connection_1.prisma.questionBank.groupBy({
                by: ['category'],
                _count: true,
                where: { isActive: true }
            });
            const levelStats = await connection_1.prisma.questionBank.groupBy({
                by: ['level'],
                _count: true,
                where: { isActive: true }
            });
            return {
                totalBanks,
                activeBanks,
                categoryStats,
                levelStats
            };
        }
        catch (error) {
            console.error('Error getting question bank stats:', error);
            throw error;
        }
    }
    async searchQuestions(query, limit = 5) {
        try {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return [];
            }
            const questions = await connection_1.prisma.questionBank.findMany({
                where: {
                    OR: [
                        { title: { contains: query.trim(), mode: 'insensitive' } },
                        { description: { contains: query.trim(), mode: 'insensitive' } },
                        { level: { equals: query.trim() } }
                    ],
                    isActive: true
                },
                take: Math.min(limit, 10),
                orderBy: { createdAt: 'desc' }
            }).catch((error) => {
                console.warn('QuestionBank search failed, returning empty array:', error?.message || error);
                return [];
            });
            return questions || [];
        }
        catch (error) {
            console.warn('Error searching questions, returning empty array:', error);
            return [];
        }
    }
}
exports.default = new QuestionBankService();
//# sourceMappingURL=questionBankService.js.map