"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function DebugPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({})
  const [cookies, setCookies] = useState<string>("")

  useEffect(() => {
    // Get localStorage data
    const ls: Record<string, string> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        ls[key] = window.localStorage.getItem(key) || ''
      }
    }
    setLocalStorage(ls)

    // Get cookies
    setCookies(document.cookie)
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>

      <div className="mb-8 p-4 bg-blue-100 rounded">
        <h2 className="text-xl font-bold mb-2">Auth Status</h2>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'None'}</p>
      </div>

      <div className="mb-8 p-4 bg-green-100 rounded">
        <h2 className="text-xl font-bold mb-2">LocalStorage</h2>
        <pre className="bg-white p-4 rounded overflow-auto max-h-64">
          {JSON.stringify(localStorage, null, 2)}
        </pre>
      </div>

      <div className="mb-8 p-4 bg-yellow-100 rounded">
        <h2 className="text-xl font-bold mb-2">Cookies</h2>
        <pre className="bg-white p-4 rounded overflow-auto max-h-64">
          {cookies || 'No cookies'}
        </pre>
      </div>
    </div>
  )
}

