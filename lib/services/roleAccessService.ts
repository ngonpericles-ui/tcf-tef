import { apiClient, ApiResponse } from '@/lib/api-client'

export type UserRole = 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
export type SubscriptionTier = 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
export type SectionType = 'student' | 'manager' | 'admin'
export type PermissionType = 
  | 'view_content' 
  | 'create_content' 
  | 'edit_content' 
  | 'delete_content'
  | 'manage_users' 
  | 'view_analytics' 
  | 'export_data'
  | 'moderate_content'
  | 'host_live_sessions'
  | 'manage_subscriptions'
  | 'system_settings'
  | 'view_reports'
  | 'manage_roles'

export interface RolePermissions {
  role: UserRole
  permissions: PermissionType[]
  sectionAccess: SectionType[]
  subscriptionRequirements: {
    [key in PermissionType]?: SubscriptionTier[]
  }
  featureAccess: {
    [key: string]: boolean | SubscriptionTier[]
  }
}

export interface AccessRule {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  requiredRole?: UserRole[]
  requiredSubscription?: SubscriptionTier[]
  requiredPermissions?: PermissionType[]
  section: SectionType
  resource: string
  action: string
  conditions?: AccessCondition[]
}

export interface AccessCondition {
  type: 'time' | 'location' | 'device' | 'custom'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
  message?: string
  messageEn?: string
}

export interface UserAccessContext {
  userId: string
  role: UserRole
  subscriptionTier: SubscriptionTier
  permissions: PermissionType[]
  currentSection: SectionType
  sessionData: {
    loginTime: string
    lastActivity: string
    ipAddress?: string
    userAgent?: string
    location?: string
  }
  preferences: {
    language: 'fr' | 'en'
    timezone: string
  }
}

export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  reasonEn?: string
  requiredRole?: UserRole[]
  requiredSubscription?: SubscriptionTier[]
  requiredPermissions?: PermissionType[]
  upgradeUrl?: string
  fallbackAction?: string
}

export class RoleAccessService {
  // Default role permissions configuration
  private static rolePermissions: RolePermissions[] = [
    {
      role: 'STUDENT',
      permissions: ['view_content'],
      sectionAccess: ['student'],
      subscriptionRequirements: {
        'view_content': ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO']
      },
      featureAccess: {
        'basic_courses': true,
        'practice_tests': ['ESSENTIAL', 'PREMIUM', 'PRO'],
        'live_sessions': ['PREMIUM', 'PRO'],
        'ai_tutor': ['PRO'],
        'offline_content': ['PREMIUM', 'PRO'],
        'progress_analytics': ['ESSENTIAL', 'PREMIUM', 'PRO'],
        'certificates': ['PREMIUM', 'PRO']
      }
    },
    {
      role: 'JUNIOR_MANAGER',
      permissions: [
        'view_content', 'create_content', 'edit_content', 
        'view_analytics', 'host_live_sessions'
      ],
      sectionAccess: ['student', 'manager'],
      subscriptionRequirements: {},
      featureAccess: {
        'content_management': true,
        'student_progress': true,
        'basic_analytics': true,
        'live_session_hosting': true,
        'content_creation_tools': true
      }
    },
    {
      role: 'SENIOR_MANAGER',
      permissions: [
        'view_content', 'create_content', 'edit_content', 'delete_content',
        'manage_users', 'view_analytics', 'export_data', 'moderate_content',
        'host_live_sessions', 'view_reports'
      ],
      sectionAccess: ['student', 'manager'],
      subscriptionRequirements: {},
      featureAccess: {
        'advanced_analytics': true,
        'user_management': true,
        'content_moderation': true,
        'data_export': true,
        'advanced_reporting': true,
        'bulk_operations': true
      }
    },
    {
      role: 'ADMIN',
      permissions: [
        'view_content', 'create_content', 'edit_content', 'delete_content',
        'manage_users', 'view_analytics', 'export_data', 'moderate_content',
        'host_live_sessions', 'manage_subscriptions', 'system_settings',
        'view_reports', 'manage_roles'
      ],
      sectionAccess: ['student', 'manager', 'admin'],
      subscriptionRequirements: {},
      featureAccess: {
        'full_system_access': true,
        'subscription_management': true,
        'system_configuration': true,
        'role_management': true,
        'security_settings': true,
        'platform_analytics': true,
        'api_access': true
      }
    }
  ]

