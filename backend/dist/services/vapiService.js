"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const connection_1 = require("../database/connection");
const i18nService_1 = __importDefault(require("./i18nService"));
class VapiService {
    constructor() {
        this.VOICE_OPTIONS = [
            {
                id: 'france_male_1',
                name: 'Pierre (France)',
                gender: 'MALE',
                accent: 'FRANCE',
                description: 'Voix masculine française professionnelle',
                voiceId: 'CwhRBWXzGAHq8TQ4Fs17'
            },
            {
                id: 'france_female_1',
                name: 'Marie (France)',
                gender: 'FEMALE',
                accent: 'FRANCE',
                description: 'Voix féminine française élégante',
                voiceId: 'EXAVITQu4vr4xnSDxMaL'
            },
            {
                id: 'quebec_male_1',
                name: 'Jean-Baptiste (Québec)',
                gender: 'MALE',
                accent: 'QUEBEC',
                description: 'Voix masculine québécoise authentique',
                voiceId: 'cjVigY5qzO86Huf0OWal'
            },
            {
                id: 'quebec_female_1',
                name: 'Céline (Québec)',
                gender: 'FEMALE',
                accent: 'QUEBEC',
                description: 'Voix féminine québécoise chaleureuse',
                voiceId: 'FGY2WhTYpPnrIDTdsKH5'
            },
            {
                id: 'quebec_male_2',
                name: 'François (Québec)',
                gender: 'MALE',
                accent: 'QUEBEC',
                description: 'Voix masculine québécoise expressive',
                voiceId: 'JBFqnCBsd6RMkjVDRZzb'
            }
        ];
        this.config = {
            apiKey: process.env.VAPI_API_KEY || '0d7d586a-e96e-43b4-84d5-3e9bfe238911',
            baseUrl: process.env.VAPI_BASE_URL || 'https://api.vapi.ai'
        };
        this.publicKey = process.env.VAPI_PUBLIC_KEY || 'cb1632e0-6256-45c2-93ca-798072bba18d';
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    getPublicKey() {
        return this.publicKey;
    }
    getVoiceOptions() {
        return this.VOICE_OPTIONS;
    }
    getVoiceById(voiceId) {
        return this.VOICE_OPTIONS.find(voice => voice.id === voiceId);
    }
    async createFrenchAssistant(voiceId, questions, language = 'fr') {
        const selectedVoice = this.getVoiceById(voiceId);
        if (!selectedVoice) {
            throw new Error(i18nService_1.default.t('voice.voice_not_found', language));
        }
        const voiceSettings = {
            provider: '11labs',
            voiceId: selectedVoice.voiceId,
            speed: 1.0,
            stability: 0.75,
            similarityBoost: 0.75
        };
        const systemPrompt = `Tu es un assistant d'évaluation de français pour les tests TCF/TEF.
    Ton rôle est de conduire une simulation d'entretien oral de 7 minutes pour évaluer le niveau de français du candidat.

    INSTRUCTIONS:
    1. Commence par te présenter et expliquer le déroulement de l'entretien
    2. Utilise les questions de la banque de données pédagogiques pour créer un entretien naturel
    3. Pose des questions adaptées au niveau perçu du candidat
    4. Évalue en temps réel: fluidité, grammaire, vocabulaire, prononciation, cohérence
    5. Prends des notes mentales pour l'évaluation finale
    6. Reste professionnel mais bienveillant et humain dans tes interactions

    BANQUE DE QUESTIONS PÉDAGOGIQUES: ${questions.length > 0 ? JSON.stringify(questions) : 'Utilise tes connaissances TCF/TEF pour créer des questions appropriées'}

    CRITÈRES D'ÉVALUATION DÉTAILLÉS:
    - Fluidité (0-100): Capacité à parler sans hésitations excessives, rythme naturel
    - Grammaire (0-100): Correction grammaticale, structures complexes
    - Vocabulaire (0-100): Richesse, précision, registre approprié
    - Prononciation (0-100): Clarté, accent, intonation
    - Cohérence (0-100): Logique du discours, organisation des idées

    ÉVALUATION FINALE:
    À la fin de l'entretien, tu dois fournir:
    - Score global sur 100
    - Scores détaillés pour chaque critère
    - Commentaires constructifs et encourageants
    - Recommandations pour l'amélioration

    Commence maintenant l'entretien de manière naturelle et humaine.`;
        const assistant = {
            name: `TCF/TEF - ${selectedVoice.name}`,
            model: {
                provider: 'openai',
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    }
                ],
                temperature: 0.7,
                maxTokens: 500
            },
            voice: voiceSettings,
            firstMessage: "Bonjour ! Je suis votre évaluateur pour cette simulation d'entretien oral en français. Nous allons passer environ 7 minutes ensemble. Êtes-vous prêt à commencer ?",
            endCallMessage: "Merci pour cette simulation ! Vous recevrez vos résultats détaillés par email dans quelques minutes. Bonne journée !",
            recordingEnabled: true,
            maxDurationSeconds: 420,
            silenceTimeoutSeconds: 10,
            backgroundDenoisingEnabled: true,
            backchannelingEnabled: true,
            clientMessages: ['transcript', 'hang', 'function-call'],
            serverMessages: ['end-of-call-report', 'status-update', 'hang', 'function-call']
        };
        try {
            const response = await this.axiosInstance.post('/assistant', assistant);
            return response.data;
        }
        catch (error) {
            console.error('Error creating VAPI assistant:', error.response?.data || error.message);
            throw new Error(i18nService_1.default.t('voice.assistant_creation_failed', language));
        }
    }
    async createImmigrationAssistant(voiceId, country, immigrationType, questions, language = 'fr') {
        const selectedVoice = this.getVoiceById(voiceId);
        if (!selectedVoice) {
            throw new Error(i18nService_1.default.t('voice.voice_not_found', language));
        }
        const voiceSettings = {
            provider: '11labs',
            voiceId: selectedVoice.voiceId,
            speed: 1.0,
            stability: 0.75,
            similarityBoost: 0.75
        };
        const countryInfo = {
            'canada': {
                name: 'Canada',
                context: 'immigration au Canada et au Québec',
                procedures: 'les procédures d\'immigration canadiennes et québécoises'
            },
            'france': {
                name: 'France',
                context: 'immigration en France',
                procedures: 'les procédures d\'immigration françaises'
            },
            'belgium': {
                name: 'Belgique',
                context: 'immigration en Belgique',
                procedures: 'les procédures d\'immigration belges'
            }
        };
        const typeInfo = {
            'skilled_worker': 'travailleur qualifié',
            'student': 'étudiant international',
            'family_reunification': 'réunification familiale',
            'work_permit': 'permis de travail',
            'family': 'regroupement familial',
            'work': 'permis de travail'
        };
        const selectedCountry = countryInfo[country] || countryInfo['canada'];
        const selectedType = typeInfo[immigrationType] || 'candidat à l\'immigration';
        const systemPrompt = `Tu es un agent d'immigration expérimenté pour ${selectedCountry.name}.
    Tu conduis un entretien d'immigration officiel avec un candidat pour ${selectedType}.

    CONTEXTE:
    - Pays de destination: ${selectedCountry.name}
    - Type de demande: ${selectedType}
    - Tu représentes les autorités d'immigration de ${selectedCountry.name}
    - Cet entretien détermine l'admissibilité du candidat

    INSTRUCTIONS:
    1. Commence par te présenter comme agent d'immigration
    2. Explique brièvement le processus d'entretien (30-45 minutes)
    3. Utilise les questions fournies pour créer un entretien naturel et professionnel
    4. Évalue: motivation, préparation, crédibilité, niveau de français, projet d'immigration
    5. Pose des questions de suivi pour clarifier les réponses
    6. Reste professionnel, impartial mais humain
    7. Prends des notes mentales pour l'évaluation finale

    CRITÈRES D'ÉVALUATION:
    - Clarté et cohérence des réponses
    - Niveau de français (expression orale)
    - Préparation et connaissance du pays
    - Motivation et projet réaliste
    - Crédibilité des informations fournies

    QUESTIONS DISPONIBLES:
    ${JSON.stringify(questions, null, 2)}

    Commence maintenant l'entretien de manière professionnelle et bienveillante.`;
        const assistant = {
            name: `Immigration ${selectedCountry.name} - ${selectedVoice.name}`,
            model: {
                provider: 'openai',
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    }
                ],
                temperature: 0.7,
                maxTokens: 1000
            },
            voice: voiceSettings,
            firstMessage: `Bonjour, je suis votre agent d'immigration pour ${selectedCountry.name}. Nous allons procéder à votre entretien d'immigration pour votre demande de ${selectedType}. Êtes-vous prêt à commencer ?`,
            endCallMessage: "Merci pour cet entretien. Vous recevrez une évaluation détaillée de votre performance. Bonne journée !",
            recordingEnabled: true,
            hipaaEnabled: false,
            silenceTimeoutSeconds: 30,
            clientMessages: ['conversation-update', 'function-call', 'hang', 'speech-update'],
            serverMessages: ['conversation-update', 'end-of-call-report', 'hang', 'speech-update']
        };
        try {
            const response = await this.axiosInstance.post('/assistant', assistant);
            return response.data;
        }
        catch (error) {
            console.error('Error creating immigration VAPI assistant:', error.response?.data || error.message);
            throw new Error(i18nService_1.default.t('voice.assistant_creation_failed', language));
        }
    }
    async startVoiceSimulation(simulationId, assistantId, language = 'fr') {
        try {
            const call = {
                id: `web-call-${simulationId}`,
                assistantId,
                status: 'active',
                type: 'webCall'
            };
            await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    vapiSessionId: call.id,
                    status: 'ACTIVE'
                }
            });
            return call;
        }
        catch (error) {
            console.error('Error starting VAPI call:', error);
            throw new Error(i18nService_1.default.t('voice.call_start_failed', language));
        }
    }
    async getCallAnalysis(callId) {
        try {
            const response = await this.axiosInstance.get(`/call/${callId}`);
            return response.data;
        }
        catch (error) {
            console.error('Error getting call analysis:', error);
            throw new Error('Failed to get call analysis');
        }
    }
    async endCall(callId) {
        try {
            await this.axiosInstance.post(`/call/${callId}/end`);
        }
        catch (error) {
            console.error('Error ending call:', error);
            throw new Error('Failed to end call');
        }
    }
    async processCallResults(callId, simulationId) {
        try {
            const callData = await this.getCallAnalysis(callId);
            const analysis = await this.analyzeTranscript(callData.transcript || '');
            const updatedSimulation = await connection_1.prisma.voiceSimulation.update({
                where: { id: simulationId },
                data: {
                    status: 'COMPLETED',
                    resultsData: JSON.parse(JSON.stringify(callData)),
                    overallScore: analysis.overallScore,
                    fluencyScore: analysis.fluencyScore,
                    grammarScore: analysis.grammarScore,
                    vocabularyScore: analysis.vocabularyScore,
                    pronunciationScore: analysis.pronunciationScore,
                    coherenceScore: analysis.coherenceScore,
                    feedback: analysis.feedback
                }
            });
            return updatedSimulation;
        }
        catch (error) {
            console.error('Error processing call results:', error);
            throw new Error('Failed to process call results');
        }
    }
    async analyzeTranscript(transcript) {
        if (!transcript || transcript.trim().length === 0) {
            throw new Error('No transcript available for analysis');
        }
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured for transcript analysis');
        }
        try {
            const analysisPrompt = `
Analysez cette transcription d'un entretien oral en français pour les tests TCF/TEF et fournissez une évaluation détaillée.

TRANSCRIPTION:
${transcript}

Évaluez selon ces 5 critères (score de 0 à 100 pour chaque):

1. FLUIDITÉ: Capacité à parler sans hésitations excessives, rythme naturel
2. GRAMMAIRE: Correction grammaticale, structures complexes
3. VOCABULAIRE: Richesse, précision, registre approprié
4. PRONONCIATION: Clarté, accent, intonation (basé sur les répétitions, corrections)
5. COHÉRENCE: Logique du discours, organisation des idées

Répondez UNIQUEMENT avec un JSON dans ce format exact:
{
  "overallScore": number,
  "fluencyScore": number,
  "grammarScore": number,
  "vocabularyScore": number,
  "pronunciationScore": number,
  "coherenceScore": number,
  "feedback": "Commentaires détaillés et constructifs en français avec recommandations spécifiques"
}`;
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un expert en évaluation de français pour les tests TCF/TEF/FLS/FLE. Analyse les transcriptions et fournis des évaluations précises et constructives.'
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const analysisText = response.data.choices[0].message.content;
            try {
                const analysis = JSON.parse(analysisText);
                if (!analysis.overallScore || !analysis.fluencyScore || !analysis.grammarScore ||
                    !analysis.vocabularyScore || !analysis.pronunciationScore || !analysis.coherenceScore) {
                    throw new Error('Invalid analysis response structure');
                }
                return analysis;
            }
            catch (parseError) {
                console.error('Error parsing AI analysis response:', parseError);
                throw new Error('Failed to parse AI analysis response');
            }
        }
        catch (error) {
            console.error('Error analyzing transcript with AI:', error.response?.data || error.message);
            throw new Error(`Failed to analyze transcript: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    async getRandomQuestions(level = 'B1', count = 10) {
        try {
            console.log(`🔍 Fetching questions for level: ${level}, count: ${count}`);
            const questionBanks = await connection_1.prisma.questionBank.findMany({
                where: {
                    isActive: true
                },
                select: {
                    id: true,
                    title: true,
                    extractedQuestions: true,
                    level: true,
                    category: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            console.log(`📚 Found ${questionBanks.length} question banks in database`);
            const allQuestions = [];
            questionBanks.forEach(bank => {
                if (bank.extractedQuestions && Array.isArray(bank.extractedQuestions)) {
                    const levelQuestions = bank.extractedQuestions.filter((q) => !level || q.level === level || q.level?.toLowerCase() === level.toLowerCase());
                    allQuestions.push(...levelQuestions);
                }
                else if (bank.extractedQuestions && typeof bank.extractedQuestions === 'object') {
                    const data = bank.extractedQuestions;
                    if (data.questions && Array.isArray(data.questions)) {
                        const levelQuestions = data.questions.filter((q) => !level || q.level === level || q.level?.toLowerCase() === level.toLowerCase());
                        allQuestions.push(...levelQuestions);
                    }
                }
            });
            console.log(`📝 Found ${allQuestions.length} questions matching level ${level}`);
            if (allQuestions.length === 0) {
                console.log('⚠️ No questions found in database, using fallback questions');
                return this.getDefaultQuestions(level, count);
            }
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            const selectedQuestions = shuffled.slice(0, count);
            console.log(`✅ Returning ${selectedQuestions.length} questions`);
            return selectedQuestions;
        }
        catch (error) {
            console.error('❌ Error getting random questions:', error);
            console.log('🔄 Falling back to default questions');
            return this.getDefaultQuestions(level, count);
        }
    }
    getDefaultQuestions(level = 'B1', count = 10) {
        console.log('⚠️ Using emergency fallback questions - no question banks found in database');
        const emergencyQuestions = [
            {
                id: 'emergency_1',
                text: "Pouvez-vous vous présenter brièvement ?",
                category: "GENERAL",
                level: "B1"
            },
            {
                id: 'emergency_2',
                text: "Parlez-moi de vos projets au Canada.",
                category: "IMMIGRATION",
                level: "B1"
            },
            {
                id: 'emergency_3',
                text: "Décrivez votre expérience professionnelle.",
                category: "WORK",
                level: "B1"
            }
        ];
        console.log(`🔄 Returning ${Math.min(emergencyQuestions.length, count)} emergency questions`);
        return emergencyQuestions.slice(0, count);
    }
}
exports.default = new VapiService();
//# sourceMappingURL=vapiService.js.map