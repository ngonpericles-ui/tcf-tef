"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Bell,
  Repeat,
  Plus,
  Trash2,
  Send,
  Settings,
  Zap,
  Target,
  BookOpen
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"

interface SessionSchedulerProps {
  onSessionCreated?: (session: any) => void
  editingSession?: any
  className?: string
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  endDate?: Date
  daysOfWeek?: number[]
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  reminderTimes: number[] // minutes before session
}

interface AutomationRule {
  id: string
  name: string
  trigger: 'time_before' | 'participant_count' | 'no_show'
  condition: any
  action: 'send_reminder' | 'cancel_session' | 'reschedule' | 'notify_admin'
  enabled: boolean
}

export default function SessionScheduler({
  onSessionCreated,
  editingSession,
  className = ""
}: SessionSchedulerProps) {
  const { lang } = useLang()
  const { user } = useAuth()
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1')
  const [category, setCategory] = useState<'CONVERSATION' | 'GRAMMAR' | 'TCF_PREP' | 'TEF_PREP' | 'WORKSHOP'>('CONVERSATION')
  const [requiredTier, setRequiredTier] = useState<'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'>('FREE')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Advanced features
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    reminderTimes: [60, 15] // 1 hour and 15 minutes before
  })
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [loading, setLoading] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Initialize form with editing session
  useEffect(() => {
    if (editingSession) {
      setTitle(editingSession.title)
      setDescription(editingSession.description)
      setDate(new Date(editingSession.date))
      setTime(format(new Date(editingSession.date), 'HH:mm'))
      setDuration(editingSession.duration)
      setMaxParticipants(editingSession.maxParticipants)
      setLevel(editingSession.level)
      setCategory(editingSession.category)
      setRequiredTier(editingSession.requiredTier)
      setTags(editingSession.tags || [])
    }
  }, [editingSession])

  // Load default automation rules
  useEffect(() => {
    const defaultRules: AutomationRule[] = [
      {
        id: '1',
        name: t('Rappel automatique', 'Automatic Reminder'),
        trigger: 'time_before',
        condition: { minutes: 60 },
        action: 'send_reminder',
        enabled: true
      },
      {
        id: '2',
        name: t('Annulation si pas assez de participants', 'Cancel if Low Attendance'),
        trigger: 'participant_count',
        condition: { minParticipants: 3, checkTime: 30 },
        action: 'cancel_session',
        enabled: false
      },
      {
        id: '3',
        name: t('Notification absence', 'No-show Notification'),
        trigger: 'no_show',
        condition: { threshold: 0.5 },
        action: 'notify_admin',
        enabled: true
      }
    ]
    setAutomationRules(defaultRules)
  }, [lang])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !title.trim()) return

    setLoading(true)
    try {
      const sessionDateTime = new Date(date)
      const [hours, minutes] = time.split(':').map(Number)
      sessionDateTime.setHours(hours, minutes)

      const sessionData = {
        title: title.trim(),
        description: description.trim(),
        date: sessionDateTime.toISOString(),
        duration,
        maxParticipants,
        level,
        category,
        requiredTier,
        tags,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        notifications,
        automationRules: automationRules.filter(rule => rule.enabled)
      }

      // TODO: Replace with actual API call
      console.log('Creating session:', sessionData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSessionCreated?.(sessionData)
      
      // Reset form
      if (!editingSession) {
        setTitle('')
        setDescription('')
        setDate(undefined)
        setTime('')
        setTags([])
      }
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSmartSuggestions = () => {
    // TODO: AI-powered session suggestions based on user data
    const suggestions = [
      {
        title: t('Conversation B2 - Actualités', 'B2 Conversation - Current Events'),
        description: t('Discussion sur les actualités françaises', 'Discussion about French current events'),
        level: 'B2' as const,
        category: 'CONVERSATION' as const,
        duration: 90
      },
      {
        title: t('Préparation TCF - Expression orale', 'TCF Prep - Speaking'),
        description: t('Entraînement intensif pour l\'expression orale du TCF', 'Intensive training for TCF speaking'),
        level: 'B1' as const,
        category: 'TCF_PREP' as const,
        duration: 60
      }
    ]
    
    return suggestions
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {editingSession ? 
            t('Modifier la session', 'Edit Session') : 
            t('Planifier une nouvelle session', 'Schedule New Session')
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('Titre', 'Title')} *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('Ex: Conversation B2 - Voyage', 'Ex: B2 Conversation - Travel')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">{t('Catégorie', 'Category')}</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONVERSATION">{t('Conversation', 'Conversation')}</SelectItem>
                    <SelectItem value="GRAMMAR">{t('Grammaire', 'Grammar')}</SelectItem>
                    <SelectItem value="TCF_PREP">{t('Préparation TCF', 'TCF Preparation')}</SelectItem>
                    <SelectItem value="TEF_PREP">{t('Préparation TEF', 'TEF Preparation')}</SelectItem>
                    <SelectItem value="WORKSHOP">{t('Atelier', 'Workshop')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('Description', 'Description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('Décrivez le contenu et les objectifs de la session...', 'Describe the content and objectives of the session...')}
                rows={3}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('Date et heure', 'Date and Time')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('Date', 'Date')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: lang === 'fr' ? fr : enUS }) : t('Sélectionner une date', 'Select date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={lang === 'fr' ? fr : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">{t('Heure', 'Time')} *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{t('Durée (minutes)', 'Duration (minutes)')}</Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('Paramètres', 'Settings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">{t('Niveau', 'Level')}</Label>
                <Select value={level} onValueChange={(value: any) => setLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - {t('Débutant', 'Beginner')}</SelectItem>
                    <SelectItem value="A2">A2 - {t('Élémentaire', 'Elementary')}</SelectItem>
                    <SelectItem value="B1">B1 - {t('Intermédiaire', 'Intermediate')}</SelectItem>
                    <SelectItem value="B2">B2 - {t('Intermédiaire avancé', 'Upper Intermediate')}</SelectItem>
                    <SelectItem value="C1">C1 - {t('Avancé', 'Advanced')}</SelectItem>
                    <SelectItem value="C2">C2 - {t('Maîtrise', 'Mastery')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">{t('Participants max', 'Max Participants')}</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="50"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredTier">{t('Abonnement requis', 'Required Subscription')}</Label>
                <Select value={requiredTier} onValueChange={(value: any) => setRequiredTier(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">{t('Gratuit', 'Free')}</SelectItem>
                    <SelectItem value="ESSENTIAL">{t('Essentiel', 'Essential')}</SelectItem>
                    <SelectItem value="PREMIUM">{t('Premium', 'Premium')}</SelectItem>
                    <SelectItem value="PRO">{t('Pro', 'Pro')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('Mots-clés', 'Tags')}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={t('Ajouter un mot-clé...', 'Add a tag...')}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('Suggestions intelligentes', 'Smart Suggestions')}
              </h3>
              <Button type="button" variant="outline" size="sm">
                {t('Générer', 'Generate')}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generateSmartSuggestions().map((suggestion, index) => (
                <Card key={index} className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <Badge variant="outline" className="text-xs">{suggestion.level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{suggestion.category}</Badge>
                      <span className="text-xs text-muted-foreground">{suggestion.duration}min</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('Options avancées', 'Advanced Options')}
            </Button>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {editingSession ? 
                t('Mettre à jour', 'Update Session') : 
                t('Créer la session', 'Create Session')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
