"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  MessageCircle,
  User,
  GraduationCap,
  Globe,
  Home
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"

interface StudentDetails {
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
  fatherName?: string
  motherName?: string
  fatherOccupation?: string
  motherOccupation?: string
  dateOfBirth?: string
  religion?: string
  class?: string
  section?: string
  roll?: string
  admissionDate?: string
  primaryPhone?: string
  secondaryPhone?: string
  primaryEmail?: string
  secondaryEmail?: string
  streetAddress?: string
  houseName?: string
  houseNumber?: string
}

export default function StudentDetailsPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!isAuthenticated || !isAdmin || !studentId) return

      try {
        setLoading(true)
        const response = await apiClient.get(`/admin/users/${studentId}`)

        if (response.success && response.data) {
          const studentData = response.data
          
          const studentDetails: StudentDetails = {
            id: studentData.id,
            firstName: studentData.firstName || '',
            lastName: studentData.lastName || '',
            email: studentData.email,
            phone: studentData.phone,
            address: studentData.address,
            level: studentData.level || 'A1',
            subscription: studentData.subscriptionTier || 'FREE',
            language: studentData.language || 'French',
            progress: studentData.progress || 0,
            status: studentData.status || 'ACTIVE',
            lastActivity: studentData.lastLoginAt || studentData.lastActivityAt,
            enrollments: studentData._count?.courseEnrollments || 0,
            testAttempts: studentData._count?.testAttempts || 0,
            averageScore: studentData.averageScore || 0,
            createdAt: studentData.createdAt,
            achievements: studentData.achievements || [],
            profileImage: studentData.profileImage,
            fatherName: studentData.fatherName || 'Not provided',
            motherName: studentData.motherName || 'Not provided',
            fatherOccupation: studentData.fatherOccupation || 'Not provided',
            motherOccupation: studentData.motherOccupation || 'Not provided',
            dateOfBirth: studentData.dateOfBirth || 'Not provided',
            religion: studentData.religion || 'Not provided',
            class: studentData.class || 'Not assigned',
            section: studentData.section || 'Not assigned',
            roll: studentData.roll || 'Not assigned',
            admissionDate: studentData.admissionDate || studentData.createdAt,
            primaryPhone: studentData.phone || 'Not provided',
            secondaryPhone: studentData.secondaryPhone || 'Not provided',
            primaryEmail: studentData.email,
            secondaryEmail: studentData.secondaryEmail || 'Not provided',
            streetAddress: studentData.streetAddress || 'Not provided',
            houseName: studentData.houseName || 'Not provided',
            houseNumber: studentData.houseNumber || 'Not provided'
          }

          setStudent(studentDetails)
        }
      } catch (error) {
        console.error('Error fetching student details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [isAuthenticated, isAdmin, studentId])

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

  const handleMessageStudent = () => {
    if (student) {
      router.push(`/admin/messages/compose?to=${student.id}&name=${student.firstName}+${student.lastName}&role=student`)
    }
  }

  const handleEditStudent = () => {
    // TODO: Implement edit functionality
    console.log('Edit student:', student)
  }

  const handleDeleteStudent = () => {
    // TODO: Implement delete functionality
    console.log('Delete student:', student)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-600 mb-4">The student you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/students')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/students')}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
                <p className="text-sm text-gray-600 mt-1">Home / Students / {student.firstName} {student.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleMessageStudent}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleEditStudent}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* About Me Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarImage src={student.profileImage} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl font-bold">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1">
                    <Home className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-3">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-sm text-gray-500">Student</p>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">First Name</p>
                  <p className="text-sm font-semibold text-gray-900">{student.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Last Name</p>
                  <p className="text-sm font-semibold text-gray-900">{student.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Father Name</p>
                  <p className="text-sm font-semibold text-gray-900">{student.fatherName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Mother Name</p>
                  <p className="text-sm font-semibold text-gray-900">{student.motherName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Father Occupation</p>
                  <p className="text-sm font-semibold text-gray-900">{student.fatherOccupation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Mother Occupation</p>
                  <p className="text-sm font-semibold text-gray-900">{student.motherOccupation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-sm font-semibold text-gray-900">{student.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Religion</p>
                  <p className="text-sm font-semibold text-gray-900">{student.religion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Class</p>
                  <p className="text-sm font-semibold text-gray-900">{student.class}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                  <p className="text-sm font-semibold text-gray-900">{student.section}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Roll</p>
                  <p className="text-sm font-semibold text-gray-900">{student.roll}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Admission Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Header */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Student</h3>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Primary Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{student.primaryPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Secondary Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{student.secondaryPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Primary Email</p>
                  <p className="text-sm font-semibold text-gray-900">{student.primaryEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Secondary Email</p>
                  <p className="text-sm font-semibold text-gray-900">{student.secondaryEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                  <p className="text-sm font-semibold text-gray-900">{student.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Street Address</p>
                  <p className="text-sm font-semibold text-gray-900">{student.streetAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">House Name</p>
                  <p className="text-sm font-semibold text-gray-900">{student.houseName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">House Number</p>
                  <p className="text-sm font-semibold text-gray-900">{student.houseNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Information */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Academic Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Level</span>
                  <Badge variant="outline" className="font-medium">
                    {student.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Language</span>
                  <span className="text-sm font-semibold text-gray-900">{student.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">{student.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${student.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Subscription & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subscription</span>
                  <Badge className={`${getSubscriptionColor(student.subscription)} font-medium`}>
                    {student.subscription}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(student.status)}
                    <Badge className={`${getStatusColor(student.status)} font-medium`}>
                      {student.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enrollments</span>
                  <span className="text-sm font-semibold text-gray-900">{student.enrollments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Test Attempts</span>
                  <span className="text-sm font-semibold text-gray-900">{student.testAttempts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-sm font-semibold text-gray-900">{student.averageScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Achievements</span>
                  <span className="text-sm font-semibold text-gray-900">{student.achievements.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={handleDeleteStudent}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
          <Button
            onClick={handleEditStudent}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
