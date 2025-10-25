"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Share2,
  Users,
  Link,
  Copy,
  Mail,
  Eye,
  Edit,
  Download,
  Trash2,
  Globe,
  Lock,
  Clock,
  UserPlus,
  MoreHorizontal,
  Check,
  X,
  Calendar,
  Shield,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileSharingSystemProps {
  file: FileItem
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface SharePermission {
  id: string
  userId: string
  userEmail: string
  userName: string
  userAvatar?: string
  permission: 'view' | 'edit' | 'download' | 'full'
  expiresAt?: string
  createdAt: string
}

interface PublicLink {
  id: string
  url: string
  permission: 'view' | 'download'
  expiresAt?: string
  password?: string
  downloadCount: number
  maxDownloads?: number
  createdAt: string
}

export default function FileSharingSystem({
  file,
  isOpen,
  onClose,
  className = ""
}: FileSharingSystemProps) {
  const { lang } = useLang()
  
  const [sharePermissions, setSharePermissions] = useState<SharePermission[]>([])
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPermission, setNewUserPermission] = useState<SharePermission['permission']>('view')
  const [linkPermission, setLinkPermission] = useState<PublicLink['permission']>('view')
  const [linkExpiry, setLinkExpiry] = useState<string>('')
  const [linkPassword, setLinkPassword] = useState('')
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined)
  const [shareMessage, setShareMessage] = useState('')

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Permission options
  const permissionOptions = [
    { value: 'view', label: t('Lecture seule', 'View only'), icon: Eye, description: t('Peut voir le fichier', 'Can view the file') },
    { value: 'edit', label: t('Modification', 'Edit'), icon: Edit, description: t('Peut modifier le fichier', 'Can edit the file') },
    { value: 'download', label: t('Téléchargement', 'Download'), icon: Download, description: t('Peut télécharger le fichier', 'Can download the file') },
    { value: 'full', label: t('Contrôle total', 'Full control'), icon: Shield, description: t('Peut tout faire', 'Can do everything') }
  ]

  // Load sharing data
  const loadSharingData = useCallback(async () => {
    if (!file.id) return

    try {
      setLoading(true)
      setError(null)

      // Load file sharing data from your backend
      const sharingResponse = await fileService.getFileShares(file.id)

      if (sharingResponse.success && sharingResponse.data) {
        // Convert backend data to component format
        const permissions: SharePermission[] = sharingResponse.data.map((share: any) => ({
          id: share.id,
          userId: share.userId,
          userEmail: share.user?.email || '',
          userName: share.user ? `${share.user.firstName} ${share.user.lastName}` : 'Unknown User',
          userAvatar: share.user?.avatar || '',
          permission: share.permissions as SharePermission['permission'],
          expiresAt: share.expiresAt,
          createdAt: share.createdAt
        }))

        setSharePermissions(permissions)

        // For now, public links will be empty until backend support is added
        setPublicLinks([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [file.id, t])

  useEffect(() => {
    if (isOpen) {
      loadSharingData()
    }
  }, [isOpen, loadSharingData])

  // Add user permission
  const addUserPermission = async () => {
    if (!newUserEmail.trim()) return

    const newPermission: SharePermission = {
      id: Date.now().toString(),
      userId: `user_${Date.now()}`,
      userEmail: newUserEmail.trim(),
      userName: newUserEmail.split('@')[0],
      permission: newUserPermission,
      createdAt: new Date().toISOString()
    }

    setSharePermissions(prev => [...prev, newPermission])
    setNewUserEmail('')
    setNewUserPermission('view')
  }

  // Update user permission
  const updateUserPermission = (permissionId: string, newPermission: SharePermission['permission']) => {
    setSharePermissions(prev => prev.map(p => 
      p.id === permissionId ? { ...p, permission: newPermission } : p
    ))
  }

  // Remove user permission
  const removeUserPermission = (permissionId: string) => {
    setSharePermissions(prev => prev.filter(p => p.id !== permissionId))
  }

  // Create public link
  const createPublicLink = async () => {
    const newLink: PublicLink = {
      id: Date.now().toString(),
      url: `https://app.example.com/shared/${file.id}/${Math.random().toString(36).substr(2, 9)}`,
      permission: linkPermission,
      expiresAt: linkExpiry ? new Date(linkExpiry).toISOString() : undefined,
      password: linkPassword || undefined,
      downloadCount: 0,
      maxDownloads: maxDownloads,
      createdAt: new Date().toISOString()
    }

    setPublicLinks(prev => [...prev, newLink])
    setLinkPermission('view')
    setLinkExpiry('')
    setLinkPassword('')
    setMaxDownloads(undefined)
  }

  // Copy link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Show success toast
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Send email invitation
  const sendEmailInvitation = async (email: string) => {
    // Mock email sending
    console.log('Sending email to:', email)
  }

  // Get permission icon
  const getPermissionIcon = (permission: SharePermission['permission']) => {
    const option = permissionOptions.find(opt => opt.value === permission)
    return option ? <option.icon className="h-4 w-4" /> : <Eye className="h-4 w-4" />
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('Partager', 'Share')} - {file.originalName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {t('Chargement...', 'Loading...')}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('Partage avec des utilisateurs', 'Share with users')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add User */}
                <div className="space-y-2">
                  <Label>{t('Inviter un utilisateur', 'Invite user')}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('Adresse email', 'Email address')}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newUserPermission} onValueChange={(value: SharePermission['permission']) => setNewUserPermission(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addUserPermission} disabled={!newUserEmail.trim()}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Current Permissions */}
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {sharePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={permission.userAvatar} />
                            <AvatarFallback>
                              {permission.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{permission.userName}</p>
                            <p className="text-xs text-muted-foreground">{permission.userEmail}</p>
                            {permission.expiresAt && (
                              <p className="text-xs text-orange-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t('Expire le', 'Expires')} {formatDate(permission.expiresAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select 
                            value={permission.permission} 
                            onValueChange={(value: SharePermission['permission']) => updateUserPermission(permission.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {permissionOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => sendEmailInvitation(permission.userEmail)}>
                                <Mail className="h-4 w-4 mr-2" />
                                {t('Envoyer un rappel', 'Send reminder')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeUserPermission(permission.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('Retirer l\'accès', 'Remove access')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    
                    {sharePermissions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('Aucun utilisateur invité', 'No users invited')}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Public Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  {t('Liens publics', 'Public links')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Link */}
                <div className="space-y-3">
                  <Label>{t('Créer un lien public', 'Create public link')}</Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">{t('Permission', 'Permission')}</Label>
                      <Select value={linkPermission} onValueChange={(value: PublicLink['permission']) => setLinkPermission(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              {t('Lecture', 'View')}
                            </div>
                          </SelectItem>
                          <SelectItem value="download">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              {t('Téléchargement', 'Download')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">{t('Expiration', 'Expiration')}</Label>
                      <Input
                        type="date"
                        value={linkExpiry}
                        onChange={(e) => setLinkExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">{t('Mot de passe (optionnel)', 'Password (optional)')}</Label>
                      <Input
                        type="password"
                        placeholder={t('Mot de passe', 'Password')}
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">{t('Limite de téléchargements', 'Download limit')}</Label>
                      <Input
                        type="number"
                        placeholder={t('Illimité', 'Unlimited')}
                        value={maxDownloads || ''}
                        onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={createPublicLink} className="w-full">
                    <Link className="h-4 w-4 mr-2" />
                    {t('Créer le lien', 'Create link')}
                  </Button>
                </div>

                <Separator />

                {/* Existing Links */}
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {publicLinks.map((link) => (
                      <div key={link.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {link.permission === 'view' ? (
                              <Eye className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Download className="h-4 w-4 text-green-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {link.permission === 'view' ? t('Lecture', 'View') : t('Téléchargement', 'Download')}
                            </Badge>
                            {link.password && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                {t('Protégé', 'Protected')}
                              </Badge>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(link.url)}>
                                <Copy className="h-4 w-4 mr-2" />
                                {t('Copier le lien', 'Copy link')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('Supprimer', 'Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-mono bg-secondary p-1 rounded truncate">{link.url}</p>
                          <div className="flex items-center justify-between">
                            <span>{link.downloadCount} {t('téléchargements', 'downloads')}</span>
                            {link.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t('Expire le', 'Expires')} {formatDate(link.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {publicLinks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('Aucun lien public', 'No public links')}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
