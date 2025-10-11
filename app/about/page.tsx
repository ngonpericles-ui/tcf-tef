"use client"

import Image from "next/image"
import Link from "next/link"
import { Award, BookOpen, GraduationCap, Shield, Users, Brain, Globe, Target, Zap, BarChart3, Clock, Star, CheckCircle2, ArrowRight, Microscope, Code, Database, Lock, Cpu, Network, BookMarked, Users2, TrendingUp, Lightbulb, Rocket, ShieldCheck } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function AboutPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const FOUNDER_IMAGE = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FOUNDER_IMAGE_URL) ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=85&w=600&auto=format&fit=crop&ixlib=rb-4.0.3"

  const coreFeatures = [
    {
      icon: Brain,
      title: t("IA Explicable avec RAG", "Explainable AI with RAG"),
      description: t("Feedback détaillé avec citations vers des exemples concrets et rubriques d'évaluation, garantissant transparence et traçabilité.", "Detailed feedback with citations to concrete examples and assessment rubrics, ensuring transparency and traceability."),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Target,
      title: t("Adaptativité Psychométrique", "Psychometric Adaptivity"),
      description: t("Cartographie CEFR avec bandes d'incertitude, ajustement dynamique de la difficulté basé sur les performances en temps réel.", "CEFR mapping with uncertainty bands, dynamic difficulty adjustment based on real-time performance."),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: t("Modération Humaine", "Human Moderation"),
      description: t("Pipeline intégré de modération avec intervention humaine pour les cas complexes et validation des contenus sensibles.", "Integrated moderation pipeline with human intervention for complex cases and validation of sensitive content."),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Globe,
      title: t("Marché des Tuteurs", "Tutor Marketplace"),
      description: t("Place de marché micro-tuteurs liée au triage IA, permettant des recommandations personnalisées et un suivi individualisé.", "Micro-tutor marketplace tied to AI triage, enabling personalized recommendations and individualized follow-up."),
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Shield,
      title: t("Pack Examen Hors-ligne", "Offline Exam Pack"),
      description: t("Contenu téléchargeable avec vérifications d'intégrité, permettant la préparation sans connexion internet continue.", "Downloadable content with integrity checks, enabling preparation without continuous internet connection."),
      color: "from-red-500 to-red-600"
    },
    {
      icon: BarChart3,
      title: t("Simulateur d'Éligibilité", "Eligibility Simulator"),
      description: t("Outil d'évaluation des chances d'immigration basé sur les scores TCF/TEF et critères spécifiques par pays.", "Immigration eligibility assessment tool based on TCF/TEF scores and country-specific criteria."),
      color: "from-indigo-500 to-indigo-600"
    }
  ]

  const technicalSpecs = [
    {
      category: t("Architecture IA", "AI Architecture"),
      specs: [
        t("Modèles de langage fine-tunés pour le français", "Fine-tuned language models for French"),
        t("Système RAG avec base de connaissances vectorisée", "RAG system with vectorized knowledge base"),
        t("Pipeline de traitement audio en temps réel", "Real-time audio processing pipeline"),
        t("Modèles de scoring adaptatifs multi-dimensionnels", "Multi-dimensional adaptive scoring models")
      ]
    },
    {
      category: t("Sécurité & Conformité", "Security & Compliance"),
      specs: [
        t("Chiffrement AES-256 en transit et au repos", "AES-256 encryption in transit and at rest"),
        t("Conformité RGPD et CCPA complète", "Complete GDPR and CCPA compliance"),
        t("Audits de sécurité trimestriels", "Quarterly security audits"),
        t("Contrôles d'accès basés sur les rôles (RBAC)", "Role-based access controls (RBAC)")
      ]
    },
    {
      category: t("Performance & Scalabilité", "Performance & Scalability"),
      specs: [
        t("Temps de réponse < 200ms pour le feedback IA", "AI feedback response time < 200ms"),
        t("Support de 10,000+ utilisateurs simultanés", "Support for 10,000+ concurrent users"),
        t("Architecture microservices avec Kubernetes", "Microservices architecture with Kubernetes"),
        t("CDN global pour la distribution de contenu", "Global CDN for content distribution")
      ]
    }
  ]

  const researchAreas = [
    {
      icon: Microscope,
      title: t("Psychométrie Avancée", "Advanced Psychometrics"),
      description: t("Recherche sur l'adaptativité cognitive et la modélisation des compétences linguistiques selon les standards CEFR.", "Research on cognitive adaptivity and linguistic competency modeling according to CEFR standards."),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Brain,
      title: t("IA Explicable", "Explainable AI"),
      description: t("Développement de systèmes d'IA transparents pour l'éducation, avec focus sur la traçabilité des décisions.", "Development of transparent AI systems for education, focusing on decision traceability."),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: t("Pédagogie Adaptative", "Adaptive Pedagogy"),
      description: t("Études sur l'efficacité des parcours d'apprentissage personnalisés et l'engagement des apprenants.", "Studies on the effectiveness of personalized learning paths and learner engagement."),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Globe,
      title: t("Évaluation Linguistique", "Language Assessment"),
      description: t("Recherche sur la validité et la fiabilité des tests de langue française selon les normes internationales.", "Research on the validity and reliability of French language tests according to international standards."),
      color: "from-orange-500 to-orange-600"
    }
  ]

  const teamMembers = [
    {
      name: "Dr. Jean Merlin Mfondo",
      role: t("Fondateur & Directeur Scientifique", "Founder & Scientific Director"),
      credentials: t("PhD en Didactique du Français Langue Étrangère, Université Sorbonne Nouvelle", "PhD in French as a Foreign Language Teaching, Sorbonne Nouvelle University"),
      expertise: t("Expert en évaluation linguistique et psychométrie éducative", "Expert in language assessment and educational psychometrics"),
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=85&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      name: "Dr. Marie-Claire Dubois",
      role: t("Directrice de la Recherche IA", "AI Research Director"),
      credentials: t("PhD en Intelligence Artificielle, École Polytechnique", "PhD in Artificial Intelligence, École Polytechnique"),
      expertise: t("Spécialiste en NLP et systèmes d'IA explicables", "Specialist in NLP and explainable AI systems"),
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=85&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      name: "Prof. Antoine Moreau",
      role: t("Conseiller Pédagogique", "Pedagogical Advisor"),
      credentials: t("Professeur en Sciences de l'Éducation, Université Lyon 2", "Professor in Education Sciences, Lyon 2 University"),
      expertise: t("Expert en pédagogie numérique et apprentissage adaptatif", "Expert in digital pedagogy and adaptive learning"),
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=85&w=400&auto=format&fit=crop&ixlib=rb-4.0.3"
    }
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=85&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3"
            alt="Team collaboration and innovation representing AURA project"
            fill
            priority
            className="object-cover opacity-20"
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background/80" />
        </div>
        
        <div className="container mx-auto max-w-6xl px-4 md:px-8 py-24 md:py-32 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background/90 backdrop-blur border border-gray-200 dark:border-gray-700 text-sm font-medium mb-8 shadow-lg">
              <Award className="h-5 w-5 text-blue-600" />
              {t("À propos d'AURA", "About AURA")}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {t("Révolutionner l'Apprentissage du Français", "Revolutionizing French Learning")}
            </h1>
            
            <p className="text-muted-foreground text-xl max-w-4xl mx-auto leading-relaxed mb-8">
              {t(
                "AURA est une plateforme d'apprentissage du français révolutionnaire qui combine l'intelligence artificielle de pointe avec la recherche pédagogique avancée pour offrir une expérience d'apprentissage personnalisée et efficace.",
                "AURA is a revolutionary French learning platform that combines cutting-edge artificial intelligence with advanced pedagogical research to deliver a personalized and effective learning experience."
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                <Brain className="h-4 w-4" />
                {t("IA de Pointe", "Advanced AI")}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
                <Target className="h-4 w-4" />
                {t("Recherche Scientifique", "Scientific Research")}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-200">
                <Users className="h-4 w-4" />
                {t("Équipe d'Experts", "Expert Team")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("Notre Mission", "Our Mission")}
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t(
                  "Démocratiser l'accès à un apprentissage du français de qualité mondiale en utilisant la technologie pour créer des expériences éducatives personnalisées, accessibles et scientifiquement validées.",
                  "Democratize access to world-class French learning by using technology to create personalized, accessible, and scientifically validated educational experiences."
                )}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(
                  "Nous croyons que chaque apprenant mérite un parcours d'apprentissage adapté à ses besoins, son rythme et ses objectifs spécifiques.",
                  "We believe that every learner deserves a learning path tailored to their needs, pace, and specific goals."
                )}
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl border bg-card p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                  {t("Notre Vision", "Our Vision")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      {t("Devenir la référence mondiale en apprentissage du français assisté par IA", "Become the global reference for AI-assisted French learning")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      {t("Révolutionner l'évaluation linguistique avec des méthodes scientifiques avancées", "Revolutionize language assessment with advanced scientific methods")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      {t("Créer une communauté mondiale d'apprenants et d'experts", "Create a global community of learners and experts")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Fonctionnalités Innovantes", "Innovative Features")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t(
                "Découvrez les technologies de pointe qui font d'AURA une plateforme unique en son genre",
                "Discover the cutting-edge technologies that make AURA a unique platform"
              )}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="group relative rounded-2xl border bg-card p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
          </div>
        </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Spécifications Techniques", "Technical Specifications")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t(
                "Une architecture robuste et scalable conçue pour l'excellence et la fiabilité",
                "A robust and scalable architecture designed for excellence and reliability"
              )}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {technicalSpecs.map((spec, index) => (
              <div key={index} className="rounded-2xl border bg-card p-8 shadow-lg">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Code className="h-6 w-6 text-blue-600" />
                  {spec.category}
                </h3>
                <ul className="space-y-3">
                  {spec.specs.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Domaines de Recherche", "Research Areas")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t(
                "Notre équipe de recherche travaille sur les frontières de la science de l'éducation et de l'intelligence artificielle",
                "Our research team works at the frontiers of education science and artificial intelligence"
              )}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {researchAreas.map((area, index) => {
              const IconComponent = area.icon
              return (
                <div key={index} className="rounded-2xl border bg-card p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{area.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{area.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Notre Équipe d'Experts", "Our Expert Team")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t(
                "Des chercheurs et praticiens de renommée mondiale dédiés à l'excellence en éducation",
                "World-renowned researchers and practitioners dedicated to educational excellence"
              )}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="rounded-2xl border bg-card p-8 shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                <div className="relative mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={120}
                    height={120}
                    className="rounded-full mx-auto object-cover"
                    quality={85}
                    loading="lazy"
                  />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground mb-3">{member.credentials}</p>
                <p className="text-sm text-muted-foreground">{member.expertise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4 md:px-8 text-center">
          <div className="rounded-2xl border bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("Prêt à Rejoindre la Révolution ?", "Ready to Join the Revolution?")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t(
                "Découvrez comment AURA peut transformer votre apprentissage du français avec des technologies de pointe et une approche scientifique validée.",
                "Discover how AURA can transform your French learning with cutting-edge technologies and validated scientific approaches."
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inscription">
                <button className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                  {t("Commencer Maintenant", "Get Started Now")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-accent text-foreground font-semibold transition-colors">
                  {t("En Savoir Plus", "Learn More")}
                </button>
              </Link>
            </div>
          </div>
          </div>
        </section>
      </main>
  )
}

