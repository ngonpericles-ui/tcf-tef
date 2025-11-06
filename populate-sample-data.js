const axios = require('axios');

async function populateSampleData() {
  try {
    console.log('🚀 Populating Sample Data for Admin Pages...\n');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.data.tokens.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('✅ Admin logged in successfully\n');

    // Create sample posts
    console.log('1. Creating Sample Posts...');
    const samplePosts = [
      {
        title: 'Guide Complet TCF - Niveau A1',
        content: 'Un guide détaillé pour préparer le TCF niveau A1 avec des exercices pratiques et des conseils d\'experts.',
        level: 'A1',
        type: 'GUIDE',
        tags: ['TCF', 'A1', 'Préparation'],
        isPublished: true
      },
      {
        title: 'Exercices TEF - Expression Orale B2',
        content: 'Collection d\'exercices pour améliorer votre expression orale pour le TEF niveau B2.',
        level: 'B2',
        type: 'EXERCISE',
        tags: ['TEF', 'B2', 'Expression Orale'],
        isPublished: true
      },
      {
        title: 'Vocabulaire Essentiel C1',
        content: 'Liste complète du vocabulaire essentiel pour atteindre le niveau C1 en français.',
        level: 'C1',
        type: 'VOCABULARY',
        tags: ['Vocabulaire', 'C1', 'Avancé'],
        isPublished: true
      }
    ];

    for (const post of samplePosts) {
      try {
        const response = await axios.post('http://localhost:3001/api/posts', post, { headers });
        if (response.data.success) {
          console.log(`✅ Created post: ${post.title}`);
        }
      } catch (error) {
        console.log(`❌ Failed to create post: ${post.title} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Create sample courses
    console.log('\n2. Creating Sample Courses...');
    const sampleCourses = [
      {
        title: 'Cours TCF Complet - Niveau Débutant',
        description: 'Formation complète pour préparer le TCF niveau débutant (A1-A2)',
        level: 'A1',
        category: 'TCF_TEF',
        requiredTier: 'FREE',
        duration: 120,
        lessons: 15,
        difficulty: 1,
        tags: ['TCF', 'Débutant', 'A1']
      },
      {
        title: 'Préparation TEF Intensif - Niveau Intermédiaire',
        description: 'Programme intensif pour réussir le TEF niveau intermédiaire (B1-B2)',
        level: 'B1',
        category: 'TCF_TEF',
        requiredTier: 'ESSENTIAL',
        duration: 180,
        lessons: 20,
        difficulty: 3,
        tags: ['TEF', 'Intermédiaire', 'B1']
      },
      {
        title: 'Maîtrise du Français - Niveau Avancé',
        description: 'Cours avancé pour atteindre la maîtrise du français (C1-C2)',
        level: 'C1',
        category: 'GRAMMAR',
        requiredTier: 'PREMIUM',
        duration: 240,
        lessons: 25,
        difficulty: 5,
        tags: ['Avancé', 'C1', 'Grammaire']
      }
    ];

    for (const course of sampleCourses) {
      try {
        const response = await axios.post('http://localhost:3001/api/courses', course, { headers });
        if (response.data.success) {
          console.log(`✅ Created course: ${course.title}`);
        }
      } catch (error) {
        console.log(`❌ Failed to create course: ${course.title} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Create sample tests
    console.log('\n3. Creating Sample Tests...');
    const sampleTests = [
      {
        title: 'Test de Niveau TCF - Évaluation A1',
        description: 'Test d\'évaluation pour déterminer votre niveau A1 en français',
        type: 'TCF',
        level: 'A1',
        category: 'TCF_TEF',
        requiredTier: 'FREE',
        duration: 60,
        questionCount: 30,
        difficulty: 1,
        passingScore: 70,
        tags: ['TCF', 'A1', 'Évaluation']
      },
      {
        title: 'Simulation TEF - Compréhension Écrite B2',
        description: 'Simulation complète de l\'épreuve de compréhension écrite du TEF niveau B2',
        type: 'TEF',
        level: 'B2',
        category: 'READING',
        requiredTier: 'ESSENTIAL',
        duration: 90,
        questionCount: 40,
        difficulty: 3,
        passingScore: 75,
        tags: ['TEF', 'B2', 'Compréhension']
      },
      {
        title: 'Test Avancé - Expression Écrite C1',
        description: 'Test avancé pour évaluer vos compétences en expression écrite niveau C1',
        type: 'PRACTICE',
        level: 'C1',
        category: 'WRITING',
        requiredTier: 'PREMIUM',
        duration: 120,
        questionCount: 25,
        difficulty: 5,
        passingScore: 80,
        tags: ['Avancé', 'C1', 'Expression']
      }
    ];

    for (const test of sampleTests) {
      try {
        const response = await axios.post('http://localhost:3001/api/tests', test, { headers });
        if (response.data.success) {
          console.log(`✅ Created test: ${test.title}`);
        }
      } catch (error) {
        console.log(`❌ Failed to create test: ${test.title} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Create sample notifications
    console.log('\n4. Creating Sample Notifications...');
    const sampleNotifications = [
      {
        title: 'Nouvelle fonctionnalité disponible',
        message: 'Découvrez notre nouveau simulateur de test TCF avec correction automatique!',
        type: 'INFO',
        priority: 'medium'
      },
      {
        title: 'Maintenance programmée',
        message: 'Maintenance système prévue le dimanche 15 septembre de 2h à 4h du matin.',
        type: 'WARNING',
        priority: 'high'
      },
      {
        title: 'Nouveau cours disponible',
        message: 'Le cours "Maîtrise du Français - Niveau Avancé" est maintenant disponible!',
        type: 'SUCCESS',
        priority: 'low'
      }
    ];

    for (const notification of sampleNotifications) {
      try {
        const response = await axios.post('http://localhost:3001/api/notifications', notification, { headers });
        if (response.data.success) {
          console.log(`✅ Created notification: ${notification.title}`);
        }
      } catch (error) {
        console.log(`❌ Failed to create notification: ${notification.title} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Create sample live sessions
    console.log('\n5. Creating Sample Live Sessions...');
    const sampleSessions = [
      {
        title: 'Session Live TCF - Préparation A2',
        description: 'Session interactive pour préparer le TCF niveau A2 avec un expert',
        instructor: 'Prof. Marie Dubois',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 90,
        maxParticipants: 20,
        requiredTier: 'FREE',
        level: 'A2',
        category: 'TCF_TEF',
        tags: ['TCF', 'A2', 'Préparation']
      },
      {
        title: 'Atelier TEF - Expression Orale B1',
        description: 'Atelier pratique pour améliorer votre expression orale en français',
        instructor: 'Prof. Jean Martin',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        duration: 120,
        maxParticipants: 15,
        requiredTier: 'ESSENTIAL',
        level: 'B1',
        category: 'ORAL',
        tags: ['TEF', 'B1', 'Expression Orale']
      }
    ];

    for (const session of sampleSessions) {
      try {
        const response = await axios.post('http://localhost:3001/api/live-sessions', session, { headers });
        if (response.data.success) {
          console.log(`✅ Created session: ${session.title}`);
        }
      } catch (error) {
        console.log(`❌ Failed to create session: ${session.title} - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Sample data population completed!');
    console.log('\n📊 Summary:');
    console.log('- Created sample posts for content management');
    console.log('- Created sample courses for course management');
    console.log('- Created sample tests for test management');
    console.log('- Created sample notifications for notification system');
    console.log('- Created sample live sessions for session management');
    console.log('\n🌐 Admin pages should now show populated data!');
    console.log('   Visit: http://localhost:3000/admin');

  } catch (error) {
    console.log('❌ Population failed:', error.message);
  }
}

populateSampleData();
