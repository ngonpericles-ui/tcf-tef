"use client"

import { useState } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/components/language-provider"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Eye,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Lock,
  CreditCard,
  HelpCircle,
  FileText,
  Calendar,
  Euro,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { lang, setLang } = useLang()
  const [theme, setTheme] = useState("dark")
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: false,
  })
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    progressVisible: false,
    achievementsVisible: true,
  })
  const [sound, setSound] = useState(true)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const invoices = [
    {
      id: "INV-2024-001",
      date: "2024-01-15",
      amount: 29.99,
      plan: "Premium",
      status: "paid",
      downloadUrl: "#",
    },
    {
      id: "INV-2023-012",
      date: "2023-12-15",
      amount: 19.99,
      plan: "Essential",
      status: "paid",
      downloadUrl: "#",
    },
    {
      id: "INV-2023-011",
      date: "2023-11-15",
      amount: 19.99,
      plan: "Essential",
      status: "paid",
      downloadUrl: "#",
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)]">
              {t("Paramètres", "Settings")}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {t("Personnalisez votre expérience d'apprentissage", "Customize your learning experience")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("Compte", "Account")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("Prénom", "First Name")}</Label>
                  <Input id="firstName" placeholder={t("Votre prénom", "Your first name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("Nom", "Last Name")}</Label>
                  <Input id="lastName" placeholder={t("Votre nom", "Your last name")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Téléphone", "Phone")}</Label>
                <Input id="phone" placeholder="+33 6 12 34 56 78" />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t("Apparence", "Appearance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <div>
                    <div className="font-medium">{t("Thème", "Theme")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Choisissez votre thème préféré", "Choose your preferred theme")}
                    </div>
                  </div>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("Clair", "Light")}</SelectItem>
                    <SelectItem value="dark">{t("Sombre", "Dark")}</SelectItem>
                    <SelectItem value="system">{t("Système", "System")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{t("Langue", "Language")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Langue de l'interface", "Interface language")}
                    </div>
                  </div>
                </div>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t("Notifications", "Notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{t("Notifications par email", "Email notifications")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Recevez des mises à jour par email", "Receive updates via email")}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{t("Notifications push", "Push notifications")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Notifications sur votre appareil", "Notifications on your device")}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <div>
                    <div className="font-medium">{t("Sons", "Sounds")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Sons des notifications et interactions", "Notification and interaction sounds")}
                    </div>
                  </div>
                </div>
                <Switch checked={sound} onCheckedChange={setSound} />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t("Confidentialité", "Privacy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{t("Profil public", "Public profile")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Permettre aux autres de voir votre profil", "Allow others to see your profile")}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{t("Progrès visibles", "Visible progress")}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t("Partager vos statistiques de progrès", "Share your progress statistics")}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={privacy.progressVisible}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, progressVisible: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t("Sécurité", "Security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Lock className="w-4 h-4 mr-2" />
                {t("Changer le mot de passe", "Change password")}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Shield className="w-4 h-4 mr-2" />
                {t("Authentification à deux facteurs", "Two-factor authentication")}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                {t("Télécharger mes données", "Download my data")}
              </Button>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t("Facturation", "Billing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/abonnement">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t("Gérer l'abonnement", "Manage subscription")}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowInvoiceHistory(!showInvoiceHistory)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t("Historique des factures", "Billing history")}
              </Button>

              {showInvoiceHistory && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                    {t("Vos factures", "Your invoices")}
                  </h4>
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{invoice.id}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(invoice.date)}
                            <span>•</span>
                            <span>{invoice.plan}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium text-sm flex items-center gap-1">
                            <Euro className="w-3 h-3" />
                            {invoice.amount}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            {t("Payé", "Paid")}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("Aucune facture disponible", "No invoices available")}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {t("Support", "Support")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <HelpCircle className="w-4 h-4 mr-2" />
                {t("Centre d'aide", "Help center")}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Mail className="w-4 h-4 mr-2" />
                {t("Contacter le support", "Contact support")}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                {t("Zone de danger", "Danger zone")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                {t("Supprimer mon compte", "Delete my account")}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline">{t("Annuler", "Cancel")}</Button>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              {t("Sauvegarder", "Save changes")}
            </Button>
          </div>
        </div>
      </main>
    </PageShell>
  )
}
