import { NextResponse, NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Handle Pro+ only access for /avantages-pro
  if (url.pathname === "/avantages-pro") {
    const isAuth = req.cookies.get('auth')?.value === '1'
    
    // Check multiple possible cookie names for subscription tier
    const subscriptionTier = req.cookies.get('subscriptionTier')?.value || 
                            req.cookies.get('user_subscription_tier')?.value ||
                            req.cookies.get('subscription_tier')?.value ||
                            req.cookies.get('tier')?.value
    

                            console.log('🔍 Middleware Debug for /avantages-pro:', {
      pathname: url.pathname,
      isAuth,
      subscriptionTier,
      userAgent: req.headers.get('user-agent'),
      allCookies: Object.fromEntries(Array.from(req.cookies).map(([key, cookie]) => [key, cookie.value]))
    })
    
    if (!isAuth) {
      // Not authenticated - redirect to login
      console.log('🚫 User not authenticated, redirecting to /connexion')
      url.pathname = "/connexion"
      return NextResponse.redirect(url)
    }
    
    // Check for Pro subscription (case insensitive)
    // Pro tier is the highest tier that grants access to /avantages-pro
    const isProUser = subscriptionTier && (
      subscriptionTier.toUpperCase() === 'PRO' ||
      subscriptionTier.toUpperCase() === 'PRO+'
    )
    
    if (!isProUser) {

      // Not Pro user - let the component handle the subscription check
      // This allows the page to load and show appropriate upgrade message
      console.log('⚠️ User is not Pro, subscriptionTier:', subscriptionTier)
    }
  }

  // Role-based section access control
  const isAuth = req.cookies.get('auth')?.value === '1'
  const role = req.cookies.get('role')?.value

  // Admin section protection
  if (url.pathname.startsWith('/admin')) {
    if (!isAuth || role !== 'ADMIN') {
      console.log('🚫 Unauthorized access to admin section, redirecting to admin login')
      // Only redirect to /admin/login if not already there to avoid infinite loop
      if (url.pathname !== '/admin/login') {
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }
    }
  }

  // Manager section protection
  if (url.pathname.startsWith('/manager') || url.pathname.startsWith('/senior-manager') || url.pathname.startsWith('/junior-manager')) {
    const isManager = role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER' || role === 'ADMIN'
    if (!isAuth || !isManager) {
      console.log('🚫 Unauthorized access to manager section, redirecting to manager login')
      // Only redirect to /manager if not already there to avoid infinite loop
      if (url.pathname !== '/manager') {
        url.pathname = '/manager'
        return NextResponse.redirect(url)
      }
    }
  }

  // Student section protection (home, courses, etc.)
  if (url.pathname.startsWith('/home') || url.pathname.startsWith('/cours') || url.pathname.startsWith('/profil')) {
    const isStudent = role === 'USER' || role === 'STUDENT'
    if (!isAuth || !isStudent) {
      console.log('🚫 Unauthorized access to student section, redirecting to student login')
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
  }

  // Prevent cross-section access - redirect authenticated users trying to access wrong login pages
  if (isAuth && role && role !== 'undefined' && role !== 'STUDENT' && role !== 'USER') {
    // Admin trying to access other login pages
    if (role === 'ADMIN' && (url.pathname === '/connexion' || url.pathname === '/manager')) {
      console.log('🔄 Admin redirected from wrong login page to admin dashboard')
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Manager trying to access other login pages
    if ((role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER') && (url.pathname === '/connexion' || url.pathname === '/admin/login')) {
      console.log('🔄 Manager redirected from wrong login page to manager dashboard')
      url.pathname = '/manager/dashboard'
      return NextResponse.redirect(url)
    }

    // Student trying to access other login pages
    if ((role === 'USER' || role === 'STUDENT') && (url.pathname === '/admin/login' || url.pathname === '/manager')) {
      console.log('🔄 Student redirected from wrong login page to student dashboard')
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  // Only handle root path redirects - don't interfere with other routes
  if (url.pathname === "/") {
    const hasAccount = req.cookies.get('hasAccount')?.value === '1'
    
    if (isAuth && role) {
      // Authenticated users: redirect to their dashboard
      switch (role) {
        case 'USER':
        case 'STUDENT':
          url.pathname = '/home'
          return NextResponse.redirect(url)
        case 'ADMIN':
          url.pathname = '/admin'
          return NextResponse.redirect(url)
        case 'SENIOR_MANAGER':
        case 'JUNIOR_MANAGER':
          url.pathname = '/manager/dashboard'
          return NextResponse.redirect(url)
        default:
          url.pathname = '/welcome'
          return NextResponse.redirect(url)
      }
    }

    // Unauthenticated users: redirect based on account status and previous role
    if (hasAccount) {
      // User has an account → redirect to appropriate login page based on role
      if (role === 'ADMIN') {
        url.pathname = "/admin/login"
      } else if (role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER') {
        url.pathname = "/manager"
      } else {
        // Students and regular users go to /connexion
        url.pathname = "/connexion"
      }
      return NextResponse.redirect(url)
    } else {
      // New user without account → redirect to welcome page
      url.pathname = "/welcome"
      return NextResponse.redirect(url)
    }
  }

  // Allow all other routes to pass through without interference
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

