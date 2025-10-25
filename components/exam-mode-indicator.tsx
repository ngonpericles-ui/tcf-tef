'use client'

import { AlertTriangle, Lock } from 'lucide-react'

interface ExamModeIndicatorProps {
  allowPause?: boolean
  allowRewind?: boolean
  timeLimit?: number
  questionType?: string
}

export default function ExamModeIndicator({
  allowPause = true,
  allowRewind = true,
  timeLimit,
  questionType
}: ExamModeIndicatorProps) {
  const restrictions = []

  if (!allowPause) {
    restrictions.push('No pause allowed')
  }
  if (!allowRewind) {
    restrictions.push('No rewind allowed')
  }

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'expression_ecrite': 'Written Expression',
      'comprehension_orale': 'Oral Comprehension',
      'comprehension_ecrite': 'Written Comprehension',
      'expression_orale': 'Oral Expression',
      'multiple_choice': 'Multiple Choice',
      'short_answer': 'Short Answer'
    }
    return labels[type] || type
  }

  if (restrictions.length === 0 && !timeLimit) {
    return null
  }

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
            Exam Mode: {getQuestionTypeLabel(questionType || 'question')}
          </p>
          {restrictions.length > 0 && (
            <ul className="space-y-1 text-amber-800 dark:text-amber-300">
              {restrictions.map((restriction, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  {restriction}
                </li>
              ))}
            </ul>
          )}
          {timeLimit && (
            <p className="text-amber-800 dark:text-amber-300 mt-1">
              ⏱️ Time limit: {Math.floor(timeLimit / 60)} minutes
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

