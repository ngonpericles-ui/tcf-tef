# RBAC Fix - Testing Guide

## Issue Fixed
**Problem**: Students were being redirected to admin page instead of student dashboard after login.

**Root Cause**: 
1. Cookies were not being set with proper attributes (SameSite, max-age)
2. Middleware was checking cookies before they were fully set
3. Race condition between cookie setting and redirect

## Solution Implemented

### 1. Updated Cookie Attributes
- Added `SameSite=Lax` to all cookies for proper server-side reading
- Added `max-age` to ensure cookies persist
- Added logging to debug cookie issues

### 2. Added Delay Before Redirect
- Added 100ms delay to ensure cookies are set before redirect
- Prevents race condition with middleware

### 3. Enhanced Debugging
- Added console logs to track cookie setting
- Added middleware debug logs to show role and auth status
- Added logging in AuthContext for cookie updates

## Files Modified

1. `/middleware.ts`
   - Added debug logging for role-based access
   - Logs: Path, Auth status, Role, UserId

2. `/contexts/AuthContext.tsx`
   - Updated `updateAuthCookies()` function
   - Added `SameSite=Lax` attribute
   - Added console logging

3. `/app/connexion/page.tsx`
   - Updated cookie setting with proper attributes
   - Added 100ms delay before redirect
   - Enhanced logging

## Testing Steps

### Test 1: Student Login
1. Go to http://localhost:3000/connexion
2. Login with student credentials:
   - Email: `student@aura.ca`
   - Password: `Student@123`
3. **Expected**: Redirect to `/home` (student dashboard)
4. **Check**: Browser console should show:
   ```
   🍪 Student login cookies set: { role: 'STUDENT', userId: '...', email: '...' }
   🔄 Redirecting to /home...
   ```
5. **Check**: Middleware logs should show:
   ```
   🔍 MIDDLEWARE DEBUG: Path=/home, Auth=true, Role=STUDENT, UserId=...
   ✅ ALLOWED: Student (STUDENT) accessing student section
   ```

### Test 2: Admin Cannot Access Student Section
1. Login as admin:
   - Email: `admin@aura.ca`
   - Password: `Admin@123`
2. Try to access http://localhost:3000/home
3. **Expected**: Redirect to `/admin`
4. **Check**: Middleware logs should show:
   ```
   🔍 MIDDLEWARE DEBUG: Path=/home, Auth=true, Role=ADMIN, UserId=...
   🚫 BLOCKED: Non-student user (ADMIN) trying to access student section
   ```

### Test 3: Student Cannot Access Admin Section
1. Login as student
2. Try to access http://localhost:3000/admin
3. **Expected**: Redirect to `/connexion`
4. **Check**: Middleware logs should show:
   ```
   🔍 MIDDLEWARE DEBUG: Path=/admin, Auth=true, Role=STUDENT, UserId=...
   🚫 BLOCKED: Non-admin user (STUDENT) trying to access admin section
   ```

### Test 4: Manager Cannot Access Student Section
1. Login as manager:
   - Email: `manager@aura.ca`
   - Password: `Manager@123`
2. Try to access http://localhost:3000/home
3. **Expected**: Redirect to `/manager`
4. **Check**: Middleware logs should show:
   ```
   🔍 MIDDLEWARE DEBUG: Path=/home, Auth=true, Role=JUNIOR_MANAGER, UserId=...
   🚫 BLOCKED: Non-student user (JUNIOR_MANAGER) trying to access student section
   ```

### Test 5: Unauthenticated User
1. Clear all cookies
2. Try to access http://localhost:3000/home
3. **Expected**: Redirect to `/connexion`
4. **Check**: Middleware logs should show:
   ```
   🔍 MIDDLEWARE DEBUG: Path=/home, Auth=false, Role=undefined, UserId=undefined
   🚫 BLOCKED: Unauthenticated user trying to access student section
   ```

## Debugging

### Check Cookies in Browser
1. Open DevTools (F12)
2. Go to Application > Cookies > localhost:3000
3. Look for:
   - `auth` = 1
   - `role` = STUDENT (or ADMIN, JUNIOR_MANAGER, etc.)
   - `user_id` = (user ID)
   - `hasAccount` = 1

### Check Console Logs
1. Open DevTools Console (F12)
2. Look for logs starting with:
   - 🍪 (cookie logs)
   - 🔍 (middleware debug)
   - ✅ (allowed access)
   - 🚫 (blocked access)

### Check Backend Logs
1. Terminal where backend is running
2. Look for login attempt logs
3. Should show role being returned

## Success Criteria

✅ Student logs in → redirected to `/home`
✅ Admin logs in → redirected to `/admin`
✅ Manager logs in → redirected to `/manager`
✅ Admin cannot access `/home` → redirected to `/admin`
✅ Student cannot access `/admin` → redirected to `/connexion`
✅ Manager cannot access `/home` → redirected to `/manager`
✅ Unauthenticated user cannot access student pages → redirected to `/connexion`
✅ Cookies are set with proper attributes
✅ Middleware logs show correct role and auth status

## Rollback (if needed)

If the fix causes issues:
1. Remove `SameSite=Lax` from cookie attributes
2. Remove the 100ms delay
3. Revert to previous middleware version

## Notes

- The 100ms delay is minimal and should not affect user experience
- `SameSite=Lax` is the recommended setting for same-site cookies
- Logging can be removed in production for performance
- Test with multiple browsers to ensure consistency