  /**
   * Check if user has access to a specific section
   */
  static async checkSectionAccess(
    userContext: UserAccessContext,
    targetSection: SectionType
  ): Promise<AccessCheckResult> {
    try {
      const roleConfig = this.rolePermissions.find(rp => rp.role === userContext.role)
      
      if (!roleConfig) {
        return {
          allowed: false,
          reason: 'Rôle utilisateur non reconnu',
          reasonEn: 'User role not recognized'
        }
      }

      // Check if role has access to section
      if (!roleConfig.sectionAccess.includes(targetSection)) {
        return {
          allowed: false,
          reason: `Accès refusé à la section ${targetSection}`,
          reasonEn: `Access denied to ${targetSection} section`,
          requiredRole: this.getMinimumRoleForSection(targetSection)
        }
      }

      // Additional API check for dynamic rules
      const response = await apiClient.post('/auth/check-section-access', {
        userId: userContext.userId,
        targetSection,
        currentContext: userContext
      })

      if (response.success) {
        return response.data
      }

      return {
        allowed: true
      }
    } catch (error) {
      console.error('Error checking section access:', error)
      return {
        allowed: false,
        reason: 'Erreur lors de la vérification des accès',
        reasonEn: 'Error checking access permissions'
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  static async checkPermission(
    userContext: UserAccessContext,
    permission: PermissionType,
    resource?: string
  ): Promise<AccessCheckResult> {
    try {
      const roleConfig = this.rolePermissions.find(rp => rp.role === userContext.role)
      
      if (!roleConfig) {
        return {
          allowed: false,
          reason: 'Rôle utilisateur non reconnu',
          reasonEn: 'User role not recognized'
        }
      }

      // Check if role has the permission
      if (!roleConfig.permissions.includes(permission)) {
        return {
          allowed: false,
          reason: `Permission ${permission} non accordée`,
          reasonEn: `Permission ${permission} not granted`,
          requiredRole: this.getMinimumRoleForPermission(permission)
        }
      }

      // Check subscription requirements
      const subscriptionReq = roleConfig.subscriptionRequirements[permission]
      if (subscriptionReq && !subscriptionReq.includes(userContext.subscriptionTier)) {
        return {
          allowed: false,
          reason: 'Abonnement insuffisant',
          reasonEn: 'Insufficient subscription',
          requiredSubscription: subscriptionReq,
          upgradeUrl: '/abonnement'
        }
      }

      // Additional API check for dynamic rules
      const response = await apiClient.post('/auth/check-permission', {
        userId: userContext.userId,
        permission,
        resource,
        currentContext: userContext
      })

      if (response.success) {
        return response.data
      }

      return {
        allowed: true
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      return {
        allowed: false,
        reason: 'Erreur lors de la vérification des permissions',
        reasonEn: 'Error checking permissions'
      }
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(
    userContext: UserAccessContext,
    feature: string
  ): Promise<AccessCheckResult> {
    try {
      const roleConfig = this.rolePermissions.find(rp => rp.role === userContext.role)
      
      if (!roleConfig) {
        return {
          allowed: false,
          reason: 'Rôle utilisateur non reconnu',
          reasonEn: 'User role not recognized'
        }
      }

      const featureAccess = roleConfig.featureAccess[feature]
      
      // Feature not defined for this role
      if (featureAccess === undefined) {
        return {
          allowed: false,
          reason: `Fonctionnalité ${feature} non disponible`,
          reasonEn: `Feature ${feature} not available`
        }
      }

      // Boolean access
      if (typeof featureAccess === 'boolean') {
        return {
          allowed: featureAccess
        }
      }

      // Subscription-based access
      if (Array.isArray(featureAccess)) {
        const hasAccess = featureAccess.includes(userContext.subscriptionTier)
        return {
          allowed: hasAccess,
          reason: hasAccess ? undefined : 'Abonnement insuffisant',
          reasonEn: hasAccess ? undefined : 'Insufficient subscription',
          requiredSubscription: hasAccess ? undefined : featureAccess,
          upgradeUrl: hasAccess ? undefined : '/abonnement'
        }
      }

      return {
        allowed: false
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return {
        allowed: false,
        reason: 'Erreur lors de la vérification des fonctionnalités',
        reasonEn: 'Error checking feature access'
      }
    }
  }

  /**
   * Get all accessible sections for a user
   */
  static getAccessibleSections(userRole: UserRole): SectionType[] {
    const roleConfig = this.rolePermissions.find(rp => rp.role === userRole)
    return roleConfig?.sectionAccess || ['student']
  }

  /**
   * Get all permissions for a user role
   */
  static getRolePermissions(userRole: UserRole): PermissionType[] {
    const roleConfig = this.rolePermissions.find(rp => rp.role === userRole)
    return roleConfig?.permissions || []
  }

  /**
   * Get feature access map for a user
   */
  static getFeatureAccess(userRole: UserRole, subscriptionTier: SubscriptionTier): { [key: string]: boolean } {
    const roleConfig = this.rolePermissions.find(rp => rp.role === userRole)
    if (!roleConfig) return {}

    const featureMap: { [key: string]: boolean } = {}
    
    Object.entries(roleConfig.featureAccess).forEach(([feature, access]) => {
      if (typeof access === 'boolean') {
        featureMap[feature] = access
      } else if (Array.isArray(access)) {
        featureMap[feature] = access.includes(subscriptionTier)
      }
    })

    return featureMap
  }

  /**
   * Get minimum role required for a section
   */
  private static getMinimumRoleForSection(section: SectionType): UserRole[] {
    const rolesWithAccess = this.rolePermissions
      .filter(rp => rp.sectionAccess.includes(section))
      .map(rp => rp.role)
    
    return rolesWithAccess
  }

  /**
   * Get minimum role required for a permission
   */
  private static getMinimumRoleForPermission(permission: PermissionType): UserRole[] {
    const rolesWithPermission = this.rolePermissions
      .filter(rp => rp.permissions.includes(permission))
      .map(rp => rp.role)
    
    return rolesWithPermission
  }

  /**
   * Validate access rules
   */
  static async validateAccessRules(
    userContext: UserAccessContext,
    rules: AccessRule[]
  ): Promise<{ [ruleId: string]: AccessCheckResult }> {
    const results: { [ruleId: string]: AccessCheckResult } = {}

    for (const rule of rules) {
      try {
        let allowed = true
        let reason = ''
        let reasonEn = ''

        // Check role requirements
        if (rule.requiredRole && !rule.requiredRole.includes(userContext.role)) {
          allowed = false
          reason = 'Rôle insuffisant'
          reasonEn = 'Insufficient role'
        }

        // Check subscription requirements
        if (allowed && rule.requiredSubscription && !rule.requiredSubscription.includes(userContext.subscriptionTier)) {
          allowed = false
          reason = 'Abonnement insuffisant'
          reasonEn = 'Insufficient subscription'
        }

        // Check permission requirements
        if (allowed && rule.requiredPermissions) {
          const hasAllPermissions = rule.requiredPermissions.every(perm => 
            userContext.permissions.includes(perm)
          )
          if (!hasAllPermissions) {
            allowed = false
            reason = 'Permissions insuffisantes'
            reasonEn = 'Insufficient permissions'
          }
        }

        // Check custom conditions
        if (allowed && rule.conditions) {
          for (const condition of rule.conditions) {
            const conditionResult = await this.evaluateCondition(userContext, condition)
            if (!conditionResult) {
              allowed = false
              reason = condition.message || 'Condition non remplie'
              reasonEn = condition.messageEn || 'Condition not met'
              break
            }
          }
        }

        results[rule.id] = {
          allowed,
          reason: allowed ? undefined : reason,
          reasonEn: allowed ? undefined : reasonEn,
          requiredRole: rule.requiredRole,
          requiredSubscription: rule.requiredSubscription,
          requiredPermissions: rule.requiredPermissions
        }
      } catch (error) {
        results[rule.id] = {
          allowed: false,
          reason: 'Erreur lors de la validation',
          reasonEn: 'Validation error'
        }
      }
    }

    return results
  }

  /**
   * Evaluate access condition
   */
  private static async evaluateCondition(
    userContext: UserAccessContext,
    condition: AccessCondition
  ): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'time':
          // Time-based conditions (e.g., business hours)
          const currentTime = new Date()
          return this.evaluateTimeCondition(currentTime, condition)
        
        case 'location':
          // Location-based conditions
          return this.evaluateLocationCondition(userContext.sessionData.location, condition)
        
        case 'device':
          // Device-based conditions
          return this.evaluateDeviceCondition(userContext.sessionData.userAgent, condition)
        
        case 'custom':
          // Custom API-based conditions
          const response = await apiClient.post('/auth/evaluate-condition', {
            userContext,
            condition
          })
          return response.success && response.data.allowed
        
        default:
          return true
      }
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }

  private static evaluateTimeCondition(currentTime: Date, condition: AccessCondition): boolean {
    // Implementation for time-based conditions
    // This would include business hours, maintenance windows, etc.
    return true // Simplified for now
  }

  private static evaluateLocationCondition(location: string | undefined, condition: AccessCondition): boolean {
    // Implementation for location-based conditions
    // This would include geo-restrictions, etc.
    return true // Simplified for now
  }

  private static evaluateDeviceCondition(userAgent: string | undefined, condition: AccessCondition): boolean {
    // Implementation for device-based conditions
    // This would include mobile/desktop restrictions, etc.
    return true // Simplified for now
  }
}
