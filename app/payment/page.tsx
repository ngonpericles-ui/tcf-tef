"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageShell from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Smartphone, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react"
import { useLang } from "@/components/language-provider"

type PaymentMethod = "card" | "mobile"
type CardBrand = "visa" | "mastercard" | "amex" | "discover" | null
type MobileOperator = "mtn" | "orange" | null

export default function PaymentPage() {
  const { lang } = useLang()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showCVV, setShowCVV] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardBrand, setCardBrand] = useState<CardBrand>(null)
  const [cardHolder, setCardHolder] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [country, setCountry] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Mobile money state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [mobileOperator, setMobileOperator] = useState<MobileOperator>(null)
  const [accountName, setAccountName] = useState("")

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    const stored = localStorage.getItem("selectedPlan")
    if (stored) {
      setSelectedPlan(JSON.parse(stored))
    } else {
      router.push("/abonnement")
    }
  }, [router])

  const detectCardBrand = (number: string): CardBrand => {
    const cleaned = number.replace(/\s/g, "")
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned) || /^4/.test(cleaned)) return "visa"
    if (
      /^(5[1-5][0-9]{14}|2(2[2-9][0-9]{12}|[3-6][0-9]{13}|7[01][0-9]{12}|720[0-9]{12}))$/.test(cleaned) ||
      /^5[1-5]/.test(cleaned) ||
      /^2[2-7]/.test(cleaned)
    )
      return "mastercard"
    if (/^3[47][0-9]{13}$/.test(cleaned) || /^3[47]/.test(cleaned)) return "amex"
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned) || /^6(?:011|5)/.test(cleaned)) return "discover"
    return null
  }

  // Mobile operator detection
  const detectMobileOperator = (number: string): MobileOperator => {
    const cleaned = number.replace(/\s/g, "")
    if (/^(\+225|225)?[0-9]{8}$/.test(cleaned)) {
      // MTN prefixes in Côte d'Ivoire
      if (/^(\+225|225)?(05|06|07|08|09)/.test(cleaned)) return "mtn"
      // Orange prefixes
      if (/^(\+225|225)?(01|02|03|04)/.test(cleaned)) return "orange"
    }
    return null
  }

  // Format card number
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const brand = detectCardBrand(cleaned)
    setCardBrand(brand)

    let formatted = cleaned
    if (brand === "amex") {
      formatted = cleaned.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3")
    } else {
      formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ")
    }

    setCardNumber(formatted.slice(0, brand === "amex" ? 17 : 19))
  }

  // Format expiry
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const formatted = cleaned.replace(/(\d{2})(\d{2})/, "$1/$2")
    setExpiry(formatted.slice(0, 5))
  }

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    // Only auto-detect if no operator is manually selected
    if (!mobileOperator) {
      const operator = detectMobileOperator(cleaned)
      setMobileOperator(operator)
    }
    setPhoneNumber(cleaned.slice(0, 10))
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      const paymentData = {
        id: `PAY-${Date.now()}`,
        plan: selectedPlan,
        method: paymentMethod,
        status: "Active",
        createdAt: new Date().toISOString(),
        ...(paymentMethod === "card"
          ? {
              cardBrand,
              lastFour: cardNumber.slice(-4),
              cardHolder,
            }
          : {
              operator: mobileOperator,
              phone: phoneNumber.slice(-4),
            }),
        transactionId: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
      }

      const existingHistory = JSON.parse(localStorage.getItem("subscriptionHistory") || "[]")
      existingHistory.unshift(paymentData)
      localStorage.setItem("subscriptionHistory", JSON.stringify(existingHistory))

      localStorage.setItem("paymentConfirmation", JSON.stringify(paymentData))
      router.push("/payment/confirmation")
    }, 2000)
  }

  const isFormValid = () => {
    if (paymentMethod === "card") {
      return cardNumber.length >= 15 && cardHolder && expiry.length === 5 && cvv.length >= 3 && country
    } else {
      return phoneNumber.length >= 8 && mobileOperator
    }
  }

  if (!selectedPlan) return null

  const cardBrandIcons = {
    visa: { bg: "bg-blue-600", text: "VISA", color: "text-white" },
    mastercard: { bg: "bg-red-600", text: "MC", color: "text-white" },
    amex: { bg: "bg-green-600", text: "AMEX", color: "text-white" },
    discover: { bg: "bg-orange-600", text: "DISC", color: "text-white" },
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("Retour", "Back")}
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{t("Paiement", "Payment")}</h1>
          <p className="text-muted-foreground">{t("Finalisez votre abonnement", "Complete your subscription")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Toggle */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Méthode de paiement", "Payment Method")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === "card"
                        ? "border-[#007BFF] bg-[#007BFF]/10 scale-105"
                        : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="text-foreground font-medium">{t("Carte bancaire", "Credit/Debit Card")}</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mobile")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-300 ${
                      paymentMethod === "mobile"
                        ? "border-[#007BFF] bg-[#007BFF]/10 scale-105"
                        : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="text-foreground font-medium">{t("Mobile Money", "Mobile Money")}</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Card Payment Form */}
            {paymentMethod === "card" && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t("Informations de carte", "Card Information")}
                  </CardTitle>
                  <div className="flex gap-3 mt-4">
                    {Object.entries(cardBrandIcons).map(([brand, style]) => (
                      <div
                        key={brand}
                        className={`w-16 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          cardBrand === brand
                            ? `${style.bg} border-foreground scale-110 shadow-lg ${style.color}`
                            : "border-gray-200 dark:border-gray-700 bg-muted text-muted-foreground opacity-30"
                        }`}
                      >
                        {style.text}
                      </div>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("Numéro de carte", "Card Number")}
                    </label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => formatCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("Nom du titulaire", "Cardholder Name")}
                    </label>
                    <Input
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="John Doe"
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("Expiration", "Expiry")}
                      </label>
                      <Input
                        value={expiry}
                        onChange={(e) => formatExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CVV/CVC</label>
                      <div className="relative">
                        <Input
                          type={showCVV ? "text" : "password"}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                          placeholder="123"
                          className="bg-input border-gray-200 dark:border-gray-700 text-foreground pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCVV(!showCVV)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t("Pays", "Country")}</label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                          <SelectValue placeholder={t("Sélectionner", "Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ci">Côte d'Ivoire</SelectItem>
                          <SelectItem value="sn">Sénégal</SelectItem>
                          <SelectItem value="ml">Mali</SelectItem>
                          <SelectItem value="bf">Burkina Faso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("Code postal", "ZIP Code")}
                      </label>
                      <Input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Money Form */}
            {paymentMethod === "mobile" && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    {t("Mobile Money", "Mobile Money")}
                  </CardTitle>
                  <div className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      {t("Sélectionnez votre opérateur", "Select your operator")}
                    </p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setMobileOperator("mtn")}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                          mobileOperator === "mtn"
                            ? "border-yellow-500 bg-yellow-500/20 scale-105 shadow-lg"
                            : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground"
                        }`}
                      >
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          MTN
                        </div>
                        <span className="text-foreground font-medium">MTN MoMo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileOperator("orange")}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                          mobileOperator === "orange"
                            ? "border-orange-500 bg-orange-500/20 scale-105 shadow-lg"
                            : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground"
                        }`}
                      >
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          OM
                        </div>
                        <span className="text-foreground font-medium">Orange Money</span>
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("Numéro de téléphone", "Phone Number")}
                    </label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => formatPhoneNumber(e.target.value)}
                      placeholder={
                        mobileOperator === "mtn"
                          ? "05 12 34 56 78"
                          : mobileOperator === "orange"
                            ? "01 23 45 67 89"
                            : t("Sélectionnez d'abord un opérateur", "Select an operator first")
                      }
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                    {mobileOperator && (
                      <p className="text-sm text-green-400 mt-1">
                        {t(
                          `Opérateur sélectionné: ${mobileOperator.toUpperCase()}`,
                          `Selected operator: ${mobileOperator.toUpperCase()}`,
                        )}
                      </p>
                    )}
                    {!mobileOperator && (
                      <p className="text-sm text-amber-400 mt-1">
                        {t(
                          "Veuillez d'abord sélectionner un opérateur ci-dessus",
                          "Please select an operator above first",
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("Nom du compte (optionnel)", "Account Name (optional)")}
                    </label>
                    <Input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-gray-200 dark:border-gray-700 sticky top-6">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Résumé de commande", "Order Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Plan", "Plan")}</span>
                  <span className="text-foreground font-medium">{selectedPlan.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Durée", "Duration")}</span>
                  <span className="text-foreground">{selectedPlan.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("Sous-total", "Subtotal")}</span>
                  <span className="text-foreground">{selectedPlan.price.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("TVA (18%)", "Tax (18%)")}</span>
                  <span className="text-foreground">{Math.round(selectedPlan.price * 0.18).toLocaleString()} CFA</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">{t("Total", "Total")}</span>
                  <span className="text-foreground">{Math.round(selectedPlan.price * 1.18).toLocaleString()} CFA</span>
                </div>

                <Badge className="bg-[#2ECC71] text-black w-full justify-center">
                  <Shield className="w-4 h-4 mr-2" />
                  1‑day free trial
                </Badge>

                <Button
                  onClick={handlePayment}
                  disabled={!isFormValid() || isProcessing}
                  className="w-full bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black font-semibold transition-all duration-300"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      {t("Traitement...", "Processing...")}
                    </div>
                  ) : (
                    t("Confirmer et payer", "Confirm & Pay")
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("Paiement sécurisé. Annulable à tout moment.", "Secure payment. Cancel anytime.")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </PageShell>
  )
}
