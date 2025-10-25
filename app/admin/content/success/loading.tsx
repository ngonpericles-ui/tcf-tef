import { Skeleton } from "@/components/ui/skeleton"

export default function ContentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-10 w-96 mx-auto mb-2" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <div>
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
