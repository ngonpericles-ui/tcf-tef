# 🧪 MANUAL TESTING CHECKLIST - Aura.ca Platform

## SECTION 1: Subscription-Based Access Control

### 1.1 Immigration Simulations Page (`/immigration-simulations`)
- [ ] **Test with PRO subscriber (Tima Claude)**
  - [ ] Login with PRO account
  - [ ] Navigate to `/immigration-simulations`
  - [ ] Verify page loads WITHOUT redirect to subscription page
  - [ ] Verify simulations are displayed
  - [ ] Verify monthly counter shows (2 simulations per month)
  - [ ] Verify "Rejoindre" button works

- [ ] **Test with FREE subscriber**
  - [ ] Login with FREE account
  - [ ] Navigate to `/immigration-simulations`
  - [ ] Verify redirected to `/abonnement`
  - [ ] Verify error message: "Les simulations d'immigration nécessitent un abonnement Pro"

- [ ] **Test with ESSENTIAL subscriber**
  - [ ] Login with ESSENTIAL account
  - [ ] Navigate to `/immigration-simulations`
  - [ ] Verify redirected to `/abonnement`

### 1.2 Voice Simulation Page (`/simulation-vocale`)
- [ ] **Test with PREMIUM subscriber**
  - [ ] Login with PREMIUM account
  - [ ] Navigate to `/simulation-vocale`
  - [ ] Verify page loads WITHOUT redirect
  - [ ] Verify simulations are displayed
  - [ ] Verify monthly counter shows (2 simulations per month)

- [ ] **Test with PRO subscriber**
  - [ ] Login with PRO account
  - [ ] Navigate to `/simulation-vocale`
  - [ ] Verify page loads WITHOUT redirect
  - [ ] Verify simulations are displayed

- [ ] **Test with ESSENTIAL subscriber**
  - [ ] Login with ESSENTIAL account
  - [ ] Navigate to `/simulation-vocale`
  - [ ] Verify redirected to `/abonnement`
  - [ ] Verify error message: "Les simulations vocales nécessitent un abonnement Premium ou Pro"

- [ ] **Test with FREE subscriber**
  - [ ] Login with FREE account
  - [ ] Navigate to `/simulation-vocale`
  - [ ] Verify redirected to `/abonnement`

## SECTION 2: Test de Niveau - Simulation Counter

### 2.1 Free Simulation Counter (`/test-niveau`)
- [ ] **Test counter display**
  - [ ] Navigate to `/test-niveau`
  - [ ] Verify "Simulations gratuites disponibles" section appears
  - [ ] Verify counter shows "X simulations gratuites restantes sur 5"
  - [ ] Verify counter is accurate

- [ ] **Test counter after simulations**
  - [ ] Complete 1 simulation
  - [ ] Refresh page
  - [ ] Verify counter decremented by 1
  - [ ] Repeat until counter reaches 0

- [ ] **Test counter blocking**
  - [ ] After 5 simulations, verify counter shows "Simulations gratuites épuisées"
  - [ ] Verify "Vous avez utilisé vos 5 simulations gratuites" message
  - [ ] Verify "S'abonner maintenant" button appears
  - [ ] Verify button redirects to `/abonnement`

- [ ] **Test audio simulations included**
  - [ ] Verify audio simulations count toward the 5 free limit
  - [ ] Complete an audio simulation
  - [ ] Verify counter decremented

## SECTION 3: Live Sessions - Tutor Functionality

### 3.1 Session Creation (`/admin/live-sessions`)
- [ ] **Test group session creation**
  - [ ] Login as admin/manager
  - [ ] Navigate to `/admin/live-sessions`
  - [ ] Click "Créer une session de groupe"
  - [ ] Fill in all required fields
  - [ ] Select date and time (future date)
  - [ ] Select duration (30, 45, 60, or 90 minutes)
  - [ ] Select max participants (20)
  - [ ] Click "Créer la session"
  - [ ] Verify success message
  - [ ] Verify session appears in list

- [ ] **Test one-on-one session creation**
  - [ ] Click "Créer une session individuelle"
  - [ ] Fill in all required fields
  - [ ] Select a student from dropdown
  - [ ] Select date and time (future date)
  - [ ] Select duration (15-120 minutes)
  - [ ] Click "Créer la session"
  - [ ] Verify success message
  - [ ] Verify session appears in list

### 3.2 Session Management Card
- [ ] **Test session card display**
  - [ ] Verify session card shows title, description, date, time
  - [ ] Verify "Rejoindre" button appears
  - [ ] Verify session status badge (SCHEDULED, LIVE, ENDED)

- [ ] **Test "Rejoindre" button**
  - [ ] Click "Rejoindre" button
  - [ ] Verify redirected to session page
  - [ ] Verify Agora video interface loads

