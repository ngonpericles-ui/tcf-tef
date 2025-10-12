"use client"

import { useParams } from "next/navigation"

// Generate static params for static export
import PageShell from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LiveSessionDetailsPage() {
  const params = useParams() as { id: string }
  const sessionId = params?.id

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">Détails de la session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground">
            <div>ID: {sessionId}</div>
            <p className="text-muted-foreground">
              Toutes les informations de la session seront affichées ici (instructeur, niveau, horaires, ressources, description, etc.).
            </p>
            <div className="flex gap-2">
              <Link href={`/live/${sessionId}`}>
                <Button>Rejoindre</Button>
              </Link>
              <Link href="/home">
                <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  )
}


