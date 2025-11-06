export function SessionSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background dark animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-9 w-9 bg-muted rounded-full" />
          </div>
        </div>
      </div>

      {/* Video Grid Skeleton */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-7xl mx-auto">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-video bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Control Bar Skeleton */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="h-12 w-12 bg-muted rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-12 w-32 bg-muted rounded-lg" />
            <div className="h-12 w-32 bg-muted rounded-lg" />
            <div className="h-12 w-24 bg-muted rounded-lg" />
          </div>
          <div className="h-12 w-12 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  )
}
