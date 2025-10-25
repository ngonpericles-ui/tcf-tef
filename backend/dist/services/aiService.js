"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const logger_1 = require("../utils/logger");
const geminiApiManager_1 = __importDefault(require("../utils/geminiApiManager"));
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
            const response = await geminiApiManager_1.default.makeRequest(async (model) => {
                const prompt = `${systemPrompt}

Message: ${message}

Réponds directement et utilement en français.`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
            return {
                content: response,
                confidence: 0.9
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating AI response:', error);
            return {
                content: "Je suis désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?",
                confidence: 0.5
            };
        }
    }
    static async generateContent(prompt) {
        try {
            return await geminiApiManager_1.default.generateContent(async (model) => {
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
    static async generateNotes(content, lessonTitle, courseTitle) {
        const prompt = `
      Vous êtes un assistant IA spécialisé dans l'éducation du français. 
      Générez des notes de cours structurées et utiles basées sur le contenu suivant:
      
      Cours: ${courseTitle}
      Leçon: ${lessonTitle}
      Contenu: ${content}
      
      Veuillez générer 5-7 notes clés qui résument les points importants de cette leçon.
      Chaque note doit être concise (1-2 phrases) et pédagogique.
      Format de réponse: Liste de notes, une par ligne, sans numérotation.
    `;
        const response = await geminiApiManager_1.default.generateContent(async (model) => {
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
    static async generateQuestions(content, lessonTitle, courseTitle, questionCount = 5, questionTypes = ["multiple-choice", "true-false", "short-answer"], category, difficulty) {
        const difficultyInstructions = {
            "easy": "Questions simples et directes, vocabulaire basique, concepts fondamentaux",
            "medium": "Questions de niveau intermédiaire, vocabulaire courant, application des règles",
            "hard": "Questions complexes, vocabulaire avancé, analyse et synthèse",
            "expert": "Questions très difficiles, vocabulaire spécialisé, réflexion critique et créative"
        };
        const categoryInstructions = {
            "grammar": "Questions de grammaire française: conjugaisons, accords, syntaxe, temps verbaux",
            "vocabulary": "Questions de vocabulaire: définitions, synonymes, antonymes, usage contextuel",
            "listening": "Questions de compréhension orale: détails, idées principales, contexte, ton",
            "reading": "Questions de compréhension écrite: analyse de texte, inférence, structure",
            "writing": "Questions d'expression écrite: rédaction, style, cohérence",
            "oral": "Questions d'expression orale: prononciation, fluidité, communication"
        };
        const prompt = `
      Vous êtes un assistant IA spécialisé dans l'éducation du français.
      Générez des questions de révision basées sur le contenu suivant:
      
      Cours: ${courseTitle}
      Leçon: ${lessonTitle}
      Contenu: ${content}
      Catégorie: ${category || 'générale'}
      Niveau de difficulté: ${difficulty || 'moyen'} - ${difficultyInstructions[difficulty] || 'niveau standard'}
      
      Veuillez générer ${questionCount} questions de révision qui testent la compréhension de cette leçon.
      ${categoryInstructions[category] || 'Questions générales de français.'}
      
      Niveau de difficulté: ${difficultyInstructions[difficulty] || 'Questions de niveau standard.'}
      
      Format de réponse JSON:
      {
        "questions": [
          {
            "questionText": "Texte de la question",
            "type": "multiple-choice",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Explication de la réponse",
            "points": 1
          }
        ]
      }
      
      Types de questions supportés: ${questionTypes.join(", ")}
      Pour les questions à choix multiples, fournissez 4 options et indiquez l'index de la bonne réponse (0-3).
      Pour les questions vrai/faux, utilisez "true" ou "false" comme correctAnswer.
      Pour les questions ouvertes, fournissez la réponse attendue comme correctAnswer.
    `;
        try {
            const response = await geminiApiManager_1.default.generateContent(async (model) => {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
            console.log('🤖 AI Response:', response.substring(0, 500) + '...');
            try {
                const jsonMatch = response.match(/\{[\s\S]*"questions"[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    const cleanedJson = jsonStr
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']')
                        .replace(/(\w+):/g, '"$1":')
                        .replace(/:(\w+)/g, ':"$1"');
                    const parsed = JSON.parse(cleanedJson);
                    if (parsed.questions && Array.isArray(parsed.questions)) {
                        console.log('✅ Successfully parsed JSON response');
                        return { questions: parsed.questions };
                    }
                }
            }
            catch (parseError) {
                console.log('❌ Failed to parse JSON:', parseError.message);
            }
            try {
                const questionMatches = response.match(/"questionText":\s*"([^"]+)"/g);
                if (questionMatches && questionMatches.length > 0) {
                    console.log('🔍 Found question text matches:', questionMatches.length);
                    const questions = questionMatches.slice(0, questionCount).map((match, index) => {
                        const questionText = match.match(/"questionText":\s*"([^"]+)"/)?.[1] || `Question ${index + 1}`;
                        const questionType = questionTypes[index % questionTypes.length];
                        return {
                            questionText,
                            type: questionType,
                            options: questionType === "multiple-choice" ? ["Option A", "Option B", "Option C", "Option D"] : [],
                            correctAnswer: questionType === "multiple-choice" ? 0 : questionType === "true-false" ? "true" : "Réponse attendue",
                            explanation: `Explication pour la question ${index + 1}`,
                            points: 1
                        };
                    });
                    console.log(`✅ Extracted ${questions.length} questions from text`);
                    return { questions };
                }
            }
            catch (extractError) {
                console.log('❌ Failed to extract questions from text:', extractError.message);
            }
            console.log('🔄 Using fallback question generation');
            const questions = [];
            for (let i = 0; i < questionCount; i++) {
                const questionType = questionTypes[i % questionTypes.length];
                let questionText = "";
                let options = [];
                let correctAnswer = 0;
                if (questionType === "multiple-choice") {
                    if (category === "grammar") {
                        questionText = `Quelle est la règle de grammaire correcte pour cette phrase ?`;
                        options = [
                            "Règle A - Conjugaison correcte",
                            "Règle B - Accord correct",
                            "Règle C - Syntaxe appropriée",
                            "Règle D - Temps verbal adapté"
                        ];
                    }
                    else if (category === "vocabulary") {
                        questionText = `Quel est le sens de ce mot dans ce contexte ?`;
                        options = [
                            "Définition A",
                            "Définition B",
                            "Définition C",
                            "Définition D"
                        ];
                    }
                    else if (category === "listening") {
                        questionText = `Que dit la personne dans l'enregistrement ?`;
                        options = [
                            "Réponse A",
                            "Réponse B",
                            "Réponse C",
                            "Réponse D"
                        ];
                    }
                    else {
                        questionText = `Question ${i + 1} sur le contenu étudié ?`;
                        options = ["Option A", "Option B", "Option C", "Option D"];
                    }
                    correctAnswer = 0;
                }
                else if (questionType === "true-false") {
                    if (category === "grammar") {
                        questionText = `Cette phrase respecte-t-elle les règles de grammaire française ?`;
                    }
                    else if (category === "vocabulary") {
                        questionText = `Ce mot a-t-il le sens donné dans ce contexte ?`;
                    }
                    else if (category === "listening") {
                        questionText = `L'enregistrement mentionne-t-il cette information ?`;
                    }
                    else {
                        questionText = `Cette affirmation est-elle correcte ?`;
                    }
                    correctAnswer = "true";
                }
                else if (questionType === "short-answer") {
                    if (category === "grammar") {
                        questionText = `Expliquez la règle de grammaire appliquée dans cette phrase.`;
                    }
                    else if (category === "vocabulary") {
                        questionText = `Définissez ce terme dans votre propre vocabulaire.`;
                    }
                    else if (category === "listening") {
                        questionText = `Résumez le contenu principal de l'enregistrement.`;
                    }
                    else {
                        questionText = `Répondez à cette question en quelques mots.`;
                    }
                    correctAnswer = "Réponse attendue selon le contenu";
                }
                questions.push({
                    questionText,
                    type: questionType,
                    options: questionType === "multiple-choice" ? options : [],
                    correctAnswer,
                    explanation: `Explication détaillée pour la question ${i + 1}`,
                    points: 1
                });
            }
            console.log(`✅ Generated ${questions.length} structured questions`);
            return { questions };
        }
        catch (error) {
            console.error('Error generating questions:', error);
            return {
                questions: [
                    {
                        questionText: "Quelle est la règle principale de cette leçon?",
                        type: "multiple-choice",
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correctAnswer: 0,
                        explanation: "Explication de la réponse correcte",
                        points: 1
                    }
                ]
            };
        }
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
        const response = await geminiApiManager_1.default.generateContent(async (model) => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
        return { response };
    }
    static async generateTranscription(videoUrl, lessonTitle, courseTitle) {
        const prompt = `
      Vous êtes un assistant IA spécialisé dans la transcription de cours de français.

      Contexte:
      - Titre du cours: ${courseTitle}
      - Titre de la leçon: ${lessonTitle}
      - URL de la vidéo: ${videoUrl}

      Générez une transcription réaliste et éducative pour cette leçon de français.
      La transcription doit être:
      - En français
      - Éducative et pédagogique
      - Adaptée au niveau du cours
      - Structurée avec des paragraphes
      - D'environ 200-300 mots

      Format de réponse: Transcription directe du contenu de la leçon.
    `;
        try {
            const response = await geminiApiManager_1.default.generateContent(async (model) => {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
            return { transcription: response };
        }
        catch (error) {
            console.error('Error generating transcription:', error);
            return {
                transcription: `Transcription de la leçon "${lessonTitle}" du cours "${courseTitle}". Cette leçon couvre les concepts fondamentaux de la langue française et fournit des exemples pratiques pour améliorer votre compréhension. Le contenu est structuré pour faciliter l'apprentissage et la rétention des informations clés.`
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
            const response = await geminiApiManager_1.default.generateContent(async (model) => {
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
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map