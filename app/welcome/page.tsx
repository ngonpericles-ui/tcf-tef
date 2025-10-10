"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Globe, Star, Shield, Sun, Moon, ArrowRight, ArrowLeft, Users, Award, BookOpen, Brain, Play, CheckCircle2, Zap, Target, TrendingUp, GraduationCap, Clock, Headphones, BarChart3, Smartphone, Monitor, Tablet } from "lucide-react"
// import { Icons } from "@/lib/icons"
import Image from "next/image"
import AuraLogo from "@/components/aura-logo"

export default function WelcomePage() {
  const { lang, setLang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user, loading } = useAuth()
  

  // Redirect non-students away from welcome page
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Only students should see the welcome page
      if (user.role !== "USER" && user.role !== "STUDENT") {
        // Redirect managers and admins to their dashboards
        switch (user.role) {
          case "ADMIN":
            router.push("/admin")
            break
          case "SENIOR_MANAGER":
          case "JUNIOR_MANAGER":
            router.push("/manager/dashboard")
            break
          default:
            router.push("/home")
            break
        }
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
        
        {/* AURA.CA Logo - Top Left */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <AuraLogo
            className="h-20 sm:h-24 md:h-32 lg:h-40 xl:h-48 w-auto"
            width={1000}
            height={300}
            priority={true}
          />
        </div>
          
        {/* Top Controls - Integrated into Hero */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
            <button
              aria-label="Language"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:bg-accent transition-colors bg-background/80 backdrop-blur-sm"
              onClick={() => setLang?.(lang === "fr" ? "en" : "fr")}
            >
              <Globe className="h-4 w-4" /> {lang.toUpperCase()}
            </button>
            <button
              aria-label={`Switch theme (current: ${theme})`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:bg-accent transition-colors bg-background/80 backdrop-blur-sm"
              onClick={cycleTheme}
            >
              {mounted && (theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              ))}
            </button>
            <Link href="/inscription">
              <Button className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-medium">
              {t("Inscription", "Sign up")}
              </Button>
            </Link>
          </div>
        
        <div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-10">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/20 text-sm font-medium animate-fade-in-up">
                <div className="w-2 h-2 bg-[#2ECC71] rounded-full animate-pulse" />
                {t("Plateforme IA de nouvelle génération", "Next-gen AI platform")}
              </div>

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
                <p className="text-xl md:text-2xl text-muted-foreground font-medium animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                  {t("Plateforme IA de préparation TCF/TEF", "TCF/TEF AI Preparation Platform")}
                </p>
              </div>
                
              {/* Enhanced Description */}
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
              {t(
                  "Préparation intelligente propulsée par l'IA explicable, l'adaptativité psychométrique et la modération humaine.",
                  "Intelligent preparation powered by explainable AI, psychometric adaptivity, and human moderation.",
              )}
            </p>
                
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                <Link href="/inscription">
                  <Button
                    size="lg"
                    className="rounded-full bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-8 py-4 text-lg relative overflow-hidden group transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10">{t("Commencer gratuitement", "Start for free")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="rounded-full border-2 bg-transparent hover:bg-accent py-4 text-lg">
                    {t("En savoir plus", "Learn more")} →
                  </Button>
              </Link>
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
                      priority={i === 0}
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

      {/* Horizontal Scrolling Success Stories */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            {t("Ils ont réussi", "They succeeded")}
          </h2>
          <p className="text-center text-muted-foreground text-lg">
            {t(
              "Rejoignez des milliers d'étudiants qui ont transformé leur avenir",
              "Join thousands of students who transformed their future",
            )}
          </p>
        </div>

        <div className="flex gap-6 animate-scroll-x overflow-x-auto pb-8 px-6 scrollbar-hide">
          {[
            { name: "Marie L.", score: "B2 → C1", quote: t("J'ai réussi mon TCF grâce à l'IA explicable", "I passed my TCF thanks to explainable AI") },
            { name: "Ahmed K.", score: "A2 → B2", quote: t("La préparation adaptative a changé ma vie", "Adaptive preparation changed my life") },
            { name: "Sophie M.", score: "B1 → C1", quote: t("Les sessions live sont incroyables", "Live sessions are incredible") },
            { name: "Jean P.", score: "A1 → B1", quote: t("Meilleure plateforme de préparation", "Best preparation platform") },
            { name: "Fatima Z.", score: "B2 → C2", quote: t("Le feedback IA est exceptionnel", "AI feedback is exceptional") }
          ].map((story, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-80 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-[#2ECC71]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#2ECC71]/20">
                  <div className="w-full h-full bg-gradient-to-br from-[#2ECC71] to-[#27c066] flex items-center justify-center text-white font-bold text-xl">
                    {story.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{story.name}</div>
                  <div className="text-sm text-[#2ECC71] font-bold">{story.score}</div>
                </div>
              </div>
              <p className="text-muted-foreground italic">"{story.quote}"</p>
              </div>
            ))}
        </div>
      </section>

      {/* Features Section - Inspired by Image Design */}
      <section className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground">
            {t("Ce qui nous rend unique", "What makes us unique")}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
            {t(
              "Des fonctionnalités que vous ne trouverez nulle part ailleurs",
              "Features you won't find anywhere else",
            )}
          </p>
        </div>

        {/* 2x2 Grid - Rectangular Cards with Exact Dark Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 01 - IA Explicable */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[280px] max-h-[320px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl font-bold text-emerald-200 dark:text-emerald-400">01</div>
              <Brain className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t("IA Explicable", "Explainable AI")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("Comprenez chaque correction avec des citations et exemples concrets", "Understand each correction with concrete citations and examples")}
            </p>
          </div>

          {/* Card 02 - Adaptativité Psychométrique */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[280px] max-h-[320px]">
            <div className="text-6xl font-bold text-blue-200 dark:text-blue-400 mb-4">02</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t("Adaptativité Psychométrique", "Psychometric Adaptability")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("Cartographie CEFR précise avec bandes d'incertitude", "Precise CEFR mapping with uncertainty bands")}
            </p>
                </div>

          {/* Card 03 - Modération Humaine */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 dark:from-violet-900/30 dark:via-fuchsia-900/30 dark:to-pink-900/30 border border-violet-200/50 dark:border-violet-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[280px] max-h-[320px]">
            <div className="text-6xl font-bold text-violet-200 dark:text-violet-400 mb-4">03</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t("Modération Humaine", "Human Moderation")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("Pipeline intégré avec intervention d'experts certifiés", "Integrated pipeline with certified expert intervention")}
            </p>
              </div>

          {/* Card 04 - Marché des Tuteurs */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30 border border-orange-200/50 dark:border-orange-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[280px] max-h-[320px]">
            <div className="text-6xl font-bold text-orange-200 dark:text-orange-400 mb-4">04</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t("Marché des Tuteurs", "Tutor Marketplace")}
              </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("Connectez-vous avec des tuteurs via notre triage IA", "Connect with tutors via our AI triage")}
              </p>
              </div>
        </div>
      </section>

      {/* Comparison Section - "Pourquoi choisir AURA ?" */}
      <section className="py-24 relative bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("Pourquoi choisir AURA ?", "Why choose AURA?")}</h2>
            <div className="mt-6">
              <Link href="/aura-features" className="inline-flex items-center gap-2 text-[#2ECC71] hover:text-[#27c066] font-medium underline decoration-2 underline-offset-4 transition-colors">
                {t("En savoir plus", "Learn more")} →
              </Link>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* AURA - Recommended */}
              <div className="relative p-8 rounded-3xl bg-card border-2 border-[#2ECC71] shadow-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gray-800 text-white text-sm font-bold">
                  {t("Recommandé", "Recommended")}
                </div>
                <div className="text-center mt-4">
                  <div className="text-5xl font-bold text-[#2ECC71] mb-2">6</div>
                  <div className="text-sm text-muted-foreground mb-6">
                    {t("Fonctionnalités uniques", "Unique features")}
                  </div>
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71]">✓</div>
                      <span>{t("IA Explicable", "Explainable AI")}</span>
                        </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71]">✓</div>
                      <span>{t("Adaptativité", "Adaptability")}</span>
                      </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71]">✓</div>
                      <span>{t("Modération", "Moderation")}</span>
                    </div>
                  </div>
                        </div>
                      </div>

              {/* Competitors */}
              <div className="p-8 rounded-3xl bg-card/50 border border-border">
                <div className="text-center">
                  <div className="text-5xl font-bold text-muted-foreground mb-2">0</div>
                  <div className="text-sm text-muted-foreground mb-6">{t("Concurrents", "Competitors")}</div>
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("IA basique", "Basic AI")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("Pas d'adaptativité", "No adaptivity")}</span>
                        </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("Feedback limité", "Limited feedback")}</span>
                    </div>
                  </div>
                        </div>
                      </div>

              {/* Traditional Methods */}
              <div className="p-8 rounded-3xl bg-card/50 border border-border">
                <div className="text-center">
                  <div className="text-5xl font-bold text-muted-foreground mb-2">0</div>
                  <div className="text-sm text-muted-foreground mb-6">
                    {t("Méthodes traditionnelles", "Traditional methods")}
                  </div>
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("Pas d'IA", "No AI")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("Pas de suivi", "No tracking")}</span>
                        </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">✗</div>
                      <span>{t("Pas de personnalisation", "No personalization")}</span>
                    </div>
                        </div>
                      </div>
                    </div>
                        </div>
                      </div>
                    </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("Pourquoi AURA.CA ?", "Why AURA.CA?")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("Une plateforme révolutionnaire qui transforme l'apprentissage du français", "A revolutionary platform that transforms French learning")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800/30 dark:to-gray-700/30 border border-blue-200/50 dark:border-gray-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t("IA Avancée", "Advanced AI")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("Notre intelligence artificielle analyse vos réponses en temps réel pour un feedback personnalisé", "Our artificial intelligence analyzes your responses in real-time for personalized feedback")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800/30 dark:to-gray-700/30 border border-green-200/50 dark:border-gray-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t("Adaptation Intelligente", "Smart Adaptation")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("Le contenu s'adapte automatiquement à votre niveau et vos objectifs d'apprentissage", "Content automatically adapts to your level and learning objectives")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-gray-800/30 dark:to-gray-700/30 border border-purple-200/50 dark:border-gray-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t("Communauté Active", "Active Community")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("Rejoignez des milliers d'étudiants et bénéficiez du soutien de tuteurs certifiés", "Join thousands of students and benefit from certified tutor support")}
              </p>
                        </div>
                      </div>
                    </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-24 relative bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("Votre Parcours d'Apprentissage", "Your Learning Journey")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("Un chemin structuré vers la maîtrise du français", "A structured path to French mastery")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {t("Évaluation", "Assessment")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("Testez votre niveau actuel", "Test your current level")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {t("Personnalisation", "Personalization")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("Plan d'apprentissage sur mesure", "Customized learning plan")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {t("Pratique", "Practice")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("Exercices adaptatifs quotidiens", "Daily adaptive exercises")}
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {t("Certification", "Certification")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("Obtenez votre certification TCF/TEF", "Get your TCF/TEF certification")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("Technologie de Pointe", "Cutting-Edge Technology")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("Des outils avancés pour maximiser votre apprentissage", "Advanced tools to maximize your learning")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Tech 1 */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/40 border border-gray-200 dark:border-gray-600/40 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t("Mobile First", "Mobile First")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("Apprenez partout, à tout moment", "Learn anywhere, anytime")}
              </p>
            </div>

            {/* Tech 2 */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/40 border border-gray-200 dark:border-gray-600/40 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t("Analytics", "Analytics")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("Suivez vos progrès en détail", "Track your progress in detail")}
              </p>
            </div>

            {/* Tech 3 */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/40 border border-gray-200 dark:border-gray-600/40 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t("Audio IA", "AI Audio")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("Prononciation parfaite", "Perfect pronunciation")}
              </p>
            </div>

            {/* Tech 4 */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/40 border border-gray-200 dark:border-gray-600/40 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t("Temps Réel", "Real Time")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("Feedback instantané", "Instant feedback")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - "Prêt à transformer votre avenir ?" */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              {t("Prêt à transformer votre avenir ?", "Ready to transform your future?")}
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              {t("Rejoignez la révolution de l'apprentissage du français", "Join the revolution of French learning")}
            </p>
            <div className="flex justify-center">
              <Link href="/inscription">
                <Button size="lg" className="rounded-full bg-gray-800 hover:bg-gray-900 text-white font-semibold px-12 py-6 text-lg">
                  {t("Commencer gratuitement", "Start for free")}
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
            {/* Left: Brand */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">
                AURA<span className="text-[#2ECC71]">.CA</span>
              </span>
              </div>
            
            {/* Center: Navigation Links */}
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
            
            {/* Right: Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2025 {t("Tous droits réservés", "All rights reserved")}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}