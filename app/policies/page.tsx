"use client"

import Image from "next/image"
import Link from "next/link"
import { Shield, Lock, FileText, ChevronRight, CheckCircle2 } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function PoliciesPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const sections = [
    {
      id: "overview",
      title: t("Aperçu", "Overview"),
      content:
        t("Ces politiques décrivent comment AURA protège la vie privée, sécurise les données et régit l'utilisation de la plateforme. Elles complètent nos Conditions générales et notre Politique de confidentialité.",
          "These Policies outline how AURA protects user privacy, secures data, and governs platform usage. They complement our Terms & Conditions and Privacy Policy."),
    },
    {
      id: "privacy",
      title: t("Principes de confidentialité", "Privacy Principles"),
      content:
        t("Nous appliquons la protection des données dès la conception : minimisation des données, limitation des finalités, chiffrement en transit et au repos, et contrôles d'accès basés sur les rôles. La pseudonymisation est utilisée lorsque pertinent.",
          "We apply privacy‑by‑design: data minimization, purpose limitation, encryption in transit and at rest, and role‑based access controls. Pseudonymization is used where feasible."),
    },
    {
      id: "security",
      title: t("Mesures de sécurité", "Security Measures"),
      content:
        t("Nous appliquons le principe du moindre privilège, l'authentification multifacteur pour les administrateurs, la mise à jour régulière des dépendances, des revues de sécurité du SDLC et une surveillance continue. Les procédures de réponse aux incidents sont testées régulièrement.",
          "We implement least privilege, MFA for administrators, regular dependency patching, secure SDLC reviews, and continuous monitoring. Incident response procedures are regularly tested."),
    },
    {
      id: "data-processing",
      title: t("Traitement des données & Sous‑traitants", "Data Processing & Sub‑processors"),
      content:
        t("Nous utilisons des fournisseurs cloud réputés avec des options de résidence des données. Les sous‑traitants sont évalués pour leur conformité. Des accords de traitement des données et des clauses contractuelles types sont maintenus lorsque requis.",
          "We use reputable cloud providers with data residency options. Sub‑processors are vetted for compliance. Data processing agreements and SCCs are maintained where applicable."),
    },
    {
      id: "retention",
      title: t("Conservation & Suppression", "Retention & Deletion"),
      content:
        t("Les données des utilisateurs sont conservées uniquement aussi longtemps que nécessaire pour les fonctionnalités d'apprentissage, la conformité et la prévention de la fraude. Les utilisateurs peuvent demander la suppression ; les sauvegardes sont purgées selon un calendrier roulant.",
          "User data is retained only as long as necessary for learning features, compliance, and fraud prevention. Users may request deletion; backups are purged on a rolling schedule."),
    },
    {
      id: "ai",
      title: t("IA responsable", "Responsible AI"),
      content:
        t("Le feedback IA inclut des indicateurs de confiance et une escalade avec intervention humaine pour les cas à faible confiance. Nous surveillons les biais et offrons des voies de recours pour les résultats contestés.",
          "AI feedback includes confidence indicators and human‑in‑the‑loop escalation for low‑confidence cases. We monitor for bias and provide appeal pathways for contested results."),
    },
    {
      id: "contact",
      title: t("Contact & Demandes", "Contact & Requests"),
      content:
        t("Pour les demandes de confidentialité ou de sécurité, contactez privacy@aura‑prep.com ou security@aura‑prep.com. Nous répondons dans les délais légaux.",
          "For privacy or security requests, contact privacy@aura‑prep.com or security@aura‑prep.com. We aim to respond within statutory timelines."),
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=85&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3"
            alt="Abstract secure network and data protection"
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
            quality={85}
          />
        </div>
        <div className="container mx-auto max-w-5xl px-4 md:px-8 py-20 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-sm font-medium mb-6">
            <Shield className="h-4 w-4" /> {t("Politiques", "Policies")}
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            {t("Politiques de la plateforme", "Platform Policies")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl">
            {t(
              "Nos pratiques de confidentialité, de sécurité et de gouvernance conçues pour une plateforme d'apprentissage et d'évaluation de niveau entreprise.",
              "Our privacy, security, and governance practices designed for an enterprise‑grade learning and assessment platform."
            )}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("Crédit image : Unsplash.", "Image credit: Unsplash.")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto max-w-5xl px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
          {/* TOC */}
          <aside className="md:sticky md:top-24 h-max">
            <nav className="space-y-1" aria-label="Section navigation">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:shadow-sm transition-all duration-200 focus:outline-none"
                >
                  <span>{s.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </a>
              ))}
            </nav>
            <div className="mt-6 rounded-md border p-3 text-xs text-muted-foreground">
              {t("Liens : ", "Related: ")}
              <Link className="underline" href="/privacy">{t("Politique de confidentialité", "Privacy Policy")}</Link> • <Link className="underline" href="/terms">{t("Conditions générales", "Terms & Conditions")}</Link>
            </div>
          </aside>

          {/* Body */}
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight mb-3">{s.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{s.content}</p>
              </section>
            ))}

            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" /> {t("Dernière mise à jour : 2025‑08‑01", "Last updated: 2025‑08‑01")}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

