'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface CircularProgressCounterProps {
  used: number
  total: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export function CircularProgressCounter({
  used,
  total,
  size = 180,
  strokeWidth = 12,
  label = "Simulations gratuites",
  className = ""
}: CircularProgressCounterProps) {
  // Ensure values are valid numbers
  const usedNum = typeof used === 'number' && !isNaN(used) ? used : 0
  // Handle Infinity for unlimited simulations
  const totalNum = total === Infinity || total === -1 ? Infinity : (typeof total === 'number' && !isNaN(total) && total > 0 ? total : 1)
  
  // Calculate remaining (Infinity means unlimited)
  const remaining = totalNum === Infinity ? Infinity : Math.max(0, totalNum - usedNum)
  const percentage = totalNum === Infinity ? 100 : (totalNum > 0 ? (remaining / totalNum) * 100 : 0)
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  
  // Dynamic color based on remaining attempts
  const getColor = () => {
    if (remaining === Infinity) return { from: '#007BFF', to: '#0056b3', text: 'text-blue-600' } // Blue for unlimited
    if (remaining > 3) return { from: '#10B981', to: '#059669', text: 'text-green-600' } // Green
    if (remaining > 1) return { from: '#F59E0B', to: '#D97706', text: 'text-yellow-600' } // Yellow
    if (remaining > 0) return { from: '#EF4444', to: '#DC2626', text: 'text-red-600' } // Red
    return { from: '#6B7280', to: '#4B5563', text: 'text-gray-600' } // Gray
  }
  
  const color = getColor()
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.from} />
              <stop offset="100%" stopColor={color.to} />
            </linearGradient>
          </defs>
          
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-center"
          >
            <div className={`text-4xl font-bold ${color.text}`}>
              {remaining === Infinity ? '∞' : remaining}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              / {total === Infinity ? '∞' : total}
            </div>
          </motion.div>
        </div>
        
        {/* Pulse animation when low */}
        {remaining > 0 && remaining <= 2 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${color.from}`,
              opacity: 0.3
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
      
      {/* Label */}
      <div className="mt-4 text-center">
        <p className={`text-sm font-semibold ${color.text}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {remaining > 0 
            ? `${remaining} simulation${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`
            : "Abonnez-vous pour continuer"
          }
        </p>
      </div>
    </div>
  )
}

