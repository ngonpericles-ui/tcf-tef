/**
 * Firebase Configuration for Student Social Media Authentication
 * Only for STUDENT role - Admin and Manager use JWT authentication
 */

import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  connectAuthEmulator,
  User as FirebaseUser
} from 'firebase/auth'
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN0SEgZViyyUhIRReyFuiWL5bvO7aPc8w",
  authDomain: "tcftef-68b4c.firebaseapp.com",
  projectId: "tcftef-68b4c",
  storageBucket: "tcftef-68b4c.firebasestorage.app",
  messagingSenderId: "896942129388",
  appId: "1:896942129388:web:64400ed6210aea818fa5c9",
  measurementId: "G-Z7183P926L"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase Auth
export const auth = getAuth(app)

// Analytics will be initialized only on client side when needed
export const analytics = null

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Google Auth Functions
export const signInWithGoogle = async () => {
  try {
    // First try popup method
    const result = await signInWithPopup(auth, googleProvider)
    return {
      success: true,
      user: result.user
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error)
    
    // Handle popup blocked error specifically
    if (error.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: {
          code: 'auth/popup-blocked',
          message: 'Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site et réessayer.'
        }
      }
    }
    
    // Handle popup closed by user
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: {
          code: 'auth/popup-closed-by-user',
          message: 'Connexion annulée par l\'utilisateur.'
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    }
  }
}

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    }
  }
}

// Firebase Auth Error Messages (French)
export const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
    'auth/popup-closed-by-user': 'Connexion annulée par l\'utilisateur.',
    'auth/popup-blocked': 'Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site.',
    'auth/cancelled-popup-request': 'Demande de connexion annulée.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cette adresse email.',
    'default': 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
  }

  return errorMessages[errorCode] || errorMessages['default']
}

// Connect to Firebase Auth emulator in development
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && process.env?.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
  } catch (error) {
    console.warn('Firebase Auth emulator already connected')
  }
}

export default app
