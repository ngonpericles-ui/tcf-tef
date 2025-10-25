"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { RoleBasedSessionManager } from '@/lib/roleBasedSessionManager'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  showText?: boolean
  confirmLogout?: boolean
}

export default function LogoutButton({
  variant = "ghost",
  size = "default",
  className = "",
  showIcon = true,
  showText = true,
  confirmLogout = true
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      // Get current user role
      const session = RoleBasedSessionManager.getCurrentSession()
      const role = session?.user?.role || 'STUDENT'
      
      // Perform logout
      await RoleBasedSessionManager.logout(role)
      
      // The logout function handles redirection
    } catch (error) {
      console.error('Logout failed:', error)
      // Fallback: clear session and redirect
      RoleBasedSessionManager.clearSession()
      router.push('/welcome')
    } finally {
      setIsLoading(false)
    }
  }

  const LogoutButtonContent = () => (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={confirmLogout ? undefined : handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className="w-4 h-4" />}
          {showText && (
            <span className={showIcon ? "ml-2" : ""}>
              {t("auth.logout", "Déconnexion")}
            </span>
          )}
        </>
      )}
    </Button>
  )

  if (!confirmLogout) {
    return <LogoutButtonContent />
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <LogoutButtonContent />
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-gray-200 dark:border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            {t("auth.logout.confirm.title", "Confirmer la déconnexion")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {t("auth.logout.confirm.description", "Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/80">
            {t("common.cancel", "Annuler")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("auth.logout.inProgress", "Déconnexion...")}
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                {t("auth.logout", "Déconnexion")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Convenience components for different sections
export function AdminLogoutButton(props: Omit<LogoutButtonProps, 'variant'>) {
  return (
    <LogoutButton
      {...props}
      variant="destructive"
      className="bg-red-600 hover:bg-red-700 text-white"
    />
  )
}

export function ManagerLogoutButton(props: Omit<LogoutButtonProps, 'variant'>) {
  return (
    <LogoutButton
      {...props}
      variant="outline"
      className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
    />
  )
}

export function StudentLogoutButton(props: Omit<LogoutButtonProps, 'variant'>) {
  return (
    <LogoutButton
      {...props}
      variant="ghost"
      className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
    />
  )
}
