import { Skeleton } from "@/components/ui/skeleton"

export default function CreateManagerLoading() {
  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-20 bg-gray-800" />
          <div>
            <Skeleton className="h-8 w-48 bg-gray-800" />
            <Skeleton className="h-4 w-64 mt-2 bg-gray-800" />
          </div>
        </div>

        <Skeleton className="h-32 bg-gray-900 rounded-lg" />
        <Skeleton className="h-96 bg-gray-900 rounded-lg" />
      </div>
    </div>
  )
}
