import { Skeleton } from "@/components/ui/skeleton"

export default function ModerationLoading() {
  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 bg-gray-800" />
            <Skeleton className="h-4 w-48 mt-2 bg-gray-800" />
          </div>
          <Skeleton className="h-6 w-32 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-gray-900 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-20 bg-gray-900 rounded-lg" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-gray-900 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
