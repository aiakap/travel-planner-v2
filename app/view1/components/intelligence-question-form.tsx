"use client"

import { useState } from "react"
import { Card } from "./card"
import { Sparkles } from "lucide-react"

export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  id: string
  label: string
  type: 'select' | 'text' | 'radio'
  options?: QuestionOption[]
  placeholder?: string
  optional?: boolean
}

interface IntelligenceQuestionFormProps {
  title: string
  description: string
  questions: Question[]
  onSubmit: (answers: Record<string, string>) => void
  loading?: boolean
}

export function IntelligenceQuestionForm({
  title,
  description,
  questions,
  onSubmit,
  loading = false
}: IntelligenceQuestionFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredQuestions = questions.filter(q => !q.optional)
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id])
    
    if (missingAnswers.length > 0) {
      alert('Please answer all required questions')
      return
    }
    
    onSubmit(answers)
  }

  const handleChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  return (
    <div className="animate-fade-in">
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, idx) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                {idx + 1}. {question.label}
                {question.optional && (
                  <span className="ml-2 text-xs font-normal text-slate-500">(Optional)</span>
                )}
              </label>

              {question.type === 'select' && question.options && (
                <select
                  value={answers[question.id] || ''}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required={!question.optional}
                >
                  <option value="">Select an option...</option>
                  {question.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer transition-all"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={(e) => handleChange(question.id, e.target.value)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        required={!question.optional}
                      />
                      <span className="text-sm font-medium text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  required={!question.optional}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Recommendations
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  )
}
