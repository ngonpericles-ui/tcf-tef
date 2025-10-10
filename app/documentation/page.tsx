"use client"

import Link from "next/link"
import PageShell from "@/components/page-shell"
import { Checklist } from "@/components/checklist"
import ManagerPostsSummary from "@/components/manager-posts-summary"
import { useLang } from "@/components/language-provider"

export default function DocumentationPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  return (
    <PageShell>
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)]">
            {t("Documentation & Plan d'implémentation", "Documentation & Implementation Plan")}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            {t(
              "Vue d'ensemble complète des fonctionnalités, thèmes, langues et accessibilité.",
              "Complete overview of features, themes, languages and accessibility.",
            )}
          </p>
        </header>

        <section className="space-y-2 mb-8">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)]">
            {t("Résumé des publications Manager", "Manager Posts Summary")}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t(
              "Synthèse détaillée des objectifs pédagogiques et points clés pour chaque publication du Manager.",
              "Detailed synthesis of learning objectives and key points for each Manager post.",
            )}
          </p>
          <ManagerPostsSummary />
        </section>

        <Checklist
          title={t("Infrastructure globale (✓)", "Global Infrastructure (✓)")}
          items={[
            {
              label: t(
                "ThemeProvider global dans app/layout.tsx avec next-themes",
                "Global ThemeProvider in app/layout.tsx with next-themes",
              ),
              done: true,
            },
            {
              label: t(
                "LanguageProvider global avec persistance localStorage",
                "Global LanguageProvider with localStorage persistence",
              ),
              done: true,
            },
            {
              label: t(
                "Transitions fluides entre thèmes (200ms duration)",
                "Smooth theme transitions (200ms duration)",
              ),
              done: true,
            },
            {
              label: t(
                "Support système de thème automatique (prefers-color-scheme)",
                "Automatic system theme support (prefers-color-scheme)",
              ),
              done: true,
            },
            {
              label: t(
                "Prévention des erreurs d'hydratation avec mounted state",
                "Hydration mismatch prevention with mounted state",
              ),
              done: true,
            },
          ]}
        />

        <Checklist
          title={t("Pages utilisateur complètes (✓)", "Complete User Pages (✓)")}
          items={[
            {
              label: t("Page d'accueil (/) avec tous les composants", "Home page (/) with all components"),
              done: true,
            },
            {
              label: t("Inscription (/inscription) avec essai gratuit", "Sign up (/inscription) with free trial"),
              done: true,
            },
            { label: t("Connexion (/connexion)", "Login (/connexion)"), done: true },
            {
              label: t(
                "Abonnement (/abonnement) avec plans et essai 1 jour",
                "Subscription (/abonnement) with plans and 1-day trial",
              ),
              done: true,
            },
            { label: t("Profil (/profil) avec statut d'essai", "Profile (/profil) with trial status"), done: true },
            {
              label: t(
                "Cours (/cours) avec modules et verrouillage Premium",
                "Courses (/cours) with modules and Premium gating",
              ),
              done: true,
            },
            { label: t("Tests (/tests) avec sélecteurs de temps", "Tests (/tests) with time selectors"), done: true },
            { label: t("Favoris (/favoris)", "Favorites (/favoris)"), done: true },
            {
              label: t(
                "Notifications (/notifications) avec marquer tout lu",
                "Notifications (/notifications) with mark all read",
              ),
              done: true,
            },
            { label: t("Live (/live) avec sessions programmées", "Live (/live) with scheduled sessions"), done: true },
            {
              label: t(
                "Détail post (/posts/[id]) avec verrouillage contenu",
                "Post detail (/posts/[id]) with content gating",
              ),
              done: true,
            },
          ]}
        />

        <Checklist
          title={t("Fonctionnalités thème & langue (✓)", "Theme & Language Features (✓)")}
          items={[
            {
              label: t("Toggle thème dans header avec icônes animées", "Theme toggle in header with animated icons"),
              done: true,
            },
            {
              label: t(
                "Toggle langue FR/EN dans header avec état actif",
                "FR/EN language toggle in header with active state",
              ),
              done: true,
            },
            {
              label: t("Contrôles dupliqués dans footer avec emojis", "Duplicate controls in footer with emojis"),
              done: true,
            },
            {
              label: t(
                "Thème sombre: arrière-plans #0A0A0A, bordures subtiles",
                "Dark theme: #0A0A0A backgrounds, subtle borders",
              ),
              done: true,
            },
            {
              label: t(
                "Thème clair: arrière-plans blancs, bordures neutres",
                "Light theme: white backgrounds, neutral borders",
              ),
              done: true,
            },
            {
              label: t(
                "Navigation active avec états visuels dans les deux thèmes",
                "Active navigation with visual states in both themes",
              ),
              done: true,
            },
          ]}
        />

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)]">
            {t("Guide de résolution des problèmes de thème", "Theme Implementation Resolution Guide")}
          </h2>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 space-y-4">
            <h3 className="font-medium">{t("Étapes de résolution", "Resolution Steps")}</h3>
            <ol className="list-decimal pl-6 text-sm space-y-2">
              <li>
                <strong>{t("Création du ThemeProvider", "ThemeProvider Creation")}:</strong>{" "}
                {t(
                  "Composant wrapper pour next-themes avec configuration optimale",
                  "Wrapper component for next-themes with optimal configuration",
                )}
              </li>
              <li>
                <strong>{t("Intégration globale", "Global Integration")}:</strong>{" "}
                {t(
                  "Déplacement vers app/layout.tsx pour persistance entre pages",
                  "Moved to app/layout.tsx for persistence across pages",
                )}
              </li>
              <li>
                <strong>{t("Prévention hydratation", "Hydration Prevention")}:</strong>{" "}
                {t(
                  "État mounted pour éviter les erreurs client/serveur",
                  "Mounted state to prevent client/server mismatches",
                )}
              </li>
              <li>
                <strong>{t("Transitions fluides", "Smooth Transitions")}:</strong>{" "}
                {t(
                  "Classes CSS transition-colors avec durée 200ms",
                  "CSS transition-colors classes with 200ms duration",
                )}
              </li>
              <li>
                <strong>{t("Cohérence visuelle", "Visual Consistency")}:</strong>{" "}
                {t(
                  "Couleurs et bordures harmonisées dans tous les composants",
                  "Harmonized colors and borders across all components",
                )}
              </li>
            </ol>
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)]">
            {t("Test de fonctionnalité", "Functionality Testing")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-lg p-4 dark:border-neutral-700">
              <h4 className="font-medium mb-2">{t("Test de thème", "Theme Testing")}</h4>
              <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>• {t("Cliquer sur l'icône lune/soleil", "Click moon/sun icon")}</li>
                <li>• {t("Vérifier la transition fluide", "Check smooth transition")}</li>
                <li>• {t("Naviguer entre pages", "Navigate between pages")}</li>
                <li>• {t("Confirmer la persistance", "Confirm persistence")}</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 dark:border-neutral-700">
              <h4 className="font-medium mb-2">{t("Test de langue", "Language Testing")}</h4>
              <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>• {t("Cliquer sur FR/EN", "Click FR/EN")}</li>
                <li>• {t("Vérifier changement immédiat", "Check immediate change")}</li>
                <li>• {t("Tester sur toutes les pages", "Test on all pages")}</li>
                <li>• {t("Confirmer localStorage", "Confirm localStorage")}</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-sm">
          <Link href="/" className="text-[#007BFF] hover:underline">
            {t("← Retour à l'accueil", "← Back to Home")}
          </Link>
        </footer>
      </div>
    </PageShell>
  )
}
