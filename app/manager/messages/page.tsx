"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import UnifiedMessagingPage from '@/components/UnifiedMessagingPage'
import { messageService, Contact } from '@/lib/services/messageService'
import { useState, useEffect } from 'react'

export default function ManagerMessagesPage() {
  const searchParams = useSearchParams()
  const [preSelectedContact, setPreSelectedContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const contactId = searchParams?.get('contactId')
    if (contactId) {
      // Fetch the specific contact details
      const fetchContact = async () => {
        try {
          const response = await messageService.getContacts()
          if (response.success && response.data) {
            const contact = response.data.find(c => c.id === contactId)
            if (contact) {
              setPreSelectedContact(contact)
            }
          }
        } catch (error) {
          console.error('Failed to fetch contact:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchContact()
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
    <UnifiedMessagingPage 
      preSelectedContact={preSelectedContact}
      userRole="SENIOR_MANAGER" // This will be dynamic based on actual user role
    />
    </div>
  )
}