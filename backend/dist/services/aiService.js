"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const logger_1 = require("../utils/logger");
const mistralApiManager = require('../utils/mistralApiManager');
const geminiApiManager = require('../utils/geminiApiManager');
class AIService {
    static async generateGreeting(firstName, lastName) {
        try {
            const hour = new Date().getHours();
            let timeOfDay = '';
            if (hour >= 5 && hour < 12) {
                timeOfDay = 'matin';
            }
            else if (hour >= 12 && hour < 17) {
                timeOfDay = 'après-midi';
            }
            else if (hour >= 17 && hour < 21) {
                timeOfDay = 'soir';
            }
            else {
                timeOfDay = 'nuit';
            }
            const greetings = [
                `Bon ${timeOfDay}, ${firstName}! Prêt pour une nouvelle session d'apprentissage?`,
                `Salut ${firstName}! Comment allez-vous aujourd'hui?`,
                `Bonjour ${firstName}! Votre parcours français vous attend.`,
                `Coucou ${firstName}! Prêt à progresser en français?`,
                `Bon ${timeOfDay} ${firstName}! Continuons votre apprentissage.`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        catch (error) {
            logger_1.logger.error('Error generating greeting:', error);
            return `Bonjour ${firstName}!`;
        }
    }
    static async generateMotivation(firstName) {
        try {
            const motivationalQuotes = [
                "Chaque mot appris vous rapproche de vos rêves.",
                "Votre persévérance en français porte déjà ses fruits.",
                "Chaque erreur est une opportunité d'apprendre.",
                "Votre accent n'est pas un défaut, c'est votre signature unique.",
                "Aujourd'hui est une nouvelle chance de progresser.",
                "Le français vous ouvre les portes du monde.",
                "Votre détermination inspire les autres.",
                "Chaque session d'étude vous rend plus fort.",
                "Vos efforts d'aujourd'hui sont les succès de demain.",
                "La maîtrise du français est à votre portée."
            ];
            return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        }
        catch (error) {
            logger_1.logger.error('Error generating motivation:', error);
            return "Chaque mot appris vous rapproche de vos rêves.";
        }
    }
    static async generateWeatherMessage(country) {
        try {
            const weatherMessages = {
                'Canada': [
                    "Il fait frais au Canada aujourd'hui, parfait pour étudier à l'intérieur!",
                    "Le temps canadien est idéal pour une session d'étude confortable.",
                    "Profitez du temps pour vous concentrer sur votre français."
                ],
                'France': [
                    "Le temps en France est magnifique pour apprendre le français!",
                    "Quel beau jour pour pratiquer votre français!",
                    "Le climat français inspire l'apprentissage."
                ],
                'Belgium': [
                    "Le temps belge est parfait pour une session d'étude.",
                    "Profitez du temps pour améliorer votre français.",
                    "Le climat belge favorise la concentration."
                ],
                'Switzerland': [
                    "Le temps suisse est idéal pour apprendre le français.",
                    "Profitez de l'air frais pour étudier.",
                    "Le climat suisse favorise l'apprentissage."
                ],
                'default': [
                    "Bonne journée pour apprendre le français!",
                    "Le temps est parfait pour une session d'étude.",
                    "Profitez de cette belle journée pour progresser."
                ]
            };
            const messages = weatherMessages[country] || weatherMessages.default;
            return messages[Math.floor(Math.random() * messages.length)];
        }
        catch (error) {
            logger_1.logger.error('Error generating weather message:', error);
            return "Bonne journée pour apprendre le français!";
        }
    }
    static async generateStudyRecommendations(userId) {
        try {
            return [
                {
                    id: 1,
                    type: 'test',
                    title: 'Test de vocabulaire avancé',
                    description: 'Améliorez votre vocabulaire avec des mots complexes',
                    difficulty: 'Intermédiaire',
                    time: '15 min',
                    reward: '50 XP'
                },
                {
                    id: 2,
                    type: 'course',
                    title: 'Grammaire française',
                    description: 'Maîtrisez les règles de grammaire essentielles',
                    difficulty: 'Débutant',
                    time: '20 min',
                    reward: '75 XP'
                },
                {
                    id: 3,
                    type: 'practice',
                    title: 'Expression orale',
                    description: 'Pratiquez votre prononciation française',
                    difficulty: 'Avancé',
                    time: '10 min',
                    reward: '100 XP'
                }
            ];
        }
        catch (error) {
            logger_1.logger.error('Error generating study recommendations:', error);
            return [];
        }
    }
    static async generateDailyTip() {
        try {
            const tips = [
                "Pratiquez l'expression orale 10 minutes par jour pour améliorer votre fluidité de 40% en 2 semaines.",
                "Écoutez de la musique française pour améliorer votre compréhension orale naturellement.",
                "Lisez un article de journal français chaque jour pour enrichir votre vocabulaire.",
                "Pratiquez avec un partenaire de conversation pour gagner en confiance.",
                "Utilisez des flashcards pour mémoriser efficacement le vocabulaire.",
                "Regardez des films français avec sous-titres pour améliorer votre écoute.",
                "Écrivez un journal en français pour pratiquer l'expression écrite.",
                "Rejoignez des groupes de conversation française pour pratiquer régulièrement."
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }
        catch (error) {
            logger_1.logger.error('Error generating daily tip:', error);
            return "Pratiquez l'expression orale 10 minutes par jour pour améliorer votre fluidité.";
        }
    }
    static async generateResponse(params) {
        try {
            const { message, systemPrompt, context } = params;
            let text = '';
            try {
                text = await mistralApiManager.generateContent(message, {
                    systemPrompt: systemPrompt,
                    maxTokens: 300,
                    temperature: 0.8,
                    model: 'mistral-small-latest'
                });
                text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
                text = text.replace(/\*([^*]+)\*/g, '$1');
                text = text.replace(/\*\*\*/g, '');
                text = text.replace(/\*\*/g, '');
                text = text.replace(/\*/g, '');
            }
            catch (mistralError) {
                logger_1.logger.warn('Mistral AI failed, falling back to Gemini:', mistralError?.message);
                const response = await geminiApiManager.makeRequest(async (model) => {
                    const prompt = `${systemPrompt}\n\nMessage: ${message}\n\nRéponds CONCISEMENT en français. Pas d'astérisques.`;
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    let text = response.text();
                    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
                    text = text.replace(/\*([^*]+)\*/g, '$1');
                    text = text.replace(/\*\*\*/g, '');
                    text = text.replace(/\*\*/g, '');
                    text = text.replace(/\*/g, '');
                    return text;
                });
                text = response;
            }
            return {
                content: text,
                confidence: 0.9
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating AI response:', {
                message: error?.message,
                status: error?.status || error?.statusCode,
                code: error?.code,
                response: error?.response?.data || error?.response,
                stack: error?.stack
            });
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED') ||
                error?.status === 429 || error?.statusCode === 429 || error?.code === 429) {
                throw new Error("QUOTA_EXCEEDED: Désolé, j'ai atteint ma limite de requêtes pour ce mois. Veuillez réessayer le mois prochain ou contactez le support pour plus d'informations.");
            }
            else if (errorMessage.includes('API key') || errorMessage.includes('AUTH_ERROR') ||
                error?.status === 400 || error?.statusCode === 400 || error?.status === 403 || error?.statusCode === 403) {
                throw new Error("AUTH_ERROR: Désolé, je rencontre un problème d'authentification avec le service IA. Veuillez contacter le support technique.");
            }
            else {
                throw new Error(`AI_SERVICE_ERROR: ${errorMessage}`);
            }
        }
    }
    static async generateContent(prompt) {
        try {
            return await geminiApiManager.generateContent(async (model) => {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating AI content:', error);
            throw new Error('Failed to generate AI content');
        }
    }
    static async generateNotes(content, lessonTitle, courseTitle, transcription) {
        const sourceContent = transcription || content;
        const prompt = `
      Vous êtes un assistant IA spécialisé dans l'éducation du français. 
      Générez des notes de cours structurées et utiles basées sur la transcription suivante:
      
      Cours: ${courseTitle}
      Leçon: ${lessonTitle}
      Transcription: ${sourceContent}
      
      Veuillez générer 5-7 notes clés qui résument les points importants de cette leçon basées sur la transcription.
      Chaque note doit être concise (1-2 phrases) et pédagogique.
      Format de réponse: Liste de notes, une par ligne, sans numérotation.
    `;
        const response = await geminiApiManager.generateContent(async (model) => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
        const notes = response
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(0, 7);
        return { notes };
    }
    static async generateQuestions(content, lessonTitle, courseTitle, questionCount = 5, questionTypes = ["multiple-choice", "true-false", "short-answer"], category, difficulty, transcription, audioUrl, videoUrl, minWords, maxWords, writingType) {
        const difficultyInstructions = {
            "easy": "Questions simples et directes, vocabulaire basique, concepts fondamentaux",
            "medium": "Questions de niveau intermédiaire, vocabulaire courant, application des règles",
            "hard": "Questions complexes, vocabulaire avancé, analyse et synthèse",
            "expert": "Questions très difficiles, vocabulaire spécialisé, réflexion critique et créative"
        };
        const categoryInstructions = {
            "grammar": "Questions de grammaire française: conjugaisons, accords, syntaxe, temps verbaux. Format TCF/TEF: MCQ avec 4 options, questions de complétion, transformations de phrases.",
            "vocabulary": "Questions de vocabulaire: définitions, synonymes, antonymes, usage contextuel. Format TCF/TEF: MCQ avec 4 options, choix du bon mot dans le contexte, complétion de phrases.",
            "listening": "Questions de compréhension orale: détails, idées principales, contexte, ton",
            "reading": "Questions de compréhension écrite: analyse de texte, inférence, structure. IMPORTANT: Le passage doit être SÉPARÉ de la question.",
            "writing": "Questions d'expression écrite: rédaction, style, cohérence",
            "oral": "Questions d'expression orale: prononciation, fluidité, communication"
        };
        console.log('🔍 AI Generation - Content Analysis:', {
            contentLength: content?.length || 0,
            contentPreview: content?.substring(0, 200) || 'NO CONTENT',
            transcriptionLength: transcription?.length || 0,
            hasValidContent: !!(content && content.trim().length > 100)
        });
        const sourceContent = transcription || content;
        if (!sourceContent || sourceContent.trim().length < 100) {
            console.error('❌ INSUFFICIENT CONTENT FOR QUESTION GENERATION:', {
                contentLength: sourceContent?.length || 0,
                contentPreview: sourceContent?.substring(0, 100) || 'EMPTY'
            });
            throw new Error('Document content is too short or empty. Please ensure the PDF/document contains readable text content before generating questions.');
        }
        const validQuestionCount = Math.min(Math.max(1, questionCount), 100);
        if (validQuestionCount !== questionCount) {
            console.log(`⚠️ Question count adjusted from ${questionCount} to ${validQuestionCount}`);
        }
        const effectiveContent = sourceContent.trim();
        console.log('📝 AI Generation Input:', {
            originalContentLength: content.length,
            effectiveContentLength: effectiveContent.length,
            contentPreview: effectiveContent.substring(0, 300),
            lessonTitle,
            courseTitle,
            questionCount,
            validQuestionCount,
            category,
            difficulty,
            hasRealContent: effectiveContent.length > 100
        });
        const isExpressionEcrite = category === 'expression_ecrite' || category === 'writing' || category === 'WRITING';
        const isListening = category === 'listening';
        const isReading = category === 'reading';
        const expressionEcriteMinWords = minWords || 150;
        const expressionEcriteMaxWords = maxWords || 300;
        const expressionEcriteWritingType = writingType || 'essay';
        let prompt;
        if (isExpressionEcrite) {
            prompt = this.getExpressionEcritePrompt(effectiveContent, courseTitle, lessonTitle, validQuestionCount, difficulty, questionTypes, expressionEcriteMinWords, expressionEcriteMaxWords, expressionEcriteWritingType);
        }
        else if (isListening) {
            prompt = this.getListeningComprehensionPrompt(effectiveContent, courseTitle, lessonTitle, validQuestionCount, difficulty, questionTypes, audioUrl, videoUrl);
        }
        else if (isReading) {
            prompt = this.getReadingComprehensionPrompt(effectiveContent, courseTitle, lessonTitle, validQuestionCount, difficulty, questionTypes);
        }
        else if (category === 'grammar' || category === 'vocabulary') {
            prompt = this.getVocabularyGrammarPrompt(effectiveContent, courseTitle, lessonTitle, validQuestionCount, category, difficulty || 'medium', questionTypes);
        }
        else {
            prompt = this.getStandardPrompt(effectiveContent, courseTitle, lessonTitle, validQuestionCount, category, difficulty, questionTypes, categoryInstructions, difficultyInstructions);
        }
        try {
            let allQuestions = [];
            const batchSize = validQuestionCount > 50 ? 25 : validQuestionCount;
            const batches = Math.ceil(validQuestionCount / batchSize);
            console.log(`🔄 Generating ${validQuestionCount} questions in ${batches} batch(es) of ${batchSize} questions each`);
            for (let batch = 0; batch < batches; batch++) {
                const currentBatchSize = batch === batches - 1 ? (validQuestionCount - allQuestions.length) : batchSize;
                let batchPrompt = prompt;
                if (category === 'grammar' || category === 'vocabulary') {
                    batchPrompt = prompt.replace(`Créez ${validQuestionCount} questions BASÉES sur ce passage`, `Créez ${currentBatchSize} questions BASÉES sur ce passage (lot ${batch + 1}/${batches})`).replace(`Générez EXACTEMENT ${validQuestionCount} questions avec passage séparé`, `Générez EXACTEMENT ${currentBatchSize} questions avec passage séparé (lot ${batch + 1}/${batches})`);
                }
                else {
                    batchPrompt = prompt.replace(`Générez EXACTEMENT ${validQuestionCount} questions/SUJETS DÉTAILLÉS`, `Générez EXACTEMENT ${currentBatchSize} questions/SUJETS DÉTAILLÉS (lot ${batch + 1}/${batches})`).replace(`Vous devez générer ${validQuestionCount} questions/SUJETS DÉTAILLÉS`, `Vous devez générer ${currentBatchSize} questions/SUJETS DÉTAILLÉS pour ce lot (${batch + 1}/${batches})`).replace(`Générez EXACTEMENT ${questionCount} questions DÉTAILLÉES et UNIQUES`, `Générez EXACTEMENT ${currentBatchSize} questions DÉTAILLÉES et UNIQUES (lot ${batch + 1}/${batches})`);
                }
                const response = await geminiApiManager.generateContent(async (model) => {
                    const result = await model.generateContent(batchPrompt);
                    const response = await result.response;
                    return response.text();
                });
                console.log(`🤖 AI Response (Batch ${batch + 1}/${batches}):`, response.substring(0, 300) + '...');
                try {
                    console.log(`🔍 Raw AI Response (Batch ${batch + 1}):`, response.substring(0, 1000));
                    let parsed = null;
                    const jsonMatch = response.match(/\{[\s\S]*?"questions"[\s\S]*?\]/);
                    if (jsonMatch) {
                        try {
                            let jsonStr = jsonMatch[0];
                            const openBraces = (jsonStr.match(/\{/g) || []).length;
                            const closeBraces = (jsonStr.match(/\}/g) || []).length;
                            if (openBraces > closeBraces) {
                                jsonStr += '}';
                            }
                            const cleanedJson = jsonStr
                                .replace(/,\s*}/g, '}')
                                .replace(/,\s*]/g, ']')
                                .replace(/(\w+):/g, '"$1":')
                                .replace(/"(\w+)":/g, '"$1":')
                                .replace(/:\s*([^",\[\{][^,\]\}]*)/g, ':"$1"')
                                .replace(/:"(\d+)"/g, ':$1')
                                .replace(/:"(true|false)"/g, ':$1')
                                .replace(/:"null"/g, ':null');
                            console.log(`🧹 Cleaned JSON (Batch ${batch + 1}):`, cleanedJson.substring(0, 500));
                            parsed = JSON.parse(cleanedJson);
                        }
                        catch (cleanError) {
                            console.log(`❌ JSON cleaning failed (Batch ${batch + 1}):`, cleanError.message);
                        }
                    }
                    if (!parsed) {
                        try {
                            parsed = JSON.parse(response);
                        }
                        catch (fullParseError) {
                            console.log(`❌ Full JSON parse failed (Batch ${batch + 1}):`, fullParseError.message);
                        }
                    }
                    if (!parsed) {
                        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                        if (codeBlockMatch) {
                            try {
                                parsed = JSON.parse(codeBlockMatch[1]);
                                console.log(`✅ Extracted JSON from code block (Batch ${batch + 1})`);
                            }
                            catch (codeBlockError) {
                                console.log(`❌ Code block JSON parse failed (Batch ${batch + 1}):`, codeBlockError.message);
                            }
                        }
                    }
                    if (parsed && parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                        console.log(`✅ Successfully parsed JSON response (Batch ${batch + 1}): ${parsed.questions.length} questions`);
                        const questionsWithPassage = parsed.questions.map((q) => {
                            const passage = q.passage || parsed.passage || null;
                            return {
                                ...q,
                                passage: passage
                            };
                        });
                        allQuestions.push(...questionsWithPassage);
                        continue;
                    }
                    else {
                        console.log(`❌ Invalid JSON structure (Batch ${batch + 1}):`, {
                            hasParsed: !!parsed,
                            hasQuestions: parsed?.questions ? true : false,
                            isArray: Array.isArray(parsed?.questions),
                            questionCount: parsed?.questions?.length || 0
                        });
                    }
                }
                catch (parseError) {
                    console.log(`❌ Failed to parse JSON (Batch ${batch + 1}):`, parseError.message);
                }
                try {
                    const questionMatches = response.match(/"questionText":\s*"([^"]+)"/g);
                    if (questionMatches && questionMatches.length > 0) {
                        console.log(`🔍 Found question text matches (Batch ${batch + 1}):`, questionMatches.length);
                        const batchQuestions = questionMatches.slice(0, currentBatchSize).map((match, index) => {
                            const questionText = match.match(/"questionText":\s*"([^"]+)"/)?.[1] || `Question ${allQuestions.length + index + 1}`;
                            const questionType = questionTypes[(allQuestions.length + index) % questionTypes.length];
                            return {
                                questionText,
                                type: questionType,
                                options: questionType === "multiple-choice" ? this.generateRealisticOptions(effectiveContent, category, allQuestions.length + index) : [],
                                correctAnswer: questionType === "multiple-choice" ? this.getRandomCorrectAnswer(allQuestions.length + index) : questionType === "true-false" ? (Math.random() > 0.5 ? "true" : "false") : "Réponse attendue basée sur le contenu",
                                explanation: `Explication détaillée pour la question ${allQuestions.length + index + 1}`,
                                passage: null,
                                points: 1,
                                category: category || 'GENERAL',
                                level: difficulty || 'B1'
                            };
                        });
                        console.log(`✅ Extracted ${batchQuestions.length} questions from text (Batch ${batch + 1})`);
                        allQuestions.push(...batchQuestions);
                        continue;
                    }
                }
                catch (extractError) {
                    console.log(`❌ Failed to extract questions from text (Batch ${batch + 1}):`, extractError.message);
                }
                console.log(`🔄 Using fallback question generation (Batch ${batch + 1})`);
                for (let i = 0; i < currentBatchSize; i++) {
                    const globalIndex = allQuestions.length + i;
                    const questionType = questionTypes[globalIndex % questionTypes.length];
                    let questionText = "";
                    let options = [];
                    let correctAnswer = Math.floor(Math.random() * 4);
                    if (questionType === "multiple-choice") {
                        if (category === "grammar") {
                            questionText = `Pouvez-vous expliquer en détail la règle de grammaire correcte pour cette phrase, en incluant les accords, la conjugaison, et les temps verbaux appropriés ?`;
                            options = [
                                "Règle A - Conjugaison correcte avec accords appropriés",
                                "Règle B - Accord correct avec syntaxe appropriée",
                                "Règle C - Syntaxe appropriée avec temps verbaux adaptés",
                                "Règle D - Temps verbal adapté avec structure correcte"
                            ];
                        }
                        else if (category === "vocabulary") {
                            questionText = `Pouvez-vous expliquer en détail le sens de ce mot dans ce contexte, en incluant les synonymes, les antonymes, et les nuances d'usage ?`;
                            options = [
                                "Définition A avec contexte et nuances",
                                "Définition B avec synonymes et usage",
                                "Définition C avec antonymes et registre",
                                "Définition D avec contexte complet"
                            ];
                        }
                        else if (category === "listening") {
                            questionText = `Pouvez-vous expliquer en détail ce que dit la personne dans l'enregistrement, en incluant le contexte, le ton, et les détails importants ?`;
                            options = [
                                "Réponse A avec contexte détaillé",
                                "Réponse B avec ton et nuances",
                                "Réponse C avec détails importants",
                                "Réponse D avec analyse complète"
                            ];
                        }
                        else {
                            questionText = `Pouvez-vous expliquer en détail les aspects essentiels de cette question sur le contenu étudié, en couvrant tous les éléments importants et les implications pratiques ?`;
                            options = this.generateRealisticOptions(effectiveContent, category, globalIndex);
                        }
                        correctAnswer = Math.floor(Math.random() * 4);
                    }
                    else if (questionType === "true-false") {
                        if (category === "grammar") {
                            questionText = `Cette phrase respecte-t-elle les règles de grammaire française ? Expliquez en détail pourquoi, en incluant les règles spécifiques, les accords, et les exceptions éventuelles.`;
                        }
                        else if (category === "vocabulary") {
                            questionText = `Ce mot a-t-il le sens donné dans ce contexte ? Expliquez en détail pourquoi, en incluant les nuances, le registre, et les usages possibles.`;
                        }
                        else if (category === "listening") {
                            questionText = `L'enregistrement mentionne-t-il cette information ? Expliquez en détail pourquoi, en incluant le contexte, les détails, et les implications.`;
                        }
                        else {
                            questionText = `Cette affirmation est-elle correcte ? Expliquez en détail pourquoi, en incluant tous les aspects essentiels, les nuances, et les implications pratiques.`;
                        }
                        correctAnswer = "true";
                    }
                    else if (questionType === "short-answer") {
                        if (category === "grammar") {
                            questionText = `Expliquez en détail la règle de grammaire appliquée dans cette phrase, en incluant tous les aspects pertinents, les exceptions, et les nuances.`;
                        }
                        else if (category === "vocabulary") {
                            questionText = `Définissez ce terme en détail dans votre propre vocabulaire, en incluant le contexte, les synonymes, et les usages possibles.`;
                        }
                        else if (category === "listening") {
                            questionText = `Résumez en détail le contenu principal de l'enregistrement, en incluant les points clés, le contexte, et les implications.`;
                        }
                        else {
                            questionText = `Répondez en détail à cette question, en couvrant tous les aspects essentiels, les nuances, et les implications pratiques du contenu étudié.`;
                        }
                        correctAnswer = "Réponse attendue détaillée selon le contenu";
                    }
                    allQuestions.push({
                        questionText,
                        type: questionType,
                        options: questionType === "multiple-choice" ? options : [],
                        correctAnswer,
                        explanation: `Explication détaillée et complète pour la question ${globalIndex + 1}, couvrant tous les aspects essentiels et les nuances importantes.`,
                        passage: null,
                        points: 1,
                        category: category || 'GENERAL',
                        level: difficulty || 'B1'
                    });
                }
                console.log(`✅ Generated ${currentBatchSize} structured questions (Batch ${batch + 1})`);
            }
            const finalQuestions = allQuestions.slice(0, validQuestionCount);
            if (finalQuestions.length < validQuestionCount) {
                console.log(`⚠️ Only ${finalQuestions.length} questions generated, requested ${validQuestionCount}. Generating ${validQuestionCount - finalQuestions.length} more...`);
                while (finalQuestions.length < validQuestionCount) {
                    const remainingCount = questionCount - finalQuestions.length;
                    const questionIndex = finalQuestions.length + 1;
                    const questionType = questionTypes[finalQuestions.length % questionTypes.length];
                    const contentParts = content.split(/[.!?]\s+/).filter(p => p.length > 20);
                    const partIndex = finalQuestions.length % Math.max(1, contentParts.length);
                    const contentPart = contentParts[partIndex] || content.substring(0, 200);
                    let questionText = "";
                    let options = [];
                    let correctAnswer = 0;
                    if (questionType === "multiple-choice") {
                        const aspects = [
                            "Quelle est la règle principale concernant",
                            "Comment expliquez-vous",
                            "Quel est le concept clé de",
                            "Quelle est la différence entre",
                            "Quel est le principe de",
                            "Comment identifier",
                            "Quelle est l'importance de",
                            "Comment appliquer",
                            "Quel est le mécanisme de",
                            "Comment distinguer"
                        ];
                        const aspectIndex = finalQuestions.length % aspects.length;
                        questionText = `${aspects[aspectIndex]} ${contentPart.substring(0, 150)} ?`;
                        options = this.generateRealisticOptions(effectiveContent, category, questionIndex);
                        correctAnswer = Math.floor(Math.random() * 4);
                    }
                    else if (questionType === "true-false") {
                        const statements = [
                            `Selon le contenu, cette affirmation est correcte: ${contentPart.substring(0, 100)}`,
                            `Cette affirmation est vraie concernant le contenu: ${contentPart.substring(0, 100)}`,
                            `Cette règle s'applique selon le contenu: ${contentPart.substring(0, 100)}`,
                            `Cette information est correcte: ${contentPart.substring(0, 100)}`
                        ];
                        const statementIndex = finalQuestions.length % statements.length;
                        questionText = statements[statementIndex];
                        correctAnswer = "true";
                    }
                    else {
                        const prompts = [
                            "Expliquez en détail",
                            "Décrivez précisément",
                            "Analysez les aspects de",
                            "Résumez les concepts de",
                            "Définissez les termes de",
                            "Illustrez avec des exemples",
                            "Comparez les différentes approches de",
                            "Évaluez l'importance de"
                        ];
                        const promptIndex = finalQuestions.length % prompts.length;
                        questionText = `${prompts[promptIndex]} ${contentPart.substring(0, 150)} ?`;
                        correctAnswer = `Réponse attendue basée sur l'analyse de ${contentPart.substring(0, 100)}`;
                    }
                    finalQuestions.push({
                        questionText,
                        type: questionType,
                        options: questionType === "multiple-choice" ? options : [],
                        correctAnswer,
                        explanation: `Explication détaillée pour la question ${questionIndex} basée sur le contenu fourni`,
                        points: 1,
                        category: category || 'GENERAL',
                        level: difficulty || 'B1'
                    });
                }
            }
            console.log(`✅ Returning exactly ${finalQuestions.length} questions (requested: ${validQuestionCount})`);
            return { questions: finalQuestions };
        }
        catch (error) {
            console.error('❌ Error generating questions:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                contentLength: content.length,
                lessonTitle,
                courseTitle,
                questionCount
            });
            console.log(`⚠️ Using fallback question generation due to error: ${error.message}`);
            const fallbackQuestions = [];
            const fallbackCount = Math.min(Math.max(1, questionCount), 100);
            for (let i = 0; i < fallbackCount; i++) {
                const questionType = questionTypes[i % questionTypes.length];
                let questionText = "";
                let options = [];
                let correctAnswer = 0;
                if (questionType === "multiple-choice") {
                    questionText = `Question ${i + 1}: ${lessonTitle || courseTitle || 'Sujet d\'examen'} - ${categoryInstructions[category] || 'Question générale'}`;
                    options = this.generateRealisticOptions(effectiveContent || content, category, i);
                    correctAnswer = Math.floor(Math.random() * 4);
                }
                else if (questionType === "true-false") {
                    questionText = `Question ${i + 1}: ${lessonTitle || courseTitle || 'Sujet d\'examen'} - Cette affirmation est correcte selon le contenu.`;
                    correctAnswer = "true";
                    options = [];
                }
                else {
                    questionText = `Question ${i + 1}: ${lessonTitle || courseTitle || 'Sujet d\'examen'} - Expliquez en détail.`;
                    correctAnswer = "Réponse attendue basée sur le contenu";
                    options = [];
                }
                fallbackQuestions.push({
                    questionText,
                    type: questionType,
                    options,
                    correctAnswer,
                    explanation: `Explication détaillée pour la question ${i + 1} basée sur ${lessonTitle || courseTitle || 'le sujet d\'examen'}`,
                    points: 1,
                    category: category || 'GENERAL',
                    level: difficulty || 'B1'
                });
            }
            return { questions: fallbackQuestions };
        }
    }
    static getVocabularyGrammarPrompt(content, courseTitle, lessonTitle, questionCount, category, difficulty, questionTypes) {
        const categoryName = category === 'vocabulary' ? 'VOCABULAIRE' : 'GRAMMAIRE';
        const categorySpecific = category === 'vocabulary'
            ? `Questions de vocabulaire français selon le format TCF/TEF:
- MCQ: Choisir le bon mot dans le contexte (4 options)
- Complétion: Compléter une phrase avec le mot approprié
- Synonyme/Antonyme: Identifier les relations entre mots
- Usage contextuel: Choisir le mot qui convient au registre de langue`
            : `Questions de grammaire française selon le format TCF/TEF:
- MCQ: Choisir la bonne forme verbale, accord, syntaxe (4 options)
- Complétion: Compléter avec la bonne conjugaison/accord
- Transformation: Transformer une phrase selon une règle grammaticale
- Identification: Identifier l'erreur grammaticale`;
        return `
Vous êtes un expert en création de questions TCF/TEF pour le ${categoryName}.

CONTENU SOURCE (extrait du PDF):
"${content.substring(0, 6000)}${content.length > 6000 ? '...[contenu tronqué]' : ''}"

MISSION CRITIQUE:
1. EXTRACTION DU PASSAGE: Identifiez un passage de 50-150 mots dans le contenu source qui servira de CONTEXTE
2. GÉNÉRATION DE QUESTIONS: Créez ${questionCount} questions BASÉES sur ce passage, mais les questions NE DOIVENT PAS répéter le passage

RÈGLES ABSOLUES:
- Le PASSAGE et la QUESTION doivent être COMPLÈTEMENT DIFFÉRENTS
- Le passage = texte à lire/comprendre
- La question = ce qui teste la compréhension/application
- Format TCF/TEF strict: 4 options pour MCQ, une seule bonne réponse

${categorySpecific}

NIVEAU: ${difficulty || 'moyen'}
TYPES DE QUESTIONS: ${questionTypes.join(', ')}

FORMAT DE RÉPONSE JSON (OBLIGATOIRE):
{
  "passage": "Passage de 50-150 mots extrait du contenu (SÉPARÉ des questions)",
  "questions": [
    {
      "passage": "Passage spécifique pour cette question (peut être le même pour toutes ou varier)",
      "questionText": "Question courte et claire (10-20 mots max) selon format TCF/TEF",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication courte de la réponse (30-50 mots)",
      "points": 1,
      "category": "${category.toUpperCase()}",
      "level": "${difficulty || 'B1'}"
    }
  ]
}

EXEMPLES POUR ${categoryName}:

PASSAGE (exemple):
"Le musée sera fermé lundi pour travaux. Les visiteurs devront attendre mardi pour la réouverture."

QUESTION (correcte):
"Quand le musée sera-t-il fermé ?"
Options: ["Samedi", "Dimanche", "Lundi", "Mardi"]
CorrectAnswer: 2

QUESTION (incorrecte - NE PAS FAIRE):
"Le musée sera fermé lundi pour travaux. Les visiteurs devront attendre mardi pour la réouverture. Quand le musée sera-t-il fermé ?"
❌ Cette question répète le passage - INTERDIT!

Générez EXACTEMENT ${questionCount} questions avec passage séparé.
Réponds UNIQUEMENT avec le JSON valide.
`;
    }
    static getExpressionEcritePrompt(content, courseTitle, lessonTitle, questionCount, difficulty, questionTypes, minWords, maxWords, writingType) {
        const writingTypeNames = {
            'article': 'un article',
            'essay': 'un essai',
            'letter': 'une lettre'
        };
        const writingTypeName = writingTypeNames[writingType] || 'un texte';
        return `
Vous êtes un expert en création de prompts d'EXPRESSION ÉCRITE pour les tests TCF/TEF.

CONTENU SOURCE (extrait du PDF/document):
"${content.substring(0, 6000)}${content.length > 6000 ? '...[contenu tronqué]' : ''}"

MISSION CRITIQUE:
1. EXTRACTION DU PASSAGE: Identifiez un passage de 200-800 mots dans le contenu source qui servira de CONTEXTE pour l'écriture
2. GÉNÉRATION DE PROMPTS D'ÉCRITURE: Créez ${questionCount} prompts d'expression écrite BASÉS sur ce passage
3. TYPE D'ÉCRITURE: ${writingTypeName} (${writingType})
4. LIMITES DE MOTS: Minimum ${minWords} mots, Maximum ${maxWords} mots

RÈGLES ABSOLUES:
- Le PASSAGE doit être LONG (200-800 mots) pour donner suffisamment de contexte
- Le PROMPT doit demander à l'étudiant d'écrire ${writingTypeName} basé sur le passage
- Le prompt doit tester le VOCABULAIRE et la GRAMMAIRE à travers l'écriture
- Format TCF/TEF strict: prompts clairs et précis

FORMAT DE RÉPONSE JSON (OBLIGATOIRE):
{
  "questions": [
    {
      "passage": "Passage de 200-800 mots extrait du contenu (contexte pour l'écriture)",
      "questionText": "Prompt d'écriture: Écrivez ${writingTypeName} de ${minWords}-${maxWords} mots sur [sujet basé sur le passage]. Votre texte doit montrer une bonne maîtrise du vocabulaire et de la grammaire française.",
      "type": "essay",
      "options": [],
      "correctAnswer": "Réponse attendue: ${writingTypeName} de ${minWords}-${maxWords} mots démontrant vocabulaire riche et grammaire correcte",
      "explanation": "L'évaluation portera sur: vocabulaire (richesse, précision), grammaire (conjugaison, accords, syntaxe), structure (introduction, développement, conclusion), cohérence et pertinence.",
      "points": 10,
      "category": "WRITING",
      "level": "${difficulty || 'B1'}"
    }
  ]
}

EXEMPLES DE PROMPTS D'EXPRESSION ÉCRITE:

PASSAGE (exemple):
"La technologie transforme notre façon de communiquer. Les réseaux sociaux permettent de rester en contact avec des amis éloignés, mais certains craignent que cela réduise les interactions en personne. Il est important de trouver un équilibre entre communication numérique et relations humaines authentiques."

PROMPT ARTICLE (correct):
"Écrivez un article de ${minWords}-${maxWords} mots sur l'impact des réseaux sociaux sur les relations humaines. Utilisez le passage ci-dessus comme point de départ. Votre article doit inclure une introduction, un développement avec des arguments, et une conclusion. Montrez votre maîtrise du vocabulaire et de la grammaire française."

PROMPT ESSAI (correct):
"Rédigez un essai de ${minWords}-${maxWords} mots analysant les avantages et inconvénients de la communication numérique. Basez-vous sur le passage fourni. Structurez votre essai avec une introduction, des paragraphes de développement, et une conclusion. Utilisez un vocabulaire riche et varié, et veillez à la correction grammaticale."

PROMPT LETTRE (correct):
"Écrivez une lettre de ${minWords}-${maxWords} mots à un ami pour discuter de votre opinion sur les réseaux sociaux et les relations humaines. Utilisez le passage comme inspiration. Votre lettre doit être formelle ou informelle selon le contexte, avec un vocabulaire approprié et une grammaire correcte."

Générez EXACTEMENT ${questionCount} prompts d'expression écrite avec passages longs (200-800 mots).
Réponds UNIQUEMENT avec le JSON valide.
`;
    }
    static getListeningComprehensionPrompt(transcription, courseTitle, lessonTitle, questionCount, difficulty, questionTypes, audioUrl, videoUrl) {
        return `
Vous êtes un expert en création de questions TCF/TEF pour la COMPRÉHENSION ORALE.

TRANSCRIPTION DU CONTENU AUDIO/VIDÉO:
"${transcription.substring(0, 6000)}${transcription.length > 6000 ? '...[transcription tronquée]' : ''}"

MISSION CRITIQUE:
1. ANALYSE: Analysez la transcription pour identifier les points clés, détails, contexte, ton, et informations importantes
2. GÉNÉRATION: Créez ${questionCount} questions BASÉES sur cette transcription selon le format TCF/TEF strict

RÈGLES ABSOLUES POUR COMPRÉHENSION ORALE:
- Format TCF/TEF: MCQ avec 4 options, une seule bonne réponse
- Questions doivent tester: détails spécifiques, idées principales, contexte, ton, inférence
- Les questions NE DOIVENT PAS répéter la transcription mot pour mot
- Chaque question doit être claire et testable après une seule écoute
- Options doivent être plausibles mais une seule est correcte

TYPES DE QUESTIONS AUTORISÉS:
- MCQ: Choisir la bonne réponse parmi 4 options après avoir écouté
- True/False: Vrai ou Faux basé sur le contenu audio/vidéo

NIVEAU: ${difficulty || 'moyen'}
TYPES DE QUESTIONS: ${questionTypes.join(', ')}

FORMAT DE RÉPONSE JSON (OBLIGATOIRE):
{
  "questions": [
    {
      "questionText": "Question courte et claire (10-20 mots max) selon format TCF/TEF",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication courte de la réponse (30-50 mots)",
      "points": 1,
      "category": "LISTENING",
      "level": "${difficulty || 'B1'}"
    }
  ]
}

EXEMPLES POUR COMPRÉHENSION ORALE:

TRANSCRIPTION (exemple):
"Demain, il fera beau. On pourra aller à la plage. N'oubliez pas votre crème solaire."

QUESTION (correcte):
"Que prévoit la météo pour demain ?"
Options: ["Il va pleuvoir", "Il va faire beau", "Il va neiger", "Il fera froid"]
CorrectAnswer: 1

Générez EXACTEMENT ${questionCount} questions robustes avec les bonnes réponses.
Réponds UNIQUEMENT avec le JSON valide.
`;
    }
    static getReadingComprehensionPrompt(content, courseTitle, lessonTitle, questionCount, difficulty, questionTypes) {
        return `
Vous êtes un expert en création de questions TCF/TEF pour la COMPRÉHENSION ÉCRITE.

CONTENU SOURCE (extrait du PDF):
"${content.substring(0, 6000)}${content.length > 6000 ? '...[contenu tronqué]' : ''}"

MISSION CRITIQUE:
1. EXTRACTION DU PASSAGE: Identifiez un passage LONG de 300-1500 mots dans le contenu source qui servira de TEXTE À LIRE
   - Utilisez le contenu réel du document (pas de résumé)
   - Sélectionnez un passage cohérent et complet
   - Le passage doit contenir suffisamment d'informations pour générer des questions variées
   - IMPORTANT: Ce passage sera affiché aux étudiants pour qu'ils le lisent avant de répondre
2. GÉNÉRATION DE QUESTIONS: Créez ${questionCount} questions BASÉES sur ce passage, mais les questions NE DOIVENT PAS répéter le passage mot pour mot

RÈGLES ABSOLUES POUR COMPRÉHENSION ÉCRITE:
- Le PASSAGE et la QUESTION doivent être COMPLÈTEMENT DIFFÉRENTS
- Le passage = texte LONG à lire/comprendre (500-2000+ mots, plusieurs paragraphes)
- La question = ce qui teste la compréhension, l'inférence, les idées principales, les détails
- Format TCF/TEF strict: 4 options pour MCQ, une seule bonne réponse
- Questions doivent tester: idées principales, détails spécifiques, inférence, contexte, structure du texte

TYPES DE QUESTIONS AUTORISÉS:
- MCQ: Choisir la bonne réponse parmi 4 options après avoir lu le passage
- True/False: Vrai ou Faux basé sur le contenu du passage
- Short-answer: Réponse courte basée sur la compréhension du texte

NIVEAU: ${difficulty || 'moyen'}
TYPES DE QUESTIONS: ${questionTypes.join(', ')}

FORMAT DE RÉPONSE JSON (OBLIGATOIRE):
{
  "passage": "Passage de 300-1500 mots extrait du contenu réel (ce passage sera affiché aux étudiants)",
  "questions": [
    {
      "passage": "Même passage de 300-1500 mots (identique pour toutes les questions de cette série)",
      "questionText": "Question claire testant la compréhension du passage (sans répéter le texte)",
      "type": "multiple-choice",
      "options": ["Option A réaliste", "Option B réaliste", "Option C réaliste", "Option D réaliste"],
      "correctAnswer": 0,
      "explanation": "Explication courte de la réponse",
      "points": 1,
      "category": "READING",
      "level": "${difficulty || 'B1'}"
    }
  ]
}

EXEMPLES POUR COMPRÉHENSION ÉCRITE:

PASSAGE (exemple):
"Le musée sera fermé lundi pour travaux. Les visiteurs devront attendre mardi pour la réouverture. Les travaux concernent la rénovation des salles d'exposition principale."

QUESTION (correcte):
"Quand le musée sera-t-il fermé ?"
Options: ["Samedi", "Dimanche", "Lundi", "Mardi"]
CorrectAnswer: 2

QUESTION (correcte - inférence):
"Quel est le but des travaux mentionnés dans le texte ?"
Options: ["Agrandir le musée", "Rénover les salles", "Construire un nouveau bâtiment", "Réparer les toits"]
CorrectAnswer: 1

QUESTION (incorrecte - NE PAS FAIRE):
"Le musée sera fermé lundi pour travaux. Les visiteurs devront attendre mardi pour la réouverture. Quand le musée sera-t-il fermé ?"
❌ Cette question répète le passage - INTERDIT!

Générez EXACTEMENT ${questionCount} questions robustes avec passage séparé.
Réponds UNIQUEMENT avec le JSON valide.
`;
    }
    static getStandardPrompt(content, courseTitle, lessonTitle, questionCount, category, difficulty, questionTypes, categoryInstructions, difficultyInstructions) {
        return `
Vous êtes un expert en création de questions TCF/TEF de haute qualité.

CONTENU SOURCE (extrait du document):
"${content.substring(0, 8000)}${content.length > 8000 ? '...[contenu tronqué]' : ''}"

MISSION CRITIQUE:
1. ANALYSER le contenu source pour comprendre les concepts clés, vocabulaire, et structures
2. GÉNÉRER ${questionCount} questions de qualité professionnelle basées sur ce contenu réel
3. RESPECTER les standards TCF/TEF officiels

RÈGLES ABSOLUES:
- Questions basées UNIQUEMENT sur le contenu fourni (pas de connaissances générales)
- Format TCF/TEF strict: MCQ avec 4 options réalistes et plausibles
- UNE SEULE bonne réponse par question
- Options variées et crédibles (pas d'indices évidents)
- Répartition aléatoire des bonnes réponses (A, B, C, D)

QUALITÉ DES OPTIONS MCQ:
- Option A correcte: 25% du temps
- Option B correcte: 25% du temps  
- Option C correcte: 25% du temps
- Option D correcte: 25% du temps
- Toutes les options doivent être grammaticalement correctes
- Éviter les indices comme "toutes les réponses ci-dessus"

TYPES DE QUESTIONS AUTORISÉS: ${questionTypes.join(', ')}
CATÉGORIE: ${category || 'générale'}
NIVEAU: ${difficulty || 'moyen'}
INSTRUCTIONS SPÉCIFIQUES: ${categoryInstructions[category] || 'Questions générales de français.'}

FORMAT DE RÉPONSE JSON (OBLIGATOIRE):
{
  "questions": [
    {
      "questionText": "Question claire et précise basée sur le contenu",
      "type": "multiple-choice",
      "options": ["Option A réaliste", "Option B réaliste", "Option C réaliste", "Option D réaliste"],
      "correctAnswer": 0,
      "explanation": "Explication courte et claire",
      "points": 1,
      "category": "${category?.toUpperCase() || 'GENERAL'}",
      "level": "${difficulty || 'B1'}",
      "passage": null
    }
  ]
}

EXEMPLES DE BONNES QUESTIONS:

Si le contenu parle de "Marie visite Paris en été":

✅ BONNE QUESTION:
"Quand Marie visite-t-elle Paris ?"
Options: ["Au printemps", "En été", "En automne", "En hiver"]
CorrectAnswer: 1 (En été)

❌ MAUVAISE QUESTION:
"Marie visite Paris en été. Quand Marie visite-t-elle Paris ?"
(Répète l'information - interdit!)

VARIEZ LES BONNES RÉPONSES:
- Question 1: correctAnswer: 0 (Option A)
- Question 2: correctAnswer: 2 (Option C)  
- Question 3: correctAnswer: 1 (Option B)
- Question 4: correctAnswer: 3 (Option D)

Générez EXACTEMENT ${questionCount} questions de qualité professionnelle.
Réponds UNIQUEMENT avec le JSON valide.
`;
    }
    static generateRealisticOptions(content, category = 'general', questionIndex = 0) {
        const contentWords = content.split(/\s+/).filter(word => word.length > 3);
        const keyPhrases = contentWords.slice(0, 20);
        const optionTemplates = {
            grammar: [
                () => `${keyPhrases[questionIndex % keyPhrases.length]} - règle de grammaire correcte`,
                () => `Usage incorrect de ${keyPhrases[(questionIndex + 1) % keyPhrases.length]}`,
                () => `Exception grammaticale pour ${keyPhrases[(questionIndex + 2) % keyPhrases.length]}`,
                () => `Conjugaison erronée de ${keyPhrases[(questionIndex + 3) % keyPhrases.length]}`
            ],
            vocabulary: [
                () => `Définition exacte de ${keyPhrases[questionIndex % keyPhrases.length]}`,
                () => `Synonyme de ${keyPhrases[(questionIndex + 1) % keyPhrases.length]}`,
                () => `Contexte d'usage de ${keyPhrases[(questionIndex + 2) % keyPhrases.length]}`,
                () => `Nuance sémantique de ${keyPhrases[(questionIndex + 3) % keyPhrases.length]}`
            ],
            reading: [
                () => `Idée principale: ${keyPhrases[questionIndex % keyPhrases.length]}`,
                () => `Détail secondaire: ${keyPhrases[(questionIndex + 1) % keyPhrases.length]}`,
                () => `Implication du texte sur ${keyPhrases[(questionIndex + 2) % keyPhrases.length]}`,
                () => `Conclusion erronée sur ${keyPhrases[(questionIndex + 3) % keyPhrases.length]}`
            ],
            listening: [
                () => `Information claire sur ${keyPhrases[questionIndex % keyPhrases.length]}`,
                () => `Détail mentionné: ${keyPhrases[(questionIndex + 1) % keyPhrases.length]}`,
                () => `Inference sur ${keyPhrases[(questionIndex + 2) % keyPhrases.length]}`,
                () => `Information non mentionnée: ${keyPhrases[(questionIndex + 3) % keyPhrases.length]}`
            ]
        };
        const templates = optionTemplates[category] || [
            () => `Réponse basée sur ${keyPhrases[questionIndex % keyPhrases.length]}`,
            () => `Alternative avec ${keyPhrases[(questionIndex + 1) % keyPhrases.length]}`,
            () => `Explication de ${keyPhrases[(questionIndex + 2) % keyPhrases.length]}`,
            () => `Analyse de ${keyPhrases[(questionIndex + 3) % keyPhrases.length]}`
        ];
        const options = templates.map((template, index) => {
            try {
                return template();
            }
            catch {
                return `Option ${String.fromCharCode(65 + index)} basée sur le contenu`;
            }
        });
        return options;
    }
    static async generateChatResponse(message, context) {
        const prompt = `
      Vous êtes un assistant IA spécialisé dans l'éducation du français.
      Vous aidez les étudiants à comprendre leur cours.
      
      Contexte du cours:
      - Titre du cours: ${context.courseTitle}
      - Titre de la leçon: ${context.lessonTitle}
      - Contenu: ${context.content}
      
      Question de l'étudiant: ${message}
      
      Répondez de manière pédagogique, claire et encourageante.
      Si la question n'est pas liée au cours, redirigez poliment vers le contenu du cours.
      Réponse en français.
    `;
        const response = await geminiApiManager.generateContent(async (model) => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
        return { response };
    }
    static async generateTranscription(videoUrl, lessonTitle, courseTitle) {
        const videoContext = videoUrl.includes('tcf') || videoUrl.includes('tef')
            ? 'TCF/TEF preparation'
            : videoUrl.includes('grammar') || lessonTitle.toLowerCase().includes('grammaire')
                ? 'French grammar lesson'
                : videoUrl.includes('vocabulary') || lessonTitle.toLowerCase().includes('vocabulaire')
                    ? 'French vocabulary lesson'
                    : 'French language lesson';
        const prompt = `
      Vous êtes un assistant IA spécialisé dans la transcription précise de cours de français avec timestamps, similaire à YouTube.

      Contexte de la vidéo:
      - Titre du cours: "${courseTitle}"
      - Titre de la leçon: "${lessonTitle}"
      - Type de contenu: ${videoContext}
      - URL de la vidéo: ${videoUrl}

      IMPORTANT: Générez une transcription RÉALISTE et DÉTAILLÉE qui correspond vraiment au contenu d'une leçon de français sur "${lessonTitle}".
      La transcription doit être:
      - En français naturel et conversationnel (comme un vrai professeur parlerait)
      - Spécifique au sujet "${lessonTitle}" - ne pas être générique
      - Éducative avec des exemples concrets
      - Formatée avec des timestamps au format [MM:SS] au début de chaque segment
      - Chaque segment représente 10-20 secondes de parole naturelle
      - Environ 8-15 segments pour une leçon de 2-4 minutes
      - Les timestamps doivent être progressifs et réalistes (ex: [0:05], [0:18], [0:35], [0:52], [1:08], etc.)
      - Le contenu doit être cohérent et progressif (introduction → explication → exemples → conclusion)

      Format de réponse EXACT (chaque ligne = un segment):
      [0:05] Texte de transcription du premier segment...
      [0:18] Texte de transcription du deuxième segment...
      [0:35] Texte de transcription du troisième segment...
      etc.

      CRITIQUE: Chaque ligne DOIT commencer par [MM:SS] suivi d'un espace, puis le texte réel de ce qui serait dit dans la vidéo sur "${lessonTitle}".
      Le texte doit être spécifique au sujet, pas générique.
    `;
        try {
            const response = await geminiApiManager.generateContent(async (model) => {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
            return { transcription: response };
        }
        catch (error) {
            console.error('Error generating transcription:', error);
            return {
                transcription: `[0:05] Bonjour à tous ! Aujourd'hui, nous allons parler de "${lessonTitle}".\n[0:12] C'est un sujet très important en français.\n[0:37] Cette leçon couvre les concepts fondamentaux de la langue française.\n[0:58] Nous allons voir des exemples pratiques pour améliorer votre compréhension.\n[1:15] Le contenu est structuré pour faciliter l'apprentissage.\n[1:30] Nous allons maintenant passer à la pratique.`
            };
        }
    }
    static async extractSujetsFromText(text) {
        const prompt = `
      Vous êtes un assistant IA spécialisé dans l'extraction de sujets de textes français.

      Analysez le texte suivant et extrayez les 5-8 sujets ou thèmes principaux:

      Texte:
      ${text.substring(0, 2000)}

      Répondez avec une liste de sujets, un par ligne, sans numérotation ni tirets.
      Les sujets doivent être:
      - Concis (2-5 mots)
      - Pertinents au contenu
      - En français
      - Uniques (pas de doublons)
    `;
        try {
            const response = await geminiApiManager.generateContent(async (model) => {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
            const sujets = response
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('-') && !line.match(/^\d+\./))
                .slice(0, 8);
            return sujets.length > 0 ? sujets : [
                'Immigration et intégration',
                'Vie quotidienne et culture',
                'Travail et carrière',
                'Éducation et formation'
            ];
        }
        catch (error) {
            console.error('Error extracting sujets from text:', error);
            return [
                'Immigration et intégration',
                'Vie quotidienne et culture',
                'Travail et carrière',
                'Éducation et formation',
                'Santé et bien-être',
                'Voyages et tourisme',
                'Technologie et innovation',
                'Environnement et développement durable'
            ];
        }
    }
    static getRandomCorrectAnswer(questionIndex) {
        const seed = questionIndex * 7 + 3;
        return seed % 4;
    }
    static generateContentBasedFallback(content, questionType, category, difficulty, questionIndex) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const randomSentence = sentences[questionIndex % sentences.length] || "Le contenu étudié";
        const contentKeywords = this.extractKeywords(content);
        const keyword1 = contentKeywords[questionIndex % contentKeywords.length] || "concept";
        const keyword2 = contentKeywords[(questionIndex + 1) % contentKeywords.length] || "élément";
        let questionText = "";
        let options = [];
        let correctAnswer = 0;
        if (questionType === "multiple-choice") {
            questionText = `Selon le contenu, quel est l'aspect principal concernant ${keyword1} ?`;
            options = [
                `${keyword1} est un élément central`,
                `${keyword2} est plus important`,
                `Aucune relation avec ${keyword1}`,
                `${keyword1} n'est pas mentionné`
            ];
            correctAnswer = this.getRandomCorrectAnswer(questionIndex);
        }
        else if (questionType === "true-false") {
            questionText = `Le contenu mentionne-t-il des informations sur ${keyword1} ?`;
            correctAnswer = Math.random() > 0.5 ? "true" : "false";
        }
        else {
            questionText = `Expliquez l'importance de ${keyword1} selon le contenu étudié.`;
            correctAnswer = `Réponse basée sur l'analyse de ${keyword1} dans le contexte du document`;
        }
        return {
            questionText,
            type: questionType,
            options,
            correctAnswer,
            explanation: `Cette question évalue la compréhension de ${keyword1} dans le contexte du document étudié.`,
            passage: null,
            points: 1,
            category: category?.toUpperCase() || 'GENERAL',
            level: difficulty || 'B1'
        };
    }
    static extractKeywords(content) {
        const commonWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or'];
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.includes(word));
        const uniqueWords = [...new Set(words)];
        return uniqueWords.slice(0, 20);
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map