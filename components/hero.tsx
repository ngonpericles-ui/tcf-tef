"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLang } from "./language-provider"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const carouselImages = [
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    alt: "Étudiants préparant le TCF/TEF",
  },
  {
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    alt: "Salle de classe moderne avec technologie d'apprentissage",
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    alt: "Étudiants célébrant leur réussite en français",
  },
  {
    src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    alt: "Interface de plateforme d'apprentissage numérique",
  },
  {
    src: "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    alt: "Professeur de français en session de préparation en ligne",
  },
]

export default function Hero() {
  const { t, lang } = useLang()
  const isReturning = false
  const [currentImage, setCurrentImage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-swap images every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % carouselImages.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10s
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section aria-labelledby="hero-title" className="py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7">
          <h1
            id="hero-title"
            className="font-[var(--font-poppins)] text-3xl md:text-4xl font-semibold tracking-tight leading-tight"
          >
            {t("hero.title")}
          </h1>
          <p className="mt-3 text-foreground">{t("hero.subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cours">
              <Button className="h-11 px-6 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black">
                {isReturning ? t("hero.primary.continue") : t("hero.primary.start")}
              </Button>
            </Link>
            <Link href="/tests?duration=3">
              <Button variant="outline" className="h-11 px-6 bg-transparent">
                {t("hero.quick")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 group">
            <div
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <Image
                src={carouselImages[currentImage].src || "/placeholder.svg"}
                alt={
                  lang === "fr" ? carouselImages[currentImage].alt : `French learning illustration ${currentImage + 1}`
                }
                fill
                className="object-cover transition-all duration-500"
                priority
              />

              {/* Navigation arrows */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImage(index)
                      setIsAutoPlaying(false)
                      setTimeout(() => setIsAutoPlaying(true), 10000)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImage ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Aller à l'image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
