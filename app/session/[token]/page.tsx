'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { OneOnOneVideoCall } from '@/components/OneOnOneVideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Video, User, Clock, Calendar } from 'lucide-react';

interface SessionData {
  sessionId: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role?: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role?: string;
  };
  duration: number;
  status: string;
  secureToken: string;
}

export default function SecureSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  const token = params?.token as string;

  // Sanitize token from URL params - remove HTML tags and decode
  const sanitizeToken = (token: string): string => {
    if (!token) return '';
    return decodeURIComponent(token)
      .replace(/<br\s*\/?>(?:\s*)/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/%3Cbr%3E/gi, '')
      .replace(/[^\w.\-+/_=]/g, '')
      .trim();
  };

  useEffect(() => {
    const cleanedToken = sanitizeToken(token || '');
    if (!cleanedToken) {
      setError('Token de session manquant');
      setLoading(false);
      return;
    }
    validateSession(cleanedToken);
  }, [token]);

  const validateSession = async (tokenToValidate: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/messages/validate-secure-session/${encodeURIComponent(tokenToValidate)}`);
      
      if (response.success && response.data) {
        const session = response.data as SessionData;
        setSessionData(session);
        
        // Auto-start session when coming from notification card (direct call)
        // Check if there's a pending session ID in localStorage (from notification)
        const pendingSessionId = localStorage.getItem('pendingSessionId');
        if (pendingSessionId === session.sessionId) {
          // This is a direct call from notification - auto-start session immediately
          // No need to show "rejoindre la session" card
          console.log('✅ Auto-starting session from notification card (direct call)');
          localStorage.removeItem('pendingSessionId');
          localStorage.removeItem('pendingSessionLink');
          setIsVideoCallActive(true);
        }
        // If no pendingSessionId, show the "rejoindre la session" card (user clicked link directly)
      } else {
        const errorMsg = response.error
        const errorString = typeof errorMsg === 'string' 
          ? errorMsg 
          : (errorMsg as any)?.message || 'Session non trouvée'
        setError(errorString);
      }
    } catch (error: any) {
      console.error('Error validating session:', error);
      setError(error.response?.data?.error || 'Erreur lors de la validation de la session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    if (sessionData) {
      setIsVideoCallActive(true);
    }
  };

  const handleEndSession = () => {
    setIsVideoCallActive(false);
    // Role-based redirection after call ends
    const userRole = user?.role;
    switch (userRole) {
      case 'STUDENT':
      case 'USER':
        router.push('/messages');
        break;
      case 'ADMIN':
        router.push('/admin/messages');
        break;
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        router.push('/messages');
        break;
      default:
        router.push('/messages');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Validation de la session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Session Non Disponible</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/messages')} className="w-full">
              Retour aux Messages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVideoCallActive && sessionData) {
    // Determine the other participant based on current user
    // If current user is the instructor, show student
    // If current user is the student, show instructor
    const currentUserId = user?.id
    const isCurrentUserInstructor = currentUserId === sessionData.instructor.id
    const isCurrentUserStudent = sessionData.student && currentUserId === sessionData.student.id
    
    let contactId = sessionData.instructor.id
    let contactName = `${sessionData.instructor.firstName} ${sessionData.instructor.lastName}`
    let contactRole = 'INSTRUCTOR'
    
    if (isCurrentUserInstructor && sessionData.student) {
      // Manager/Instructor viewing - show student
      contactId = sessionData.student.id
      contactName = `${sessionData.student.firstName} ${sessionData.student.lastName}`
      contactRole = 'STUDENT'
    } else if (isCurrentUserStudent) {
      // Student viewing - show instructor (already set above)
      contactId = sessionData.instructor.id
      contactName = `${sessionData.instructor.firstName} ${sessionData.instructor.lastName}`
      contactRole = 'INSTRUCTOR'
    }
    
    // IMPORTANT: When joining via secure session, pass BOTH sessionId AND contactId
    // sessionId = tells OneOnOneVideoCall it's a session join (no permission check)
    // contactId = identifies the other participant for display
    // This way: JOINING session ≠ CALLING someone
    return (
      <OneOnOneVideoCall
        sessionId={sessionData.sessionId}
        contactId={contactId}
        contactName={contactName}
        contactRole={contactRole}
        onEndCall={handleEndSession}
      />
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Session non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Video className="h-12 w-12 text-blue-600 mr-3" />
              <div>
                <CardTitle className="text-2xl text-blue-600">Session Privée</CardTitle>
                <p className="text-gray-600">Session individuelle de préparation TCF/TEF</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session Details */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">{sessionData.title}</h3>
              <p className="text-gray-700 mb-4">{sessionData.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Instructeur</p>
                    <p className="font-medium">
                      {sessionData.instructor.firstName} {sessionData.instructor.lastName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="font-medium">{sessionData.duration} minutes</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <p className="font-medium capitalize">{sessionData.status.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cette session est privée et sécurisée. Seuls vous et votre instructeur pouvez y participer.
                Le lien de cette session est personnel et ne doit pas être partagé.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleStartSession}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Video className="h-5 w-5 mr-2" />
                Rejoindre la Session
              </Button>
              
              <Button 
                onClick={() => router.push('/messages')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Retour aux Messages
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-gray-800">Instructions :</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Assurez-vous d'avoir une connexion internet stable</li>
                <li>• Utilisez un casque ou des écouteurs pour une meilleure qualité audio</li>
                <li>• Trouvez un endroit calme et bien éclairé</li>
                <li>• Testez votre microphone et votre caméra avant de commencer</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
