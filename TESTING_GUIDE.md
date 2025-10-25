# 🧪 TESTING GUIDE

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running
- Cloudinary account
- Google Gemini API key
- VAPI account

### Setup
```bash
# Frontend
cd /home/gotti/Desktop/frontend
npm install
npm run dev

# Backend
cd /home/gotti/Desktop/frontend/backend
npm install
npm run dev
```

---

## Test Scenarios

### 1. Expression Orale (Speaking)

**Test**: Create expression orale question
1. Go to `/admin/content/questionnaire`
2. Select category: "oral"
3. Upload PDF with topics
4. Verify sujets extracted
5. Select voice preference
6. Set max duration (3 min)
7. Save questionnaire
8. Verify in database

**Expected**: ✅ PDF extracted, questions created, stored in DB

---

### 2. Simulation Builder

**Test**: Create TCF/TEF simulation
1. Go to `/admin/content/simulation/builder`
2. Fill simulation parameters
3. Configure 4 sections
4. Upload documents per section
5. Generate questions with AI
6. Review questions
7. Save simulation
8. Verify Cloudinary upload

**Expected**: ✅ Simulation created, uploaded to Cloudinary

---

### 3. Audio Simulator

**Test**: Create audio simulation
1. Go to `/manager/content/audio-simulator`
2. Upload up to 20 audio files
3. Extract content with AI
4. Verify questions generated
5. Save simulator
6. Verify in database

**Expected**: ✅ Audio processed, questions extracted

---

### 4. Test de Niveau Page

**Test**: Subscription access control
1. Login as FREE tier student
2. Go to `/test-niveau`
3. Take 5 free simulations
4. Attempt 6th simulation
5. Verify blocked with subscription message
6. Login as PREMIUM student
7. Verify access to B1-C2 levels
8. Verify ESSENTIAL only shows B1

**Expected**: ✅ Access control working properly

---

### 5. Voice Simulation

**Test**: VAPI integration
1. Go to `/simulation-vocale`
2. Click "Start Voice Simulation"
3. Verify VAPI loads
4. Test microphone access
5. Speak and verify transcription
6. Complete simulation
7. Verify results saved

**Expected**: ✅ VAPI working, voice recorded, results saved

---

### 6. Immigration Simulation

**Test**: Immigration interview
1. Go to `/immigration-simulations`
2. Select country and category
3. Start simulation
4. Answer questions
5. Verify AI evaluation
6. Check results
7. Verify stored in database

**Expected**: ✅ Interview completed, results saved

---

## API Testing

### Test Free Attempts Counter
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/simulations/free-attempts/count
```

### Test Question Generation
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@document.pdf" \
  http://localhost:3001/api/ai/generate-questions-from-file
```

### Test Subscription History
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/subscriptions/history
```

---

## Database Testing

### Check Simulations
```sql
SELECT * FROM "Simulation" LIMIT 10;
```

### Check Voice Simulations
```sql
SELECT * FROM "VoiceSimulation" LIMIT 10;
```

### Check Subscriptions
```sql
SELECT * FROM "Subscription" WHERE "userId" = 'USER_ID';
```

### Check Test Attempts
```sql
SELECT * FROM "TestAttempt" WHERE "userId" = 'USER_ID';
```

---

## Performance Testing

### Load Test
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/test-niveau
```

### Database Query Performance
```sql
EXPLAIN ANALYZE SELECT * FROM "Simulation" WHERE "type" = 'SIMULATION';
```

---

## Security Testing

### Test Authentication
1. Try accessing `/admin` without login
2. Verify redirect to login
3. Try accessing with invalid token
4. Verify 401 error

### Test Authorization
1. Login as STUDENT
2. Try accessing `/admin/content`
3. Verify 403 error
4. Login as ADMIN
5. Verify access granted

### Test Input Validation
1. Try SQL injection in search
2. Try XSS in question text
3. Verify sanitization

---

## Checklist

- [ ] All 10 parts implemented
- [ ] Build passes (0 errors)
- [ ] No TypeScript errors
- [ ] All endpoints working
- [ ] Database connected
- [ ] Cloudinary working
- [ ] VAPI working
- [ ] Gemini AI working
- [ ] Authentication working
- [ ] Authorization working
- [ ] Subscription control working
- [ ] Free attempts counter working
- [ ] Voice recording working
- [ ] AI extraction working
- [ ] File upload working

---

## Troubleshooting

### Build Fails
```bash
npm run build 2>&1 | grep -i error
```

### API Not Responding
```bash
curl -v http://localhost:3001/api/health
```

### Database Connection Error
```bash
psql -U user -d database -h host
```

### Cloudinary Upload Fails
- Check API key
- Check file size
- Check file type

### VAPI Not Working
- Check public key
- Check browser permissions
- Check microphone access

---

## Support

For issues, check:
- `/backend/logs` for server errors
- Browser console for frontend errors
- Database logs for query errors

