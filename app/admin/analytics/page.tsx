"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Globe,
  PieChart,
  LineChart,
  Activity,
  Shield
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface PaymentData {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  customerEmail: string
  customerName: string
  createdAt: string
  subscriptionTier: string
  country: string
  paymentProvider: string
}

interface AnalyticsData {
  totalRevenue: number
  monthlyRevenue: number
  totalTransactions: number
  successfulPayments: number
  failedPayments: number
  averageOrderValue: number
  revenueGrowth: number
  userGrowth: number
  conversionRate: number
  churnRate: number
  payments: PaymentData[]
  revenueByPeriod: any[]
  paymentsByMethod: any[]
  subscriptionDistribution: any[]
  geographicDistribution: any[]
  userStats?: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    subscriptionDistribution: any[]
  }
}

export default function AdminAnalyticsPage() {
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")
  const [selectedCountry] = useState("all")

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeframe: selectedPeriod,
        ...(selectedPaymentMethod !== "all" && { paymentMethod: selectedPaymentMethod }),
        ...(selectedCountry !== "all" && { country: selectedCountry }),
      })

      const response = await apiClient.get(`/admin/analytics?${params}`)
      if ((response.data as any)?.success) {
        setAnalyticsData((response.data as any).data)
      } else {
        throw new Error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error(t("Erreur lors du chargement des données", "Error loading data"))
      // Set empty data structure on error
      setAnalyticsData({
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        failedPayments: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        userGrowth: 0,
        conversionRate: 0,
        churnRate: 0,
        payments: [],
        revenueByPeriod: [],
        paymentsByMethod: [],
        subscriptionDistribution: [],
        geographicDistribution: [],
        userStats: {
          totalUsers: 0,
          newUsers: 0,
          activeUsers: 0,
          subscriptionDistribution: []
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
    toast.success(t("Données actualisées", "Data refreshed"))
  }

  const exportData = () => {
    // Implementation for data export
    toast.success(t("Export en cours...", "Exporting data..."))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("Chargement des analytics...", "Loading analytics...")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("Analytics Financières", "Financial Analytics")}
            </h1>
            <p className="text-muted-foreground">
              {t("Tableau de bord financier en temps réel", "Real-time financial dashboard")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t("Actualiser", "Refresh")}
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            {t("Exporter", "Export")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("Filtres", "Filters")}:</span>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t("7 jours", "7 days")}</SelectItem>
            <SelectItem value="30d">{t("30 jours", "30 days")}</SelectItem>
            <SelectItem value="90d">{t("90 jours", "90 days")}</SelectItem>
            <SelectItem value="1y">{t("1 an", "1 year")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("Méthode de paiement", "Payment method")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Toutes les méthodes", "All methods")}</SelectItem>
            <SelectItem value="card">{t("Carte bancaire", "Credit card")}</SelectItem>
            <SelectItem value="mobile_money">{t("Mobile Money", "Mobile Money")}</SelectItem>
            <SelectItem value="orange_money">{t("Orange Money", "Orange Money")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Revenus totaux", "Total Revenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalRevenue.toLocaleString()} FCFA
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analyticsData?.revenueGrowth}% {t("ce mois", "this month")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Transactions", "Transactions")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalTransactions.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {analyticsData?.successfulPayments} {t("réussies", "successful")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Panier moyen", "Average Order")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.averageOrderValue.toFixed(2)} FCFA
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5.2% {t("vs mois dernier", "vs last month")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Taux de conversion", "Conversion Rate")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.conversionRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -0.3% {t("vs mois dernier", "vs last month")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">{t("Paiements", "Payments")}</TabsTrigger>
          <TabsTrigger value="revenue">{t("Revenus", "Revenue")}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t("Abonnements", "Subscriptions")}</TabsTrigger>
          <TabsTrigger value="geography">{t("Géographie", "Geography")}</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {t("Méthodes de paiement", "Payment Methods")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {analyticsData?.paymentsByMethod && analyticsData.paymentsByMethod.length > 0 ? (
                    <Pie
                      data={{
                        labels: analyticsData.paymentsByMethod.map(method => method.method),
                        datasets: [
                          {
                            data: analyticsData.paymentsByMethod.map(method => method.count),
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: [
                              'rgba(59, 130, 246, 1)',
                              'rgba(16, 185, 129, 1)',
                              'rgba(245, 158, 11, 1)',
                              'rgba(239, 68, 68, 1)',
                            ],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const method = analyticsData.paymentsByMethod[context.dataIndex];
                                return `${context.label}: ${method.count} (${method.percentage.toFixed(1)}%)`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      {t("Aucune donnée de paiement disponible", "No payment data available")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t("Statut des paiements", "Payment Status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{t("Réussis", "Successful")}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{analyticsData?.successfulPayments}</div>
                      <div className="text-xs text-muted-foreground">
                        {((analyticsData?.successfulPayments || 0) / (analyticsData?.totalTransactions || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">{t("Échoués", "Failed")}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{analyticsData?.failedPayments}</div>
                      <div className="text-xs text-muted-foreground">
                        {((analyticsData?.failedPayments || 0) / (analyticsData?.totalTransactions || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Paiements récents", "Recent Payments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t("ID", "ID")}</th>
                      <th className="text-left p-2">{t("Client", "Customer")}</th>
                      <th className="text-left p-2">{t("Montant", "Amount")}</th>
                      <th className="text-left p-2">{t("Méthode", "Method")}</th>
                      <th className="text-left p-2">{t("Statut", "Status")}</th>
                      <th className="text-left p-2">{t("Date", "Date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-2 font-mono text-xs">{payment.id}</td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{payment.customerName}</div>
                            <div className="text-xs text-muted-foreground">{payment.customerEmail}</div>
                          </div>
                        </td>
                        <td className="p-2 font-bold">{payment.amount} FCFA</td>
                        <td className="p-2">
                          <Badge variant="outline">{payment.method}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={payment.status === 'succeeded' ? 'default' : 'destructive'}
                            className={payment.status === 'succeeded' ? 'bg-green-500' : ''}
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">
                          {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                {t("Évolution des revenus", "Revenue Evolution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {analyticsData?.revenueByPeriod && analyticsData.revenueByPeriod.length > 0 ? (
                  <Line
                    data={{
                      labels: analyticsData.revenueByPeriod.map(item =>
                        format(new Date(item.date), 'dd/MM')
                      ),
                      datasets: [
                        {
                          label: t('Revenus', 'Revenue'),
                          data: analyticsData.revenueByPeriod.map(item => item.revenue),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: t('Évolution des revenus', 'Revenue Evolution'),
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return value + ' FCFA';
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {t("Aucune donnée de revenus disponible", "No revenue data available")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData?.subscriptionDistribution.map((sub) => (
              <Card key={sub.tier}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{sub.tier}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sub.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {sub.revenue.toLocaleString()} FCFA {t("revenus", "revenue")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscription Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("Distribution des abonnements", "Subscription Distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {analyticsData?.subscriptionDistribution && analyticsData.subscriptionDistribution.length > 0 ? (
                  <Bar
                    data={{
                      labels: analyticsData.subscriptionDistribution.map(sub => sub.tier),
                      datasets: [
                        {
                          label: t('Nombre d\'utilisateurs', 'Number of Users'),
                          data: analyticsData.subscriptionDistribution.map(sub => sub.count),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderColor: 'rgba(59, 130, 246, 1)',
                          borderWidth: 1,
                        },
                        {
                          label: t('Revenus (FCFA)', 'Revenue (FCFA)'),
                          data: analyticsData.subscriptionDistribution.map(sub => sub.revenue),
                          backgroundColor: 'rgba(16, 185, 129, 0.8)',
                          borderColor: 'rgba(16, 185, 129, 1)',
                          borderWidth: 1,
                          yAxisID: 'y1',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index' as const,
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: t('Utilisateurs et revenus par tier d\'abonnement', 'Users and Revenue by Subscription Tier'),
                        },
                      },
                      scales: {
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: t('Tier d\'abonnement', 'Subscription Tier')
                          }
                        },
                        y: {
                          type: 'linear' as const,
                          display: true,
                          position: 'left' as const,
                          title: {
                            display: true,
                            text: t('Nombre d\'utilisateurs', 'Number of Users')
                          }
                        },
                        y1: {
                          type: 'linear' as const,
                          display: true,
                          position: 'right' as const,
                          title: {
                            display: true,
                            text: t('Revenus (FCFA)', 'Revenue (FCFA)')
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {t("Aucune donnée d'abonnement disponible", "No subscription data available")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("Distribution géographique", "Geographic Distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.geographicDistribution.map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{country.count} {t("utilisateurs", "users")}</div>
                      <div className="text-sm text-muted-foreground">{country.revenue.toLocaleString()} FCFA</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
