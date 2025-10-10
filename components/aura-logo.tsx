"use client"

import Image from "next/image"
import { useState } from "react"

interface AuraLogoProps {
  className?: string
  width?: number
  height?: number
  alt?: string
  priority?: boolean
}

export default function AuraLogo({ 
  className = "h-20 w-auto", 
  width = 1000, 
  height = 300,
  alt = "AURA.CA Logo",
  priority = false
}: AuraLogoProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-r from-[#2ECC71] to-[#27c066] rounded-lg p-4`}>
        <span className="text-white font-bold text-xl">AURA.CA</span>
      </div>
    )
  }

  return (
    <Image
      src="/logo/AURA.CA.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
      style={{
        filter: 'none'
      }}
    />
  )
}
