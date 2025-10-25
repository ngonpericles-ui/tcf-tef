# AI Functionalities - Deep Dive Analysis

## 🤖 Overview
Aura.ca has **15+ AI-powered features** using Gemini AI, OpenAI, and VAPI for voice interactions.

---

## 1. **AI Chat Service** (`/ai-chat`)
**Purpose**: Conversational AI tutor for French learning

**Features**:
- Real-time chat with AI tutor
- Context-aware responses
- Question bank integration
- Conversation history
- Multi-language support (FR/EN)
- User level adaptation
- Source attribution

**How It Works**:
1. User sends message
2. System retrieves relevant questions from question bank
3. Gemini AI generates response with context
4. Response includes sources and confidence score
5. Chat history saved for future context

**Backend Service**: `aiChatService.ts`
- `sendMessage()` - Send chat message
- `getRelevantQuestions()` - Find related questions
- `generateAIResponse()` - Generate AI response
- `buildSystemPrompt()` - Create system context

**Frontend Integration**:
- Component: `/app/ai-chat/page.tsx`
- API: `POST /api/ai-chat/send-message`
- Stores chat history in database
- Real-time message display

**Key Capabilities**:
- Grammar explanations
- Vocabulary help
- Pronunciation guidance
- Test preparation
- Conversation practice

---

## 2. **Voice Simulation** (`/simulation-vocale`)
**Purpose**: AI-powered oral interview practice using VAPI

**Features**:
- Voice preference selection (French voices)
- Scheduled simulations
- Real-time voice interaction
- Question generation
- Performance scoring
- Detailed feedback
- Recording storage

**Scoring Metrics**:
- Fluency score
- Grammar score
- Vocabulary score
- Pronunciation score
- Coherence score
- Overall score

**Backend Service**: `voiceSimulationService.ts`
- `bookSimulation()` - Schedule simulation
- `startSimulation()` - Begin voice session
- `endSimulation()` - Complete session
- `getResults()` - Fetch results

**VAPI Integration**:
- `vapiService.ts` - VAPI API wrapper
- `createFrenchAssistant()` - Create voice assistant
- `startVoiceSimulation()` - Start call
- `getRandomQuestions()` - Generate questions

**Frontend Integration**:
- Component: `/app/simulation-vocale/page.tsx`
- Booking page: `/app/simulation-vocale/booking`
- Results page: `/app/simulation-vocale/results`
- Usage page: `/app/simulation-vocale/usage`
- Voice page: `/app/simulation-vocale/voice`

**User Flow**:
1. Select voice preference
2. Book simulation slot
3. Join voice session
4. Answer AI-generated questions
5. Receive performance feedback
6. View detailed results

---

## 3. **Immigration Simulation** (`/immigration-simulations`)
**Purpose**: AI-generated immigration interview practice

**Features**:
- Country selection
- Immigration type selection (work, study, family, etc.)
- Personal info collection
- AI-generated interview questions
- Real-time response analysis
- Credibility scoring
- Detailed feedback

**Supported Countries**:
- Canada
- France
- Germany
- USA
- Australia
- Others

**Interview Types**:
- Work visa
- Study visa
- Family sponsorship
- Skilled immigration
- Refugee

**Backend Service**: `immigrationSimulationService.js`
- `createSession()` - Initialize simulation
- `generateInterviewQuestions()` - AI question generation
- `submitResponse()` - Process user response
- `analyzeResponse()` - AI analysis
- `generateReport()` - Final report

**AI Analysis Criteria**:
- Relevance to question
- Completeness of answer
- Clarity and coherence
- French language level
- Credibility assessment

**Frontend Integration**:
- Main page: `/app/immigration-simulations/page.tsx`
- Question page: `/app/immigration-simulations/questions`
- Timeline page: `/app/immigration-simulations/timeline`
- Documents page: `/app/immigration-simulations/documents`
- Cultural page: `/app/immigration-simulations/cultural`

---

## 4. **Floating AI Assistant** (`/floating-ai-assistant`)
**Purpose**: Context-aware AI help on any page

**Features**:
- Page-context awareness
- Quick suggestions
- Contextual prompts
- Multi-language support
- Confidence scoring
- Suggestion generation

**Context Types**:
- Voice simulation page
- Immigration simulation page
- TCF/TEF simulation page
- Course pages
- Test pages
- General pages

**Quick Suggestions**:
- "How to prepare for oral interview?"
- "What are evaluation criteria?"
- "How to manage stress?"
- "Tips to improve pronunciation?"

