export const getErrorMessage = (errorCode: string, language: string = 'fr'): string => {
  const translations: Record<string, Record<string, string>> = {
    ACCOUNT_NOT_FOUND: {
      fr: "❌ Compte introuvable. Veuillez créer un compte d'abord ou vérifier votre adresse e-mail.",
      en: "❌ Account not found. Please create an account first or check your email address."
    },
    INVALID_PASSWORD: {
      fr: "🔒 Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.",
      en: "🔒 Incorrect password. Please try again or reset your password."
    },
    ACCOUNT_SUSPENDED: {
      fr: "⚠️ Compte suspendu. Veuillez contacter le support pour plus d'informations.",
      en: "⚠️ Account is suspended. Please contact support for more information."
    },
    ACCOUNT_INACTIVE: {
      fr: "⏸️ Compte inactif. Veuillez contacter le support pour réactiver votre compte.",
      en: "⏸️ Account is inactive. Please contact support to reactivate your account."
    },
    INVALID_EMAIL: {
      fr: "📧 Adresse e-mail invalide. Veuillez vérifier le format de votre e-mail.",
      en: "📧 Invalid email address. Please check your email format."
    },
    PASSWORD_TOO_SHORT: {
      fr: "🔐 Le mot de passe doit contenir au moins 8 caractères.",
      en: "🔐 Password must be at least 8 characters long."
    },
    EMAIL_ALREADY_EXISTS: {
      fr: "📨 Cette adresse e-mail est déjà utilisée. Essayez de vous connecter ou utilisez un autre e-mail.",
      en: "📨 This email address is already in use. Try logging in or use a different email."
    },
    // Admin specific errors
    ADMIN_ACCOUNT_NOT_FOUND: {
      fr: "❌ Compte administrateur introuvable",
      en: "❌ Admin account not found"
    },
    ADMIN_INVALID_CREDENTIALS: {
      fr: "🔒 Identifiants administrateur incorrects",
      en: "🔒 Invalid admin credentials"
    },
    ADMIN_ACCESS_DENIED: {
      fr: "🚫 Accès administrateur refusé",
      en: "🚫 Admin access denied"
    },
    // Manager specific errors
    MANAGER_ACCOUNT_NOT_FOUND: {
      fr: "❌ Compte manager introuvable",
      en: "❌ Manager account not found"
    },
    MANAGER_INVALID_CREDENTIALS: {
      fr: "🔒 Identifiants manager incorrects",
      en: "🔒 Invalid manager credentials"
    },
    MANAGER_ACCESS_DENIED: {
      fr: "🚫 Accès manager refusé",
      en: "🚫 Manager access denied"
    },
    MANAGER_ROLE_INVALID: {
      fr: "👤 Rôle manager invalide",
      en: "👤 Invalid manager role"
    },
    NETWORK_ERROR: {
      fr: "🌐 Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.",
      en: "🌐 Connection error. Please check your internet connection and try again."
    },
    SERVER_ERROR: {
      fr: "⚙️ Erreur du serveur. Veuillez réessayer dans quelques minutes.",
      en: "⚙️ Server error. Please try again in a few minutes."
    },
    VALIDATION_ERROR: {
      fr: "📝 Données invalides. Veuillez vérifier vos informations et réessayer.",
      en: "📝 Invalid data. Please check your information and try again."
    },
    UNAUTHORIZED_ERROR: {
      fr: "🚫 Accès non autorisé. Veuillez vérifier vos identifiants.",
      en: "🚫 Unauthorized access. Please check your credentials."
    },
    FORBIDDEN_ERROR: {
      fr: "🔒 Accès interdit. Vous n'avez pas les permissions nécessaires.",
      en: "🔒 Access forbidden. You don't have the necessary permissions."
    },
    NOT_FOUND_ERROR: {
      fr: "🔍 Ressource introuvable. Veuillez vérifier votre demande.",
      en: "🔍 Resource not found. Please check your request."
    },
    CONFLICT_ERROR: {
      fr: "⚠️ Conflit détecté. Cette ressource existe déjà.",
      en: "⚠️ Conflict detected. This resource already exists."
    },
    // Social authentication errors
    ACCOUNT_ALREADY_EXISTS: {
      fr: "⚠️ Ce compte existe déjà. Veuillez vous connecter avec vos identifiants existants.",
      en: "⚠️ This account already exists. Please sign in with your existing credentials."
    },
    SOCIAL_AUTH_ONLY_STUDENTS: {
      fr: "🚫 L'authentification sociale n'est disponible que pour les étudiants",
      en: "🚫 Social authentication is only available for students"
    },
    SOCIAL_ACCOUNT_MISMATCH: {
      fr: "❌ Ce compte social n'est pas lié à votre compte. Veuillez utiliser l'email et le mot de passe avec lesquels vous vous êtes inscrit.",
      en: "❌ This social media account is not linked to your account. Please use the email and password you used to sign up."
    },
    GOOGLE_AUTH_FAILED: {
      fr: "❌ Échec de l'authentification Google. Veuillez réessayer ou utiliser une autre méthode de connexion.",
      en: "❌ Google authentication failed. Please try again or use another login method."
    },
    GOOGLE_AUTH_ERROR: {
      fr: "⚙️ Erreur lors de l'authentification Google. Veuillez réessayer dans quelques minutes.",
      en: "⚙️ Error during Google authentication. Please try again in a few minutes."
    },
    MISSING_ID_TOKEN: {
      fr: "🔑 Jeton d'authentification Google manquant. Veuillez réessayer la connexion.",
      en: "🔑 Missing Google authentication token. Please try logging in again."
    },
    INVALID_TOKEN: {
      fr: "🔒 Jeton d'authentification Google invalide. Veuillez vous reconnecter avec Google.",
      en: "🔒 Invalid Google authentication token. Please sign in with Google again."
    },
    AUTHENTICATION_PROCESSING_FAILED: {
      fr: "⚙️ Échec du traitement de l'authentification. Veuillez réessayer ou contacter le support.",
      en: "⚙️ Authentication processing failed. Please try again or contact support."
    }
  };

  return translations[errorCode]?.[language] || translations[errorCode]?.['en'] || errorCode;
};

