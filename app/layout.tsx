import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import ErrorBoundary from "@/components/error-boundary"
import ChunkErrorHandler from "@/components/chunk-error-handler"

// Force dynamic rendering for all routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "TCF/TEF Prep Platform",
  description: "Premium bilingual learning platform for TCF/TEF preparation with personalized AI coaching.",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ChunkErrorHandler />
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
            <LanguageProvider>
              <AuthProvider>
                <div className="min-h-screen transition-colors duration-200">{children}</div>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
