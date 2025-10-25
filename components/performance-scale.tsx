"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Plus, Download, Upload, SlidersHorizontal, BarChart3, Radar, Search, Trash2, CheckSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import BarChart from "./charts/bar-chart"
import RadarChart from "./charts/radar-chart"
import ScoreBadge from "./score-badge"
import {
  type Model,
  type Weights,
  defaultModels,
  defaultWeights,
  computeScore,
  normalizeMetrics,
  scoreColor,
} from "./model-data"

type SortKey = "score" | "name" | "provider" | "accuracy" | "latency" | "cost" | "speed"

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state])
  return [state, setState] as const
}

export default function PerformanceScale() {
  const [models, setModels] = useLocalStorage<Model[]>("models", defaultModels)
  const [weights, setWeights] = useLocalStorage<Weights>("weights", defaultWeights)
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState<string | "all">("all")
  const [selected, setSelected] = useState<string[]>([]) // for compare (up to 3)
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const providers = useMemo(() => ["all", ...Array.from(new Set(models.map((m) => m.provider)))], [models])

  const withScores = useMemo(
    () =>
      models.map((m) => ({
        ...m,
        score: computeScore(m.metrics, weights),
        normalized: normalizeMetrics(m.metrics),
      })),
    [models, weights],
  )

  const filtered = useMemo(() => {
    return withScores
      .filter((m) => (providerFilter === "all" ? true : m.provider.toLowerCase() === providerFilter.toLowerCase()))
      .filter((m) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          (m.family || "").toLowerCase().includes(q)
        )
      })
  }, [withScores, providerFilter, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortKey === "name" || sortKey === "provider") {
        return a[sortKey].localeCompare(b[sortKey]) * dir
      }
      if (sortKey === "score") return (a.score - b.score) * dir
      if (sortKey === "accuracy") return (a.metrics.accuracy - b.metrics.accuracy) * dir
      if (sortKey === "latency") return (a.metrics.latencyMs - b.metrics.latencyMs) * dir
      if (sortKey === "cost") return (a.metrics.costPer1k - b.metrics.costPer1k) * dir
      if (sortKey === "speed") return (a.metrics.speedTokensPerSec - b.metrics.speedTokensPerSec) * dir
      return 0
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const barData = useMemo(() => sorted.map((m) => ({ id: m.id, name: m.name, score: m.score })), [sorted])

  const top3 = useMemo(() => [...withScores].sort((a, b) => b.score - a.score).slice(0, 3), [withScores])

  const compareIds = selected.slice(0, 3)
  const compareModels = compareIds.length ? withScores.filter((m) => compareIds.includes(m.id)) : top3

  const radarData = useMemo(() => {
    const metrics = ["accuracy", "speed", "latency", "cost", "context", "reliability", "throughput"] as const
    return metrics.map((metric) => {
      const row: any = { metric }
      compareModels.forEach((m) => {
        row[m.name] = (m.normalized as any)[metric]
      })
      return row
    })
  }, [compareModels])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id] // keep last 2, add new
      return [...prev, id]
    })
  }

  function clearAll() {
    setSelected([])
    setSearch("")
    setProviderFilter("all")
    setSortKey("score")
    setSortDir("desc")
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(models, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "models.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (Array.isArray(parsed)) {
          // basic validation
          setModels(parsed)
        }
      } catch (err) {
        console.error("Invalid JSON", err)
      }
    }
    reader.readAsText(file)
    e.currentTarget.value = ""
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Overview</CardTitle>
          <CardDescription>
            {"Score each model from 1–100 and visualize differences across key metrics."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" aria-hidden="true" />
                <Input
                  placeholder="Search models, providers, families"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-72"
                  aria-label="Search"
                />
              </div>
              <select
                aria-label="Filter by provider"
                className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All providers" : p}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 bg-transparent">
                <Trash2 className="h-4 w-4" />
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <WeightsDialog weights={weights} onChange={setWeights} />
              <AddModelDialog onAdd={(m) => setModels((prev) => [...prev, m])} />
              <div className="relative">
                <input
                  id="import-json"
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={onImportFile}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("import-json")?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
              <Button variant="default" size="sm" onClick={exportJSON} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="bar">
            <TabsList>
              <TabsTrigger value="bar" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Scores
              </TabsTrigger>
              <TabsTrigger value="radar" className="gap-2">
                <Radar className="h-4 w-4" />
                Metrics Comparison
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bar" className="mt-4">
              <BarChart data={barData} onBarClick={(id) => toggleSelect(id)} />
              <div className="mt-2 text-xs text-neutral-600">
                {"Click a bar to add/remove a model in the comparison panel (up to 3)."}
              </div>
            </TabsContent>
            <TabsContent value="radar" className="mt-4">
              <RadarChart
                data={radarData as any}
                seriesKeys={compareModels.map((m) => m.name)}
                colors={["#10b981", "#84cc16", "#f59e0b", "#ef4444"]}
              />
              <div className="mt-2 text-xs text-neutral-600">
                {"Higher is better for all normalized axes; latency and cost are inverted when normalized."}
              </div>
            </TabsContent>
          </Tabs>

          <CompareStrip
            models={withScores}
            selected={selected}
            onToggle={toggleSelect}
            onClear={() => setSelected([])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Models</CardTitle>
          <CardDescription>{"Sortable, filterable list with key metrics and overall scores."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <HeaderCell label="Compare" />
                  <SortableHeader
                    label="Model"
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  <SortableHeader
                    label="Provider"
                    active={sortKey === "provider"}
                    dir={sortDir}
                    onClick={() => toggleSort("provider")}
                  />
                  <SortableHeader
                    label="Score"
                    active={sortKey === "score"}
                    dir={sortDir}
                    onClick={() => toggleSort("score")}
                  />
                  <SortableHeader
                    label="Accuracy"
                    active={sortKey === "accuracy"}
                    dir={sortDir}
                    onClick={() => toggleSort("accuracy")}
                  />
                  <SortableHeader
                    label="Latency (ms)"
                    active={sortKey === "latency"}
                    dir={sortDir}
                    onClick={() => toggleSort("latency")}
                  />
                  <SortableHeader
                    label="Cost ($/1k)"
                    active={sortKey === "cost"}
                    dir={sortDir}
                    onClick={() => toggleSort("cost")}
                  />
                  <SortableHeader
                    label="Speed (t/s)"
                    active={sortKey === "speed"}
                    dir={sortDir}
                    onClick={() => toggleSort("speed")}
                  />
                  <HeaderCell label="Context (k)" />
                  <HeaderCell label="Reliability (%)" />
                  <HeaderCell label="Throughput (rps)" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m.id} className="hover:bg-neutral-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selected.includes(m.id)}
                          onCheckedChange={() => toggleSelect(m.id)}
                          aria-label={`Select ${m.name} for comparison`}
                        />
                        <CheckSquare
                          className={cn("h-4 w-4", selected.includes(m.id) ? "text-emerald-600" : "text-neutral-400")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-neutral-500">{m.family}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.provider}</Badge>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={m.score} />
                    </TableCell>
                    <TableCell className="tabular-nums">{m.metrics.accuracy}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.latencyMs}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.costPer1k.toFixed(3)}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.speedTokensPerSec}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.contextK}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.reliability}</TableCell>
                    <TableCell className="tabular-nums">{m.metrics.throughputRps}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active?: boolean
  dir?: "asc" | "desc"
  onClick?: () => void
}) {
  return (
    <TableHead
      role="button"
      onClick={onClick}
      className={cn("cursor-pointer select-none", active ? "text-neutral-900" : "text-neutral-600")}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {active && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}
      </div>
    </TableHead>
  )
}

