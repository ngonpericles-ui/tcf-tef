import { Skeleton } from "@/components/ui/skeleton"

export default function ManagerUploadLoading() {
  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-20 bg-gray-800" />
            <div>
              <Skeleton className="h-8 w-64 bg-gray-800" />
              <Skeleton className="h-4 w-48 mt-2 bg-gray-800" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 bg-gray-900 rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 bg-gray-900 rounded-lg" />
            <Skeleton className="h-64 bg-gray-900 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
