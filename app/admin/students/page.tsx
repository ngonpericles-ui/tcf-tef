"use client"

import { useEffect } from "react"
import ManagerStudents from "@/app/manager/students/page"

export default function AdminStudentsPage() {
  useEffect(() => {
    // Set admin role in localStorage so the manager students page knows it's being used by admin
    localStorage.setItem("managerRole", "admin")
  }, [])

  return (
    <div className="p-6">
      <ManagerStudents />
    </div>
  )
}