function HeaderCell({ label }: { label: string }) {
  return <TableHead className="text-neutral-600">{label}</TableHead>
}

function CompareStrip({
  models,
  selected,
  onToggle,
  onClear,
}: {
  models: (Model & { score: number })[]
  selected: string[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const chosen = models.filter((m) => selected.includes(m.id))
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Compare</span>
          <span className="text-xs text-neutral-500">{chosen.length} / 3 selected</span>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <Separator className="my-3" />
      <div className="flex flex-wrap gap-2">
        {chosen.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Select models from the table or chart to compare up to 3 at a time.
          </p>
        ) : (
          chosen.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{m.name}</span>
                <span className="text-xs text-neutral-500">{m.provider}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", scoreColor(m.score))} />
                <span className="text-sm font-semibold tabular-nums">{m.score}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggle(m.id)}
                aria-label={`Remove ${m.name} from comparison`}
              >
                ×
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function WeightsDialog({ weights, onChange }: { weights: Weights; onChange: (w: Weights) => void }) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<Weights>(weights)

  useEffect(() => setLocal(weights), [weights])

  const total = Object.values(local).reduce((a, b) => a + b, 0)
  const fields: { key: keyof Weights; label: string }[] = [
    { key: "accuracy", label: "Accuracy" },
    { key: "speed", label: "Speed" },
    { key: "latency", label: "Latency" },
    { key: "cost", label: "Cost efficiency" },
    { key: "context", label: "Context length" },
    { key: "reliability", label: "Reliability" },
    { key: "throughput", label: "Throughput" },
  ]

  function setWeight(k: keyof Weights, v: number) {
    setLocal((prev) => ({ ...prev, [k]: v }))
  }

  function apply() {
    onChange(local)
    setOpen(false)
  }

  function reset() {
    setLocal(defaultWeights)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <SlidersHorizontal className="h-4 w-4" />
          Weights
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scoring Weights</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {fields.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-12 items-center gap-3">
              <Label htmlFor={`w-${key}`} className="col-span-5 text-sm">
                {label}
              </Label>
              <div className="col-span-5">
                <Slider
                  id={`w-${key}`}
                  min={0}
                  max={1}
                  step={0.01}
                  value={[local[key]]}
                  onValueChange={([v]) => setWeight(key, v)}
                />
              </div>
              <div className="col-span-2 text-right text-sm tabular-nums">{local[key].toFixed(2)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-md border bg-neutral-50 px-3 py-2">
            <span className="text-sm text-neutral-600">Total weight</span>
            <span className="text-sm font-medium tabular-nums">{total.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={reset}>
            Reset defaults
          </Button>
          <Button onClick={apply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddModelDialog({ onAdd }: { onAdd: (m: Model) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    provider: "",
    family: "",
    accuracy: 80,
    speed: 100,
    latency: 120,
    cost: 0.02,
    context: 128,
    reliability: 90,
    throughput: 5,
  })

  function add() {
    if (!form.name || !form.provider) return
    const m: Model = {
      id: `${form.provider}-${form.name}`.toLowerCase().replace(/\s+/g, "-"),
      name: form.name,
      provider: form.provider,
      family: form.family || undefined,
      metrics: {
        accuracy: Number(form.accuracy),
        speedTokensPerSec: Number(form.speed),
        latencyMs: Number(form.latency),
        costPer1k: Number(form.cost),
        contextK: Number(form.context),
        reliability: Number(form.reliability),
        throughputRps: Number(form.throughput),
      },
    }
    onAdd(m)
    setOpen(false)
    setForm({
      name: "",
      provider: "",
      family: "",
      accuracy: 80,
      speed: 100,
      latency: 120,
      cost: 0.02,
      context: 128,
      reliability: 90,
      throughput: 5,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add model
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add custom model</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Provider" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} />
          <Field label="Family" value={form.family} onChange={(v) => setForm({ ...form, family: v })} />
          <NumberField
            label="Accuracy (0-100)"
            value={form.accuracy}
            onChange={(v) => setForm({ ...form, accuracy: v })}
          />
          <NumberField label="Speed (tokens/s)" value={form.speed} onChange={(v) => setForm({ ...form, speed: v })} />
          <NumberField label="Latency (ms)" value={form.latency} onChange={(v) => setForm({ ...form, latency: v })} />
          <NumberField
            label="Cost ($/1k)"
            step="0.001"
            value={form.cost}
            onChange={(v) => setForm({ ...form, cost: v })}
          />
          <NumberField label="Context (k)" value={form.context} onChange={(v) => setForm({ ...form, context: v })} />
          <NumberField
            label="Reliability (0-100)"
            value={form.reliability}
            onChange={(v) => setForm({ ...form, reliability: v })}
          />
          <NumberField
            label="Throughput (rps)"
            value={form.throughput}
            onChange={(v) => setForm({ ...form, throughput: v })}
          />
        </div>
        <DialogFooter>
          <Button onClick={add}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: string
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step={step || "1"}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
