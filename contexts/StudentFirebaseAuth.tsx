/**
 * Firebase Authentication Context for Students Only
 * This context handles social media authentication specifically for STUDENT role
 * Admin and Manager sections use the regular JWT authentication
 */

"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth'
import { auth, googleProvider, appleProvider } from '@/lib/firebase'
import { apiClient } from '@/lib/api-client'
import { SessionManager } from '@/lib/sessionManager'

interface StudentFirebaseAuthContextType {
  // Firebase user state
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  
  // Authentication methods
  signInWithGoogle: () => Promise<{ success: boolean; user?: any; error?: string }>
  signInWithApple: () => Promise<{ success: boolean; user?: any; error?: string }>
  signOut: () => Promise<void>
  
  // Integration with existing auth system
  isAuthenticated: boolean
  user: any | null
}

const StudentFirebaseAuthContext = createContext<StudentFirebaseAuthContextType | undefined>(undefined)

interface StudentFirebaseAuthProviderProps {
  children: ReactNode
}

export function StudentFirebaseAuthProvider({ children }: StudentFirebaseAuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Clear any existing Firebase session on mount
    signOut(auth).catch(() => {
      // Ignore errors if already signed out
    })

    // Set a timeout to ensure loading state doesn't stay true forever
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000) // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      setLoading(false)
      clearTimeout(timeout) // Clear timeout since we got a response
      
      // Only clear user data when Firebase user signs out
      // Do NOT automatically exchange tokens or sign in
      if (!firebaseUser) {
        setUser(null)
        await SessionManager.clearSession()
      }
    }, (error) => {
      console.error('Firebase auth state error:', error)
      setLoading(false)
      clearTimeout(timeout)
    })

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  /**
   * Exchange Firebase ID token for JWT tokens
   */
  const exchangeFirebaseTokenForJWT = async (idToken: string) => {
    try {
      const response = await apiClient.post('/auth/social/google', { idToken })
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data as any
        
        // Create session data
        const sessionData = {
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes from now
          lastActivity: Date.now()
        }

        // Save session
        await SessionManager.saveSession(sessionData)
        setUser(userData)
        
        return { success: true, user: userData }
      } else {
        // Handle specific error messages from backend
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Failed to authenticate with server'
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error exchanging Firebase token:', error)
      throw error
    }
  }

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      
      const jwtResult = await exchangeFirebaseTokenForJWT(idToken)
      return jwtResult
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in was cancelled'
        : error.message || 'Google sign-in failed'
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in with Apple
   */
  const signInWithApple = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const result = await signInWithPopup(auth, appleProvider)
      const idToken = await result.user.getIdToken()
      
      const jwtResult = await exchangeFirebaseTokenForJWT(idToken)
      return jwtResult
    } catch (error: any) {
      console.error('Apple sign-in error:', error)
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in was cancelled'
        : error.message || 'Apple sign-in failed'
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign out from both Firebase and JWT system
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      // Sign out from Firebase
      await signOut(auth)
      
      // Clear JWT session
      await SessionManager.clearSession()
      setUser(null)
    } catch (error: any) {
      console.error('Sign-out error:', error)
      setError(error.message || 'Sign-out failed')
    } finally {
      setLoading(false)
    }
  }

  const value: StudentFirebaseAuthContextType = {
    firebaseUser,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signOut: handleSignOut,
    isAuthenticated: !!user,
    user
  }

  return (
    <StudentFirebaseAuthContext.Provider value={value}>
      {children}
    </StudentFirebaseAuthContext.Provider>
  )
}

/**
 * Hook to use Firebase authentication for students
 */
export function useStudentFirebaseAuth() {
  const context = useContext(StudentFirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useStudentFirebaseAuth must be used within a StudentFirebaseAuthProvider')
  }
  return context
}

/**
 * Higher-order component to protect student routes with Firebase auth
 */
export function withStudentFirebaseAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const ComponentWithAuth = (props: P) => {
    const { isAuthenticated, loading } = useStudentFirebaseAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading authentication...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access this page.</p>
            <a 
              href="/welcome" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Welcome Page
            </a>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  ComponentWithAuth.displayName = `withStudentFirebaseAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return ComponentWithAuth
}
