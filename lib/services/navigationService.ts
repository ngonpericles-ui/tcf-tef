import { 
  BookOpen, 
  Target, 
  Video, 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  Store, 
  CreditCard, 
  Bell, 
  MessageSquare,
  Rss,
  UserCheck,
  LayoutDashboard,
  Globe,
  Heart,
  Trophy,
  Download,
  Wifi,
  User,
  Search,
  Home,
  FileText,
  Calendar,
  Zap,
  Brain,
  Lightbulb,
  TrendingUp
} from "lucide-react"

export type UserRole = 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
export type SubscriptionTier = 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'

export interface NavigationItem {
  id: string
  label: string
  labelEn: string
  href: string
  icon: any
  badge?: string | number
  description?: string
  descriptionEn?: string
  requiredRole?: UserRole[]
  requiredSubscription?: SubscriptionTier[]
  isNew?: boolean
  isPopular?: boolean
  category: 'main' | 'learning' | 'management' | 'analytics' | 'system' | 'profile'
  section: 'student' | 'manager' | 'admin' | 'shared'
  order: number
}

export interface NavigationSection {
  id: string
  title: string
  titleEn: string
  items: NavigationItem[]
  requiredRole?: UserRole[]
  icon: any
}

export interface BreadcrumbItem {
  label: string
  labelEn: string
  href?: string
}

export class NavigationService {
  private static navigationItems: NavigationItem[] = [
    // Student Section - Main Navigation
    {
      id: 'home',
      label: 'Accueil',
      labelEn: 'Home',
      href: '/home',
      icon: Home,
      description: 'Page d\'accueil principale',
      descriptionEn: 'Main home page',
      category: 'main',
      section: 'student',
      order: 1
    },
    {
      id: 'courses',
      label: 'Cours',
      labelEn: 'Courses',
      href: '/cours',
      icon: BookOpen,
      description: 'Cours de français TCF/TEF',
      descriptionEn: 'French TCF/TEF courses',
      category: 'learning',
      section: 'student',
      order: 2
    },
    {
      id: 'tests',
      label: 'Tests',
      labelEn: 'Tests',
      href: '/tests',
      icon: Target,
      description: 'Tests de pratique et évaluations',
      descriptionEn: 'Practice tests and assessments',
      category: 'learning',
      section: 'student',
      order: 3
    },
    {
      id: 'live',
      label: 'Sessions Live',
      labelEn: 'Live Sessions',
      href: '/live',
      icon: Video,
      badge: 'LIVE',
      description: 'Sessions en direct avec des professeurs',
      descriptionEn: 'Live sessions with teachers',
      category: 'learning',
      section: 'student',
      order: 4,
      isPopular: true
    },
    {
      id: 'news',
      label: 'Actualités',
      labelEn: 'News',
      href: '/quoi-de-neuf',
      icon: Wifi,
      description: 'Dernières nouvelles et mises à jour',
      descriptionEn: 'Latest news and updates',
      category: 'main',
      section: 'student',
      order: 5
    },
    {
      id: 'favorites',
      label: 'Favoris',
      labelEn: 'Favorites',
      href: '/favoris',
      icon: Heart,
      description: 'Vos contenus favoris',
      descriptionEn: 'Your favorite content',
      category: 'profile',
      section: 'student',
      order: 6
    },
    {
      id: 'achievements',
      label: 'Réussites',
      labelEn: 'Achievements',
      href: '/achievements',
      icon: Trophy,
      description: 'Vos accomplissements et badges',
      descriptionEn: 'Your accomplishments and badges',
      category: 'profile',
      section: 'student',
      order: 7
    },
    {
      id: 'download',
      label: 'Téléchargements',
      labelEn: 'Downloads',
      href: '/download',
      icon: Download,
      description: 'Ressources téléchargeables',
      descriptionEn: 'Downloadable resources',
      category: 'main',
      section: 'student',
      order: 8
    },
    {
      id: 'subscription',
      label: 'Abonnement',
      labelEn: 'Subscription',
      href: '/abonnement',
      icon: CreditCard,
      description: 'Gérer votre abonnement',
      descriptionEn: 'Manage your subscription',
      category: 'profile',
      section: 'student',
      order: 9
    },
    {
      id: 'profile',
      label: 'Profil',
      labelEn: 'Profile',
      href: '/profil',
      icon: User,
      description: 'Votre profil personnel',
      descriptionEn: 'Your personal profile',
      category: 'profile',
      section: 'student',
      order: 10
    },

    // Manager Section
    {
      id: 'manager-dashboard',
      label: 'Tableau de bord',
      labelEn: 'Dashboard',
      href: '/manager',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble des activités',
      descriptionEn: 'Overview of activities',
      category: 'main',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 1
    },
    {
      id: 'manager-content',
      label: 'Contenu',
      labelEn: 'Content',
      href: '/manager/content',
      icon: BookOpen,
      description: 'Gérer le contenu éducatif',
      descriptionEn: 'Manage educational content',
      category: 'management',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 2
    },
    {
      id: 'manager-students',
      label: 'Étudiants',
      labelEn: 'Students',
      href: '/manager/students',
      icon: Users,
      description: 'Gérer les étudiants',
      descriptionEn: 'Manage students',
      category: 'management',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 3
    },
    {
      id: 'manager-sessions',
      label: 'Sessions Live',
      labelEn: 'Live Sessions',
      href: '/manager/sessions',
      icon: Video,
      description: 'Gérer les sessions en direct',
      descriptionEn: 'Manage live sessions',
      category: 'management',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 4
    },
    {
      id: 'manager-analytics',
      label: 'Analytics',
      labelEn: 'Analytics',
      href: '/manager/analytics',
      icon: BarChart3,
      description: 'Analyses et statistiques',
      descriptionEn: 'Analytics and statistics',
      category: 'analytics',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 5,
      isNew: true
    },
    {
      id: 'manager-feed',
      label: 'Mon Feed',
      labelEn: 'My Feed',
      href: '/manager/feed',
      icon: Rss,
      description: 'Flux d\'actualités personnalisé',
      descriptionEn: 'Personalized news feed',
      category: 'main',
      section: 'manager',
      requiredRole: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'],
      order: 6
    },

    // Admin Section
    {
      id: 'admin-dashboard',
      label: 'Tableau de bord',
      labelEn: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble administrative',
      descriptionEn: 'Administrative overview',
      category: 'main',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 1
    },
    {
      id: 'admin-users',
      label: 'Utilisateurs',
      labelEn: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'Gérer tous les utilisateurs',
      descriptionEn: 'Manage all users',
      category: 'management',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 2
    },
    {
      id: 'admin-managers',
      label: 'Managers',
      labelEn: 'Managers',
      href: '/admin/managers',
      icon: UserCheck,
      description: 'Gérer les managers',
      descriptionEn: 'Manage managers',
      category: 'management',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 3
    },
    {
      id: 'admin-analytics',
      label: 'Analytics',
      labelEn: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Analyses complètes de la plateforme',
      descriptionEn: 'Comprehensive platform analytics',
      category: 'analytics',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 4,
      isNew: true
    },
    {
      id: 'admin-moderation',
      label: 'Modération',
      labelEn: 'Moderation',
      href: '/admin/moderation',
      icon: Shield,
      description: 'Modération du contenu',
      descriptionEn: 'Content moderation',
      category: 'system',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 5
    },
    {
      id: 'admin-subscriptions',
      label: 'Abonnements',
      labelEn: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCard,
      description: 'Gérer les abonnements',
      descriptionEn: 'Manage subscriptions',
      category: 'system',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 6
    },
    {
      id: 'admin-marketplace',
      label: 'Marketplace',
      labelEn: 'Marketplace',
      href: '/admin/marketplace',
      icon: Store,
      description: 'Gérer la marketplace',
      descriptionEn: 'Manage marketplace',
      category: 'system',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 7
    },
    {
      id: 'admin-settings',
      label: 'Paramètres',
      labelEn: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Paramètres système',
      descriptionEn: 'System settings',
      category: 'system',
      section: 'admin',
      requiredRole: ['ADMIN'],
      order: 8
    }
  ]

