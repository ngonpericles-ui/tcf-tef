# Frontend-Backend Integration Test Plan

## Test Scenarios

### 1. Authentication Flow
- [ ] **Registration**: Test user registration at `/inscription`
  - Fill form with valid data
  - Verify successful registration and automatic login
  - Check redirect to appropriate dashboard based on role

- [ ] **Login**: Test user login at `/connexion`
  - Test with valid credentials
  - Verify role-based redirect (admin → `/admin`, manager → `/manager`, user → `/home`)
  - Test with invalid credentials

- [ ] **Protected Routes**: Test route protection
  - Try accessing `/admin` without authentication → should redirect to `/connexion`
  - Try accessing `/admin` as non-admin user → should redirect to `/unauthorized`
  - Try accessing `/manager` as non-manager → should redirect to `/unauthorized`

### 2. Admin Dashboard Integration
- [ ] **Admin Dashboard**: Test `/admin` page
  - Login as admin user
  - Verify dashboard loads with real backend data
  - Check statistics display correctly
  - Verify user information shows in navigation

- [ ] **Admin Users Management**: Test `/admin/users` page
  - Verify users list loads from backend
  - Check user data displays correctly (name, email, status)
  - Test search and filtering functionality
  - Test user actions (suspend, activate)

### 3. Manager Dashboard Integration
- [ ] **Manager Dashboard**: Test `/manager/dashboard` page
  - Login as manager user (junior or senior)
  - Verify dashboard loads with manager-specific data
  - Check role-based permissions display
  - Verify statistics are manager-specific

### 4. Error Handling
- [ ] **Network Errors**: Test with backend offline
  - Verify error messages display appropriately
  - Check loading states work correctly
  - Ensure graceful degradation

- [ ] **Authentication Errors**: Test token expiration
  - Wait for token to expire or manually clear tokens
  - Verify automatic redirect to login
  - Test token refresh mechanism

### 5. Build and Production
- [ ] **Build Process**: Test production build
  - Run `npm run build`
  - Verify no build errors
  - Check all pages compile correctly

## Test Users (from backend)

### Admin User
- Email: admin@tcf-tef.com
- Password: admin123
- Role: ADMIN
- Should access: `/admin/*` pages

### Manager Users
- Email: manager@tcf-tef.com
- Password: manager123
- Role: JUNIOR_MANAGER or SENIOR_MANAGER
- Should access: `/manager/*` pages

### Regular User
- Email: user@tcf-tef.com
- Password: user123
- Role: USER
- Should access: `/home`, `/tests`, etc.

## API Endpoints Being Tested

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Token refresh
- POST `/api/auth/logout` - User logout

### Admin
- GET `/api/admin/dashboard` - Admin dashboard data
- GET `/api/admin/users` - Users list with filtering
- PATCH `/api/admin/users/:id` - Update user status

### Manager
- GET `/api/manager/dashboard` - Manager dashboard data
- GET `/api/manager/analytics` - Manager analytics
- GET `/api/manager/students` - Manager's students

## Success Criteria

✅ **Authentication**: Users can register, login, and logout successfully
✅ **Role-based Access**: Users are redirected to appropriate dashboards
✅ **Protected Routes**: Unauthorized access is properly blocked
✅ **Data Integration**: Real backend data displays correctly in frontend
✅ **Error Handling**: Errors are handled gracefully with user feedback
✅ **Build Process**: Application builds successfully for production
✅ **Performance**: Pages load within reasonable time limits
✅ **Responsive**: UI works correctly on different screen sizes

## Current Status

### ✅ Completed
- [x] API client configuration and setup
- [x] Authentication system integration (login/register)
- [x] Protected route components (AdminRoute, ManagerRoute, UserRoute)
- [x] Admin dashboard connection to backend
- [x] Admin users page with real data
- [x] Manager layout with role-based protection
- [x] Manager dashboard with backend integration
- [x] Error handling and loading states
- [x] Build process verification

### 🔄 In Progress
- [ ] Complete manager section integration
- [ ] Test all admin functionalities
- [ ] Verify all API endpoints work correctly

### ⏳ Pending
- [ ] User dashboard integration
- [ ] Complete error monitoring setup
- [ ] Performance optimization
- [ ] Final testing and validation
