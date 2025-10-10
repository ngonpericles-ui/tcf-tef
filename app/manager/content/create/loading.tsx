export default function Loading() {
  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gray-800 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-800 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded w-64 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Role Badge Skeleton */}
        <div className="flex justify-center">
          <div className="h-10 bg-gray-800 rounded-full w-32 animate-pulse"></div>
        </div>

        {/* Content Types Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="w-5 h-5 bg-gray-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-24 animate-pulse"></div>
                  <div className="h-6 bg-gray-800 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
