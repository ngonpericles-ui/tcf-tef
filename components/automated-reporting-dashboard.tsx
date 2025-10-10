"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Bell,
  Settings,
  Send,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Zap,
  Mail,
  Smartphone,
  Globe,
  Plus,
  Edit,
  Trash2
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { AIPredictionService } from "@/lib/services/aiPredictionService"

interface AutomatedReportingDashboardProps {
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'
  className?: string
}

interface ReportSchedule {
  id: string
  name: string
  type: 'weekly' | 'monthly' | 'quarterly'
  format: 'pdf' | 'xlsx' | 'json'
  recipients: string[]
  enabled: boolean
  lastGenerated: string
  nextScheduled: string
  includesPredictions: boolean
  sections: string[]
}

interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  metric: string
  enabled: boolean
  channels: ('email' | 'sms' | 'webhook')[]
  recipients: string[]
  lastTriggered?: string
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  format: string
  generatedAt: string
  size: string
  downloadUrl: string
  status: 'completed' | 'generating' | 'failed'
}

export default function AutomatedReportingDashboard({
  userRole,
  className = ""
}: AutomatedReportingDashboardProps) {
  const { t } = useLanguage()
  
  const [reportSchedules, setReportSchedules] = useState<ReportSchedule[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewReportDialog, setShowNewReportDialog] = useState(false)
  const [showNewAlertDialog, setShowNewAlertDialog] = useState(false)

  // Mock data for demonstration - in real app, this would come from your backend
  useEffect(() => {
    const loadReportingData = async () => {
      try {
        setLoading(true)
        
        // Mock report schedules
        setReportSchedules([
          {
            id: '1',
            name: 'Weekly Student Progress Report',
            type: 'weekly',
            format: 'pdf',
            recipients: ['admin@example.com', 'manager@example.com'],
            enabled: true,
            lastGenerated: '2024-01-15T10:00:00Z',
            nextScheduled: '2024-01-22T10:00:00Z',
            includesPredictions: true,
            sections: ['student_progress', 'predictions', 'risks']
          },
          {
            id: '2',
            name: 'Monthly Analytics Summary',
            type: 'monthly',
            format: 'xlsx',
            recipients: ['director@example.com'],
            enabled: true,
            lastGenerated: '2024-01-01T09:00:00Z',
            nextScheduled: '2024-02-01T09:00:00Z',
            includesPredictions: false,
            sections: ['analytics', 'performance', 'trends']
          }
        ])

        // Mock alert rules
        setAlertRules([
          {
            id: '1',
            name: 'High Risk Student Alert',
            condition: 'risk_score > threshold',
            threshold: 80,
            metric: 'student_risk_score',
            enabled: true,
            channels: ['email', 'sms'],
            recipients: ['support@example.com'],
            lastTriggered: '2024-01-14T15:30:00Z'
          },
          {
            id: '2',
            name: 'Low Engagement Alert',
            condition: 'engagement_rate < threshold',
            threshold: 30,
            metric: 'daily_engagement_rate',
            enabled: true,
            channels: ['email'],
            recipients: ['manager@example.com']
          }
        ])

        // Mock generated reports
        setGeneratedReports([
          {
            id: '1',
            name: 'Weekly Student Progress Report',
            type: 'weekly',
            format: 'pdf',
            generatedAt: '2024-01-15T10:00:00Z',
            size: '2.4 MB',
            downloadUrl: '/reports/weekly-progress-2024-01-15.pdf',
            status: 'completed'
          },
          {
            id: '2',
            name: 'Monthly Analytics Summary',
            type: 'monthly',
            format: 'xlsx',
            generatedAt: '2024-01-01T09:00:00Z',
            size: '1.8 MB',
            downloadUrl: '/reports/monthly-analytics-2024-01.xlsx',
            status: 'completed'
          }
        ])

      } catch (error) {
        console.error('Failed to load reporting data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReportingData()
  }, [])

  // Generate report manually
  const handleGenerateReport = async (scheduleId: string) => {
    try {
      const schedule = reportSchedules.find(s => s.id === scheduleId)
      if (!schedule) return

      // Call AI prediction service to generate report
      await AIPredictionService.generateAutomatedReport(
        schedule.type,
        schedule.includesPredictions,
        schedule.format
      )

      // Update UI to show generating status
      // In real app, you'd poll for completion or use websockets
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  // Toggle schedule enabled/disabled
  const toggleSchedule = (scheduleId: string) => {
    setReportSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    )
  }

  // Toggle alert rule enabled/disabled
  const toggleAlert = (alertId: string) => {
    setAlertRules(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    )
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          {t("Chargement des rapports automatisés...", "Loading automated reports...")}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t('Rapports automatisés', 'Automated Reports')}
          </h2>
          <p className="text-muted-foreground">
            {t('Génération automatique de rapports et système d\'alertes', 'Automated report generation and alert system')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('Nouveau rapport', 'New Report')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Créer un nouveau rapport automatisé', 'Create New Automated Report')}</DialogTitle>
                <DialogDescription>
                  {t('Configurez un nouveau rapport à générer automatiquement', 'Configure a new report to be generated automatically')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="report-name">{t('Nom du rapport', 'Report name')}</Label>
                  <Input id="report-name" placeholder={t('Ex: Rapport hebdomadaire', 'e.g. Weekly Report')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-type">{t('Fréquence', 'Frequency')}</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Sélectionner', 'Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t('Hebdomadaire', 'Weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('Mensuel', 'Monthly')}</SelectItem>
                        <SelectItem value="quarterly">{t('Trimestriel', 'Quarterly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="report-format">{t('Format', 'Format')}</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Sélectionner', 'Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="xlsx">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="recipients">{t('Destinataires', 'Recipients')}</Label>
                  <Textarea 
                    id="recipients" 
                    placeholder={t('Adresses email séparées par des virgules', 'Email addresses separated by commas')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>
                  {t('Annuler', 'Cancel')}
                </Button>
                <Button onClick={() => setShowNewReportDialog(false)}>
                  {t('Créer', 'Create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Rapports programmés', 'Scheduled Reports')}
                </p>
                <p className="text-2xl font-bold">{reportSchedules.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Alertes actives', 'Active Alerts')}
                </p>
                <p className="text-2xl font-bold">{alertRules.filter(a => a.enabled).length}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Rapports générés', 'Generated Reports')}
                </p>
                <p className="text-2xl font-bold">{generatedReports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Alertes déclenchées', 'Alerts Triggered')}
                </p>
                <p className="text-2xl font-bold">{alertRules.filter(a => a.lastTriggered).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules">{t('Rapports programmés', 'Scheduled Reports')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('Alertes', 'Alerts')}</TabsTrigger>
          <TabsTrigger value="generated">{t('Rapports générés', 'Generated Reports')}</TabsTrigger>
        </TabsList>

        {/* Scheduled Reports Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="space-y-4">
            {reportSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold">{schedule.name}</h4>
                        <Badge variant="outline" className="capitalize">
                          {schedule.type}
                        </Badge>
                        <Badge variant="outline" className="uppercase">
                          {schedule.format}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={schedule.enabled} 
                            onCheckedChange={() => toggleSchedule(schedule.id)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {schedule.enabled ? t('Activé', 'Enabled') : t('Désactivé', 'Disabled')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Dernière génération', 'Last generated')}</p>
                          <p className="font-medium">
                            {new Date(schedule.lastGenerated).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Prochaine génération', 'Next scheduled')}</p>
                          <p className="font-medium">
                            {new Date(schedule.nextScheduled).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Destinataires', 'Recipients')}</p>
                          <p className="font-medium">{schedule.recipients.length} {t('personnes', 'people')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">{t('Sections incluses', 'Included sections')}:</span>
                        {schedule.sections.map((section, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {section.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      {schedule.includesPredictions && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Zap className="h-4 w-4" />
                          <span>{t('Inclut les prédictions IA', 'Includes AI predictions')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReport(schedule.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        {t('Générer maintenant', 'Generate Now')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('Règles d\'alerte', 'Alert Rules')}</h3>
            <Dialog open={showNewAlertDialog} onOpenChange={setShowNewAlertDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('Nouvelle alerte', 'New Alert')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Créer une nouvelle alerte', 'Create New Alert')}</DialogTitle>
                  <DialogDescription>
                    {t('Configurez une nouvelle règle d\'alerte automatique', 'Configure a new automatic alert rule')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alert-name">{t('Nom de l\'alerte', 'Alert name')}</Label>
                    <Input id="alert-name" placeholder={t('Ex: Alerte engagement faible', 'e.g. Low Engagement Alert')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="metric">{t('Métrique', 'Metric')}</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Sélectionner', 'Select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student_risk_score">{t('Score de risque étudiant', 'Student Risk Score')}</SelectItem>
                          <SelectItem value="engagement_rate">{t('Taux d\'engagement', 'Engagement Rate')}</SelectItem>
                          <SelectItem value="completion_rate">{t('Taux de completion', 'Completion Rate')}</SelectItem>
                          <SelectItem value="dropout_rate">{t('Taux d\'abandon', 'Dropout Rate')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="threshold">{t('Seuil', 'Threshold')}</Label>
                      <Input id="threshold" type="number" placeholder="80" />
                    </div>
                  </div>
                  <div>
                    <Label>{t('Canaux de notification', 'Notification channels')}</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sms" />
                        <Label htmlFor="sms" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          SMS
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="webhook" />
                        <Label htmlFor="webhook" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Webhook
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewAlertDialog(false)}>
                    {t('Annuler', 'Cancel')}
                  </Button>
                  <Button onClick={() => setShowNewAlertDialog(false)}>
                    {t('Créer', 'Create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {alertRules.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold">{alert.name}</h4>
                        <Badge variant="outline" className="capitalize">
                          {alert.metric.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.enabled}
                            onCheckedChange={() => toggleAlert(alert.id)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {alert.enabled ? t('Activé', 'Enabled') : t('Désactivé', 'Disabled')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Condition', 'Condition')}</p>
                          <p className="font-medium">{alert.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Seuil', 'Threshold')}</p>
                          <p className="font-medium">{alert.threshold}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('Dernière alerte', 'Last triggered')}</p>
                          <p className="font-medium">
                            {alert.lastTriggered
                              ? new Date(alert.lastTriggered).toLocaleDateString()
                              : t('Jamais', 'Never')
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">{t('Canaux', 'Channels')}:</span>
                        {alert.channels.map((channel, index) => (
                          <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                            {channel === 'email' ? <Mail className="h-3 w-3" /> :
                             channel === 'sms' ? <Smartphone className="h-3 w-3" /> :
                             <Globe className="h-3 w-3" />}
                            {channel}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {alert.recipients.length} {t('destinataire(s)', 'recipient(s)')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        {t('Tester', 'Test')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Generated Reports Tab */}
        <TabsContent value="generated" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Rapports générés', 'Generated Reports')}</h3>

          <div className="space-y-4">
            {generatedReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{report.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{t('Généré le', 'Generated on')} {new Date(report.generatedAt).toLocaleDateString()}</span>
                          <span>{report.size}</span>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === 'completed' ? t('Terminé', 'Completed') :
                             report.status === 'generating' ? t('En cours', 'Generating') :
                             t('Échec', 'Failed')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          {t('Télécharger', 'Download')}
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        {t('Aperçu', 'Preview')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
