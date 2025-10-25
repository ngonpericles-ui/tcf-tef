"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminManagersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the create-manager page
    router.push("/admin/create-manager")
  }, [router])

  return null
}