**Backend Service**: `floatingAiAssistantService.ts`
- `getAssistance()` - Get AI help
- `buildSystemPrompt()` - Context-aware prompt
- `getQuickSuggestions()` - Generate suggestions
- `parseResponse()` - Parse AI response

**Frontend Integration**:
- Component: `FloatingAiAssistant.tsx`
- Hook: `useFloatingAiAssistant.ts`
- API: `POST /api/floating-ai-assistant/help`

---

## 5. **AI Feedback Service**
**Purpose**: Automated assessment feedback

**Features**:
- Submission analysis
- Score generation
- Strength identification
- Weakness identification
- Recommendations
- Confidence scoring
- Human review option

**Submission Types**:
- Written essays
- Test answers
- Simulation responses
- Course assignments

**Feedback Components**:
- Overall score (0-100)
- Detailed analysis
- Strengths (JSON array)
- Weaknesses (JSON array)
- Recommendations (JSON array)
- Confidence score

**Backend Service**: `aiTeacherFeedbackService.ts`
- `generateFeedback()` - Create feedback
- `analyzeSubmission()` - Analyze content
- `scoreSubmission()` - Generate score

---

## 6. **AI Tutor Service**
**Purpose**: Personalized learning recommendations

**Features**:
- Study plan generation
- Personalized recommendations
- Progress analysis
- Learning path suggestions
- Motivation messages

**Backend Service**: `aiTutorService.js`
- `generateStudyPlan()` - Create personalized plan
- `getRecommendations()` - Learning suggestions
- `generateMotivation()` - Motivational messages

---

## 7. **Real-time Speech Service**
**Purpose**: Speech recognition and analysis

**Features**:
- Speech-to-text conversion
- Accent analysis
- Pronunciation scoring
- Real-time feedback

**Backend Service**: `realTimeSpeechService.ts`
- `recognizeSpeech()` - Convert speech to text
- `analyzePronunciation()` - Score pronunciation
- `provideFeedback()` - Real-time feedback

---

## 8. **AI Content Suggestions**
**Purpose**: Personalized content recommendations

**Features**:
- Course recommendations
- Test suggestions
- Content personalization
- Learning path optimization

**Backend Service**: `aiService.ts`
- `generateStudyRecommendations()` - Recommend content
- `generateDailyTip()` - Daily learning tip
- `generateGreeting()` - Personalized greeting
- `generateMotivation()` - Motivational message

---

## 9. **AI Session Insights**
**Purpose**: Learning analytics and insights

**Features**:
- Session analysis
- Performance insights
- Progress tracking
- Trend analysis

**Backend Service**: `aiService.ts`
- `generateSessionInsights()` - Analyze session
- `identifyWeaknesses()` - Find problem areas
- `suggestImprovements()` - Improvement tips

---

## 10. **Question Bank Integration**
**Purpose**: AI uses question bank for context

**Features**:
- Question retrieval
- Context enrichment
- Relevant question matching
- Question-based responses

**Backend Service**: `questionBankService.ts`
- `getRelevantQuestions()` - Find related questions
- `extractQuestions()` - Extract from PDF
- `storeQuestions()` - Save to database

---

## 🔌 AI API Endpoints

```
POST   /api/ai-chat/send-message
GET    /api/ai-chat/history
POST   /api/voice-simulation/book
POST   /api/voice-simulation/start
GET    /api/voice-simulation/results/:id
POST   /api/immigration-simulation/create
POST   /api/immigration-simulation/submit-response
GET    /api/immigration-simulation/report/:id
POST   /api/floating-ai-assistant/help
GET    /api/floating-ai-assistant/suggestions
POST   /api/ai-feedback/generate
GET    /api/ai/recommendations
POST   /api/ai/study-plan
```

---

## 🧠 AI Models Used

- **Gemini AI**: Main AI engine for chat, feedback, analysis
- **OpenAI**: Alternative AI capabilities
- **VAPI**: Voice interaction and speech processing
- **Speech Recognition**: Real-time speech-to-text

---

## 📊 AI Integration Points

1. **Chat Interface** - Real-time AI responses
2. **Voice Sessions** - VAPI voice interaction
3. **Immigration Simulations** - AI question generation
4. **Feedback System** - Automated assessment
5. **Recommendations** - Personalized suggestions
6. **Analytics** - AI-powered insights
7. **Floating Assistant** - Context-aware help

---

**Status**: ✅ AI FUNCTIONALITIES FULLY DOCUMENTED

