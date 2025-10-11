"use client"

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GoogleAuthButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export default function GoogleAuthButton({ 
  onSuccess, 
  onError, 
  className = "",
  children 
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      
      // Create Google provider
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      // Get ID token
      const idToken = await user.getIdToken()
      
      // Send to backend for verification and user creation
      const response = await fetch(`${(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3001/api'}/auth/social/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Use the existing login function to set the user state
        await login(user.email || '', '') // Empty password for social auth
        
        onSuccess?.()
      } else {
        throw new Error(data.error || 'Google authentication failed')
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      const errorMessage = error.message || 'Google authentication failed'
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={loading}
      variant="outline"
      className={`w-full flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {children || (loading ? 'Signing in...' : 'Continue with Google')}
    </Button>
  )
}
