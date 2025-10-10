"use client"

import Image from "next/image"
import Link from "next/link"
import { Shield, Scale, FileText, ChevronRight, CheckCircle2, BookOpen, Gavel, Users, Lock } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function TermsPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  
  const sections = [
    {
      id: "intro",
      title: t("Introduction", "Introduction"),
      content: t("Ces Conditions Générales (\"CG\") régissent votre accès et votre utilisation d'AURA, la plateforme de préparation TCF/TEF augmentée par l'IA. En accédant au Service ou en l'utilisant, vous acceptez d'être lié par ces Conditions.", "These Terms and Conditions (\"Terms\") govern your access to and use of AURA, the AI‑enhanced TCF/TEF preparation platform. By accessing or using the Service, you agree to be bound by these Terms."),
      icon: BookOpen,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "eligibility",
      title: t("Éligibilité & Comptes", "Eligibility & Accounts"),
      content: t("Vous devez avoir au moins 16 ans (ou l'âge requis par votre juridiction) pour créer un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités réalisées sous votre compte.", "You must be at least 16 years old (or the age required by your jurisdiction) to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account."),
      icon: Users,
      color: "from-green-500 to-green-600"
    },
    {
      id: "use",
      title: t("Utilisation autorisée", "Permitted Use"),
      content: t("AURA est fourni à des fins pédagogiques. Vous acceptez de ne pas pratiquer l'ingénierie inverse, l'extraction massive (scraping) ni d'utiliser le Service pour créer des jeux de données ou des modèles concurrents. Vous respecterez les lois, politiques d'examen et standards communautaires applicables.", "AURA is provided for educational purposes. You agree not to reverse engineer, scrape, or use the Service to create competing datasets or models. You will comply with applicable laws, exam policies, and community standards."),
      icon: Shield,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "content",
      title: t("Contenu & Propriété intellectuelle", "Content & Intellectual Property"),
      content: t("Tous les contenus de la plateforme (items, consignes, rubriques, médias, analyses) sont protégés par le droit de la propriété intellectuelle. Vous conservez la propriété de vos contenus envoyés, mais concédez à AURA une licence pour les stocker et les traiter afin de fournir des fonctionnalités telles que le feedback et l'analytique.", "All platform content (items, prompts, rubrics, media, analytics) is protected by intellectual property laws. You retain ownership of submissions you upload, but grant AURA a license to store and process them to provide features such as feedback and analytics."),
      icon: FileText,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "privacy",
      title: t("Confidentialité & Protection des données", "Privacy & Data Protection"),
      content: t("Nous traitons vos données conformément à notre Politique de confidentialité, avec minimisation des données, contrôles d'accès basés sur les rôles, chiffrement en transit et au repos, et consentement explicite pour l'enregistrement persistant de l'audio.", "We process your data in accordance with our Privacy Policy, including data minimization, role‑based access controls, encryption in transit and at rest, and explicit consent for persistent storage of audio."),
      icon: Lock,
      color: "from-indigo-500 to-indigo-600"
    },
    {
      id: "ai",
      title: t("Retour généré par l'IA", "AI‑Generated Feedback"),
      content: t("Le feedback en expression écrite et orale peut être généré à l'aide de l'IA. Nous fournissons des indicateurs de confiance et des citations vers les rubriques et des exemples lorsque pertinent. Les cas à faible confiance peuvent être soumis à une revue humaine.", "Writing and speaking feedback may be generated using AI. We provide confidence indicators and citations to rubrics and exemplars where applicable. Low‑confidence cases may be flagged for human review."),
      icon: Shield,
      color: "from-pink-500 to-pink-600"
    },
    {
      id: "payments",
      title: t("Abonnements & Paiements", "Subscriptions & Payments"),
      content: t("Les frais d'abonnement, les conditions de renouvellement et les délais d'annulation sont indiqués au moment du paiement. Des taxes peuvent s'appliquer. Les remboursements sont traités conformément à notre Politique de remboursement.", "Subscription fees, renewal terms, and cancellation windows are disclosed at checkout. Taxes may apply. Refunds are handled according to our Refund Policy."),
      icon: Scale,
      color: "from-teal-500 to-teal-600"
    },
    {
      id: "prohibited",
      title: t("Comportements interdits", "Prohibited Conduct"),
      content: t("N'essayez pas de compromettre l'intégrité des examens, de partager des contenus protégés par le droit d'auteur sans autorisation, ni de publier des contenus illicites, haineux ou harcelants.", "Do not attempt to compromise exam integrity, share copyrighted materials without authorization, or upload unlawful, hateful, or harassing content."),
      icon: Gavel,
      color: "from-red-500 to-red-600"
    },
    {
      id: "ip",
      title: t("DMCA & Réclamations PI", "DMCA & IP Claims"),
      content: t("Si vous pensez qu'un contenu porte atteinte à vos droits de propriété intellectuelle, contactez notre agent désigné à legal@tcf-tef-prep.com avec les informations nécessaires pour enquête.", "If you believe content infringes your IP, contact our designated agent at legal@tcf-tef-prep.com with sufficient detail for investigation."),
      icon: FileText,
      color: "from-amber-500 to-amber-600"
    },
    {
      id: "termination",
      title: t("Résiliation", "Termination"),
      content: t("Nous pouvons suspendre ou résilier l'accès en cas de violation des présentes Conditions. Vous pouvez supprimer votre compte à tout moment ; nous traiterons les demandes de suppression conformément à notre politique de conservation des données.", "We may suspend or terminate access for violations of these Terms. You may delete your account at any time; we will process deletion requests consistent with our data retention policy."),
      icon: Shield,
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: "disclaimers",
      title: t("Avertissements & Limitation de responsabilité", "Disclaimers & Limitation of Liability"),
      content: t("Le Service est fourni \"en l'état\". Dans la mesure permise par la loi, AURA décline toute garantie et limite sa responsabilité pour les dommages indirects ou consécutifs.", "The Service is provided \"as is\". To the maximum extent permitted by law, AURA disclaims warranties and limits liability for indirect or consequential damages."),
      icon: Scale,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      id: "law",
      title: t("Droit applicable & Litiges", "Governing Law & Disputes"),
      content: t("Ces Conditions sont régies par les lois de votre pays de résidence, sauf disposition locale impérative contraire. Les litiges seront résolus par les juridictions compétentes ou par arbitrage lorsque requis.", "These Terms are governed by the laws of your country of residence unless mandatory local law provides otherwise. Disputes shall be resolved in competent courts or via arbitration where required."),
      icon: Gavel,
      color: "from-violet-500 to-violet-600"
    },
    {
      id: "changes",
      title: t("Modifications des Conditions", "Changes to Terms"),
      content: t("Nous pouvons mettre à jour ces Conditions pour refléter les évolutions du produit ou les exigences légales. Les changements importants seront communiqués dans l'application ou par e‑mail avec leurs dates d'effet.", "We may update these Terms to reflect product changes or legal requirements. Material changes will be communicated in‑app or by email with effective dates."),
      icon: FileText,
      color: "from-rose-500 to-rose-600"
    },
    {
      id: "contact",
      title: t("Contact", "Contact"),
      content: t("Des questions ? Contactez legal@tcf-tef-prep.com.", "Questions? Contact legal@tcf-tef-prep.com."),
      icon: Users,
      color: "from-sky-500 to-sky-600"
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=85&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3"
            alt="Legal documents and scales of justice representing terms and conditions"
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background/80" />
        </div>
        
        <div className="container mx-auto max-w-6xl px-4 md:px-8 py-24 md:py-32 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background/90 backdrop-blur border border-gray-200 dark:border-gray-700 text-sm font-medium mb-8 shadow-lg">
              <Scale className="h-5 w-5 text-blue-600" /> 
              {t("Conditions générales", "Terms & Conditions")}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {t("Conditions Générales d'Utilisation", "Terms and Conditions of Use")}
            </h1>
            
            <p className="text-muted-foreground text-xl max-w-4xl mx-auto leading-relaxed mb-8">
              {t(
                "Des conditions claires et transparentes, conçues pour une plateforme d'évaluation EdTech intégrant l'adaptativité psychométrique, des simulations fidèles à l'examen et un feedback IA explicable.",
                "Clear, transparent terms built for an EdTech assessment platform integrating psychometric adaptivity, exam‑faithful simulations, and explainable AI feedback."
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                {t("Dernière mise à jour : 1er août 2025", "Last updated: August 1st, 2025")}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                <Shield className="h-4 w-4" />
                {t("Conforme RGPD", "GDPR Compliant")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Content Section */}
      <section className="container mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-16">
          {/* Enhanced TOC */}
          <aside className="lg:sticky lg:top-24 h-max">
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <h3 className="font-semibold mb-6 text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {t("Table des matières", "Table of Contents")}
              </h3>
              <nav className="space-y-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="group flex items-center justify-between rounded-lg px-3 py-3 text-sm hover:bg-accent hover:shadow-sm transition-all duration-200 focus:outline-none border border-transparent hover:border-gray-200 dark:border-gray-700"
                  >
                    <span className="group-hover:text-foreground transition-colors font-medium">{s.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>
                ))}
              </nav>
              
              <div className="mt-8 rounded-xl border bg-gradient-to-br from-muted/50 to-muted/30 p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-3 text-foreground">{t("Documents connexes", "Related Documents")}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <Link className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline" href="/privacy">
                          {t("Politique de confidentialité", "Privacy Policy")}
                        </Link>
                      </div>
                      <div>
                        <Link className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline" href="/about">
                          {t("À propos d'AURA", "About AURA")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Enhanced Terms Body */}
          <article className="max-w-none">
            <div className="space-y-8">
              {sections.map((s, index) => {
                const IconComponent = s.icon
                return (
                  <section key={s.id} id={s.id} className="scroll-mt-24">
                    <div className="rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start gap-6 mb-6">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {index + 1}
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-lg">{s.content}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )
              })}
            </div>

            {/* Enhanced Footer */}
            <div className="mt-16 rounded-2xl border bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 p-8 text-center shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold">{t("Conditions acceptées", "Terms Accepted")}</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-lg max-w-2xl mx-auto">
                {t(
                  "En utilisant AURA, vous confirmez avoir lu, compris et accepté ces conditions générales d'utilisation.",
                  "By using AURA, you confirm that you have read, understood, and accepted these terms and conditions of use."
                )}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t("Version effective depuis le 1er août 2025", "Effective version since August 1st, 2025")}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

