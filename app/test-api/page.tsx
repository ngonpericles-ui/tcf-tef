"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

export default function TestAPIPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🔄 Testing API call...')
        const response = await apiClient.get('/courses')
        console.log('✅ API Response:', response.data)
        setData(response.data)
      } catch (err: any) {
        console.error('❌ API Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {data && (
        <div>
          <p className="mb-2">
            <strong>Success:</strong> {data.success ? 'Yes' : 'No'}
          </p>
          <p className="mb-2">
            <strong>Courses:</strong> {data.data?.content?.length || 0}
          </p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

