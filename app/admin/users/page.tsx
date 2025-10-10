"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, Ban, CheckCircle, TrendingUp, Users, Crown, Calendar, Wifi } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"

export default function UsersManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterSubscription, setFilterSubscription] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    premiumSubscribers: 0,
    averageScore: 0,
    newThisMonth: 0
  })

  // Fetch users and stats from backend
  useEffect(() => {
    fetchUsersAndStats()
  }, [searchTerm, filterRole, filterSubscription, filterStatus])

  const fetchUsersAndStats = async () => {
    try {
      setLoading(true)
      
      // Fetch users with filters
      const usersResponse = await apiClient.get(`/admin/users?limit=1000&search=${searchTerm}&role=${filterRole}&subscription=${filterSubscription}&status=${filterStatus}`)
      
      console.log('Users API response:', usersResponse)
      
      // Handle different response structures
      let usersData: any[] = []
      if (usersResponse.success) {
        if (Array.isArray(usersResponse.data)) {
          usersData = usersResponse.data
        } else if (usersResponse.data && Array.isArray((usersResponse.data as any).users)) {
          usersData = (usersResponse.data as any).users
        } else if (usersResponse.data && Array.isArray((usersResponse.data as any).data)) {
          usersData = (usersResponse.data as any).data
        }
      }
      
      if (usersData.length > 0) {
        setUsers(usersData)
        console.log('Successfully loaded users:', usersData.length)
        
        // Calculate stats from users data
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const onlineUsers = usersData.filter((u: any) => {
          if (!u.lastLoginAt) return false
          const lastLogin = new Date(u.lastLoginAt)
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
          return lastLogin > fiveMinutesAgo && u.status === 'ACTIVE'
        }).length
        
        // Only count students as subscribers (admin and managers don't need subscriptions)
        const premiumSubscribers = usersData.filter((u: any) =>
          (u.role === 'USER' || u.role === 'STUDENT') &&
          u.subscriptionTier && u.subscriptionTier !== 'FREE' && u.subscriptionTier !== 'GRATUIT'
        ).length
        
        const newThisMonth = usersData.filter((u: any) => 
          new Date(u.createdAt) >= thisMonth
        ).length
        
        const scores = usersData.filter((u: any) => u.averageScore !== null && u.averageScore !== undefined)
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((acc: number, u: any) => acc + (u.averageScore || 0), 0) / scores.length)
          : 0
        
        setStats({
          totalUsers: usersData.length,
          onlineUsers,
          premiumSubscribers,
          averageScore,
          newThisMonth
        })
      } else {
        console.log('No users found or invalid response structure')
        setUsers([])
        setStats({
          totalUsers: 0,
          onlineUsers: 0,
          premiumSubscribers: 0,
          averageScore: 0,
          newThisMonth: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
      setStats({
        totalUsers: 0,
        onlineUsers: 0,
        premiumSubscribers: 0,
        averageScore: 0,
        newThisMonth: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    // Only apply subscription filter to students (admin and managers don't have subscriptions)
    const matchesSubscription = filterSubscription === "all" ||
      (user.role === 'USER' || user.role === 'STUDENT') && user.subscriptionTier === filterSubscription ||
      (user.role !== 'USER' && user.role !== 'STUDENT') // Always include non-students
    const matchesStatus = filterStatus === "all" || user.status === filterStatus

    return matchesSearch && matchesRole && matchesSubscription && matchesStatus
  })

  const getSubscriptionColor = (subscription: string, userRole?: string) => {
    // Admin and managers don't need subscriptions
    if (userRole === 'ADMIN' || userRole === 'JUNIOR_MANAGER' || userRole === 'SENIOR_MANAGER') {
      return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }

    switch (subscription) {
      case "FREE":
      case "GRATUIT":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "ESSENTIEL":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "PREMIUM":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "PRO_PLUS":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-muted/50 text-muted-foreground border-gray-200 dark:border-gray-700"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "INACTIVE":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "SUSPENDED":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-muted/50 text-muted-foreground border-gray-200 dark:border-gray-700"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "USER":
      case "STUDENT":
        return "Élève"
      case "JUNIOR_MANAGER":
      case "SENIOR_MANAGER":
        return "Tuteur"
      case "ADMIN":
        return "Administrateur"
      default:
        return role
    }
  }

  const getSubscriptionDisplayName = (subscription: string, userRole: string) => {
    // Admin and managers don't need subscriptions
    if (userRole === 'ADMIN' || userRole === 'JUNIOR_MANAGER' || userRole === 'SENIOR_MANAGER') {
      return "N/A"
    }

    switch (subscription) {
      case "FREE":
      case "GRATUIT":
        return "Gratuit"
      case "ESSENTIEL":
        return "Essentiel"
      case "PREMIUM":
        return "Premium"
      case "PRO_PLUS":
        return "Pro+"
      default:
        return subscription || "Aucun"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Tuteurs et Élèves</h1>
          <p className="text-muted-foreground mt-1">Gérez tous les tuteurs et élèves de la plateforme</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            {stats.totalUsers} utilisateurs totaux
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs en Ligne</CardTitle>
            <Wifi className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.onlineUsers}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Actuellement connectés
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abonnés Premium</CardTitle>
            <Crown className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.premiumSubscribers}
            </div>
            <p className="text-xs text-orange-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Élèves avec abonnement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score Moyen</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.averageScore}%
            </div>
            <p className="text-xs text-blue-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Moyenne des élèves
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux ce mois</CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.newThisMonth}
            </div>
            <p className="text-xs text-purple-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Inscriptions récentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-foreground">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="USER">Élèves</SelectItem>
                <SelectItem value="JUNIOR_MANAGER">Tuteurs Junior</SelectItem>
                <SelectItem value="SENIOR_MANAGER">Tuteurs Senior</SelectItem>
                <SelectItem value="ADMIN">Administrateurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSubscription} onValueChange={setFilterSubscription}>
              <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                <SelectValue placeholder="Abonnement" />
              </SelectTrigger>
              <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="FREE">Gratuit</SelectItem>
                <SelectItem value="ESSENTIEL">Essentiel</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="PRO_PLUS">Pro+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-foreground">Liste des Tuteurs et Élèves</CardTitle>
          <CardDescription className="text-muted-foreground">
            {loading ? "Chargement..." : `${filteredUsers.length} utilisateur(s) trouvé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableHead className="text-muted-foreground">Utilisateur</TableHead>
                  <TableHead className="text-muted-foreground">Rôle</TableHead>
                  <TableHead className="text-muted-foreground">Abonnement</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-muted-foreground">Tests</TableHead>
                  <TableHead className="text-muted-foreground">Score Moyen</TableHead>
                  <TableHead className="text-muted-foreground">Inscription</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Chargement des utilisateurs...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-200 dark:border-gray-700 hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()}
                          </div>
                        <div>
                            <p className="font-medium text-foreground">
                              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                            </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-foreground">
                          {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={getSubscriptionColor(user.subscriptionTier, user.role)}>
                          {getSubscriptionDisplayName(user.subscriptionTier, user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status === "ACTIVE" ? "Actif" : user.status === "INACTIVE" ? "Inactif" : "Suspendu"}
                      </Badge>
                    </TableCell>
                      <TableCell className="text-foreground">{user._count?.test_attempts || 0}</TableCell>
                      <TableCell className="text-foreground">{user.averageScore || 0}%</TableCell>
                      <TableCell className="text-foreground">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                          <DropdownMenuItem className="text-foreground hover:bg-muted">
                            <Eye className="w-4 h-4 mr-2" />
                            Voir le profil
                          </DropdownMenuItem>
                            {user.status === "ACTIVE" ? (
                            <DropdownMenuItem className="text-red-400 hover:bg-muted">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspendre
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-400 hover:bg-muted">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
