"use client"

import { Suspense } from "react"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  BookOpen,
  Target,
  Video,
  Users,
  FileText,
  Award,
  Bell,
  BarChart3,
  TrendingUp,
  Clock,
  Filter
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { SharedDataProvider, useSharedData } from "@/components/shared-data-provider"
import UnifiedSearch from "@/components/unified-search"
import SectionLayout from "@/components/section-layout"

import { type SearchCategory, type SearchScope } from "@/lib/services/unifiedSearchService"

function SearchPageContent() {
  const { t } = useLanguage()
  const { userProfile } = useSharedData()
  const searchParams = useSearchParams()
  
  // Get search parameters
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') as SearchCategory || 'all'
  
  // Determine user scope
  const getUserScope = (): SearchScope => {
    if (!userProfile) return 'student'
    
    switch (userProfile.role) {
      case 'ADMIN':
        return 'admin'
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        return 'manager'
      default:
        return 'student'
    }
  }

  const userScope = getUserScope()

  // Category configurations
  const categoryConfigs = {
    all: {
      label: t('Tout', 'All'),
      labelEn: 'All',
      icon: Search,
      description: t('Rechercher dans toute la plateforme', 'Search across the platform'),
      descriptionEn: 'Search across the platform'
    },
    courses: {
      label: t('Cours', 'Courses'),
      labelEn: 'Courses',
      icon: BookOpen,
      description: t('Cours de français TCF/TEF', 'French TCF/TEF courses'),
      descriptionEn: 'French TCF/TEF courses'
    },
    tests: {
      label: t('Tests', 'Tests'),
      labelEn: 'Tests',
      icon: Target,
      description: t('Tests de pratique et évaluations', 'Practice tests and assessments'),
      descriptionEn: 'Practice tests and assessments'
    },
    live_sessions: {
      label: t('Sessions Live', 'Live Sessions'),
      labelEn: 'Live Sessions',
      icon: Video,
      description: t('Sessions en direct avec des professeurs', 'Live sessions with teachers'),
      descriptionEn: 'Live sessions with teachers'
    },
    content: {
      label: t('Contenu', 'Content'),
      labelEn: 'Content',
      icon: FileText,
      description: t('Articles, ressources et matériel pédagogique', 'Articles, resources and educational material'),
      descriptionEn: 'Articles, resources and educational material'
    },
    users: {
      label: t('Utilisateurs', 'Users'),
      labelEn: 'Users',
      icon: Users,
      description: t('Étudiants, professeurs et managers', 'Students, teachers and managers'),
      descriptionEn: 'Students, teachers and managers'
    },
    achievements: {
      label: t('Réussites', 'Achievements'),
      labelEn: 'Achievements',
      icon: Award,
      description: t('Badges et accomplissements', 'Badges and accomplishments'),
      descriptionEn: 'Badges and accomplishments'
    },
    announcements: {
      label: t('Annonces', 'Announcements'),
      labelEn: 'Announcements',
      icon: Bell,
      description: t('Actualités et communications', 'News and communications'),
      descriptionEn: 'News and communications'
    },
    analytics: {
      label: t('Analytics', 'Analytics'),
      labelEn: 'Analytics',
      icon: BarChart3,
      description: t('Rapports et statistiques', 'Reports and statistics'),
      descriptionEn: 'Reports and statistics'
    },
    files: {
      label: t('Fichiers', 'Files'),
      labelEn: 'Files',
      icon: FileText,
      description: t('Documents et ressources téléchargeables', 'Documents and downloadable resources'),
      descriptionEn: 'Documents and downloadable resources'
    }
  }

  // Get available categories based on user role
  const getAvailableCategories = (): SearchCategory[] => {
    const baseCategories: SearchCategory[] = ['all', 'courses', 'tests', 'live_sessions', 'content', 'achievements']
    
    if (userScope === 'admin') {
      return [...baseCategories, 'users', 'announcements', 'analytics', 'files']
    } else if (userScope === 'manager') {
      return [...baseCategories, 'users', 'announcements', 'analytics']
    }
    
    return baseCategories
  }

  const availableCategories = getAvailableCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {t('Recherche', 'Search')}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {t(
            'Trouvez rapidement ce que vous cherchez dans toute la plateforme',
            'Quickly find what you\'re looking for across the platform'
          )}
        </p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardContent className="p-6">
          <UnifiedSearch
            defaultQuery={query}
            scope={userScope}
            categories={availableCategories}
            showFilters={true}
            showSuggestions={true}
            showRecent={true}
            showTrending={true}
          />
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={category} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          {availableCategories.slice(0, 6).map((cat) => {
            const config = categoryConfigs[cat]
            const Icon = config.icon
            
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Category Content */}
        {availableCategories.map((cat) => {
          const config = categoryConfigs[cat]
          
          return (
            <TabsContent key={cat} value={cat} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <config.icon className="h-5 w-5" />
                    {config.label}
                  </CardTitle>
                  <CardDescription>
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnifiedSearch
                    defaultQuery={query}
                    scope={userScope}
                    categories={cat === 'all' ? availableCategories : [cat]}
                    showFilters={true}
                    showSuggestions={false}
                    showRecent={false}
                    showTrending={false}
                    compact={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Quick Access Cards */}
      {!query && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Popular Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                {t('Recherches populaires', 'Popular searches')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  TCF
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  TEF
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  Grammaire
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  Vocabulaire
                </Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                  Compréhension orale
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t('Activité récente', 'Recent activity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t(
                  'Vos recherches récentes apparaîtront ici',
                  'Your recent searches will appear here'
                )}
              </p>
            </CardContent>
          </Card>

          {/* Search Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                {t('Conseils de recherche', 'Search tips')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('Utilisez des mots-clés spécifiques', 'Use specific keywords')}</li>
                <li>• {t('Filtrez par catégorie', 'Filter by category')}</li>
                <li>• {t('Essayez les suggestions', 'Try the suggestions')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Loading component
function SearchPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SearchPageWrapper() {
  const { userProfile } = useSharedData()

  if (!userProfile) {
    return <SearchPageSkeleton />
  }

  return (
    <SectionLayout
      userRole={userProfile.role}
      subscriptionTier={userProfile.subscriptionTier}
      currentSection="student" // Search is available in all sections
      userName={userProfile.name}
      userEmail={userProfile.email}
      showBreadcrumbs={true}
      showAIAssistant={true}
      maxWidth="xl"
    >
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </SectionLayout>
  )
}

export default function SearchPage() {
  return (
    <SharedDataProvider>
      <SearchPageWrapper />
    </SharedDataProvider>
  )
}
