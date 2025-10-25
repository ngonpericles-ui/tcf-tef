"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { ArrowLeft, Send, Shield, Crown, User, Users } from "lucide-react"

export default function BulkMessagingPage() {
  return (
    <Suspense fallback={null}>
      <BulkMessagingPageInner />
    </Suspense>
  )
}

type Role = "junior" | "content" | "senior" | "admin"

function BulkMessagingPageInner() {
  const { t } = useLanguage()
  const router = useRouter()
  const params = useSearchParams()

  const [role, setRole] = useState<Role>("junior")
  const [sender, setSender] = useState({ name: "", email: "", role: "junior" as Role })
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [sendAsNotification, setSendAsNotification] = useState(true)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  // Mock sender info (would come from auth/session in a real app)
  useEffect(() => {
    const roleParam = (params.get("role") || localStorage.getItem("managerRole") || "junior").toLowerCase() as Role
    const normalized: Role = ["junior", "content", "senior", "admin"].includes(roleParam) ? roleParam : "junior"
    setRole(normalized)
    const name = localStorage.getItem("managerName") || (normalized === "senior" ? "Aïcha Benali" : "Marie Dubois")
    const email = localStorage.getItem("managerEmail") || (normalized === "senior" ? "aicha@tcf-tef.com" : "marie@tcf-tef.com")
    setSender({ name, email, role: normalized })
  }, [params])

  const getAvailableLevels = (r: Role) => (r === "junior" ? ["A1", "A2", "B1"] : ["A1", "A2", "B1", "B2", "C1", "C2"])
  const getAvailableSubscriptions = (r: Role) =>
    r === "junior" ? ["Free", "Essential"] : ["Free", "Essential", "Premium", "Pro+"]

  const roleInfo = useMemo(() => {
    switch (role) {
      case "senior":
      case "admin":
        return { label: t("Senior Manager", "Senior Manager"), color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Crown }
      case "content":
        return { label: t("Content Manager", "Content Manager"), color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Shield }
      default:
        return { label: t("Junior Manager", "Junior Manager"), color: "bg-green-500/10 text-green-400 border-green-500/20", icon: User }
    }
  }, [role, t])

  const toggleLevel = (level: string) =>
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))

  const toggleSubscription = (sub: string) =>
    setSelectedSubscriptions((prev) => (prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]))

  const handleSend = () => {
    // Store notification payload to localStorage for demo purposes
    const payload = {
      id: Date.now(),
      type: sendAsNotification ? "notification" : "message",
      title,
      message,
      filters: { levels: selectedLevels, subscriptions: selectedSubscriptions },
      sender,
      createdAt: new Date().toISOString(),
    }
    const key = "user_notifications"
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    existing.push(payload)
    localStorage.setItem(key, JSON.stringify(existing))
    // Reset
    setTitle("")
    setMessage("")
    setSelectedLevels([])
    setSelectedSubscriptions([])
    alert(t("Message envoyé et enregistré pour notification.", "Message sent and stored for notification."))
  }

  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("Message groupé", "Bulk Message")}</h1>
              <p className="text-muted-foreground">{t("Envoyez un message aux étudiants par filtres", "Send a message to students using filters")}</p>
            </div>
          </div>
          <Badge variant="outline" className={roleInfo.color}>
            <RoleIcon className="w-4 h-4 mr-2" />
            {roleInfo.label}
          </Badge>
        </div>

        {/* Sender card */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Informations de l'expéditeur", "Sender Information")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("Ces informations apparaîtront dans la notification", "These details will appear in the notification")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-foreground font-semibold">{sender.name}</div>
                <div className="text-muted-foreground text-sm">{sender.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Destinataires", "Recipients")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {role === "junior"
                ? t("Limité aux niveaux A1–B1 et aux plans Free/Essential", "Limited to A1–B1 levels and Free/Essential plans")
                : t("Aucun niveau/abonnement limité", "No level/subscription limitations")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("Niveaux", "Levels")}</label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableLevels(role).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedLevels.includes(lvl)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-input border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("Abonnements", "Subscriptions")}</label>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableSubscriptions(role).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubscription(sub)}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedSubscriptions.includes(sub)
                        ? "bg-green-600 border-green-500 text-white"
                        : "bg-input border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {(selectedLevels.length > 0 || selectedSubscriptions.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedLevels.map((l) => (
                  <Badge key={l} className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {l}
                  </Badge>
                ))}
                {selectedSubscriptions.map((s) => (
                  <Badge key={s} className="bg-green-500/10 text-green-400 border-green-500/20">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Composer */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Composer", "Compose")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("Rédigez le message à envoyer aux étudiants sélectionnés", "Write the message for selected students")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("Titre du message", "Message title")}
              className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
            />
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("Votre message...", "Your message...")}
              rows={6}
              className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
            />

            <label className="flex items-center space-x-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={sendAsNotification}
                onChange={(e) => setSendAsNotification(e.target.checked)}
              />
              <span>{t("Envoyer comme notification", "Send as notification")}</span>
            </label>

            <div className="flex justify-between">
              <div className="flex items-center text-muted-foreground text-sm">
                <Users className="w-4 h-4 mr-2" />
                {t("Destinataires via filtres", "Recipients via filters")}
              </div>
              <Button
                disabled={!title || !message}
                onClick={handleSend}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                {t("Envoyer", "Send")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



