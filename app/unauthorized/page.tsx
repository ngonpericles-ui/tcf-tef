"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Accès restreint
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Cette page est réservée aux administrateurs uniquement.</p>
            <p>Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
          </div>
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button 
              onClick={() => router.push("/manager")} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              Tableau de bord Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}