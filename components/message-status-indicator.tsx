import React from 'react'
import { Check, CheckCheck, Clock } from 'lucide-react'
import { useLanguage } from './language-provider'

interface MessageStatusIndicatorProps {
  isRead: boolean
  deliveredAt?: string
  sentAt?: string
  className?: string
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  isRead,
  deliveredAt,
  sentAt,
  className = ""
}) => {
  const { t } = useLanguage()

  const getStatusIcon = () => {
    if (isRead) {
      return {
        icon: <CheckCheck className="w-3 h-3 text-blue-200" />,
        title: t("Lu", "Read"),
        color: "text-blue-200"
      }
    }
    
    if (deliveredAt) {
      return {
        icon: <CheckCheck className="w-3 h-3 text-gray-300" />,
        title: t("Livré", "Delivered"),
        color: "text-gray-300"
      }
    }
    
    if (sentAt) {
      return {
        icon: <Check className="w-3 h-3 text-gray-300" />,
        title: t("Envoyé", "Sent"),
        color: "text-gray-300"
      }
    }
    
    return {
      icon: <Clock className="w-3 h-3 text-gray-400" />,
      title: t("En cours d'envoi", "Sending"),
      color: "text-gray-400"
    }
  }

  const status = getStatusIcon()

  return (
    <div 
      className={`flex items-center ${className}`}
      title={status.title}
    >
      {status.icon}
    </div>
  )
}

export default MessageStatusIndicator
