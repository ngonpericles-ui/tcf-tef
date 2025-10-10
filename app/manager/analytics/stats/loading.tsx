export default function StatsLoading() {
  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
