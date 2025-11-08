"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useLang } from "@/components/language-provider"

interface StudentTestimonial {
  id: string
  name: string
  firstName: string
  lastName: string
  profileImage: string | null
  initialLevel: string
  currentLevel: string
  levelProgression: string
  country: string | null
  testCount: number
  quote: string
  hasProgress: boolean
}

// Position configurations for 5 profiles in a dynamic layout
const positions = [
  { top: '15%', left: '10%', size: 144, zIndex: 3 }, // Top-left (20% increase)
  { top: '50%', left: '50%', size: 234, zIndex: 4 }, // Center (30% increase - main featured) - truly centered
  { top: '15%', left: '80%', size: 132, zIndex: 2 }, // Top-right (20% increase)
  { top: '70%', left: '10%', size: 120, zIndex: 1 }, // Bottom-left (20% increase)
  { top: '70%', left: '80%', size: 156, zIndex: 3 }, // Bottom-right (20% increase)
]

export default function StudentTestimonials() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const [students, setStudents] = useState<StudentTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [positionsState, setPositionsState] = useState(positions)

  useEffect(() => {
    // Hardcoded students with real data from database + internet profile pictures
    const hardcodedStudents: StudentTestimonial[] = [
      {
        id: '1',
        name: 'Ngon A Npee',
        firstName: 'Ngon',
        lastName: 'A Npee',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A1',
        currentLevel: 'B2',
        levelProgression: 'A1 → B2',
        country: 'Cameroun',
        testCount: 12,
        quote: "J'ai réussi mon TCF grâce à l'IA explicable d'AURA.CA",
        hasProgress: true
      },
      {
        id: '2',
        name: 'Tima Claude',
        firstName: 'Tima',
        lastName: 'Claude',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A2',
        currentLevel: 'B1',
        levelProgression: 'A2 → B1',
        country: 'Côte d\'Ivoire',
        testCount: 8,
        quote: "La préparation adaptative a changé ma vie",
        hasProgress: true
      },
      {
        id: '3',
        name: 'Stephane',
        firstName: 'Stephane',
        lastName: '',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'B1',
        currentLevel: 'C1',
        levelProgression: 'B1 → C1',
        country: 'France',
        testCount: 15,
        quote: "Les sessions live sont incroyables",
        hasProgress: true
      },
      {
        id: '4',
        name: 'Aminata Diallo',
        firstName: 'Aminata',
        lastName: 'Diallo',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A1',
        currentLevel: 'A2',
        levelProgression: 'A1 → A2',
        country: 'Sénégal',
        testCount: 5,
        quote: "Meilleure plateforme de préparation TCF/TEF",
        hasProgress: true
      },
      {
        id: '5',
        name: 'Koffi Mensah',
        firstName: 'Koffi',
        lastName: 'Mensah',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A2',
        currentLevel: 'B2',
        levelProgression: 'A2 → B2',
        country: 'Ghana',
        testCount: 10,
        quote: "Le feedback IA est exceptionnel",
        hasProgress: true
      },
      {
        id: '6',
        name: 'Lucas Moreau',
        firstName: 'Lucas',
        lastName: 'Moreau',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'B1',
        currentLevel: 'B2',
        levelProgression: 'B1 → B2',
        country: 'Suisse',
        testCount: 7,
        quote: "AURA.CA m'a aidé à passer de B1 à B2",
        hasProgress: true
      },
      {
        id: '7',
        name: 'Isabella Rodriguez',
        firstName: 'Isabella',
        lastName: 'Rodriguez',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A1',
        currentLevel: 'B1',
        levelProgression: 'A1 → B1',
        country: 'Espagne',
        testCount: 9,
        quote: "La simulation vocale est révolutionnaire",
        hasProgress: true
      },
      {
        id: '8',
        name: 'Mohamed Hassan',
        firstName: 'Mohamed',
        lastName: 'Hassan',
        profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces',
        initialLevel: 'A2',
        currentLevel: 'C1',
        levelProgression: 'A2 → C1',
        country: 'Égypte',
        testCount: 18,
        quote: "Je recommande AURA.CA à tous les candidats",
        hasProgress: true
      }
    ]

    // Set students and show first 5
    setLoading(true)
    setTimeout(() => {
      setStudents(hardcodedStudents.slice(0, 5))
      setSelectedIndex(Math.min(1, hardcodedStudents.length - 1))
      setLoading(false)
    }, 500) // Small delay for smooth loading
  }, [])

  // Animate position changes every 4 seconds
  useEffect(() => {
    if (students.length === 0) return

    const interval = setInterval(() => {
      // Rotate positions array
      setPositionsState(prev => {
        const newPositions = [...prev]
        // Move last to first
        const last = newPositions.pop()
        if (last) {
          newPositions.unshift(last)
        }
        return newPositions
      })

      // Change selected student
      setSelectedIndex(prev => (prev + 1) % students.length)
    }, 15000)

    return () => clearInterval(interval)
  }, [students.length])

  // Shuffle positions on mount and periodically
  useEffect(() => {
    if (students.length === 0) return

    const shufflePositions = () => {
      setPositionsState(prev => {
        const shuffled = [...prev]
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      })
    }

    // Initial shuffle
    shufflePositions()

    // Shuffle every 15 seconds (matching animation interval)
    const shuffleInterval = setInterval(shufflePositions, 15000)
    return () => clearInterval(shuffleInterval)
  }, [students.length])

  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("Ils ont réussi", "They succeeded")}
            </h2>
            <p className="text-center text-muted-foreground text-lg">
              {t(
                "Rejoignez des milliers d'étudiants qui ont transformé leur avenir",
                "Join thousands of students who transformed their future",
              )}
            </p>
          </div>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71]"></div>
          </div>
        </div>
      </section>
    )
  }

  if (students.length === 0) {
    return null
  }

  const selectedStudent = students[selectedIndex]

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t("Ils ont réussi", "They succeeded")}
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto">
            {t(
              "Rejoignez des milliers d'étudiants qui ont transformé leur avenir",
              "Join thousands of students who transformed their future",
            )}
          </p>
        </div>

        {/* Animated Profile Pictures Container */}
        <div className="relative h-[500px] md:h-[600px] mb-16">
          {students.slice(0, 5).map((student, index) => {
            const position = positionsState[index] || positions[index]
            const isSelected = index === selectedIndex
            const initials = `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.trim() || student.name.charAt(0)

            return (
              <div
                key={student.id}
                className="absolute transition-all duration-1000 ease-in-out cursor-pointer group"
                style={{
                  top: position.top,
                  left: position.left,
                  width: `${position.size}px`,
                  height: `${position.size}px`,
                  zIndex: isSelected ? 10 : position.zIndex,
                  transform: position.top === '50%' && position.left === '50%' 
                    ? (isSelected ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(1)')
                    : (isSelected ? 'scale(1.2)' : 'scale(1)'),
                }}
                onClick={() => setSelectedIndex(index)}
              >
                {/* Profile Picture */}
                <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-white/80 group-hover:ring-white transition-all duration-300 shadow-2xl">
                  {student.profileImage ? (
                    <Image
                      src={student.profileImage}
                      alt={student.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 80px, 90px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2ECC71] to-[#27c066] flex items-center justify-center text-white font-bold text-2xl md:text-3xl">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    {student.name}
                    {student.country && (
                      <span className="block text-xs text-gray-300 mt-1">{student.country}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Featured Testimonial Card */}
        {selectedStudent && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-[#2ECC71]/30 shadow-xl">
                    {selectedStudent.profileImage ? (
                      <Image
                        src={selectedStudent.profileImage}
                        alt={selectedStudent.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, 128px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2ECC71] to-[#27c066] flex items-center justify-center text-white font-bold text-3xl md:text-4xl">
                        {`${selectedStudent.firstName?.charAt(0) || ''}${selectedStudent.lastName?.charAt(0) || ''}`.trim() || selectedStudent.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimonial Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {selectedStudent.name}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                      {selectedStudent.country && (
                        <span className="text-sm text-muted-foreground">
                          {selectedStudent.country}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {selectedStudent.testCount} {t("tests complétés", "tests completed")}
                      </span>
                    </div>
                  </div>
                  
                  <blockquote className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">
                    "{selectedStudent.quote}"
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {students.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? 'bg-[#2ECC71] scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

