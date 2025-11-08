"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"

interface SuccessStory {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage: string | null
  initialLevel: string
  currentLevel: string
  progressPercentage: number
  latestScore: number
  completedAt: string
}

interface AnimatedSuccessStoriesProps {
  lang: "fr" | "en"
}

const t = (fr: string, en: string, lang: "fr" | "en") => (lang === "fr" ? fr : en)

export default function AnimatedSuccessStories({ lang }: AnimatedSuccessStoriesProps) {
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState<number[]>([])

  // Fetch real students from API
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/success-stories')
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          // Take first 5 students
          const students = data.data.slice(0, 5)
          setStories(students)
          
          // Initialize positions: [0, 1, 2, 3, 4]
          setPositions(students.map((_, i) => i))
        } else {
          // Fallback to empty array if API fails
          setStories([])
        }
      } catch (error) {
        console.error('Error fetching success stories:', error)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  // Animate positions - rotate every 3 seconds
  useEffect(() => {
    if (stories.length === 0) return

    const interval = setInterval(() => {
      setPositions(prev => {
        // Rotate positions: [0,1,2,3,4] -> [1,2,3,4,0] -> [2,3,4,0,1] etc.
        const newPositions = [...prev]
        const first = newPositions.shift()
        if (first !== undefined) {
          newPositions.push(first)
        }
        return newPositions
      })
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [stories.length])

  // Position configurations for 5 profiles in a dynamic layout
  const getPositionStyle = (index: number, position: number) => {
    const positions = [
      // Center (featured)
      { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, scale: 1.2 },
      // Top left
      { top: '10%', left: '15%', transform: 'translate(-50%, -50%)', zIndex: 3, scale: 0.9 },
      // Top right
      { top: '10%', right: '15%', transform: 'translate(50%, -50%)', zIndex: 3, scale: 0.9 },
      // Bottom left
      { bottom: '10%', left: '15%', transform: 'translate(-50%, 50%)', zIndex: 3, scale: 0.9 },
      // Bottom right
      { bottom: '10%', right: '15%', transform: 'translate(50%, 50%)', zIndex: 3, scale: 0.9 },
    ]

    const pos = positions[position]
    return {
      position: 'absolute' as const,
      top: pos.top,
      left: pos.left,
      right: pos.right,
      bottom: pos.bottom,
      transform: pos.transform,
      zIndex: pos.zIndex,
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      scale: pos.scale,
    }
  }

  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            {t("Ils ont réussi", "They succeeded", lang)}
          </h2>
          <p className="text-center text-muted-foreground text-lg">
            {t(
              "Rejoignez des milliers d'étudiants qui ont transformé leur avenir",
              "Join thousands of students who transformed their future",
              lang
            )}
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71]"></div>
        </div>
      </section>
    )
  }

  if (stories.length === 0) {
    return null // Don't show section if no stories
  }

  // Generate testimonial quotes based on progress
  const getTestimonial = (story: SuccessStory) => {
    const levelImprovement = story.currentLevel !== story.initialLevel
    const highScore = story.progressPercentage >= 80

    if (highScore && levelImprovement) {
      return t(
        `J'ai progressé de ${story.initialLevel} à ${story.currentLevel} grâce à AURA.CA`,
        `I progressed from ${story.initialLevel} to ${story.currentLevel} thanks to AURA.CA`,
        lang
      )
    } else if (highScore) {
      return t(
        "La préparation adaptative a changé ma vie",
        "Adaptive preparation changed my life",
        lang
      )
    } else if (levelImprovement) {
      return t(
        "J'ai réussi mon TCF grâce à l'IA explicable",
        "I passed my TCF thanks to explainable AI",
        lang
      )
    } else {
      return t(
        "Meilleure plateforme de préparation",
        "Best preparation platform",
        lang
      )
    }
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("Ils ont réussi", "They succeeded", lang)}
        </h2>
        <p className="text-center text-muted-foreground text-lg">
          {t(
            "Rejoignez des milliers d'étudiants qui ont transformé leur avenir",
            "Join thousands of students who transformed their future",
            lang
          )}
        </p>
      </div>

      {/* Animated Profile Container */}
      <div className="relative min-h-[500px] max-w-6xl mx-auto px-6">
        {stories.map((story, index) => {
          const position = positions[index] ?? index
          const isCenter = position === 0
          const profileUrl = getComprehensiveProfilePictureUrl(
            story.email,
            story.profileImage || undefined
          )
          const fullName = `${story.firstName} ${story.lastName}`
          const initials = `${story.firstName.charAt(0)}${story.lastName.charAt(0)}`
          const levelProgress = `${story.initialLevel} → ${story.currentLevel}`

          return (
            <div
              key={story.id}
              style={getPositionStyle(index, position)}
              className={`
                ${isCenter ? 'w-80' : 'w-64'}
                p-6 rounded-2xl bg-card/80 backdrop-blur-xl border-2 
                ${isCenter ? 'border-[#2ECC71] shadow-2xl' : 'border-border/50 shadow-lg'}
                transition-all duration-800 hover:scale-105
              `}
            >
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-4">
                <div className={`
                  relative ${isCenter ? 'w-20 h-20' : 'w-16 h-16'} 
                  rounded-full overflow-hidden ring-2 
                  ${isCenter ? 'ring-[#2ECC71]' : 'ring-[#2ECC71]/30'}
                  mb-3
                `}>
                  <Image
                    src={profileUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const fallback = document.createElement('div')
                        fallback.className = 'w-full h-full bg-gradient-to-br from-[#2ECC71] to-[#27c066] flex items-center justify-center text-white font-bold'
                        fallback.style.fontSize = isCenter ? '1.5rem' : '1.25rem'
                        fallback.textContent = initials
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                  {/* Fallback initials (hidden if image loads) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71] to-[#27c066] flex items-center justify-center text-white font-bold"
                    style={{ fontSize: isCenter ? '1.5rem' : '1.25rem', display: 'none' }}
                    data-fallback={true}
                  >
                    {initials}
                  </div>
                </div>

                {/* Name and Level */}
                <div className="text-center">
                  <div className={`font-semibold ${isCenter ? 'text-lg' : 'text-base'}`}>
                    {fullName}
                  </div>
                  <div className={`text-sm text-[#2ECC71] font-bold ${isCenter ? 'mt-1' : ''}`}>
                    {levelProgress}
                  </div>
                  {isCenter && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {story.progressPercentage}% {t("de réussite", "success rate", lang)}
                    </div>
                  )}
                </div>
              </div>

              {/* Testimonial Quote */}
              {isCenter && (
                <p className="text-muted-foreground italic text-center text-sm mt-4">
                  "{getTestimonial(story)}"
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

