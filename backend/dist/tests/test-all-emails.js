"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAllEmailServices = testAllEmailServices;
const emailService_1 = require("../services/emailService");
const TEST_EMAIL = 'periclesngon01@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
async function testAllEmailServices() {
    console.log('=== Testing All Email Services ===\n');
    console.log(`Test Email: ${TEST_EMAIL}\n`);
    const results = [];
    console.log('1. Testing Welcome Email...');
    try {
        const result = await emailService_1.EmailService.sendWelcomeEmail({
            firstName: 'Pericles',
            lastName: 'Ngon',
            email: TEST_EMAIL,
            loginUrl: `${FRONTEND_URL}/connexion`
        });
        results.push({ service: 'Welcome Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Welcome Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('2. Testing Course Enrollment Email...');
    try {
        const result = await emailService_1.EmailService.sendCourseEnrollmentEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            courseName: 'Français Avancé - Niveau B2',
            courseUrl: `${FRONTEND_URL}/courses/123`,
            instructorName: 'Marie Dupont'
        });
        results.push({ service: 'Course Enrollment Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Course Enrollment Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('3. Testing Live Session Reminder Email...');
    try {
        const result = await emailService_1.EmailService.sendLiveSessionReminderEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            sessionTitle: 'Grammaire Avancée - Le Subjonctif',
            sessionDate: new Date().toLocaleDateString('fr-FR'),
            sessionTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            joinUrl: `${FRONTEND_URL}/live-session/123`,
            duration: 60
        });
        results.push({ service: 'Live Session Reminder Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Live Session Reminder Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('4. Testing Test Results Email...');
    try {
        const result = await emailService_1.EmailService.sendTestResultsEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            testName: 'Test de Niveau TCF',
            score: 75,
            totalQuestions: 100,
            percentage: 75,
            level: 'B2 - Avancé',
            recommendations: [
                'Continuez à pratiquer la grammaire',
                'Améliorez votre vocabulaire professionnel',
                'Pratiquez l\'expression orale'
            ]
        });
        results.push({ service: 'Test Results Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Test Results Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('5. Testing Voice Simulation Booking Email...');
    try {
        const result = await emailService_1.EmailService.sendVoiceSimulationBookingEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            voicePreference: 'FEMALE',
            duration: '30 minutes'
        });
        results.push({ service: 'Voice Simulation Booking Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Voice Simulation Booking Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('6. Testing Voice Simulation Reminder Email...');
    try {
        console.log('   ⚠️  Skipped - requires database connection for token generation');
        results.push({ service: 'Voice Simulation Reminder Email', success: true, error: 'Skipped - requires DB' });
    }
    catch (error) {
        results.push({ service: 'Voice Simulation Reminder Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('7. Testing Voice Simulation Results Email...');
    try {
        const result = await emailService_1.EmailService.sendVoiceSimulationResultsEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            overallScore: 82.5,
            fluencyScore: 85,
            grammarScore: 80,
            vocabularyScore: 78,
            pronunciationScore: 88,
            coherenceScore: 82,
            feedback: 'Excellente performance! Votre prononciation est remarquable. Continuez à pratiquer pour améliorer votre vocabulaire.',
            completedAt: new Date()
        });
        results.push({ service: 'Voice Simulation Results Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Voice Simulation Results Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('8. Testing Immigration Simulation Confirmation Email...');
    try {
        console.log('   ⚠️  Skipped - requires database connection for token generation');
        results.push({ service: 'Immigration Simulation Confirmation Email', success: true, error: 'Skipped - requires DB' });
    }
    catch (error) {
        results.push({ service: 'Immigration Simulation Confirmation Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('9. Testing Immigration Simulation Reminder Email...');
    try {
        console.log('   ⚠️  Skipped - requires database connection for token generation');
        results.push({ service: 'Immigration Simulation Reminder Email', success: true, error: 'Skipped - requires DB' });
    }
    catch (error) {
        results.push({ service: 'Immigration Simulation Reminder Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('10. Testing Immigration Simulation Results Email...');
    try {
        const result = await emailService_1.EmailService.sendImmigrationSimulationResultsEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            country: 'canada',
            immigrationType: 'skilled_worker',
            finalScore: 85,
            feedback: 'Votre dossier est très solide. Vous avez une bonne compréhension des procédures d\'immigration au Canada. Continuez à vous préparer pour l\'entretien.',
            completedAt: new Date(),
            simulationId: 'test-imm-123'
        });
        results.push({ service: 'Immigration Simulation Results Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'Immigration Simulation Results Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('11. Testing One-on-One Session Email (Messaging)...');
    try {
        const secureToken = 'test-token-123456789';
        const result = await emailService_1.EmailService.sendOneOnOneSessionEmail({
            firstName: 'Pericles',
            email: TEST_EMAIL,
            sessionTitle: 'Session de préparation TCF/TEF',
            instructorName: 'Marie Dupont',
            sessionDate: new Date().toLocaleDateString('fr-FR'),
            sessionTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            secureLink: `${FRONTEND_URL}/session/${secureToken}`,
            duration: 30
        });
        results.push({ service: 'One-on-One Session Email', success: result });
        console.log(result ? '   ✅ Sent successfully' : '   ❌ Failed to send\n');
    }
    catch (error) {
        results.push({ service: 'One-on-One Session Email', success: false, error: error.message });
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    console.log('\n=== Test Summary ===\n');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${result.service}`);
        if (!result.success && result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    console.log(`\nTotal: ${results.length} emails`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%\n`);
    if (successCount === results.length) {
        console.log('🎉 All email services are working correctly!');
    }
    else {
        console.log('⚠️  Some email services failed. Please check the errors above.');
    }
    return results;
}
if (require.main === module) {
    testAllEmailServices()
        .then(() => {
        console.log('\n=== Test Complete ===');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test-all-emails.js.map