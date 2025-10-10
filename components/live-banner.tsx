"use client"

import { useLang } from "./language-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Calendar, Clock, Play, Star, Heart, MessageCircle, Share2 } from "lucide-react"

export default function LiveBanner() {
  const { t } = useLang()
  return (
    <section id="live" aria-labelledby="live-title" className="py-8">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-card shadow-xl">
        {/* Social media style gradient top bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#007BFF] via-[#8E44AD] to-[#E74C3C]" />

        {/* Floating elements for visual appeal */}
        <div className="absolute top-6 right-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#007BFF]/10 to-[#8E44AD]/10 blur-2xl animate-pulse" />
        <div className="absolute bottom-6 left-6 h-20 w-20 rounded-full bg-gradient-to-br from-[#E74C3C]/10 to-[#F39C12]/10 blur-xl animate-pulse delay-1000" />

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Main content area */}
            <div className="flex-1 space-y-6">
              {/* Live indicator with social media style */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#E74C3C] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-[#E74C3C]" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#FF6B6B] px-4 py-2 text-sm font-bold text-white shadow-lg">
                    <Play className="h-3 w-3 fill-white" />
                    LIVE
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-current" />
                    Premium
                  </span>
                </div>
              </div>

              {/* Title and description */}
              <div className="space-y-4">
                <h2 id="live-title" className="text-2xl md:text-3xl font-bold text-foreground">
                  Atelier d'expression orale
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  Rejoignez notre session interactive pour améliorer votre expression orale avec des experts certifiés
                  TCF/TEF
                </p>

                {/* Social media style engagement stats */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">25</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Share2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">30</span>
                  </div>
                </div>

                {/* Session details with improved styling */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                      <p className="text-sm font-bold text-foreground">Aujourd'hui</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="p-3 rounded-xl bg-purple-500/10">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horaire</p>
                      <p className="text-sm font-bold text-foreground">18:00 - 19:30</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</p>
                      <p className="text-sm font-bold text-foreground">12/20</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons with social media styling */}
            <div className="flex flex-col gap-4 lg:min-w-[220px]">
              <Link href="/live">
                <Button className="w-full bg-gradient-to-r from-[#007BFF] to-[#0056CC] hover:from-[#0056CC] hover:to-[#004499] text-white px-8 py-4 h-auto font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl">
                  {t("live.cta")}
                </Button>
              </Link>
              <Link href="/live">
                <Button
                  variant="outline"
                  className="w-full px-8 py-4 h-auto font-semibold text-base border-2 border-gray-200 dark:border-gray-700 hover:bg-secondary bg-card rounded-2xl transition-all duration-300"
                >
                  Voir le programme
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
