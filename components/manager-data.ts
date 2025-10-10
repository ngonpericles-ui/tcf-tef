export type Visibility = "public" | "subscribers-only"
export type Status = "draft" | "published"

export type ManagerPost = {
  id: string
  author: string
  role: "Manager"
  verified: boolean
  createdAt: string
  title: string
  preview: string
  media?: string
  visibility: Visibility
  likes: number
  comments: number
  shares: number
  status: Status
  objectives: string[]
  keyPoints: string[]
}

// Seed data (front-end only)
export const managerPosts: ManagerPost[] = [
  {
    id: "p1",
    author: "Aïcha",
    role: "Manager",
    verified: true,
    createdAt: "2025-08-08T10:00:00Z",
    title: "10 erreurs fréquentes au passé composé",
    preview:
      "Évitez ces pièges courants avec des exemples clairs et des astuces mémorables pour améliorer votre précision.",
    media: "/french-grammar-illustration.png",
    visibility: "public",
    likes: 124,
    comments: 18,
    shares: 12,
    status: "published",
    objectives: [
      "Clarifier les règles d’accord et d’auxiliaire être/avoir",
      "Réduire les erreurs récurrentes des apprenants (B1–B2)",
      "Proposer des exercices d’auto‑évaluation rapides",
    ],
    keyPoints: [
      "Accord du participe passé avec être vs. avoir",
      "Emploi de “déjà” et “encore” au passé composé",
      "Négation et place des pronoms objets",
    ],
  },
  {
    id: "p2",
    author: "Julien",
    role: "Manager",
    verified: true,
    createdAt: "2025-08-08T07:00:00Z",
    title: "Exercices d’écoute B1: comprendre l’essentiel",
    preview:
      "Entraînez-vous avec des dialogues réalistes et des questions ciblées pour améliorer la compréhension globale.",
    media: "/listening-practice-audio-wave.png",
    visibility: "subscribers-only",
    likes: 89,
    comments: 10,
    shares: 4,
    status: "published",
    objectives: [
      "Renforcer la compréhension de l’idée générale (B1)",
      "Développer des stratégies d’écoute ciblées (mots clés, connecteurs)",
      "Préparer aux sections ‘Compréhension orale’ du TCF/TEF",
    ],
    keyPoints: [
      "Identifier l’intention du locuteur",
      "Repérer mots clés et marqueurs de discours",
      "Gestion du temps et des distracteurs",
    ],
  },
  {
    id: "p3",
    author: "Aïcha",
    role: "Manager",
    verified: true,
    createdAt: "2025-08-07T15:00:00Z",
    title: "Atelier: enrichir son vocabulaire pour la production écrite",
    preview:
      "Sélection de champs lexicaux et expressions idiomatiques pour améliorer la clarté et la richesse du style.",
    visibility: "public",
    likes: 62,
    comments: 7,
    shares: 5,
    status: "draft",
    objectives: [
      "Accroître la variété lexicale pour la production écrite",
      "Éviter les répétitions et les anglicismes",
      "Préparer des tournures utiles pour l’argumentation",
    ],
    keyPoints: [
      "Synonymes et nuances sémantiques",
      "Connecteurs logiques pour structurer un paragraphe",
      "Collocations fréquentes niveau B2–C1",
    ],
  },
]
