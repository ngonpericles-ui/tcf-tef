import { NextResponse, NextRequest } from "next/server"

// 🎯 CLEAN ROLE-BASED REDIRECTION LOGIC
// Based on 4 roles: STUDENT, JUNIOR_MANAGER, SENIOR_MANAGER, ADMIN

// Role constants
const ROLES = {
  STUDENT: 'STUDENT',
  JUNIOR_MANAGER: 'JUNIOR_MANAGER', 
  SENIOR_MANAGER: 'SENIOR_MANAGER',
  ADMIN: 'ADMIN'
} as const

// Route categories
const ADMIN_ROUTES = ['/admin']
const MANAGER_ROUTES = ['/manager', '/senior-manager', '/junior-manager'] 
const STUDENT_ROUTES = [
  '/home', '/cours', '/profil', '/quoi-de-neuf', '/favoris', '/messages', 
  '/notifications', '/tcf-simulation', '/tcf-tef-simulation', '/simulation-vocale', 
  '/immigration-simulations', '/live', '/achievements', '/abonnement', '/corriger', 
  '/test-results', '/search', '/explore', '/chat', '/marketplace', '/settings', '/payment'
]

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Handle Pro+ only access for /avantages-pro
  if (url.pathname === "/avantages-pro") {
    const isAuth = req.cookies.get('auth')?.value === '1'
    const subscriptionTier = req.cookies.get('subscriptionTier')?.value || 
                        req.cookies.get('user_subscription_tier')?.value ||
                        req.cookies.get('subscription_tier')?.value ||
                        req.cookies.get('tier')?.value

    if (!isAuth) {
      console.log('🚫 User not authenticated, redirecting to /connexion')
      url.pathname = "/connexion"
      return NextResponse.redirect(url)
    }
    
    const isProUser = subscriptionTier && (
      subscriptionTier.toUpperCase() === 'PRO' ||
      subscriptionTier.toUpperCase() === 'PRO+'
    )
    
    if (!isProUser) {
      console.log('⚠️ User is not Pro, subscriptionTier:', subscriptionTier)
    }
  }

  // 🔐 AUTHENTICATION & ROLE DETECTION
  const isAuth = req.cookies.get('auth')?.value === '1'
  const role = req.cookies.get('role')?.value
  const userId = req.cookies.get('user_id')?.value

  // Determine route type
  const isAdminRoute = ADMIN_ROUTES.some(route => url.pathname.startsWith(route))
  const isManagerRoute = MANAGER_ROUTES.some(route => url.pathname.startsWith(route))
  const isStudentRoute = STUDENT_ROUTES.some(route => url.pathname.startsWith(route))

  console.log(`🔍 Route Check: ${url.pathname} | Auth: ${isAuth} | Role: ${role}`)

  // 🔑 LOGIN PAGES - Always allow access regardless of existing session
  if (url.pathname === '/admin/login' || url.pathname === '/connexion' || url.pathname === '/manager') {
    console.log(`✅ ALLOWED: Login page access (existing role: ${role})`)
    return NextResponse.next()
  }

  // 🚫 UNAUTHENTICATED USERS
  if (!isAuth) {
    // Allow access to login pages, welcome page, and static assets
    if (url.pathname === '/connexion' || url.pathname === '/welcome' || url.pathname === '/admin/login' || url.pathname === '/manager' || 
        url.pathname.startsWith('/logo/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/_next/') || 
        url.pathname.startsWith('/favicon') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.gif') || url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
      console.log(`✅ ALLOWED: Unauthenticated access to ${url.pathname}`)
      return NextResponse.next()
    }
    
    // Redirect admin routes to admin login
    if (isAdminRoute) {
      console.log(`🚫 BLOCKED: Unauthenticated user → /admin/login`)
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    
    // Redirect manager routes to manager login
    if (isManagerRoute) {
      console.log(`🚫 BLOCKED: Unauthenticated user → /manager`)
      url.pathname = '/manager'
      return NextResponse.redirect(url)
    }
    
    // Redirect student routes to student login
    if (isStudentRoute) {
      console.log(`🚫 BLOCKED: Unauthenticated user → /connexion`)
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
    
    // Default redirect to welcome for other routes
    console.log(`🚫 BLOCKED: Unauthenticated user → /welcome`)
    url.pathname = '/welcome'
    return NextResponse.redirect(url)
  }

  // 🔐 AUTHENTICATED USERS - ROLE-BASED ACCESS

  // ADMIN SECTION - Only ADMIN can access
  if (isAdminRoute) {
    if (role !== ROLES.ADMIN) {
      console.log(`🚫 BLOCKED: Non-admin (${role}) trying to access admin`)
      // Redirect based on their role
      if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
        url.pathname = '/manager'
      } else if (role === ROLES.STUDENT) {
        url.pathname = '/home'
      } else {
        url.pathname = '/connexion' // Unknown role
      }
      return NextResponse.redirect(url)
    }
    console.log(`✅ ALLOWED: Admin accessing admin section`)
    return NextResponse.next()
  }

  // MANAGER SECTION - Only MANAGERS and ADMIN can access
  if (isManagerRoute) {
    const isManager = role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER || role === ROLES.ADMIN
    if (!isManager) {
      console.log(`🚫 BLOCKED: Non-manager (${role}) trying to access manager`)
      if (role === ROLES.STUDENT) {
        url.pathname = '/home'
      } else {
        url.pathname = '/connexion'
      }
      return NextResponse.redirect(url)
    }
    console.log(`✅ ALLOWED: Manager/Admin (${role}) accessing manager section`)
    return NextResponse.next()
  }

  // STUDENT SECTION - Students and ADMIN can access
  if (isStudentRoute) {
    const isStudent = role === ROLES.STUDENT
    const isAdmin = role === ROLES.ADMIN
    
    // Block managers from student section
    if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
      console.log(`🚫 BLOCKED: Manager (${role}) trying to access student section`)
      url.pathname = '/manager'
      return NextResponse.redirect(url)
    }
    
    // Special handling for /connexion (student login page)
    if (url.pathname === '/connexion') {
      // Always allow access to student login page regardless of existing session
      // Let the login page handle authentication logic
      console.log(`✅ ALLOWED: Access to student login page (existing role: ${role})`)
      return NextResponse.next()
    }
    
    // Block students from other student routes if already logged in
    if (isStudent) {
      console.log(`✅ ALLOWED: Student (${role}) accessing student section`)
      return NextResponse.next()
    }
    
    // Allow admins to access student section
    if (isAdmin) {
      console.log(`✅ ALLOWED: Admin (${role}) accessing student section`)
      return NextResponse.next()
    }
    
    console.log(`✅ ALLOWED: ${isStudent ? 'Student' : 'Admin'} (${role}) accessing student section`)
    return NextResponse.next()
  }

  // Allow access to all other routes
  console.log(`✅ ALLOWED: Public route access`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

