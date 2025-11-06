# Manual Testing Guide - Aura.ca Platform
**Date**: October 24, 2025

---

## 🚀 GETTING STARTED

### Start Servers
```bash
# Terminal 1 - Backend
cd /home/gotti/Desktop/frontend/backend
npm run dev

# Terminal 2 - Frontend
cd /home/gotti/Desktop/frontend
npm run dev
```

### Access Platform
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## ✅ TEST 1: Duration Field (VIDEO Only)

**URL**: http://localhost:3000/admin/content

**Steps**:
1. Navigate to Admin Content page
2. Look at content cards
3. Verify:
   - ✅ VIDEO content shows duration (e.g., "2h durée")
   - ✅ COURSE content does NOT show duration
   - ✅ DOCUMENT content does NOT show duration
   - ✅ AUDIO content does NOT show duration

**Expected Result**: Duration only visible for VIDEO content type

---

## ✅ TEST 2: View/Voir Button

**URL**: http://localhost:3000/admin/content

**Steps**:
1. Click "more options" (three dots) on any content card
2. Click "Voir" button
3. Verify:
   - ✅ File opens in new tab
   - ✅ If no file, error toast appears: "Aucun fichier disponible"

**Expected Result**: File opens successfully in new tab

---

## ✅ TEST 3: Questionnaire Expression Orale

**URL**: http://localhost:3000/admin/content/questionnaire

**Steps**:
1. Create new questionnaire
2. Select category: "Expression Orale"
3. Scroll down
4. Verify:
   - ✅ "Générer des Questions avec l'IA" section is HIDDEN
   - ✅ Only Expression Orale section is visible
   - ✅ PDF upload, sujet extraction, voice selection visible

**Expected Result**: AI generation section hidden for oral category

---

## ✅ TEST 4: Simulation Builder - Exam Types

**URL**: http://localhost:3000/admin/content/simulation/builder

**Steps**:
1. Go to Configuration section
2. Click "Type d'examen" dropdown
3. Verify options:
   - ✅ TCF
   - ✅ TEF
   - ✅ Épreuve typique (NEW)

**Expected Result**: All three exam types available

---

## ✅ TEST 5: AI Generation - File Upload

**URL**: http://localhost:3000/admin/content/simulation/builder

**Steps**:
1. Upload a PDF file for a section
2. Click "Générer avec AI" button
3. Verify:
   - ✅ No 400 error
   - ✅ Questions are generated
   - ✅ Success message appears

**Expected Result**: Questions generated without 400 error

---

## ✅ TEST 6: Audio Simulator - Voice Options

**URL**: http://localhost:3000/manager/content/audio-simulator

**Steps**:
1. Navigate to Audio Simulator page
2. Look for "Sélection de la Voix" dropdown
3. Verify 7-8 voice options:
   - ✅ Voix Féminine France 1
   - ✅ Voix Féminine France 2
   - ✅ Voix Masculine France 1
   - ✅ Voix Masculine France 2
   - ✅ Voix Féminine Québec
   - ✅ Voix Masculine Québec
   - ✅ Voix Féminine Belgique
   - ✅ Voix Masculine Belgique

**Expected Result**: All 8 voice options visible

---

## ✅ TEST 7: Audio Simulator - Sujets Selection

**URL**: http://localhost:3000/manager/content/audio-simulator

**Steps**:
1. Look for "Sélectionner un Sujet" dropdown
2. Click dropdown
3. Verify:
   - ✅ Dropdown appears
   - ✅ Sujets are fetched from question bank
   - ✅ Multiple options available

**Expected Result**: Sujets loaded from question bank

---

## ✅ TEST 8: Audio Simulator - Duration Display

**URL**: http://localhost:3000/manager/content/audio-simulator

**Steps**:
1. Look for "Durée" section
2. Verify:
   - ✅ Shows "Durée fixe: 7 minutes"
   - ✅ Cannot be changed
   - ✅ Displayed in info box

**Expected Result**: Duration fixed at 7 minutes

---

## ✅ TEST 9: Audio Extraction

**URL**: http://localhost:3000/manager/content/audio-simulator

**Steps**:
1. Upload an audio file
2. Click "Extraire" button
3. Verify:
   - ✅ Extraction starts
   - ✅ Questions extracted from audio
   - ✅ Success message appears

**Expected Result**: Audio content extracted successfully

---

## ✅ TEST 10: Build Verification

**Terminal**:
```bash
cd /home/gotti/Desktop/frontend
npm run build
```

**Verify**:
- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ All pages compile successfully

**Expected Result**: Build succeeds

---

## 🐛 TROUBLESHOOTING

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Backend Not Responding
```bash
cd /home/gotti/Desktop/frontend/backend
npm run dev
```

### Frontend Not Loading
```bash
cd /home/gotti/Desktop/frontend
npm run dev
```

---

## 📊 TEST RESULTS TEMPLATE

| Test | Status | Notes |
|------|--------|-------|
| Duration Field | ✅/❌ | |
| View Button | ✅/❌ | |
| Expression Orale | ✅/❌ | |
| Exam Types | ✅/❌ | |
| AI Generation | ✅/❌ | |
| Voice Options | ✅/❌ | |
| Sujets Selection | ✅/❌ | |
| Duration Display | ✅/❌ | |
| Audio Extraction | ✅/❌ | |
| Build Status | ✅/❌ | |

---

**All tests should pass! ✅**