  /**
   * Get navigation items for a specific user role and section
   */
  static getNavigationItems(
    userRole: UserRole,
    section?: 'student' | 'manager' | 'admin' | 'shared',
    category?: string
  ): NavigationItem[] {
    return this.navigationItems
      .filter(item => {
        // Filter by section if specified
        if (section && item.section !== section && item.section !== 'shared') {
          return false
        }
        
        // Filter by category if specified
        if (category && item.category !== category) {
          return false
        }
        
        // Filter by role requirements
        if (item.requiredRole && !item.requiredRole.includes(userRole)) {
          return false
        }
        
        return true
      })
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Get navigation sections organized by category
   */
  static getNavigationSections(userRole: UserRole, section?: string): NavigationSection[] {
    const items = this.getNavigationItems(userRole, section as any)
    const sections: { [key: string]: NavigationSection } = {}

    items.forEach(item => {
      if (!sections[item.category]) {
        sections[item.category] = {
          id: item.category,
          title: this.getCategoryTitle(item.category),
          titleEn: this.getCategoryTitleEn(item.category),
          items: [],
          icon: this.getCategoryIcon(item.category)
        }
      }
      sections[item.category].items.push(item)
    })

    return Object.values(sections)
  }

  /**
   * Generate breadcrumbs for a given path
   */
  static generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Add home
    breadcrumbs.push({
      label: 'Accueil',
      labelEn: 'Home',
      href: '/home'
    })

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Find matching navigation item
      const navItem = this.navigationItems.find(item => item.href === currentPath)
      
      if (navItem) {
        breadcrumbs.push({
          label: navItem.label,
          labelEn: navItem.labelEn,
          href: index === segments.length - 1 ? undefined : currentPath
        })
      } else {
        // Fallback for dynamic routes
        breadcrumbs.push({
          label: this.formatSegment(segment),
          labelEn: this.formatSegment(segment),
          href: index === segments.length - 1 ? undefined : currentPath
        })
      }
    })

    return breadcrumbs
  }

  /**
   * Get quick actions based on user role and current section
   */
  static getQuickActions(userRole: UserRole, currentSection: string): NavigationItem[] {
    const quickActions: NavigationItem[] = []

    // Common quick actions
    quickActions.push({
      id: 'search',
      label: 'Recherche',
      labelEn: 'Search',
      href: '/search',
      icon: Search,
      category: 'main',
      section: 'shared',
      order: 1
    })

    // Role-specific quick actions
    if (userRole === 'ADMIN') {
      quickActions.push(
        {
          id: 'quick-analytics',
          label: 'Analytics',
          labelEn: 'Analytics',
          href: '/admin/analytics',
          icon: TrendingUp,
          category: 'analytics',
          section: 'admin',
          order: 2
        },
        {
          id: 'quick-users',
          label: 'Utilisateurs',
          labelEn: 'Users',
          href: '/admin/users',
          icon: Users,
          category: 'management',
          section: 'admin',
          order: 3
        }
      )
    } else if (userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER') {
      quickActions.push(
        {
          id: 'quick-students',
          label: 'Étudiants',
          labelEn: 'Students',
          href: '/manager/students',
          icon: Users,
          category: 'management',
          section: 'manager',
          order: 2
        },
        {
          id: 'quick-content',
          label: 'Contenu',
          labelEn: 'Content',
          href: '/manager/content',
          icon: BookOpen,
          category: 'management',
          section: 'manager',
          order: 3
        }
      )
    } else {
      quickActions.push(
        {
          id: 'quick-courses',
          label: 'Cours',
          labelEn: 'Courses',
          href: '/cours',
          icon: BookOpen,
          category: 'learning',
          section: 'student',
          order: 2
        },
        {
          id: 'quick-tests',
          label: 'Tests',
          labelEn: 'Tests',
          href: '/tests',
          icon: Target,
          category: 'learning',
          section: 'student',
          order: 3
        }
      )
    }

    return quickActions
  }

  /**
   * Check if user has access to a specific navigation item
   */
  static hasAccess(
    item: NavigationItem, 
    userRole: UserRole, 
    subscriptionTier: SubscriptionTier
  ): boolean {
    // Check role requirements
    if (item.requiredRole && !item.requiredRole.includes(userRole)) {
      return false
    }

    // Check subscription requirements
    if (item.requiredSubscription && !item.requiredSubscription.includes(subscriptionTier)) {
      return false
    }

    return true
  }

  /**
   * Get section switcher options based on user role
   */
  static getSectionSwitcher(userRole: UserRole): { label: string; labelEn: string; href: string; icon: any }[] {
    const sections = []

    // Student section (always available)
    sections.push({
      label: 'Étudiant',
      labelEn: 'Student',
      href: '/home',
      icon: BookOpen
    })

    // Manager section
    if (userRole === 'JUNIOR_MANAGER' || userRole === 'SENIOR_MANAGER' || userRole === 'ADMIN') {
      sections.push({
        label: 'Manager',
        labelEn: 'Manager',
        href: '/manager',
        icon: Users
      })
    }

    // Admin section
    if (userRole === 'ADMIN') {
      sections.push({
        label: 'Admin',
        labelEn: 'Admin',
        href: '/admin',
        icon: Shield
      })
    }

    return sections
  }

  // Helper methods
  private static getCategoryTitle(category: string): string {
    const titles: { [key: string]: string } = {
      'main': 'Principal',
      'learning': 'Apprentissage',
      'management': 'Gestion',
      'analytics': 'Analytics',
      'system': 'Système',
      'profile': 'Profil'
    }
    return titles[category] || category
  }

  private static getCategoryTitleEn(category: string): string {
    const titles: { [key: string]: string } = {
      'main': 'Main',
      'learning': 'Learning',
      'management': 'Management',
      'analytics': 'Analytics',
      'system': 'System',
      'profile': 'Profile'
    }
    return titles[category] || category
  }

  private static getCategoryIcon(category: string): any {
    const icons: { [key: string]: any } = {
      'main': Home,
      'learning': BookOpen,
      'management': Users,
      'analytics': BarChart3,
      'system': Settings,
      'profile': User
    }
    return icons[category] || Home
  }

  private static formatSegment(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
