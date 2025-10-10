"use client"

import Link from "next/link"
import Image from "next/image"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Layers } from "lucide-react"

export default function ExploreHub() {
  return (
    <PageShell>
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1920&h=1080&fit=crop&q=80"
              alt="Explore learning"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-transparent -z-0" />
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Explore</h1>
            <p className="text-white/90 text-lg md:text-xl">
              Accédez rapidement aux cours, tests et plus encore.
            </p>
          </div>
        </section>

        {/* Quick links */}
        <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/cours" className="group rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-lg font-semibold text-foreground">Cours</div>
                  <div className="text-sm text-muted-foreground">Découvrir les cours</div>
                </div>
              </div>
            </Link>
            <Link href="/tests" className="group rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-lg font-semibold text-foreground">Tests</div>
                  <div className="text-sm text-muted-foreground">S'entraîner et évaluer son niveau</div>
                </div>
              </div>
            </Link>
            <Link href="/abonnement" className="group rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <Layers className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-lg font-semibold text-foreground">Abonnement</div>
                  <div className="text-sm text-muted-foreground">Choisir un plan</div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  )
}


