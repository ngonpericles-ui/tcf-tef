# 🚀 Quick Start Testing Guide
**October 24, 2025**

---

## ⚡ QUICK SETUP (2 minutes)

### Terminal 1 - Start Backend
```bash
cd /home/gotti/Desktop/frontend/backend
npm run dev
```
✅ Wait for: "🚀 Server running on port 3001"

### Terminal 2 - Start Frontend
```bash
cd /home/gotti/Desktop/frontend
npm run dev -- -p 3002
```
✅ Wait for: "✓ Ready in X.Xs"

### Open Browser
```
http://localhost:3002
```

---

## 🧪 QUICK TESTS (5 minutes each)

### TEST 1: Duration Field ⏱️
**URL**: http://localhost:3002/admin/content
- Look at content cards
- ✅ VIDEO content shows duration
- ❌ Other content types don't show duration

### TEST 2: View Button 👁️
**URL**: http://localhost:3002/admin/content
- Click "..." on any card
- Click "Voir"
- ✅ File opens in new tab

### TEST 3: Expression Orale 🎤
**URL**: http://localhost:3002/admin/content/questionnaire
- Select "Expression Orale" category
- ✅ AI generation section is HIDDEN
- ✅ Only expression orale section visible

### TEST 4: Exam Types 📝
**URL**: http://localhost:3002/admin/content/simulation/builder
- Click "Type d'examen" dropdown
- ✅ See: TCF, TEF, Épreuve typique

### TEST 5: AI Generation 🤖
**URL**: http://localhost:3002/admin/content/simulation/builder
- Upload a PDF
- Click "Générer avec AI"
- ✅ No 400 error
- ✅ Questions generated

### TEST 6: Voice Options 🎵
**URL**: http://localhost:3002/manager/content/audio-simulator
- Look for "Sélection de la Voix" dropdown
- ✅ See 8 voice options:
  - France Female 1 & 2
  - France Male 1 & 2
  - Quebec Female & Male
  - Belgium Female & Male

### TEST 7: Sujets Selection 📚
**URL**: http://localhost:3002/manager/content/audio-simulator
- Look for "Sélectionner un Sujet" dropdown
- ✅ Dropdown populated with sujets

### TEST 8: Duration Display ⏰
**URL**: http://localhost:3002/manager/content/audio-simulator
- Look for "Durée" section
- ✅ Shows "Durée fixe: 7 minutes"

---

## 📊 RESULTS CHECKLIST

```
[ ] Duration Field - Only VIDEO shows duration
[ ] View Button - Opens file in new tab
[ ] Expression Orale - AI section hidden
[ ] Exam Types - Épreuve typique available
[ ] AI Generation - No 400 error
[ ] Voice Options - 8 options visible
[ ] Sujets Selection - Dropdown populated
[ ] Duration Display - Shows 7 minutes
```

---

## 🔍 WHAT TO LOOK FOR

### ✅ GOOD SIGNS
- No error messages
- Pages load quickly
- Dropdowns populate with data
- Buttons respond immediately
- Files open in new tabs

### ❌ BAD SIGNS
- 400/500 errors
- Blank dropdowns
- Buttons don't respond
- Pages take >5 seconds to load
- Console errors

---

## 🛠️ TROUBLESHOOTING

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Backend Not Responding
```bash
# Check if running
curl http://localhost:3001/api/health

# Restart if needed
cd /home/gotti/Desktop/frontend/backend
npm run dev
```

### Frontend Not Loading
```bash
# Check if running
curl http://localhost:3002

# Restart if needed
cd /home/gotti/Desktop/frontend
npm run dev -- -p 3002
```

---

## 📱 BROWSER CONSOLE

Open DevTools (F12) and check:
- ✅ No red errors
- ✅ Network requests successful (200 status)
- ✅ No CORS errors

---

## ⏱️ ESTIMATED TIME

- Setup: 2 minutes
- Test 1-8: 5 minutes each = 40 minutes
- **Total**: ~45 minutes

---

## 🎯 SUCCESS CRITERIA

✅ All 8 tests pass
✅ No console errors
✅ All pages load quickly
✅ All buttons work
✅ All dropdowns populate

---

## 📞 SUPPORT

If any test fails:
1. Check browser console (F12)
2. Check terminal output
3. Restart servers
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try again

---

**Ready to test? Let's go! 🚀**

