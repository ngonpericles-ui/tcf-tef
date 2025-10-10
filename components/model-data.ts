export type ModelMetrics = {
  accuracy: number // 0-100 (%)
  speedTokensPerSec: number // higher is better
  latencyMs: number // lower is better
  costPer1k: number // USD per 1k tokens, lower is better
  contextK: number // context length in K tokens (e.g., 128 = 128k)
  reliability: number // 0-100 (%)
  throughputRps: number // requests per second capacity
}

export type Model = {
  id: string
  name: string
  provider: string
  family?: string
  metrics: ModelMetrics
}

export type Weights = {
  accuracy: number
  speed: number
  latency: number
  cost: number
  context: number
  reliability: number
  throughput: number
}

export const defaultWeights: Weights = {
  accuracy: 0.35,
  speed: 0.15,
  latency: 0.1,
  cost: 0.15,
  context: 0.1,
  reliability: 0.1,
  throughput: 0.05,
}

// Helper clamps
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Normalization functions to 0-100 scale
export function normalizeMetrics(m: ModelMetrics) {
  // Accuracy is already 0-100
  const accuracy = clamp(m.accuracy, 0, 100)

  // Speed: assume 0 -> 0; 200+ t/s -> 100
  const speed = clamp((m.speedTokensPerSec / 200) * 100, 0, 100)

  // Latency: 50ms ~ 100, 300ms ~ 0
  const latency = clamp(((300 - m.latencyMs) / (300 - 50)) * 100, 0, 100)

  // Cost: $0.01 -> 100, $1.00 -> 0 (log-ish linear approx)
  const cost = clamp(((1 - m.costPer1k) / (1 - 0.01)) * 100, 0, 100)

  // Context: 8k -> 0, 128k -> 100
  const context = clamp(((m.contextK - 8) / (128 - 8)) * 100, 0, 100)

  // Reliability: already 0-100
  const reliability = clamp(m.reliability, 0, 100)

  // Throughput: 0 -> 0; 10 rps -> 100
  const throughput = clamp((m.throughputRps / 10) * 100, 0, 100)

  return { accuracy, speed, latency, cost, context, reliability, throughput }
}

export function computeScore(m: ModelMetrics, w: Weights) {
  const n = normalizeMetrics(m)
  const totalW = w.accuracy + w.speed + w.latency + w.cost + w.context + w.reliability + w.throughput || 1
  const score =
    (n.accuracy * w.accuracy +
      n.speed * w.speed +
      n.latency * w.latency +
      n.cost * w.cost +
      n.context * w.context +
      n.reliability * w.reliability +
      n.throughput * w.throughput) /
    totalW
  return Math.round(score)
}

// Simple score to color mapping (red->amber->green)
export function scoreColor(score: number) {
  if (score >= 85) return "bg-emerald-500"
  if (score >= 70) return "bg-lime-500"
  if (score >= 55) return "bg-amber-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-rose-500"
}

export function scoreRing(score: number) {
  const hue = score >= 85 ? 152 : score >= 70 ? 90 : score >= 55 ? 38 : score >= 40 ? 20 : 4
  return `hsl(${hue} 70% 45%)`
}

export const defaultModels: Model[] = [
  {
    id: "v0-gpt-5",
    name: "v0 GPT-5",
    provider: "v0",
    family: "GPT",
    metrics: {
      accuracy: 92,
      speedTokensPerSec: 190,
      latencyMs: 70,
      costPer1k: 0.02,
      contextK: 200,
      reliability: 97,
      throughputRps: 9,
    },
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    family: "GPT",
    metrics: {
      accuracy: 88,
      speedTokensPerSec: 120,
      latencyMs: 120,
      costPer1k: 0.03,
      contextK: 128,
      reliability: 95,
      throughputRps: 7,
    },
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    family: "Claude",
    metrics: {
      accuracy: 90,
      speedTokensPerSec: 110,
      latencyMs: 110,
      costPer1k: 0.025,
      contextK: 200,
      reliability: 96,
      throughputRps: 6,
    },
  },
  {
    id: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    provider: "Meta",
    family: "Llama",
    metrics: {
      accuracy: 86,
      speedTokensPerSec: 95,
      latencyMs: 140,
      costPer1k: 0.01,
      contextK: 128,
      reliability: 92,
      throughputRps: 5,
    },
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    family: "Mistral",
    metrics: {
      accuracy: 82,
      speedTokensPerSec: 130,
      latencyMs: 130,
      costPer1k: 0.015,
      contextK: 64,
      reliability: 90,
      throughputRps: 6,
    },
  },
  {
    id: "grok-2",
    name: "Grok-2",
    provider: "xAI",
    family: "Grok",
    metrics: {
      accuracy: 83,
      speedTokensPerSec: 140,
      latencyMs: 100,
      costPer1k: 0.02,
      contextK: 128,
      reliability: 91,
      throughputRps: 6,
    },
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    family: "Gemini",
    metrics: {
      accuracy: 85,
      speedTokensPerSec: 105,
      latencyMs: 130,
      costPer1k: 0.025,
      contextK: 1000, // 1M tokens ~ 1000k, clamp to max
      reliability: 94,
      throughputRps: 5,
    },
  },
]