export const translateApiError = (error: any, language: string = 'fr', context?: 'admin' | 'manager' | 'student'): string => {
  // If it's already a translated message, return it
  if (typeof error === 'string') {
    // Check for common network error patterns
    if (error.toLowerCase().includes('network error') || error.toLowerCase().includes('network_error')) {
      return getErrorMessage('NETWORK_ERROR', language);
    }
    if (error.toLowerCase().includes('connection') || error.toLowerCase().includes('fetch')) {
      return getErrorMessage('CONNECTION_FAILED', language);
    }
    if (error.toLowerCase().includes('server') || error.toLowerCase().includes('unavailable')) {
      return getErrorMessage('SERVER_UNAVAILABLE', language);
    }
    return error;
  }

  // If it's an error object with a message (check this first for error codes)
  if (error?.message) {
    // Check if it's an error code (uppercase with underscores)
    if (error.message.includes('_') && error.message === error.message.toUpperCase()) {
      // Map common error codes to context-specific ones
      let errorCode = error.message;
      
      if (context === 'admin') {
        if (errorCode === 'ACCOUNT_NOT_FOUND') errorCode = 'ADMIN_ACCOUNT_NOT_FOUND';
        else if (errorCode === 'INVALID_PASSWORD') errorCode = 'ADMIN_INVALID_CREDENTIALS';
        else if (errorCode === 'UNAUTHORIZED_ERROR') errorCode = 'ADMIN_ACCESS_DENIED';
      } else if (context === 'manager') {
        if (errorCode === 'ACCOUNT_NOT_FOUND') errorCode = 'MANAGER_ACCOUNT_NOT_FOUND';
        else if (errorCode === 'INVALID_PASSWORD') errorCode = 'MANAGER_INVALID_CREDENTIALS';
        else if (errorCode === 'UNAUTHORIZED_ERROR') errorCode = 'MANAGER_ACCESS_DENIED';
      }
      
      return getErrorMessage(errorCode, language);
    }
    return error.message;
  }

  // If it's an error object with a code
  if (error?.code) {
    return getErrorMessage(error.code, language);
  }

  // Fallback with context
  if (context === 'admin') {
    return language === 'fr' 
      ? "❌ Erreur de connexion administrateur"
      : "❌ Admin connection error";
  } else if (context === 'manager') {
    return language === 'fr' 
      ? "❌ Erreur de connexion manager"
      : "❌ Manager connection error";
  }
  
  return language === 'fr' 
    ? "❌ Une erreur inattendue s'est produite"
    : "❌ An unexpected error occurred";
};
