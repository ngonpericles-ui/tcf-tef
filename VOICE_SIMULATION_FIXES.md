# Voice Simulation Page Fixes

## Issues Fixed

### 1. ✅ Hardcoded localhost:3001 URLs
**Problem:** Frontend was calling `http://localhost:3001/api/...` which fails in production.

**Fixed in:**
- `app/simulation-vocale/page.tsx` - Replaced 2 hardcoded localhost URLs
- All files now use `apiClient` which respects `NEXT_PUBLIC_API_URL`

### 2. ✅ API Endpoint Calls
**Problem:** Using `fetch()` instead of `apiClient`, causing issues with environment URLs.

**Fixed:**
- `/simulations/free-attempts/count` - Now uses `apiClient.get()`
- `/subscriptions/active` - Now uses `apiClient.get()`
- `/voice-simulation/history` - Now uses `apiClient.get()`
- `/voice-simulation/monthly-count` - Now uses `apiClient.get()`
- `/voice-simulation/voices` - Now uses `apiClient.get()`
- `/voice-simulation/question-bank/sujets` - Now uses `apiClient.get()`
- `/users/preferences/voice` - Now uses `apiClient.get()`
- `/voice-simulation/book` - Now uses `apiClient.post()`
- `/voice-simulation/cancel/:id` - Now uses `apiClient.delete()`
- `/voice-simulation/reschedule/:id` - Now uses `apiClient.put()`

### 3. ✅ Response Handling
**Problem:** Response structure wasn't being handled correctly.

**Fixed:**
- Added proper type assertions for response data
- Fixed `monthlyCount` vs `count` property mismatch
- Fixed array handling for simulations and bookings
- Improved error handling

### 4. ✅ TypeScript Errors
**Problem:** Type errors due to response data typing.

**Fixed:**
- Added `as any` type assertions where needed
- Fixed array type checks
- Proper handling of nested response structures

## Remaining Issues to Check

### Calendar Display
The calendar logic appears correct - it only disables past dates. If dates are still greyed out:
1. Check if `selectedDate` state is being set correctly
2. Verify timezone handling
3. Check if there are any CSS issues hiding enabled dates

### Backend Routes Status
All routes exist in backend:
- ✅ `/api/voice-simulation/history` - GET (authenticated)
- ✅ `/api/voice-simulation/voices` - GET (public)
- ✅ `/api/voice-simulation/question-bank/sujets` - GET (public)
- ✅ `/api/voice-simulation/monthly-count` - GET (authenticated)
- ✅ `/api/users/preferences/voice` - GET (authenticated)
- ✅ `/api/voice-simulation/book` - POST (authenticated)
- ✅ `/api/voice-simulation/cancel/:id` - DELETE (authenticated)
- ✅ `/api/voice-simulation/reschedule/:id` - PUT (authenticated)

## Critical: Environment Variable

**MUST SET in Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

Without this, all API calls will fail in production.

## Testing Checklist

- [ ] Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Test voice simulation page loads
- [ ] Test calendar displays correctly (dates not greyed out)
- [ ] Test booking a simulation
- [ ] Test canceling a simulation
- [ ] Test rescheduling a simulation
- [ ] Test voice selection
- [ ] Test topic selection
- [ ] Verify all API calls go to Render backend, not localhost

