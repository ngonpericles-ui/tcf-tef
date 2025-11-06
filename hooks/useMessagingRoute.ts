import { useAuth } from '@/contexts/AuthContext'

export const useMessagingRoute = () => {
  const { user } = useAuth()

  const getMessagingRoute = () => {
    if (!user) {
      console.log('🔍 useMessagingRoute: No user, returning /connexion')
      return '/connexion'
    }

    console.log('🔍 useMessagingRoute: User role:', user.role)
    
    switch (user.role) {
      case 'ADMIN':
        console.log('🔍 useMessagingRoute: Admin detected, returning /admin/messages')
        return '/admin/messages'
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        console.log('🔍 useMessagingRoute: Manager detected, returning /manager/messages')
        return '/manager/messages'
      case 'STUDENT':
      case 'USER':
        console.log('🔍 useMessagingRoute: Student detected, returning /messages')
        return '/messages'
      default:
        console.log('🔍 useMessagingRoute: Unknown role, returning /connexion')
        return '/connexion'
    }
  }

  const getMessagingRouteWithContact = (contactId: string) => {
    const baseRoute = getMessagingRoute()
    return `${baseRoute}?contactId=${contactId}`
  }

  return {
    getMessagingRoute,
    getMessagingRouteWithContact,
    currentRoute: getMessagingRoute()
  }
}
