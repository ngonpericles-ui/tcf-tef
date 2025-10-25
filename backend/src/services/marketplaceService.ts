import { prisma } from '@/database/connection';
import { ApiResponse } from '../types';

export interface TutorProfile {
  id: string;
  userId: string;
  title: string;
  bio: string;
  specialties: string[];
  experience: number;
  rating: number;
  totalStudents: number;
  languages: string[];
  availability: string;
  location: string;
  website?: string;
  phone?: string;
  isActive: boolean;
  hourlyRate?: number;
  joinedDate: string;
  lastActive: string;
}

export interface StudentRequest {
  id: string;
  studentId: string;
  tutorId: string;
  requestType: 'session' | 'message' | 'expertise';
  subject: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  requestedDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

export class MarketplaceService {
  // Get tutor profile for manager/admin
  static async getTutorProfile(userId: string): Promise<ApiResponse<TutorProfile | null>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              createdLiveSessions: true,
              createdCourses: true
            }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          error: { message: 'User not found', statusCode: 404 }
        };
      }

      // Create a basic tutor profile from user data
      const profile: TutorProfile = {
        id: user.id,
        userId: user.id,
        title: user.role === 'ADMIN' ? 'Administrateur Expert' : 
               user.role === 'SENIOR_MANAGER' ? 'Formateur Senior' : 'Formateur',
        bio: user.bio || `Formateur expérimenté en français langue étrangère avec une expertise dans la préparation aux examens TCF/TEF.`,
        specialties: ['TCF/TEF Preparation', 'French Grammar', 'Conversation Practice'],
        experience: 5, // Default experience
        rating: 4.8, // Default rating
        totalStudents: user._count.createdLiveSessions + user._count.createdCourses,
        languages: ['Français', 'English'],
        availability: 'Lundi-Vendredi 9h-17h',
        location: user.city || 'France',
        website: '',
        phone: user.phone || '',
        isActive: user.status === 'ACTIVE',
        hourlyRate: 45,
        joinedDate: user.createdAt.toISOString(),
        lastActive: user.lastActivityAt?.toISOString() || new Date().toISOString()
      };

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Error getting tutor profile:', error);
      return {
        success: false,
        error: { message: 'Failed to get tutor profile', statusCode: 500 }
      };
    }
  }

  // Get student requests for tutor
  static async getStudentRequests(tutorId: string): Promise<ApiResponse<StudentRequest[]>> {
    try {
      // For now, return empty array as we don't have a requests table
      // In a real implementation, you would query a marketplace_requests table
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error getting student requests:', error);
      return {
        success: false,
        error: { message: 'Failed to get student requests', statusCode: 500 }
      };
    }
  }

  // Get all active tutors for student marketplace
  static async getAllTutors(): Promise<ApiResponse<TutorProfile[]>> {
    try {
      const tutors = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] },
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: {
              createdLiveSessions: true,
              createdCourses: true
            }
          }
        }
      });

      const tutorProfiles: TutorProfile[] = tutors.map(user => ({
        id: user.id,
        userId: user.id,
        title: user.role === 'ADMIN' ? 'Administrateur Expert' : 
               user.role === 'SENIOR_MANAGER' ? 'Formateur Senior' : 'Formateur',
        bio: user.bio || `Formateur expérimenté en français langue étrangère.`,
        specialties: user.role === 'ADMIN' ? ['TCF/TEF Preparation', 'Advanced Grammar', 'Business French'] :
                    user.role === 'SENIOR_MANAGER' ? ['TCF/TEF Preparation', 'French Grammar', 'Conversation Practice'] :
                    ['Basic French', 'Conversation Practice'],
        experience: user.role === 'ADMIN' ? 10 : user.role === 'SENIOR_MANAGER' ? 7 : 3,
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        totalStudents: user._count.createdLiveSessions + user._count.createdCourses,
        languages: ['Français', 'English'],
        availability: 'Disponible',
        location: user.city || 'France',
        website: '',
        phone: user.phone || '',
        isActive: true,
        hourlyRate: user.role === 'ADMIN' ? 60 : user.role === 'SENIOR_MANAGER' ? 45 : 35,
        joinedDate: user.createdAt.toISOString(),
        lastActive: user.lastActivityAt?.toISOString() || new Date().toISOString()
      }));

      return {
        success: true,
        data: tutorProfiles
      };
    } catch (error) {
      console.error('Error getting all tutors:', error);
      return {
        success: false,
        error: { message: 'Failed to get tutors', statusCode: 500 }
      };
    }
  }

  // Update tutor profile
  static async updateTutorProfile(userId: string, updates: Partial<TutorProfile>): Promise<ApiResponse<TutorProfile>> {
    try {
      // Update user basic info
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          bio: updates.bio,
          phone: updates.phone,
          city: updates.location
        },
        include: {
          _count: {
            select: {
              createdLiveSessions: true,
              createdCourses: true
            }
          }
        }
      });

      // Return updated profile
      const profile = await this.getTutorProfile(userId);
      return profile;
    } catch (error) {
      console.error('Error updating tutor profile:', error);
      return {
        success: false,
        error: { message: 'Failed to update tutor profile', statusCode: 500 }
      };
    }
  }

  // Activate/deactivate tutor profile
  static async activateTutorProfile(userId: string, isActive: boolean): Promise<ApiResponse<TutorProfile | null>> {
    try {
      // Check if user is manager or admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
        return {
          success: false,
          error: { message: 'Unauthorized: Only managers and admins can manage marketplace profiles', statusCode: 403 }
        };
      }

      // Update or create tutor profile
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivityAt: new Date()
        }
      });

      // For now, we'll track activation status in a simple way
      // In a real implementation, you might have a separate TutorProfile table
      console.log(`Tutor profile ${isActive ? 'activated' : 'deactivated'} for user ${userId}`);

      // Return updated profile
      const profile = await this.getTutorProfile(userId);
      return {
        success: true,
        data: profile.data,
        message: `Profile ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error('Error activating tutor profile:', error);
      return {
        success: false,
        error: { message: 'Failed to activate tutor profile', statusCode: 500 }
      };
    }
  }

  // Handle student request action
  static async handleStudentRequest(requestId: string, action: 'accept' | 'decline', managerId: string): Promise<ApiResponse<any>> {
    try {
      // Check if manager exists
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(manager.role)) {
        return {
          success: false,
          error: { message: 'Unauthorized: Only managers and admins can handle requests', statusCode: 403 }
        };
      }

      // For now, we'll simulate handling the request
      // In a real implementation, you would have a StudentRequest table
      console.log(`Request ${requestId} ${action}ed by manager ${managerId}`);

      return {
        success: true,
        data: {
          requestId,
          action,
          managerId,
          status: action === 'accept' ? 'accepted' : 'declined',
          handledAt: new Date().toISOString()
        },
        message: `Request ${action}ed successfully`
      };
    } catch (error) {
      console.error('Error handling student request:', error);
      return {
        success: false,
        error: { message: 'Failed to handle student request', statusCode: 500 }
      };
    }
  }
}
