"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Globe, Star, Shield, Sun, Moon, ArrowRight, ArrowLeft, Users, Award, BookOpen, Brain, Play, CheckCircle2, Zap, Target, TrendingUp, GraduationCap, Clock, Headphones, BarChart3, Smartphone, Monitor, Tablet, Wallet, MessageCircle, XCircle, Sparkles, Cpu, DollarSign, HelpCircle, Layers, Package, AlertCircle, Ban, Settings } from "lucide-react"
// import { Icons } from "@/lib/icons"
import Image from "next/image"
import AuraLogo from "@/components/aura-logo"
import StudentTestimonials from "@/components/student-testimonials"
import SiteFooter from "@/components/site-footer"
import { motion, useInView } from "framer-motion"

// Voice Simulation Card Component with Scroll Animations
function VoiceSimulationCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  const imageVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="bg-transparent rounded-3xl p-6 md:p-8 lg:p-11 min-h-[420px] md:min-h-[490px] flex items-center">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-11 items-center w-full">
          {/* Image - Left Side with Animation */}
          <motion.div
            className="order-2 md:order-1"
            variants={imageVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="relative w-full max-w-md mx-auto md:max-w-full">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/simution.png"
                  alt={t("Simulation vocale", "Voice Simulation")}
                  width={600}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
          
          {/* Text Content - Right Side with Animation */}
          <motion.div
            className="order-1 md:order-2"
            variants={textVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              {t("Simulation vocale", "Voice Simulation")}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Pratiquez votre prononciation avec notre IA vocale avancée. Recevez des corrections en temps réel et améliorez votre accent français avec des exercices interactifs personnalisés.",
                "Practice your pronunciation with our advanced voice AI. Receive real-time corrections and improve your French accent with personalized interactive exercises."
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Notre technologie de reconnaissance vocale analyse chaque mot et vous guide vers une prononciation parfaite, adaptée à votre niveau CEFR.",
                "Our speech recognition technology analyzes every word and guides you toward perfect pronunciation, tailored to your CEFR level."
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// One-on-One Sessions Card Component with Scroll Animations
function OneOnOneCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  // Card 2 - Inverted: Text left, Image right
  const imageVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="bg-transparent rounded-3xl p-6 md:p-8 lg:p-11 min-h-[420px] md:min-h-[490px] flex items-center">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-11 items-center w-full">
          {/* Text Content - Left Side with Animation (Card 2 - Inverted) */}
          <motion.div
            className="order-1 md:order-1"
            variants={textVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              {t("Sessions individuelles", "One-on-One Sessions")}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "En plus des sessions de groupe, nous avons les sessions one-on-one pour nos apprenants pro. Bénéficiez d'un accompagnement personnalisé avec des tuteurs certifiés pour progresser à votre rythme.",
                "In addition to group sessions, we offer one-on-one sessions for our pro learners. Benefit from personalized coaching with certified tutors to progress at your own pace."
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Nos sessions individuelles sont adaptées à vos besoins spécifiques et vous permettent d'atteindre vos objectifs d'apprentissage plus rapidement avec un suivi dédié.",
                "Our one-on-one sessions are tailored to your specific needs and allow you to reach your learning goals faster with dedicated support."
              )}
            </p>
          </motion.div>
          
          {/* Image - Right Side with Animation (Card 2 - Inverted) */}
          <motion.div
            className="order-2 md:order-2"
            variants={imageVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="relative w-full max-w-md mx-auto md:max-w-full">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/oneonone.png"
                  alt={t("Sessions individuelles", "One-on-One Sessions")}
                  width={600}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Tutor Marketplace Card Component with Scroll Animations
function TutorMarketplaceCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  const imageVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="bg-transparent rounded-3xl p-6 md:p-8 lg:p-11 min-h-[420px] md:min-h-[490px] flex items-center">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-11 items-center w-full">
          {/* Image - Left Side with Animation */}
          <motion.div
            className="order-2 md:order-1"
            variants={imageVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="relative w-full max-w-md mx-auto md:max-w-full">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/marcher.png"
                  alt={t("Marché des tuteurs", "Tutor Marketplace")}
                  width={600}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
          
          {/* Text Content - Right Side with Animation */}
          <motion.div
            className="order-1 md:order-2"
            variants={textVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              {t("Marché des tuteurs", "Tutor Marketplace")}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Connectez-vous avec des tuteurs certifiés via notre marché de tuteurs intelligent. Notre système de triage IA vous met en relation avec le tuteur idéal selon votre niveau, vos objectifs et vos préférences d'apprentissage.",
                "Connect with certified tutors through our intelligent tutor marketplace. Our AI triage system matches you with the ideal tutor based on your level, goals, and learning preferences."
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Choisissez parmi une sélection de tuteurs expérimentés, consultez leurs profils, leurs spécialités et leurs tarifs. Réservez des sessions personnalisées qui correspondent parfaitement à vos besoins.",
                "Choose from a selection of experienced tutors, view their profiles, specialties, and rates. Book personalized sessions that perfectly match your needs."
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Community and Messaging Card Component with Scroll Animations
function CommunityMessagingCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  const imageVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="bg-transparent rounded-3xl p-6 md:p-8 lg:p-11 min-h-[420px] md:min-h-[490px] flex items-center">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-11 items-center w-full">
          {/* Text Content - Left Side with Animation (Card 4 - Inverted) */}
          <motion.div
            className="order-1 md:order-1"
            variants={textVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              {t("Communauté et messagerie", "Community and Messaging")}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Partagez vos expériences et communiquez directement avec vos tuteurs sur notre plateforme. Le feed vous permet de partager vos réussites, poser des questions et interagir avec la communauté d'apprenants.",
                "Share your experiences and communicate directly with your tutors on our platform. The feed allows you to share your achievements, ask questions, and interact with the learning community."
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Notre système de messagerie intégré facilite la communication en temps réel entre étudiants et tuteurs. Partagez des fichiers, posez des questions et recevez des réponses rapides pour optimiser votre apprentissage.",
                "Our integrated messaging system facilitates real-time communication between students and tutors. Share files, ask questions, and receive quick responses to optimize your learning."
              )}
            </p>
          </motion.div>
          
          {/* Image - Right Side with Animation (Card 4 - Inverted) */}
          <motion.div
            className="order-2 md:order-2"
            variants={imageVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="relative w-full max-w-md mx-auto md:max-w-full">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/feed.png"
                  alt={t("Communauté et messagerie", "Community and Messaging")}
                  width={600}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Plans Card Component with Scroll Animations
function PlansCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })

  // Card 5 - Image left, Text right (same as cards 1 & 3)
  const imageVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.2,
      },
    },
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="bg-transparent rounded-3xl p-6 md:p-8 lg:p-11 min-h-[420px] md:min-h-[490px] flex items-center">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-11 items-center w-full">
          {/* Image - Left Side with Animation */}
          <motion.div
            className="order-2 md:order-1"
            variants={imageVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <div className="relative w-full max-w-md mx-auto md:max-w-full">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/plans.png"
                  alt={t("Nos plans", "Our Plans")}
                  width={600}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
          
          {/* Text Content - Right Side with Animation */}
          <motion.div
            className="order-1 md:order-2"
            variants={textVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              {t("Nos plans", "Our Plans")}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Nous avons des plans flexibles et abordables pour votre préparation TCF/TEF. Choisissez le plan qui correspond le mieux à vos besoins et à votre budget, avec des options allant du plan gratuit aux plans premium avec accompagnement personnalisé.",
                "We offer flexible and affordable plans for your TCF/TEF preparation. Choose the plan that best fits your needs and budget, with options ranging from the free plan to premium plans with personalized support."
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400, lineHeight: '1.6' }}>
              {t(
                "Tous nos plans incluent l'accès aux simulations d'examen, aux ressources d'apprentissage et au suivi de progression. Les plans premium offrent des sessions individuelles, un accès prioritaire aux tuteurs et des fonctionnalités avancées pour maximiser vos chances de réussite.",
                "All our plans include access to exam simulations, learning resources, and progress tracking. Premium plans offer one-on-one sessions, priority access to tutors, and advanced features to maximize your chances of success."
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Why Choose AURA Component with Image Right, Text Left, and 6 Transparent Cards
function WhyChooseAuraCard({ t }: { t: (fr: string, en: string) => string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.2 })
  const router = useRouter()

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        delay: 0.1 * i,
      },
    }),
  }

  return (
    <div className="mb-20" ref={ref}>
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          {t("Pourquoi", "Why")} <span className="text-[#2ECC71]">AURA</span> {t("est le bon choix pour vous", "is The Right Choice for You")}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Top Left - Expert Instructors */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="group"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t("Tuteurs Experts", "Expert")} <span className="text-[#2ECC71]">{t("Certifiés", "Tutors")}</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
              {t(
                "Apprenez auprès de professionnels certifiés qui apportent des années d'expérience réelle en enseignement du français. Bénéficiez des dernières méthodes, techniques et insights nécessaires pour exceller dans votre préparation TCF/TEF.",
                "Learn from certified professionals who bring years of real-world experience in French teaching. Benefit from the latest methods, techniques, and insights needed to excel in your TCF/TEF preparation."
              )}
            </p>
          </div>
        </motion.div>

        {/* Top Right - Horaires d'Apprentissage Flexibles */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="group"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="text-[#2ECC71]">{t("Horaires", "Schedules")}</span> {t("d'Apprentissage Flexibles", "Flexible Learning")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
              {t(
                "Chez AURA.CA, nous comprenons l'importance d'équilibrer l'apprentissage avec un mode de vie chargé. C'est pourquoi nos cours sont disponibles à la demande, vous permettant d'apprendre à votre propre rythme, à tout moment et n'importe où.",
                "At AURA.CA, we understand the importance of balancing learning with a busy lifestyle. That's why our courses are available on-demand, allowing you to learn at your own pace, anytime and anywhere."
              )}
            </p>
          </div>
        </motion.div>

        {/* Image Card - Right side spanning 2 rows */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="group md:row-span-2"
        >
          <div className="relative rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80)"
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-3xl font-bold mb-5 text-white">
                  {t("Horaires", "Flexible")} <span className="text-[#2ECC71]">{t("d'Apprentissage Flexibles", "Learning Schedules")}</span>
                </h3>
                <p className="text-white/95 leading-relaxed mb-6 text-lg">
                  {t(
                    "Chez AURA.CA, nous comprenons l'importance d'équilibrer l'apprentissage avec un mode de vie chargé. C'est pourquoi nos cours sont disponibles à la demande, vous permettant d'apprendre à votre propre rythme, à tout moment et n'importe où.",
                    "At AURA.CA, we understand the importance of balancing learning with a busy lifestyle. That's why our courses are available on-demand, allowing you to learn at your own pace, anytime and anywhere."
                  )}
                </p>
              </div>
              <Button
                className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-6 py-3 text-base w-auto mx-auto mt-6"
                onClick={() => router.push("/inscription")}
              >
                {t("Commencer gratuitement", "Start Free Trial")} →
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Left - 100+ Courses (wider card spanning 2 columns) */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="group md:col-span-2"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-gray-600 dark:text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              <span className="text-[#2ECC71]">100+</span> {t("Cours à Impact Élevé", "High Impact Courses")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
              {t(
                "AURA.CA propose plus de 100 cours qui couvrent les compétences essentielles pour la préparation TCF/TEF. Que vous soyez débutant ou professionnel expérimenté, nos cours offrent un apprentissage pratique et immédiatement applicable.",
                "AURA.CA offers over 100 courses covering essential skills for TCF/TEF preparation. Whether you're a beginner or experienced professional, our courses provide practical, immediately applicable learning."
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  const { lang, setLang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user, loading } = useAuth()
  

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on role to their respective dashboards
      switch (user.role) {
        case "ADMIN":
          router.push("/admin")
          break
        case "SENIOR_MANAGER":
        case "JUNIOR_MANAGER":
          router.push("/manager")
          break
        case "STUDENT":
        case "USER":
          router.push("/home")
          break
        default:
          // Unknown role, stay on welcome page
          break
      }
    }
  }, [loading, isAuthenticated, user, router])

  // Mark that the welcome page has been seen
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("welcome_seen", "1")
      } catch {}
    }
  }, [])

  // Avoid hydration mismatch for theme icon
  useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light")
    else setTheme("dark")
  }

  // Enhanced image carousel with optimized high-quality images
  const images = [
    {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      alt: t("Étudiants collaborant", "Students collaborating")
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      alt: t("Apprentissage en ligne", "Online learning")
    },
    {
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      alt: t("Formation professionnelle", "Professional training")
    },
    {
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      alt: t("Succès académique", "Academic success")
    },
    {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
      alt: t("Excellence éducative", "Educational excellence")
    }
  ]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, 5000) // Change image every 5 seconds
    return () => clearInterval(interval)
  }, [images.length])

  // Stats data
  const stats = [
    { number: "1000+", label: t("Étudiants", "Students") },
    { number: "92%", label: t("Taux de réussite", "Success rate") },
    { number: "24/7", label: t("Support", "Support") },
    { number: "50+", label: t("Pays", "Countries") }
  ]

  // Show loading spinner if redirecting non-students away
  if (isAuthenticated && user && user.role !== "USER" && user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
      <main className="min-h-screen bg-background text-foreground">

      {/* Advanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Advanced Gradient Mesh Background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: theme === "dark" 
              ? `radial-gradient(at 0% 0%, oklch(0.65 0.2 142 / 0.3) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, oklch(0.7 0.18 220 / 0.25) 0px, transparent 50%),
                 radial-gradient(at 100% 100%, oklch(0.75 0.15 280 / 0.2) 0px, transparent 50%),
                 radial-gradient(at 0% 100%, oklch(0.8 0.17 40 / 0.15) 0px, transparent 50%)`
              : `radial-gradient(at 0% 0%, oklch(0.55 0.18 142 / 0.2) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, oklch(0.6 0.15 220 / 0.15) 0px, transparent 50%),
                 radial-gradient(at 100% 100%, oklch(0.65 0.12 280 / 0.1) 0px, transparent 50%),
                 radial-gradient(at 0% 100%, oklch(0.7 0.14 40 / 0.08) 0px, transparent 50%)`
          }}
        />
        
        {/* Floating Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2ECC71]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Header - Eversend Style - Minimal Height */}
        <header className="absolute top-0 left-0 right-0 z-10 px-6 sm:px-8 md:px-12 lg:px-16 py-0.5 sm:py-0.5 md:py-1 bg-background/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="container mx-auto max-w-screen-2xl flex items-center justify-between">
            {/* Left: Logo - Increased by 40% more (total 90% increase) */}
            <div className="flex items-center -ml-2 sm:-ml-3 md:-ml-4">
              <AuraLogo
                className="h-[81px] sm:h-[101px] md:h-[132px] lg:h-[164px] xl:h-[197px] w-auto"
                width={1000}
                height={300}
                priority={true}
              />
            </div>
            
            {/* Center: Navigation Links - Always visible, spaced out, bold */}
            <nav className="flex items-center gap-8 md:gap-10 lg:gap-12 text-base md:text-lg font-bold text-foreground">
              <Link href="/privacy" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t("Confidentialité", "Privacy")}
              </Link>
              <Link href="/terms" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t("Conditions", "Terms")}
              </Link>
              <Link href="/about" className="hover:text-[#2ECC71] transition-colors whitespace-nowrap">
                {t("À propos", "About")}
              </Link>
            </nav>
            
            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              <button
                aria-label="Language"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm border border-gray-200 dark:border-gray-700 hover:bg-accent transition-colors bg-background/80 backdrop-blur-sm"
                onClick={() => setLang?.(lang === "fr" ? "en" : "fr")}
              >
                <Globe className="h-4 w-4" /> {lang.toUpperCase()}
              </button>
              <button
                aria-label={`Switch theme (current: ${theme})`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm border border-gray-200 dark:border-gray-700 hover:bg-accent transition-colors bg-background/80 backdrop-blur-sm"
                onClick={cycleTheme}
              >
                {mounted && (theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                ))}
              </button>
              <Link href="/connexion">
                <Button className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-4 py-1 text-xs md:text-sm">
                  {t("Connexion", "Login")}
                </Button>
              </Link>
            </div>
          </div>
        </header>
        
        <div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8 pt-44 md:pt-52 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            {/* Left Content - Pushed to the left */}
            <div className="space-y-8 -ml-2 sm:-ml-4 md:-ml-6 mt-4 md:mt-6">
              {/* Main Headline with Better Typography */}
              <div className="space-y-4">
                <h1 className="font-bold text-5xl md:text-6xl xl:text-7xl leading-[1.1] tracking-tight">
                  <span className="block text-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    {t("Bienvenue sur", "Welcome to")}
                  </span>
                  <span 
                    className="block bg-gradient-to-r from-[#2ECC71] via-[#27c066] to-[#22a85a] bg-clip-text text-transparent animate-gradient-shift" 
                    style={{ animationDelay: "0.3s" }}
                  >
                    AURA.CA
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-[#2ECC71] font-semibold animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                  {t("Plateforme IA de préparation TCF/TEF", "TCF/TEF AI Preparation Platform")}
                </p>
              </div>
                
              {/* Enhanced Description - More interesting and engaging */}
              <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
                <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed max-w-2xl">
                  {t(
                    "Transformez votre préparation aux examens TCF/TEF avec notre plateforme révolutionnaire. Notre IA explicable analyse chaque réponse pour vous offrir un feedback détaillé et personnalisé, adapté à votre niveau CEFR.",
                    "Transform your TCF/TEF exam preparation with our revolutionary platform. Our explainable AI analyzes every answer to provide you with detailed and personalized feedback, adapted to your CEFR level."
                  )}
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {t(
                    "Bénéficiez de simulations vocales avancées, de tests blancs réalistes, et d'un accompagnement personnalisé par des tuteurs certifiés. Rejoignez des milliers d'étudiants qui ont réussi grâce à notre méthode pédagogique structurée en 5 étapes.",
                    "Benefit from advanced voice simulations, realistic practice tests, and personalized coaching from certified tutors. Join thousands of students who have succeeded thanks to our structured 5-step pedagogical method."
                  )}
                </p>
              </div>
                
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                  <Button
                    size="lg"
                  className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-8 py-4 text-lg relative overflow-hidden group transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                  onClick={() => router.push("/inscription")}
                  >
                    <span className="relative z-10">{t("Commencer gratuitement", "Start for free")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full border-2 bg-transparent hover:bg-accent py-4 text-lg w-full sm:w-auto"
                  onClick={() => router.push("/about")}
                >
                    {t("En savoir plus", "Learn more")} →
                  </Button>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 animate-fade-in-up" style={{ animationDelay: "1.1s" }}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#2ECC71] mb-1">1000+</div>
                  <div className="text-sm text-muted-foreground font-medium">{t("Étudiants", "Students")}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#2ECC71] mb-1">92%</div>
                  <div className="text-sm text-muted-foreground font-medium">{t("Taux de réussite", "Success rate")}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#2ECC71] mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground font-medium">{t("Support", "Support")}</div>
                </div>
              </div>
            </div>

            {/* Right: Image Carousel with Floating Cards */}
            <div className="relative h-[600px] lg:h-[700px]">
              {/* Image Carousel Container */}
              <div className="absolute top-0 right-0 w-[85%] h-[70%] rounded-3xl overflow-hidden border border-border/50 shadow-2xl backdrop-blur-sm">
                {/* Carousel Images */}
                {images.map((image, i) => (
                  <div key={image.src} className={`absolute inset-0 transition-all duration-1000 ${
                    i === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  }`}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      priority={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
                ))}
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i === currentImageIndex 
                          ? "bg-[#2ECC71] scale-125" 
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                    </div>
                  </div>

              {/* Floating Card 1 - CEFR Level */}
              <div className="absolute top-32 left-12 w-56 p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl animate-float">
                <div className="text-sm font-medium mb-2">{t("Niveau CEFR", "CEFR Level")}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2ECC71] to-[#27c066] bg-clip-text text-transparent">
                  B2 → C1
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t("Progression moyenne", "Average progress")}</div>
                </div>
                
              {/* Floating Card 2 - AI Feedback */}
              <div className="absolute bottom-20 left-0 w-64 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71] font-bold">
                    AI
                    </div>
                    <div>
                    <div className="font-semibold">{t("Feedback instantané", "Instant feedback")}</div>
                    <div className="text-xs text-muted-foreground">{t("Propulsé par IA", "AI-powered")}</div>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[92%] bg-gradient-to-r from-[#2ECC71] to-[#27c066] rounded-full" />
                </div>
              </div>

              {/* Carousel Navigation Arrows */}
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background transition-all duration-300 flex items-center justify-center group"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background transition-all duration-300 flex items-center justify-center group"
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Dark Mode Glow Effect */}
              {theme === "dark" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2ECC71]/30 rounded-full blur-3xl animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Real Student Testimonials with Animated Profiles */}
      <StudentTestimonials />

      {/* Features Section - Eversend Style */}
      <section className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          {/* Features Badge - Like Eversend */}
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {t("Fonctionnalités", "Features")}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {t("Ce qui nous rend", "What makes us")} <span className="text-[#2ECC71]">{t("unique", "unique")}</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-normal" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {t(
              "Des fonctionnalités que vous ne trouverez nulle part ailleurs",
              "Features you won't find anywhere else",
            )}
          </p>
        </div>

        {/* Card 1 - Voice Simulation - Eversend Exact Style with Animations */}
        <VoiceSimulationCard t={t} />

        {/* Card 2 - One-on-One Sessions - Eversend Exact Style with Animations */}
        <OneOnOneCard t={t} />

        {/* Card 3 - Tutor Marketplace - Eversend Exact Style with Animations */}
        <TutorMarketplaceCard t={t} />

        {/* Card 4 - Community and Messaging - Eversend Exact Style with Animations */}
        <CommunityMessagingCard t={t} />

        {/* Card 5 - Plans - Eversend Exact Style with Animations */}
        <PlansCard t={t} />
      </section>

      {/* Why Choose AURA Section - New Design with Image Right, Text Left, 6 Transparent Cards */}
      <section className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-16 md:py-24">
        <WhyChooseAuraCard t={t} />
      </section>

      {/* Learning Path Section */}
      <section className="py-24 relative bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {t("Votre Parcours", "Your Learning")} <span className="text-[#2ECC71]">{t("d'Apprentissage", "Journey")}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("Un chemin structuré vers la maîtrise du français", "A structured path to French mastery")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Illustration Left */}
            <div className="flex justify-center md:justify-end">
              <div className="rounded-3xl overflow-hidden shadow-xl w-full max-w-xs md:max-w-md">
                <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80" alt="Étudiante devant ordinateur pour apprentissage en ligne" className="w-full h-auto object-cover" />
              </div>
            </div>
            {/* Steps Right */}
            <div className="flex flex-col gap-8">
              {/* Step 1 */}
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#2ECC71] rounded-full flex items-center justify-center text-white font-bold text-2xl mt-1 shadow-lg">1</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-foreground">{t("Évaluation", "Assessment")} <span className="text-[#2ECC71]">{t("initiale", "Initial")}</span></h3>
                  <p className="text-muted-foreground text-base">{t("Testez votre niveau par un diagnostic précis.", "Test your level with an accurate diagnostic.")}</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#2ECC71] rounded-full flex items-center justify-center text-white font-bold text-2xl mt-1 shadow-lg">2</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-foreground"><span className="text-[#2ECC71]">{t("Parcours", "Path")}</span> {t("personnalisé", "Personalized")}</h3>
                  <p className="text-muted-foreground text-base">{t("Recevez un plan d'études adapté à vos besoins et objectifs.", "Get a learning plan tailored to your needs and goals.")}</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#2ECC71] rounded-full flex items-center justify-center text-white font-bold text-2xl mt-1 shadow-lg">3</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-foreground"><span className="text-[#2ECC71]">{t("Pratique", "Practice")}</span> {t("interactive", "Interactive")}</h3>
                  <p className="text-muted-foreground text-base">{t("Progression par exercices, simulations orales et écrites, et corrections intelligentes.", "Progress through exercises, oral & written simulations, and smart correction.")}</p>
                </div>
              </div>
              {/* Step 4 */}
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#2ECC71] rounded-full flex items-center justify-center text-white font-bold text-2xl mt-1 shadow-lg">4</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-foreground">{t("Suivi", "Coaching")} <span className="text-[#2ECC71]">&</span> {t("Certification", "Certification")}</h3>
                  <p className="text-muted-foreground text-base">{t("Bénéficiez de retours IA/humains jusqu'à l'obtention de votre certification.", "Benefit from AI/human feedback until you get certified.")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - "Prêt à transformer votre avenir ?" */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              {t("Prêt à transformer", "Ready to transform")} <span className="text-[#2ECC71]">{t("votre avenir ?", "your future?")}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("Rejoignez la révolution de l'apprentissage du français", "Join the revolution of French learning")}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </main>
  )
}