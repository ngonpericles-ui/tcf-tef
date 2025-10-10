"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import Link from "next/link"
import { ArrowLeft, Brain, Mic, Video, Globe, Users, Award, BookOpen, Shield, Zap, Target, TrendingUp, GraduationCap, Clock, Headphones, BarChart3, Smartphone, Monitor, Tablet, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"

export default function AuraFeaturesPage() {
  const { lang, setLang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // AURA's unique features based on project analysis
  const uniqueFeatures = [
    {
      icon: Brain,
      title: t("IA Explicable Avancée", "Advanced Explainable AI"),
      description: t("Aura.CA - Assistant IA personnalisé avec personnalité chaleureuse et expertise TCF/TEF", "Aura.CA - Personalized AI assistant with warm personality and TCF/TEF expertise"),
      details: [
        t("Personnalité Aura.CA unique avec émojis et encouragements", "Unique Aura.CA personality with emojis and encouragement"),
        t("Adaptation automatique au niveau de l'étudiant", "Automatic adaptation to student level"),
        t("Expertise complète TCF/TEF toutes versions", "Complete TCF/TEF expertise all versions"),
        t("Méthode pédagogique structurée en 5 étapes", "Structured pedagogical method in 5 steps")
      ],
      competitors: [
        t("IA basique sans personnalité", "Basic AI without personality"),
        t("Pas d'adaptation au niveau", "No level adaptation"),
        t("Expertise limitée", "Limited expertise"),
        t("Réponses génériques", "Generic responses")
      ]
    },
    {
      icon: Mic,
      title: t("Simulations Vocales VAPI", "VAPI Voice Simulations"),
      description: t("Conversations IA en temps réel avec voix françaises authentiques", "Real-time AI conversations with authentic French voices"),
      details: [
        t("5 voix françaises (France/Québec) avec accents authentiques", "5 French voices (France/Quebec) with authentic accents"),
        t("Analyse en temps réel: prononciation, grammaire, fluidité", "Real-time analysis: pronunciation, grammar, fluency"),
        t("Scoring automatique avec feedback détaillé", "Automatic scoring with detailed feedback"),
        t("Scénarios d'immigration personnalisés", "Personalized immigration scenarios")
      ],
      competitors: [
        t("Voix synthétiques basiques", "Basic synthetic voices"),
        t("Pas d'analyse en temps réel", "No real-time analysis"),
        t("Feedback limité", "Limited feedback"),
        t("Scénarios génériques", "Generic scenarios")
      ]
    },
    {
      icon: Video,
      title: t("Sessions Live Agora", "Agora Live Sessions"),
      description: t("Formation en direct avec tableau blanc et enregistrement", "Live training with whiteboard and recording"),
      details: [
        t("Intégration Agora pour qualité vidéo professionnelle", "Agora integration for professional video quality"),
        t("Tableau blanc interactif en temps réel", "Real-time interactive whiteboard"),
        t("Enregistrement automatique des sessions", "Automatic session recording"),
        t("Jusqu'à 50 participants par session", "Up to 50 participants per session")
      ],
      competitors: [
        t("Qualité vidéo limitée", "Limited video quality"),
        t("Pas de tableau blanc", "No whiteboard"),
        t("Pas d'enregistrement", "No recording"),
        t("Limite de participants", "Participant limit")
      ]
    },
    {
      icon: Globe,
      title: t("Simulations d'Immigration", "Immigration Simulations"),
      description: t("Préparation complète aux entretiens d'immigration", "Complete preparation for immigration interviews"),
      details: [
        t("Scénarios Canada, France, Belgique, Suisse", "Canada, France, Belgium, Switzerland scenarios"),
        t("Questions générées par IA selon le profil", "AI-generated questions based on profile"),
        t("Anti-triche avec détection de patterns", "Anti-cheating with pattern detection"),
        t("Feedback culturel et linguistique", "Cultural and linguistic feedback")
      ],
      competitors: [
        t("Pas de simulations d'immigration", "No immigration simulations"),
        t("Questions statiques", "Static questions"),
        t("Pas de détection anti-triche", "No anti-cheating detection"),
        t("Feedback limité", "Limited feedback")
      ]
    },
    {
      icon: Users,
      title: t("Marché des Tuteurs IA", "AI Tutor Marketplace"),
      description: t("Matching intelligent entre étudiants et tuteurs certifiés", "Intelligent matching between students and certified tutors"),
      details: [
        t("Triage IA basé sur le niveau et les besoins", "AI triage based on level and needs"),
        t("Tuteurs certifiés avec vérification", "Certified tutors with verification"),
        t("Système de notation et commentaires", "Rating and review system"),
        t("Tarification transparente", "Transparent pricing")
      ],
      competitors: [
        t("Pas de matching intelligent", "No intelligent matching"),
        t("Tuteurs non vérifiés", "Unverified tutors"),
        t("Pas de système de notation", "No rating system"),
        t("Tarification opaque", "Opaque pricing")
      ]
    },
    {
      icon: BarChart3,
      title: t("Analytics Avancés", "Advanced Analytics"),
      description: t("Suivi détaillé des performances avec prédictions", "Detailed performance tracking with predictions"),
      details: [
        t("Cartographie CEFR précise avec bandes d'incertitude", "Precise CEFR mapping with uncertainty bands"),
        t("Prédictions de réussite aux examens", "Exam success predictions"),
        t("Recommandations personnalisées", "Personalized recommendations"),
        t("Rapports détaillés pour parents/tuteurs", "Detailed reports for parents/tutors")
      ],
      competitors: [
        t("Analytics basiques", "Basic analytics"),
        t("Pas de prédictions", "No predictions"),
        t("Recommandations génériques", "Generic recommendations"),
        t("Pas de rapports détaillés", "No detailed reports")
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
          <Link href="/welcome" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("Retour", "Back")}
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">
              AURA<span className="text-[#2ECC71]">.CA</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t("Fonctionnalités Uniques AURA", "AURA's Unique Features")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("Découvrez les technologies avancées qui rendent AURA unique dans l'apprentissage du français", "Discover the advanced technologies that make AURA unique in French learning")}
            </p>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
          {uniqueFeatures.map((feature, index) => (
            <div key={index} className="mb-16 last:mb-0">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: AURA Features */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#27c066] flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Competitors Limitations */}
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-card/50 border border-border">
                    <h4 className="text-lg font-semibold mb-4 text-muted-foreground">
                      {t("Limitations des concurrents", "Competitor Limitations")}
                    </h4>
                    <div className="space-y-3">
                      {feature.competitors.map((limitation, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("Technologies Avancées", "Advanced Technologies")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("AURA utilise les dernières technologies pour offrir une expérience d'apprentissage révolutionnaire", "AURA uses the latest technologies to deliver a revolutionary learning experience")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Google Gemini 1.5 Flash",
                description: t("IA conversationnelle avancée", "Advanced conversational AI"),
                icon: Brain
              },
              {
                name: "VAPI Voice AI",
                description: t("Simulations vocales en temps réel", "Real-time voice simulations"),
                icon: Mic
              },
              {
                name: "Agora Video SDK",
                description: t("Sessions live haute qualité", "High-quality live sessions"),
                icon: Video
              },
              {
                name: "Prisma ORM",
                description: t("Base de données optimisée", "Optimized database"),
                icon: BarChart3
              },
              {
                name: "Socket.IO",
                description: t("Communication temps réel", "Real-time communication"),
                icon: Zap
              },
              {
                name: "Stripe Payments",
                description: t("Paiements sécurisés", "Secure payments"),
                icon: Shield
              }
            ].map((tech, index) => (
              <div key={index} className="p-6 rounded-2xl bg-card/50 border border-border hover:border-[#2ECC71]/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#2ECC71] to-[#27c066] flex items-center justify-center">
                    <tech.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Prêt à découvrir AURA ?", "Ready to discover AURA?")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("Rejoignez la révolution de l'apprentissage du français avec les technologies les plus avancées", "Join the French learning revolution with the most advanced technologies")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inscription">
                <Button size="lg" className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-8">
                  {t("Commencer gratuitement", "Start for free")}
                </Button>
              </Link>
              <Link href="/welcome">
                <Button size="lg" variant="outline" className="rounded-full border-2">
                  {t("Retour à l'accueil", "Back to home")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">
                AURA<span className="text-[#2ECC71]">.CA</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t("Confidentialité", "Privacy")}
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {t("Conditions", "Terms")}
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                {t("À propos", "About")}
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 {t("Tous droits réservés", "All rights reserved")}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
