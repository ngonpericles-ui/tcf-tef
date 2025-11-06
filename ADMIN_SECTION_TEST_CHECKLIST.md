# Admin Section - Comprehensive Test Checklist

## Test Execution Guide

### Prerequisites
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- Admin user credentials ready
- Browser DevTools open (F12) to check console for errors

---

## 1. Admin Authentication & Access Control

### Test 1.1: Admin Login
- [ ] Navigate to `http://localhost:3000/admin/login`
- [ ] Enter admin credentials
- [ ] Verify successful login and redirect to `/admin`
- [ ] Check browser console for no errors
- [ ] Verify auth token is stored in localStorage

### Test 1.2: Route Protection
- [ ] Try accessing `/admin` without login
- [ ] Verify redirect to `/admin/login`
- [ ] Try accessing `/connexion` as logged-in admin
- [ ] Verify redirect to `/admin` dashboard
- [ ] Try accessing `/manager` as logged-in admin
- [ ] Verify redirect to `/admin` dashboard

### Test 1.3: Session Persistence
- [ ] Login as admin
- [ ] Refresh the page
- [ ] Verify admin is still logged in
- [ ] Close and reopen browser
- [ ] Verify session is restored

---

## 2. Admin Dashboard

### Test 2.1: Dashboard Load
- [ ] Navigate to `/admin`
- [ ] Verify page loads without errors
- [ ] Check console for API errors
- [ ] Verify all dashboard sections are visible

### Test 2.2: Dashboard Statistics
- [ ] Verify user count is displayed
- [ ] Verify course count is displayed
- [ ] Verify test count is displayed
- [ ] Verify live session count is displayed
- [ ] Verify revenue/subscription stats are displayed

### Test 2.3: Dashboard Navigation
- [ ] Click on "Users" section
- [ ] Verify navigation to users page
- [ ] Click on "Courses" section
- [ ] Verify navigation to courses page
- [ ] Click on "Tests" section
- [ ] Verify navigation to tests page

---

## 3. Admin Users Management

### Test 3.1: Users List
- [ ] Navigate to `/admin/users`
- [ ] Verify users list loads
- [ ] Verify pagination works
- [ ] Verify search functionality works
- [ ] Verify filter by role works

### Test 3.2: User Actions
- [ ] Click on a user to view details
- [ ] Verify user profile information displays
- [ ] Click edit button
- [ ] Modify user information
- [ ] Save changes
- [ ] Verify changes are saved

### Test 3.3: User Deletion
- [ ] Select a test user
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify user is removed from list

---

## 4. Admin Marketplace

### Test 4.1: Marketplace Load
- [ ] Navigate to `/admin/marketplace`
- [ ] Verify page loads without errors
- [ ] Verify tutor profiles are displayed
- [ ] Check console for no errors

### Test 4.2: Profile Activation
- [ ] Click "Activate Profile" button
- [ ] Verify success message appears
- [ ] Verify profile status changes
- [ ] Refresh page
- [ ] Verify activation persists

### Test 4.3: Student Requests
- [ ] Verify student requests section loads
- [ ] Click "Accept" on a request
- [ ] Verify request status changes to "accepted"
- [ ] Click "Decline" on another request
- [ ] Verify request status changes to "declined"

---

## 5. Admin Live Sessions

### Test 5.1: Live Sessions List
- [ ] Navigate to `/admin/live-sessions`
- [ ] Verify page loads without errors
- [ ] Verify sessions list displays
- [ ] Verify pagination works

### Test 5.2: Create Group Session
- [ ] Click "Create Session" button
- [ ] Fill in session details:
  - [ ] Title: "Test Grammar Session"
  - [ ] Description: "A test session for grammar"
  - [ ] Date: Select future date
  - [ ] Time: Select time
  - [ ] Duration: 60 minutes
  - [ ] Max Participants: 20
- [ ] Click "Create Session"
- [ ] Verify success message
- [ ] Verify session appears in list

### Test 5.3: Create One-on-One Session
- [ ] Click "Create One-on-One Session" button
- [ ] Fill in session details:
  - [ ] Title: "Test 1-on-1 Session"
  - [ ] Description: "A test one-on-one session"
  - [ ] Date: Select future date
  - [ ] Time: Select time
  - [ ] Duration: 30 minutes
  - [ ] Student: Select a Pro+ student
- [ ] Click "Create Session"
- [ ] Verify success message
- [ ] Verify session appears in list

### Test 5.4: Session Visibility in Student Section
- [ ] Login as a student
- [ ] Navigate to live sessions
- [ ] Verify created sessions are visible
- [ ] Verify session details are correct

---

## 6. Admin Content Management

### Test 6.1: Content Management
- [ ] Navigate to `/admin/content` section
- [ ] Verify content management interface loads
- [ ] Verify create course button works
- [ ] Verify edit course works
- [ ] Verify delete course works

### Test 6.2: Tests
- [ ] Navigate to tests section
- [ ] Verify tests list loads
- [ ] Verify create test button works
- [ ] Verify edit test works
- [ ] Verify delete test works

---

## 7. Error Handling

### Test 7.1: Network Errors
- [ ] Stop backend server
- [ ] Try to load admin page
- [ ] Verify error message is displayed
- [ ] Restart backend
- [ ] Verify page reloads successfully

### Test 7.2: Invalid Data
- [ ] Try to create session with empty title
- [ ] Verify validation error appears
- [ ] Try to create session with past date
- [ ] Verify validation error appears

---

## 8. Performance & UI

### Test 8.1: Page Load Time
- [ ] Open DevTools Network tab
- [ ] Navigate to `/admin`
- [ ] Verify page loads in < 3 seconds
- [ ] Verify no failed requests

### Test 8.2: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all elements are visible and functional

### Test 8.3: Dark Mode
- [ ] Toggle dark mode
- [ ] Verify all pages display correctly
- [ ] Verify text is readable
- [ ] Verify no styling issues

---

## Test Results Summary

| Test Category | Status | Notes |
|---|---|---|
| Authentication | [ ] Pass / [ ] Fail | |
| Dashboard | [ ] Pass / [ ] Fail | |
| Users Management | [ ] Pass / [ ] Fail | |
| Marketplace | [ ] Pass / [ ] Fail | |
| Live Sessions | [ ] Pass / [ ] Fail | |
| Content Management | [ ] Pass / [ ] Fail | |
| Error Handling | [ ] Pass / [ ] Fail | |
| Performance | [ ] Pass / [ ] Fail | |

---

## Known Issues & Fixes Applied

1. **Authentication Routing** ✅ FIXED
   - Admin/Manager users can no longer access `/connexion`
   - Proper redirects implemented

2. **Live Session Creation** ✅ FIXED
   - Session creation now calls backend API
   - Sessions appear in student section

3. **Marketplace Error** ✅ FIXED
   - Profile activation endpoint verified
   - Error handling improved

---

## Next Steps

1. Run through all tests in this checklist
2. Document any failures
3. Report issues to development team
4. Verify fixes in next release

