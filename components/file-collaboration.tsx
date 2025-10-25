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
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Users,
  Send,
  Reply,
  Edit,
  Trash2,
  Pin,
  Heart,
  MoreHorizontal,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Filter,
  Search,
  Bell,
  BellOff,
  Star,
  Flag,
  Quote,
  Paperclip,
  Smile,
  AtSign,
  Hash
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileCollaborationProps {
  file: FileItem
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface Comment {
  id: string
  fileId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  content: string
  createdAt: string
  updatedAt?: string
  parentId?: string
  isResolved: boolean
  isPinned: boolean
  likes: number
  isLiked: boolean
  mentions: string[]
  attachments: string[]
  reactions: { emoji: string; count: number; users: string[] }[]
}

interface Annotation {
  id: string
  fileId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  position: { x: number; y: number; page?: number }
  type: 'note' | 'highlight' | 'drawing'
  color: string
  createdAt: string
  isResolved: boolean
}

interface Activity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  action: 'comment' | 'edit' | 'share' | 'download' | 'annotate'
  description: string
  timestamp: string
  metadata?: any
}

export default function FileCollaboration({
  file,
  isOpen,
  onClose,
  className = ""
}: FileCollaborationProps) {
  const { lang } = useLang()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [filterResolved, setFilterResolved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(true)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load collaboration data
  const loadCollaborationData = useCallback(async () => {
    if (!file.id) return

    try {
      setLoading(true)
      setError(null)

      // For now, start with empty data until backend collaboration features are implemented
      // This provides the UI structure for future backend integration

      setComments([])
      setAnnotations([])
      setActivities([
        {
          id: '1',
          userId: 'current-user',
          userName: t('Vous', 'You'),
          userAvatar: '',
          action: 'comment',
          description: t('avez ouvert le fichier', 'opened the file'),
          timestamp: new Date().toISOString()
        }
      ])

      // TODO: When backend supports comments/collaboration:
      // const commentsResponse = await fileService.getFileComments(file.id)
      // const activitiesResponse = await fileService.getFileActivities(file.id)
      // Process and set the real data

    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [file.id, t])

  useEffect(() => {
    if (isOpen) {
      loadCollaborationData()
    }
  }, [isOpen, loadCollaborationData])

  // Add comment
  const addComment = async (parentId?: string) => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      fileId: file.id,
      userId: 'current-user',
      userName: 'Utilisateur actuel',
      userEmail: 'current@example.com',
      userAvatar: '',
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      parentId,
      isResolved: false,
      isPinned: false,
      likes: 0,
      isLiked: false,
      mentions: [],
      attachments: [],
      reactions: []
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
    setReplyingTo(null)
  }

  // Edit comment
  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, content: editContent.trim(), updatedAt: new Date().toISOString() }
        : c
    ))
    setEditingComment(null)
    setEditContent('')
  }

  // Delete comment
  const deleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  // Toggle comment resolution
  const toggleResolution = async (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, isResolved: !c.isResolved } : c
    ))
  }

  // Toggle comment pin
  const togglePin = async (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, isPinned: !c.isPinned } : c
    ))
  }

  // Like comment
  const toggleLike = async (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { 
            ...c, 
            isLiked: !c.isLiked,
            likes: c.isLiked ? c.likes - 1 : c.likes + 1
          }
        : c
    ))
  }

  // Filter comments
  const filteredComments = comments.filter(comment => {
    if (filterResolved && !comment.isResolved) return false
    if (searchQuery && !comment.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Get thread comments
  const getThreadComments = (parentId: string) => {
    return comments.filter(c => c.parentId === parentId)
  }

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return t('À l\'instant', 'Just now')
    if (diffInMinutes < 60) return t(`Il y a ${diffInMinutes} min`, `${diffInMinutes}m ago`)
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return t(`Il y a ${diffInHours}h`, `${diffInHours}h ago`)
    
    const diffInDays = Math.floor(diffInHours / 24)
    return t(`Il y a ${diffInDays}j`, `${diffInDays}d ago`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('Collaboration', 'Collaboration')} - {file.originalName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {t('Chargement...', 'Loading...')}
          </div>
        ) : (
          <Tabs defaultValue="comments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('Commentaires', 'Comments')} ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center gap-2">
                <Pin className="h-4 w-4" />
                {t('Annotations', 'Annotations')} ({annotations.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('Activité', 'Activity')}
              </TabsTrigger>
            </TabsList>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              {/* Comment Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('Rechercher dans les commentaires...', 'Search comments...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Button
                  variant={filterResolved ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterResolved(!filterResolved)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t('Résolus', 'Resolved')}
                </Button>
                
                <Button
                  variant={notifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotifications(!notifications)}
                >
                  {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </div>

              {/* Add Comment */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder={t('Ajouter un commentaire...', 'Add a comment...')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <AtSign className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={() => addComment()} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        {t('Commenter', 'Comment')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredComments
                    .filter(comment => !comment.parentId)
                    .map((comment) => (
                    <Card key={comment.id} className={`${comment.isPinned ? 'ring-2 ring-yellow-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Comment Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.userAvatar} />
                                <AvatarFallback>
                                  {comment.userName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{comment.userName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeAgo(comment.createdAt)}
                                  {comment.updatedAt && (
                                    <span> • {t('modifié', 'edited')}</span>
                                  )}
                                </p>
                              </div>
                              {comment.isPinned && (
                                <Badge variant="secondary" className="text-xs">
                                  <Pin className="h-3 w-3 mr-1" />
                                  {t('Épinglé', 'Pinned')}
                                </Badge>
                              )}
                              {comment.isResolved && (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('Résolu', 'Resolved')}
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
                                <DropdownMenuItem onClick={() => {
                                  setEditingComment(comment.id)
                                  setEditContent(comment.content)
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('Modifier', 'Edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setReplyingTo(comment.id)}>
                                  <Reply className="h-4 w-4 mr-2" />
                                  {t('Répondre', 'Reply')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePin(comment.id)}>
                                  <Pin className="h-4 w-4 mr-2" />
                                  {comment.isPinned ? t('Désépingler', 'Unpin') : t('Épingler', 'Pin')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleResolution(comment.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {comment.isResolved ? t('Rouvrir', 'Reopen') : t('Résoudre', 'Resolve')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteComment(comment.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('Supprimer', 'Delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Comment Content */}
                          {editingComment === comment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateComment(comment.id)}>
                                  {t('Sauvegarder', 'Save')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingComment(null)
                                    setEditContent('')
                                  }}
                                >
                                  {t('Annuler', 'Cancel')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{comment.content}</p>
                          )}

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLike(comment.id)}
                              className={comment.isLiked ? 'text-red-500' : ''}
                            >
                              <Heart className={`h-4 w-4 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                              {comment.likes}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(comment.id)}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              {t('Répondre', 'Reply')}
                            </Button>

                            {/* Reactions */}
                            {comment.reactions.map((reaction) => (
                              <Badge key={reaction.emoji} variant="outline" className="text-xs">
                                {reaction.emoji} {reaction.count}
                              </Badge>
                            ))}
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <div className="ml-8 space-y-2">
                              <Textarea
                                placeholder={t('Répondre...', 'Reply...')}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => addComment(comment.id)}>
                                  {t('Répondre', 'Reply')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setReplyingTo(null)}
                                >
                                  {t('Annuler', 'Cancel')}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Thread Replies */}
                          {getThreadComments(comment.id).map((reply) => (
                            <div key={reply.id} className="ml-8 p-3 bg-secondary/50 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={reply.userAvatar} />
                                    <AvatarFallback className="text-xs">
                                      {reply.userName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm">{reply.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                  {reply.isResolved && (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {t('Résolu', 'Resolved')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredComments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchQuery || filterResolved
                          ? t('Aucun commentaire trouvé', 'No comments found')
                          : t('Aucun commentaire pour le moment', 'No comments yet')
                        }
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Annotations Tab */}
            <TabsContent value="annotations" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('Fonctionnalité d\'annotation en développement', 'Annotation feature in development')}</p>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.userAvatar} />
                        <AvatarFallback>
                          {activity.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.userName}</span>
                          {' '}{activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
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
