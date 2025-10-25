import { Skeleton } from "@/components/ui/skeleton"

export default function AIProcessingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-6 w-32" />
        </div>

        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