### 3.3 Tutor Agora Interface
- [ ] **Test video functionality**
  - [ ] Verify video camera works
  - [ ] Verify audio microphone works
  - [ ] Verify video quality is good

- [ ] **Test screen sharing**
  - [ ] Click screen share button
  - [ ] Select screen to share
  - [ ] Verify screen is shared to participants

- [ ] **Test whiteboard**
  - [ ] Click whiteboard button
  - [ ] Verify whiteboard opens
  - [ ] Test drawing tools
  - [ ] Verify drawings are visible to participants

- [ ] **Test chat**
  - [ ] Send a message in chat
  - [ ] Verify message appears for all participants
  - [ ] Verify message history is preserved

- [ ] **Test AI assistant**
  - [ ] Verify AI assistant is available
  - [ ] Ask a question
  - [ ] Verify AI responds appropriately

- [ ] **Test participant management**
  - [ ] Verify participant list shows all joined users
  - [ ] Test muting/unmuting participants
  - [ ] Test removing participants

## SECTION 4: Live Sessions - Student Functionality

### 4.1 Session Display (`/live`)
- [ ] **Test session list**
  - [ ] Navigate to `/live`
  - [ ] Verify sessions appear immediately after tutor creates them
  - [ ] Verify sessions show title, tutor, time, duration, type
  - [ ] Verify sessions are sorted by date

- [ ] **Test session filtering**
  - [ ] Test filter by category
  - [ ] Test filter by level
  - [ ] Test search functionality

### 4.2 Student Join Functionality
- [ ] **Test joining before session starts**
  - [ ] Click "S'inscrire" on upcoming session
  - [ ] Verify redirected to session page
  - [ ] Verify "Waiting for teacher..." message appears
  - [ ] Verify waiting room interface

- [ ] **Test joining live session**
  - [ ] Wait for session to start
  - [ ] Click "Rejoindre" on live session
  - [ ] Verify Agora interface loads
  - [ ] Verify video/audio works

### 4.3 Session Card and Reminders
- [ ] **Test "Rejoindre" button**
  - [ ] Verify button is enabled for accessible sessions
  - [ ] Verify button is disabled for locked sessions
  - [ ] Click button and verify join works

- [ ] **Test "Ajouter un rappel" button**
  - [ ] Click "Ajouter un rappel"
  - [ ] Select "5 minutes avant"
  - [ ] Verify confirmation message
  - [ ] Verify email notification sent

- [ ] **Test reminder notifications**
  - [ ] Wait for reminder time
  - [ ] Verify email notification received
  - [ ] Verify platform notification appears

## SECTION 5: Manager Creation

### 5.1 Create Manager Page (`/admin/create-manager`)
- [ ] **Test manager creation form**
  - [ ] Navigate to `/admin/create-manager`
  - [ ] Fill in all required fields (name, email, password)
  - [ ] Click "Créer le manager"
  - [ ] Verify success message
  - [ ] Verify manager appears in history

- [ ] **Test manager login**
  - [ ] Logout
  - [ ] Login with new manager account
  - [ ] Verify manager dashboard loads
  - [ ] Verify manager can access manager features

### 5.2 Manager History Page
- [ ] **Test history display**
  - [ ] Navigate to manager history page
  - [ ] Verify all created managers are listed
  - [ ] Verify manager details (name, email, creation date)
  - [ ] Verify manager status (active/inactive)

## SECTION 6: Admin Settings

### 6.1 Settings Page (`/admin/settings`)
- [ ] **Test profile settings**
  - [ ] Navigate to `/admin/settings`
  - [ ] Update profile information
  - [ ] Click "Enregistrer"
  - [ ] Verify changes saved

- [ ] **Test password change**
  - [ ] Click "Changer le mot de passe"
  - [ ] Enter current password
  - [ ] Enter new password
  - [ ] Confirm new password
  - [ ] Click "Enregistrer"
  - [ ] Verify success message
  - [ ] Logout and login with new password

- [ ] **Test notification preferences**
  - [ ] Toggle notification options
  - [ ] Click "Enregistrer"
  - [ ] Verify preferences saved

- [ ] **Test platform configuration**
  - [ ] Update any platform settings
  - [ ] Click "Enregistrer"
  - [ ] Verify changes applied

## FINAL VERIFICATION

- [ ] All pages load without errors
- [ ] All buttons work correctly
- [ ] All forms submit successfully
- [ ] All redirects work as expected
- [ ] All error messages display correctly
- [ ] All success messages display correctly
- [ ] No console errors
- [ ] No network errors
- [ ] Performance is acceptable
- [ ] Mobile responsiveness works

## NOTES

- Test with different subscription tiers
- Test with different user roles
- Test with different browsers
- Test on mobile devices
- Test with slow network connection
- Test with offline mode

