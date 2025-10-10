const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@tcftef.com';
const ADMIN_PASSWORD = 'AdminTest123!';

let authToken = '';

const loginAsAdmin = async () => {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    authToken = response.data.data.tokens.accessToken;
    console.log('✅ Admin login successful');
    console.log('🔑 Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
};

const createSampleCourses = async () => {
  console.log('\n📚 Creating sample courses...');
  
  const courses = [
    {
      title: 'TCF Préparation Niveau A2',
      titleEn: 'TCF Preparation Level A2',
      description: 'Cours complet pour préparer le TCF niveau A2. Couvre toutes les compétences : compréhension orale, compréhension écrite, expression orale et expression écrite.',
      descriptionEn: 'Complete course to prepare for TCF level A2. Covers all skills: listening, reading, speaking and writing.',
      level: 'A2',
      category: 'TCF_TEF',
      requiredTier: 'FREE',
      duration: 120,
      lessons: 15,
      difficulty: 2,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      tags: ['TCF', 'A2', 'Préparation', 'Français']
    },
    {
      title: 'TEF Canada - Expression Orale B1',
      titleEn: 'TEF Canada - Speaking B1',
      description: 'Maîtrisez l\'expression orale pour le TEF Canada niveau B1. Techniques, exercices pratiques et simulations d\'examen.',
      descriptionEn: 'Master speaking skills for TEF Canada level B1. Techniques, practical exercises and exam simulations.',
      level: 'B1',
      category: 'ORAL',
      requiredTier: 'ESSENTIAL',
      duration: 80,
      lessons: 12,
      difficulty: 3,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      tags: ['TEF', 'B1', 'Expression orale', 'Canada']
    },
    {
      title: 'Français Général - Niveau Débutant',
      titleEn: 'General French - Beginner Level',
      description: 'Cours gratuit pour débuter en français. Vocabulaire de base, grammaire essentielle et expressions courantes.',
      descriptionEn: 'Free course to start learning French. Basic vocabulary, essential grammar and common expressions.',
      level: 'A1',
      category: 'VOCABULARY',
      requiredTier: 'FREE',
      duration: 60,
      lessons: 10,
      difficulty: 1,
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
      tags: ['Français', 'A1', 'Débutant', 'Gratuit']
    },
    {
      title: 'Grammaire Française Avancée',
      titleEn: 'Advanced French Grammar',
      description: 'Perfectionnez votre grammaire française avec ce cours avancé. Subjonctif, concordance des temps, et structures complexes.',
      descriptionEn: 'Perfect your French grammar with this advanced course. Subjunctive, tense agreement, and complex structures.',
      level: 'C1',
      category: 'GRAMMAR',
      requiredTier: 'PREMIUM',
      duration: 100,
      lessons: 20,
      difficulty: 5,
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      tags: ['Grammaire', 'C1', 'Avancé', 'Subjonctif']
    }
  ];

  for (const course of courses) {
    try {
      const response = await axios.post(`${API_BASE_URL}/courses`, course, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Created course: ${course.title}`);
    } catch (error) {
      console.error(`❌ Failed to create course "${course.title}":`, error.response?.data || error.message);
    }
  }
};

const createSampleTests = async () => {
  console.log('\n📝 Creating sample tests...');
  
  const tests = [
    {
      title: 'Test TCF - Compréhension Orale A2',
      titleEn: 'TCF Test - Listening Comprehension A2',
      description: 'Test de compréhension orale pour le niveau A2 du TCF. 20 questions avec audio.',
      descriptionEn: 'Listening comprehension test for TCF level A2. 20 questions with audio.',
      type: 'TCF',
      level: 'A2',
      category: 'LISTENING',
      requiredTier: 'FREE',
      duration: 30,
      questionCount: 20,
      difficulty: 2,
      passingScore: 60,
      tags: ['TCF', 'A2', 'Compréhension orale', 'Audio']
    },
    {
      title: 'Test TEF - Expression Écrite B1',
      titleEn: 'TEF Test - Written Expression B1',
      description: 'Test d\'expression écrite pour le niveau B1 du TEF. Rédaction d\'un texte argumentatif.',
      descriptionEn: 'Written expression test for TEF level B1. Writing an argumentative text.',
      type: 'TEF',
      level: 'B1',
      category: 'WRITING',
      requiredTier: 'ESSENTIAL',
      duration: 60,
      questionCount: 2,
      difficulty: 3,
      passingScore: 50,
      tags: ['TEF', 'B1', 'Expression écrite', 'Rédaction']
    },
    {
      title: 'Quiz Grammaire - Les Temps du Passé',
      titleEn: 'Grammar Quiz - Past Tenses',
      description: 'Quiz rapide sur l\'utilisation des temps du passé en français : passé composé, imparfait, plus-que-parfait.',
      descriptionEn: 'Quick quiz on the use of past tenses in French: passé composé, imparfait, plus-que-parfait.',
      type: 'PRACTICE',
      level: 'B1',
      category: 'GRAMMAR',
      requiredTier: 'FREE',
      duration: 15,
      questionCount: 10,
      difficulty: 2,
      passingScore: 70,
      tags: ['Grammaire', 'B1', 'Temps du passé', 'Quiz']
    }
  ];

  for (const test of tests) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tests`, test, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Created test: ${test.title}`);
    } catch (error) {
      console.error(`❌ Failed to create test "${test.title}":`, error.response?.data || error.message);
    }
  }
};

const main = async () => {
  console.log('🚀 Starting sample data creation...');
  
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without admin authentication');
    return;
  }

  await createSampleCourses();
  await createSampleTests();
  
  console.log('\n🎉 Sample data creation completed!');
  console.log('📊 Summary:');
  console.log('   - 4 sample courses created');
  console.log('   - 3 sample tests created');
  console.log('   - Mix of free and paid content');
  console.log('   - Different levels (A1, A2, B1, C1)');
  console.log('   - Various categories (TCF, TEF, Grammar, General French)');
};

main().catch(console.error);
