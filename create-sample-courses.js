const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@tcftef.com',
  password: 'Admin123!'
};

let authToken = '';

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} failed:`, error.response?.data?.message || error.message);
    throw error;
  }
};

const adminLogin = async () => {
  console.log('\n🔐 Admin Login...');
  try {
    const response = await apiRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
    authToken = response.data.data?.tokens?.accessToken || 
                response.data.tokens?.accessToken || 
                response.data.token ||
                response.data.accessToken;
    
    console.log('✅ Admin login successful');
    console.log(`   Token: ${authToken ? 'Received' : 'Missing'}`);
    return true;
  } catch (error) {
    console.log('❌ Admin login failed');
    return false;
  }
};

const createSampleCourses = async () => {
  console.log('\n📚 Creating Sample Courses...');
  
  const courses = [
    {
      title: 'Guide Complet TCF - Niveau Débutant',
      description: 'Guide complet pour débuter la préparation au Test de Connaissance du Français (TCF). Contient des exercices pratiques, des conseils et des stratégies pour réussir.',
      level: 'A1',
      category: 'TCF',
      duration: 120,
      price: 0,
      isPublished: true,
      content: {
        modules: [
          {
            title: 'Introduction au TCF',
            description: 'Présentation du test et de sa structure',
            order: 1
          },
          {
            title: 'Compréhension orale',
            description: 'Techniques et exercices pour la compréhension orale',
            order: 2
          },
          {
            title: 'Compréhension écrite',
            description: 'Méthodes pour améliorer la compréhension écrite',
            order: 3
          }
        ]
      }
    },
    {
      title: 'Préparation TEF Intensif - Niveau Intermédiaire',
      description: 'Manuel de préparation intensive pour le Test d\'Évaluation de Français (TEF). Inclut des exemples d\'examens et des techniques de réussite.',
      level: 'B1',
      category: 'TEF',
      duration: 180,
      price: 0,
      isPublished: true,
      content: {
        modules: [
          {
            title: 'Structure du TEF',
            description: 'Comprendre les différentes sections du TEF',
            order: 1
          },
          {
            title: 'Expression orale',
            description: 'Techniques pour réussir l\'expression orale',
            order: 2
          },
          {
            title: 'Expression écrite',
            description: 'Méthodes pour l\'expression écrite',
            order: 3
          }
        ]
      }
    },
    {
      title: 'Maîtrise du Français - Niveau Avancé',
      description: 'Cours avancé pour perfectionner votre français et atteindre un niveau C1-C2. Idéal pour les étudiants souhaitant exceller aux tests de français.',
      level: 'C1',
      category: 'GENERAL',
      duration: 240,
      price: 0,
      isPublished: true,
      content: {
        modules: [
          {
            title: 'Français avancé',
            description: 'Maîtrise des structures complexes',
            order: 1
          },
          {
            title: 'Culture française',
            description: 'Aspects culturels et sociétaux',
            order: 2
          },
          {
            title: 'Préparation aux certifications',
            description: 'Stratégies pour les examens de haut niveau',
            order: 3
          }
        ]
      }
    }
  ];

  for (const courseData of courses) {
    try {
      const response = await apiRequest('POST', '/courses', courseData);
      console.log(`✅ Created course: ${courseData.title}`);
      console.log(`   Course ID: ${response.data.data?.id || response.data.id || 'Unknown'}`);
    } catch (error) {
      console.log(`❌ Failed to create course: ${courseData.title}`);
    }
  }
};

const createSampleTests = async () => {
  console.log('\n📝 Creating Sample Tests...');
  
  const tests = [
    {
      title: 'Test TCF - Compréhension Orale A1',
      description: 'Test de compréhension orale niveau débutant pour le TCF',
      level: 'A1',
      category: 'TCF',
      duration: 30,
      totalQuestions: 10,
      passingScore: 60,
      isPublished: true,
      questions: [
        {
          question: 'Écoutez le dialogue et choisissez la bonne réponse.',
          type: 'MULTIPLE_CHOICE',
          options: ['Bonjour', 'Bonsoir', 'Salut', 'Au revoir'],
          correctAnswer: 0,
          points: 1
        }
      ]
    },
    {
      title: 'Test TEF - Expression Écrite B1',
      description: 'Test d\'expression écrite niveau intermédiaire pour le TEF',
      level: 'B1',
      category: 'TEF',
      duration: 60,
      totalQuestions: 5,
      passingScore: 70,
      isPublished: true,
      questions: [
        {
          question: 'Rédigez un texte de 150 mots sur le thème de l\'environnement.',
          type: 'ESSAY',
          points: 20
        }
      ]
    }
  ];

  for (const testData of tests) {
    try {
      const response = await apiRequest('POST', '/tests', testData);
      console.log(`✅ Created test: ${testData.title}`);
      console.log(`   Test ID: ${response.data.data?.id || response.data.id || 'Unknown'}`);
    } catch (error) {
      console.log(`❌ Failed to create test: ${testData.title}`);
    }
  }
};

const main = async () => {
  console.log('🚀 Starting Sample Course and Test Creation');
  console.log('=============================================');

  // Step 1: Login as admin
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Step 2: Create sample courses
  await createSampleCourses();

  // Step 3: Create sample tests
  await createSampleTests();

  console.log('\n🎉 Sample Course and Test Creation Completed!');
  console.log('=============================================');
};

// Run the script
main().catch(console.error);
