"use client"

import Image from "next/image"
import Link from "next/link"
import { Shield, Eye, Cookie, FileText, Lock, CheckCircle2, Globe, Clock, Users } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function PrivacyPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1600&auto=format&fit=crop"
            alt="Data security"
            fill
            priority
            className="object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto max-w-5xl px-4 md:px-8 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" /> {t("Politique de confidentialité", "Privacy Policy")}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t("TCF/TEF Politique de confidentialité", "TCF/TEF Privacy Policy")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t(
                "Comment nous collectons, utilisons, stockons et protégeons vos données à travers notre suite de préparation fidèle à l'examen, incluant les tests adaptatifs et le feedback assisté par IA.",
                "How we collect, use, store, and protect your data across our exam‑faithful preparation suite, including adaptive testing and AI‑assisted feedback."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("Protection des données", "Data Protection")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("Conformité GDPR et CCPA avec chiffrement de bout en bout", "GDPR & CCPA compliant with end-to-end encryption")}
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("Transparence totale", "Total Transparency")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("Contrôle complet de vos données et accès", "Complete control over your data and access")}
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("Sécurité renforcée", "Enhanced Security")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("Infrastructure sécurisée avec audits réguliers", "Secure infrastructure with regular audits")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="grid md:grid-cols-[300px_1fr] gap-12">
              {/* Sidebar Navigation */}
              <aside className="md:sticky md:top-24 h-max">
                <nav className="space-y-2">
                  <a href="#scope" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Portée", "Scope")}</span>
                  </a>
                  <a href="#data-collection" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Collecte de données", "Data Collection")}</span>
                  </a>
                  <a href="#data-usage" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Utilisation des données", "Data Usage")}</span>
                  </a>
                  <a href="#data-sharing" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Partage", "Sharing")}</span>
                  </a>
                  <a href="#security" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Sécurité", "Security")}</span>
                  </a>
                  <a href="#cookies" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Cookie className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Cookies", "Cookies")}</span>
                  </a>
                  <a href="#rights" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Vos droits", "Your Rights")}</span>
                  </a>
                  <a href="#retention" className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-accent transition-colors">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{t("Conservation", "Retention")}</span>
                  </a>
                </nav>
              </aside>

              {/* Main Content */}
              <article className="space-y-8">
                <section id="scope" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Portée", "Scope")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                                          "Cette Politique s'applique aux sites web et applications TCF/TEF. Nous respectons les lois de protection des données applicables (ex: GDPR) et suivons les principes de confidentialité dès la conception, incluant la minimisation des données, le chiffrement et les contrôles d'accès basés sur les rôles.",
                    "This Policy applies to TCF/TEF websites and apps. We comply with applicable data protection laws (e.g., GDPR) and follow privacy‑by‑design principles including data minimization, encryption, and role‑based access controls."
                    )}
                  </p>
                </section>

                <section id="data-collection" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Données que nous collectons", "Data We Collect")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-medium">{t("Données de compte", "Account data")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Nom, email, préférences", "Name, email, preferences")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-medium">{t("Données d'apprentissage", "Learning data")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Items tentés, scores, temps de travail", "Items attempted, scores, time‑on‑task")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-medium">{t("Médias uploadés", "Media you upload")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Réponses écrites, audio pour l'oral", "Writing responses; audio for speaking")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-medium">{t("Données d'usage", "Device and usage data")}</h4>
                          <p className="text-sm text-muted-foreground">{t("IP, type d'appareil, logs", "IP, device type, logs")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="data-usage" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Comment nous utilisons vos données", "How We Use Your Data")}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{t("Livrer des simulations fidèles à l'examen et de la pratique", "Deliver exam‑faithful simulations and practice")}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{t("Fournir un feedback écrit/oral assisté par IA avec indicateurs de confiance", "Provide AI‑assisted writing/speaking feedback with confidence indicators")}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{t("Personnaliser les recommandations basées sur la performance", "Personalize recommendations based on performance")}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{t("Améliorer la calibration des items et la performance", "Improve item calibration and platform performance")}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="data-sharing" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Partage", "Sharing")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Nous ne vendons pas de données personnelles. Nous partageons des données avec des processeurs fournissant des services d'infrastructure, d'analyse ou de modération sous des contrats stricts. Nous pouvons divulguer des informations pour respecter les demandes légales.",
                      "We do not sell personal data. We share data with processors providing infrastructure, analytics, or moderation services under strict contracts. We may disclose information to comply with legal requests."
                    )}
                  </p>
                </section>

                <section id="security" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Sécurité", "Security")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Nous chiffrons les données en transit et au repos, restreignons l'accès par rôle et maintenons des journaux d'audit des opérations sensibles. L'audio brut est traité de manière éphémère quand c'est possible ; le stockage persistant nécessite un consentement explicite et une rétention limitée.",
                      "We encrypt data in transit and at rest, restrict access by role, and maintain audit logs of sensitive operations. Raw audio is processed ephemerally when feasible; persistent storage requires explicit consent and limited retention."
                    )}
                  </p>
                </section>

                <section id="cookies" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Cookies et technologies similaires", "Cookies & Similar Technologies")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Nous utilisons des cookies essentiels pour l'authentification et l'intégrité de session, et des cookies d'analyse optionnels. Vous pouvez contrôler les cookies dans votre navigateur. Voir notre Avis sur les cookies pour plus de détails.",
                      "We use essential cookies for authentication and session integrity, and optional analytics cookies. You may control cookies in your browser. See our Cookie Notice for details."
                    )}
                  </p>
                </section>

                <section id="rights" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Vos droits", "Your Rights")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Selon votre juridiction, vous pouvez demander l'accès, la correction, la suppression ou la portabilité de vos données, et vous opposer au traitement. Contactez privacy@tcf-tef-prep.com.",
                      "Depending on your jurisdiction, you may request access, correction, deletion, or portability of your data, and object to processing. Contact privacy@tcf-tef-prep.com."
                    )}
                  </p>
                </section>

                <section id="retention" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Conservation", "Retention")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Nous conservons les données seulement aussi longtemps que nécessaire pour les finalités décrites et pour respecter les obligations légales. Les analyses agrégées peuvent être conservées pour soutenir la calibration et la recherche.",
                      "We retain data only as long as necessary for the purposes described and to comply with legal obligations. Aggregated analytics may be retained to support calibration and research."
                    )}
                  </p>
                </section>

                <section className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("Modifications", "Changes")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Nous mettrons à jour cette Politique à mesure que nos services évoluent. Les changements importants seront communiqués dans l'application ou par email.",
                      "We will update this Policy as our services evolve. Material changes will be communicated in‑app or by email."
                    )}
                  </p>
                </section>

                <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      {t("Dernière mise à jour", "Last updated")}: 2025‑08‑01
                    </div>
                    <div className="text-sm">
                      {t("Voir aussi nos", "See also our")} <Link className="underline hover:text-foreground transition-colors" href="/terms">{t("Conditions générales", "Terms & Conditions")}</Link>.
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

