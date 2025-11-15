import { NextResponse, NextRequest } from "next/server"

// 🎯 CLEAN ROLE-BASED REDIRECTION LOGIC
// Based on 4 roles: STUDENT, JUNIOR_MANAGER, SENIOR_MANAGER, ADMIN

// Role constants
const ROLES = {
  STUDENT: 'STUDENT',
  JUNIOR_MANAGER: 'JUNIOR_MANAGER', 
  SENIOR_MANAGER: 'SENIOR_MANAGER',
  ADMIN: 'ADMIN'
};

// Route categories
const ADMIN_ROUTES = ['/admin']
const MANAGER_ROUTES = ['/manager', '/senior-manager', '/junior-manager'] 
const STUDENT_ROUTES = [
  '/home', '/cours', '/profil', '/quoi-de-neuf', '/favoris',
  '/notifications', '/tcf-simulation', '/tcf-tef-simulation', '/simulation-vocale', 
  '/immigration-simulations', '/live', '/achievements', '/abonnement', '/corriger', 
  '/test-results', '/search', '/explore', '/chat', '/marketplace', '/settings', '/payment'
]
// Special messaging routes - each role has their own
const MESSAGING_ROUTES = {
  ADMIN: '/admin/messages',
  MANAGER: ['/manager/messages', '/senior-manager/messages', '/junior-manager/messages'],
  STUDENT: '/messages'
}

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
      url.pathname = "/connexion"
      return NextResponse.redirect(url)
    }
    
    const isProUser = subscriptionTier && (
      subscriptionTier.toUpperCase() === 'PRO' ||
      subscriptionTier.toUpperCase() === 'PRO+'
    )
  }

  // 🔐 AUTHENTICATION & ROLE DETECTION
  const isAuth = req.cookies.get('auth')?.value === '1'
  const role = req.cookies.get('role')?.value
  const userId = req.cookies.get('user_id')?.value

  // 🎥 LIVE SESSION ROUTES - Check FIRST (before route type determination)
  // This prevents /live-session/ from being incorrectly classified as a student route
  if (url.pathname.startsWith('/live-session/') || url.pathname.startsWith('/session/')) {
    // Allow all authenticated users to access live sessions
    if (isAuth) {
      return NextResponse.next()
    }
    // Unauthenticated users should login
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  // Determine route type (EXCLUDE live-session routes from this check)
  const isAdminRoute = ADMIN_ROUTES.some(route => url.pathname.startsWith(route))
  const isManagerRoute = MANAGER_ROUTES.some(route => url.pathname.startsWith(route))
  const isStudentRoute = STUDENT_ROUTES.some(route => url.pathname.startsWith(route))

  // 🔑 LOGIN PAGES - Strict role-based access control
  if (url.pathname === '/admin/login') {
    // Unauthenticated users can access admin login
    if (!isAuth) {
      return NextResponse.next()
    }
    // Authenticated admins can stay on admin login (for logout/re-login)
    if (isAuth && role === ROLES.ADMIN) {
      return NextResponse.next()
    }
    // Non-admin authenticated users must be redirected to their home page
    if (isAuth && role !== ROLES.ADMIN) {
      if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
        url.pathname = '/manager'
      } else if (role === ROLES.STUDENT) {
        url.pathname = '/home'
      }
      return NextResponse.redirect(url)
    }
  }

  if (url.pathname === '/manager') {
    // Unauthenticated users can access manager login
    if (!isAuth) {
      return NextResponse.next()
    }
    // Authenticated managers can stay on manager login (for logout/re-login)
    if (isAuth && (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER)) {
      return NextResponse.next()
    }
    // Non-manager authenticated users must be redirected to their home page
    if (isAuth && ![ROLES.SENIOR_MANAGER, ROLES.JUNIOR_MANAGER].includes(role as 'SENIOR_MANAGER' | 'JUNIOR_MANAGER')) {
      if (role === ROLES.ADMIN) {
        url.pathname = '/admin'
      } else if (role === ROLES.STUDENT) {
        url.pathname = '/home'
      }
      return NextResponse.redirect(url)
    }
  }

  if (url.pathname === '/connexion') {
    // Unauthenticated users can access student login
    if (!isAuth) {
      return NextResponse.next()
    }
    // Authenticated students can stay on student login (for logout/re-login)
    if (isAuth && role === ROLES.STUDENT) {
      return NextResponse.next()
    }
    // Non-student authenticated users must be redirected to their LOGIN page (not dashboard)
    if (isAuth && role !== ROLES.STUDENT) {
      if (role === ROLES.ADMIN) {
        url.pathname = '/admin/login'  // ✅ Redirect to admin LOGIN page
      } else if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
        url.pathname = '/manager'  // Manager login page
      }
      return NextResponse.redirect(url)
    }
  }

  // 🚫 UNAUTHENTICATED USERS
  if (!isAuth) {
    // Allow access to login pages, welcome page, inscription page, forgot password page, and static assets
    if (url.pathname === '/connexion' || url.pathname === '/welcome' || url.pathname === '/inscription' || url.pathname === '/mot-de-passe-oublie' || url.pathname === '/admin/login' || url.pathname === '/manager' || 
        url.pathname.startsWith('/logo/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/_next/') || 
        url.pathname.startsWith('/favicon') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.gif') || url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
      return NextResponse.next()
    }
    
    // Redirect admin routes to admin login
    if (isAdminRoute) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    
    // Redirect manager routes to manager login
    if (isManagerRoute) {
      url.pathname = '/manager'
      return NextResponse.redirect(url)
    }
    
    // Redirect student routes to student login
    if (isStudentRoute) {
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
    
    // Default redirect to welcome for other routes
    url.pathname = '/welcome'
    return NextResponse.redirect(url)
  }

  // 🔐 AUTHENTICATED USERS - ROLE-BASED ACCESS
  // Note: Live session routes are already handled above (before route type determination)

  // 📨 MESSAGING ROUTES - Strict role-based access
  const isMessagingRoute = url.pathname.startsWith('/messages') || 
                           url.pathname.startsWith('/admin/messages') ||
                           url.pathname.startsWith('/manager/messages') ||
                           url.pathname.startsWith('/senior-manager/messages') ||
                           url.pathname.startsWith('/junior-manager/messages')

  if (isMessagingRoute) {
    // Admin trying to access messages
    if (url.pathname.startsWith('/admin/messages')) {
      if (role !== ROLES.ADMIN) {
        if (role === ROLES.STUDENT) {
          url.pathname = '/messages'  // Redirect to student messages
        } else if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
          url.pathname = '/manager/messages'  // Redirect to manager messages
        }
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    
    // Manager trying to access messages
    if (url.pathname.startsWith('/manager/messages') || 
        url.pathname.startsWith('/senior-manager/messages') ||
        url.pathname.startsWith('/junior-manager/messages')) {
      const isManager = role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER
      if (!isManager) {
        if (role === ROLES.ADMIN) {
          url.pathname = '/admin/messages'
        } else if (role === ROLES.STUDENT) {
          url.pathname = '/messages'
        }
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
    
    // Student trying to access messages
    if (url.pathname === '/messages' || url.pathname.startsWith('/messages/')) {
      if (role !== ROLES.STUDENT) {
        if (role === ROLES.ADMIN) {
          url.pathname = '/admin/messages'
        } else if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
          url.pathname = '/manager/messages'
        }
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }
  }

  // ADMIN SECTION - Only ADMIN can access
  if (isAdminRoute) {
    if (role !== ROLES.ADMIN) {
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
    return NextResponse.next()
  }

  // MANAGER SECTION - Only MANAGERS can access (NOT ADMIN)
  if (isManagerRoute) {
    const isManager = role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER
    if (!isManager) {
      if (role === ROLES.ADMIN) {
        url.pathname = '/admin'
      } else if (role === ROLES.STUDENT) {
        url.pathname = '/home'
      }
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // STUDENT SECTION - Only STUDENTS can access (NOT ADMIN, NOT MANAGER)
  // BUT exclude live-session routes (already handled above)
  if (isStudentRoute && !url.pathname.startsWith('/live-session/') && !url.pathname.startsWith('/session/')) {
    const isStudent = role === ROLES.STUDENT
    
    if (!isStudent) {
      if (role === ROLES.ADMIN) {
        url.pathname = '/admin'
      } else if (role === ROLES.SENIOR_MANAGER || role === ROLES.JUNIOR_MANAGER) {
        url.pathname = '/manager'
      }
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Allow access to all other routes
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

