"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  User, 
  MoreVertical, 
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import MessageIcon from "@/components/MessageIcon"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  level: string
  subscription: string
  language: string
  progress: number
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastActivity?: string
  enrollments: number
  testAttempts: number
  averageScore: number
  createdAt: string
  achievements: any[]
  profileImage?: string
}

export default function AdminStudentsPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    eligibleTCF: 0
  })

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isAuthenticated || !isAdmin) return

      try {
        setLoading(true)
        const response = await apiClient.get('/admin/users', { 
          params: { role: 'STUDENT' } 
        })

        if (response.success && response.data) {
          const studentsData = Array.isArray(response.data) ? response.data :
                              Array.isArray((response.data as any).users) ? (response.data as any).users :
                              Array.isArray((response.data as any).data) ? (response.data as any).data : []

          const transformedStudents: Student[] = studentsData.map((student: any) => ({
            id: student.id,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            email: student.email,
            phone: student.phone,
            address: student.address,
            level: student.level || 'A1',
            subscription: student.subscriptionTier || 'FREE',
            language: student.language || 'French',
            progress: student.progress || 0,
            status: student.status || 'ACTIVE',
            lastActivity: student.lastLoginAt || student.lastActivityAt,
            enrollments: student._count?.courseEnrollments || 0,
            testAttempts: student._count?.testAttempts || 0,
            averageScore: student.averageScore || 0,
            createdAt: student.createdAt,
            achievements: student.achievements || [],
            profileImage: student.profileImage
          }))

          setStudents(transformedStudents)

          // Calculate stats
          const activeStudents = transformedStudents.filter(s => s.status === 'ACTIVE').length
          const totalProgress = transformedStudents.reduce((acc, s) => acc + (s.progress || 0), 0)
          const totalEnrollments = transformedStudents.reduce((acc, s) => acc + (s.enrollments || 0), 0)
          const completedCourses = transformedStudents.filter(s => s.progress >= 100).length
          const eligibleTCF = transformedStudents.filter(s => s.level === 'B2' || s.level === 'C1' || s.level === 'C2').length

          setStats({
            totalStudents: transformedStudents.length,
            activeStudents,
            averageProgress: transformedStudents.length > 0 ? Math.round(totalProgress / transformedStudents.length) : 0,
            totalEnrollments,
            completedCourses,
            eligibleTCF
          })
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [isAuthenticated, isAdmin])

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(student.level)
    const matchesSubscription = selectedSubscriptions.length === 0 || selectedSubscriptions.includes(student.subscription)
    
    return matchesSearch && matchesLevel && matchesSubscription
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'INACTIVE':
        return <XCircle className="w-4 h-4 text-gray-400" />
      case 'SUSPENDED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'PRO':
        return 'bg-purple-100 text-purple-800'
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-800'
      case 'ESSENTIAL':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  const handleViewProfile = (student: Student) => {
    router.push(`/admin/students/${student.id}`)
  }

  const handleEditStudent = (student: Student) => {
    // TODO: Implement edit functionality
    console.log('Edit student:', student)
  }

  const handleDeleteStudent = (student: Student) => {
    // TODO: Implement delete functionality
    console.log('Delete student:', student)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Students List</h1>
              <p className="text-sm text-gray-600 mt-1">Home / Students</p>
            </div>
            <div className="flex items-center space-x-3">
              <MessageIcon 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="md"
                variant="default"
              />
            </div>
          </div>
        </div>
      </div>

    <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eligible TCF/TEF</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.eligibleTCF}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Students Information</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span>Last 30 days</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                    <DropdownMenuItem>Last 90 days</DropdownMenuItem>
                    <DropdownMenuItem>All time</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900">Student Name</TableHead>
                  <TableHead className="font-semibold text-gray-900">Email</TableHead>
                  <TableHead className="font-semibold text-gray-900">Level</TableHead>
                  <TableHead className="font-semibold text-gray-900">Subscription</TableHead>
                  <TableHead className="font-semibold text-gray-900">Language</TableHead>
                  <TableHead className="font-semibold text-gray-900">Progress</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Enrollments</TableHead>
                  <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={student.profileImage} />
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">#{student.id.slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {student.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSubscriptionColor(student.subscription)} font-medium`}>
                        {student.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{student.language}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(student.status)}
                        <Badge className={`${getStatusColor(student.status)} font-medium`}>
                          {student.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{student.enrollments}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MessageIcon
                          contactId={student.id}
                          size="sm"
                          variant="ghost"
                          className="hover:bg-blue-50"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewProfile(student)}
                          className="p-2 hover:bg-green-50"
                        >
                          <User className="w-4 h-4 text-green-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="p-2 hover:bg-gray-50">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStudent(student)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}