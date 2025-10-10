export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="h-32 bg-gray-800 animate-pulse"></div>
          <div className="p-6">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-gray-800 rounded-full animate-pulse -mt-16"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-6">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-800 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
