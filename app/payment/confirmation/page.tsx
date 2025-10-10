"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageShell from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, ArrowLeft, Calendar, CreditCard, Smartphone, FileText } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function PaymentConfirmationPage() {
  const { lang } = useLang()
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<any>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    const stored = localStorage.getItem("paymentConfirmation")
    if (stored) {
      setPaymentData(JSON.parse(stored))
      setShowAnimation(true)
    } else {
      router.push("/abonnement")
    }
  }, [router])

  const generatePDF = () => {
    const invoiceContent = `
FACTURE / INVOICE
TCF-TEF Platform
${t("Numéro de facture", "Invoice Number")}: ${paymentData.transactionId}
${t("Date", "Date")}: ${new Date(paymentData.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}

${t("FACTURATION À", "BILL TO")}:
${paymentData.cardHolder || t("Utilisateur", "User")}

${t("DÉTAILS", "DETAILS")}:
${t("Abonnement", "Subscription")} ${paymentData.plan.plan} - ${paymentData.plan.period}
${t("Sous-total", "Subtotal")}: ${paymentData.plan.price.toLocaleString()} CFA
${t("TVA (18%)", "Tax (18%)")}: ${Math.round(paymentData.plan.price * 0.18).toLocaleString()} CFA
${t("TOTAL", "TOTAL")}: ${Math.round(paymentData.plan.price * 1.18).toLocaleString()} CFA

${t("Méthode de paiement", "Payment Method")}: ${paymentData.method === "card" ? `${paymentData.cardBrand?.toUpperCase()} •••• ${paymentData.lastFour}` : `${paymentData.operator?.toUpperCase()} •••• ${paymentData.phone}`}

${t("Merci pour votre confiance!", "Thank you for your trust!")}
${t("Support", "Support")}: support@tcf-tef.com
    `

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(invoiceContent))
    element.setAttribute("download", `facture-${paymentData.transactionId}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!paymentData) return null

  const startDate = new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")
  const endDate = new Date(
    Date.now() +
      (paymentData.plan.period === "yearly" ? 365 : paymentData.plan.period === "quarterly" ? 90 : 30) *
        24 *
        60 *
        60 *
        1000,
  ).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")

  return (
    <PageShell>
      <main className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-6 transition-all duration-1000 ${showAnimation ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-180"}`}
          >
            <CheckCircle className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("Paiement confirmé !", "Payment Confirmed!")}</h1>
          <p className="text-muted-foreground text-lg">
            {t("Votre abonnement a été activé avec succès", "Your subscription has been activated successfully")}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">{t("Essai gratuit actif", "Free trial active")}</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Détails du paiement", "Payment Details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">{t("Plan", "Plan")}</span>
                  <div className="text-foreground font-medium">{paymentData.plan.plan}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("Durée", "Duration")}</span>
                  <div className="text-foreground font-medium">{paymentData.plan.period}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("Montant", "Amount")}</span>
                  <div className="text-foreground font-medium">
                    {Math.round(paymentData.plan.price * 1.18).toLocaleString()} CFA
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("ID Transaction", "Transaction ID")}</span>
                  <div className="text-foreground font-medium font-mono text-sm">{paymentData.transactionId}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {t("Détails de l'abonnement", "Subscription Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">{t("Date de début", "Start Date")}</span>
                  <div className="text-foreground font-medium">{startDate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("Date de fin", "End Date")}</span>
                  <div className="text-foreground font-medium">{endDate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("Méthode de paiement", "Payment Method")}</span>
                  <div className="text-foreground font-medium flex items-center">
                    {paymentData.method === "card" ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {paymentData.cardBrand?.toUpperCase()} •••• {paymentData.lastFour}
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        {paymentData.operator?.toUpperCase()} •••• {paymentData.phone}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">{t("Statut", "Status")}</span>
                  <div className="text-[#2ECC71] font-medium flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    {t("Actif", "Active")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t("Aperçu de la facture", "Invoice Preview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background border border-gray-200 dark:border-gray-700 p-8 rounded-lg">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-[#007BFF]">TCF-TEF Platform</h3>
                    <p className="text-muted-foreground mt-1">{t("Plateforme d'apprentissage", "Learning Platform")}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-lg font-semibold text-foreground">{t("FACTURE", "INVOICE")}</h4>
                    <p className="text-muted-foreground">#{paymentData.transactionId}</p>
                    <p className="text-muted-foreground">
                      {new Date(paymentData.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h5 className="font-semibold mb-2 text-foreground">{t("FACTURATION À", "BILL TO")}:</h5>
                  <p className="text-foreground">{paymentData.cardHolder || t("Utilisateur", "User")}</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-foreground">
                      {t("Abonnement", "Subscription")} {paymentData.plan.plan}
                    </span>
                    <span className="text-foreground">{paymentData.plan.price.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-foreground">{t("TVA (18%)", "Tax (18%)")}</span>
                    <span className="text-foreground">
                      {Math.round(paymentData.plan.price * 0.18).toLocaleString()} CFA
                    </span>
                  </div>
                  <div className="flex justify-between py-4 font-bold text-lg border-t-2 border-gray-200 dark:border-gray-700 mt-4">
                    <span className="text-foreground">{t("TOTAL", "TOTAL")}</span>
                    <span className="text-foreground">
                      {Math.round(paymentData.plan.price * 1.18).toLocaleString()} CFA
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-muted-foreground">
                  <p className="text-sm">{t("Merci pour votre confiance!", "Thank you for your trust!")}</p>
                  <p className="text-sm">Support: support@tcf-tef.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={generatePDF}
              className="flex-1 bg-card hover:bg-accent text-foreground border border-gray-200 dark:border-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("Télécharger la facture", "Download Invoice")}
            </Button>
            <Button onClick={() => router.push("/")} className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour au tableau de bord", "Back to Dashboard")}
            </Button>
          </div>
        </div>
      </main>
    </PageShell>
  )
}
