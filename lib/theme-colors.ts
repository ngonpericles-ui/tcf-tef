/**
 * Theme-aware color system for consistent light/dark mode support
 * This replaces hardcoded colors with proper theme-aware alternatives
 */

export const themeColors = {
  // Card backgrounds with proper theme adaptation
  card: {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", 
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    pink: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
    cyan: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    violet: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
    rose: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
  },

  // Text colors with proper contrast
  text: {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400", 
    orange: "text-orange-600 dark:text-orange-400",
    pink: "text-pink-600 dark:text-pink-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet: "text-violet-600 dark:text-violet-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400"
  },

  // Icon colors
  icon: {
    blue: "text-blue-500 dark:text-blue-400",
    green: "text-green-500 dark:text-green-400",
    purple: "text-purple-500 dark:text-purple-400",
    orange: "text-orange-500 dark:text-orange-400", 
    pink: "text-pink-500 dark:text-pink-400",
    cyan: "text-cyan-500 dark:text-cyan-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    violet: "text-violet-500 dark:text-violet-400",
    yellow: "text-yellow-500 dark:text-yellow-400",
    rose: "text-rose-500 dark:text-rose-400",
    indigo: "text-indigo-500 dark:text-indigo-400"
  },

  // Gradient backgrounds
  gradient: {
    blue: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    green: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    purple: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    orange: "bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30",
    pink: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30",
    multi: "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20"
  },

  // Badge colors
  badge: {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700"
  }
}

/**
 * Get theme-aware card styles
 */
export function getCardStyles(color: keyof typeof themeColors.card) {
  return themeColors.card[color]
}

/**
 * Get theme-aware text styles  
 */
export function getTextStyles(color: keyof typeof themeColors.text) {
  return themeColors.text[color]
}

/**
 * Get theme-aware icon styles
 */
export function getIconStyles(color: keyof typeof themeColors.icon) {
  return themeColors.icon[color]
}

/**
 * Get theme-aware gradient styles
 */
export function getGradientStyles(color: keyof typeof themeColors.gradient) {
  return themeColors.gradient[color]
}

/**
 * Get theme-aware badge styles
 */
export function getBadgeStyles(color: keyof typeof themeColors.badge) {
  return themeColors.badge[color]
}
