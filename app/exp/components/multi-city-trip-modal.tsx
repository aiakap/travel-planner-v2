"use client"

import { useState } from "react"
import { Dialog } from "@/app/exp/ui/dialog"
import { Button } from "@/app/exp/ui/button"
import { Input } from "@/app/exp/ui/input"
import { Label } from "@/app/exp/ui/label"
import { Plus, X, MapPin } from "lucide-react"
import { CityAutocompleteInput } from "./city-autocomplete-input"

interface CityStop {
  city: string
  durationDays: number
}

interface MultiCityTripModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title?: string
    startDate: Date
    cities: CityStop[]
  }) => Promise<void>
}

export function MultiCityTripModal({
  isOpen,
  onClose,
  onSubmit,
}: MultiCityTripModalProps) {
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState(() => {
    // Default to 7 days from now
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  })
  const [cities, setCities] = useState<CityStop[]>([
    { city: "", durationDays: 3 }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCity = () => {
    if (cities.length >= 10) {
      setError("Maximum 10 cities allowed")
      return
    }
    setCities([...cities, { city: "", durationDays: 3 }])
    setError(null)
  }

  const removeCity = (index: number) => {
    if (cities.length === 1) {
      setError("At least one city is required")
      return
    }
    setCities(cities.filter((_, i) => i !== index))
    setError(null)
  }

  const updateCity = (index: number, field: keyof CityStop, value: string | number) => {
    const updated = [...cities]
    updated[index] = { ...updated[index], [field]: value }
    setCities(updated)
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!startDate) {
      return "Start date is required"
    }

    if (cities.length === 0) {
      return "At least one city is required"
    }

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i]
      if (!city.city.trim()) {
        return `City ${i + 1} name is required`
      }
      if (city.durationDays < 1) {
        return `City ${i + 1} must have at least 1 day`
      }
      if (city.durationDays > 90) {
        return `City ${i + 1} duration cannot exceed 90 days`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: title.trim() || undefined,
        startDate: new Date(startDate),
        cities: cities.map(c => ({
          city: c.city.trim(),
          durationDays: c.durationDays
        }))
      })
      
      // Reset form
      setTitle("")
      setStartDate(() => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        return date.toISOString().split('T')[0]
      })
      setCities([{ city: "", durationDays: 3 }])
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create trip")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalDays = cities.reduce((sum, city) => sum + city.durationDays, 0)

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div 
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-slate-200 p-6 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-semibold text-slate-900 pr-8">
              Plan Your Journey
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Define your journey chapters - cities, regions, or destinations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Trip Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                Trip Title (optional)
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., European Adventure"
                className="mt-1"
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {/* Chapters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-slate-700">
                  Journey Chapters
                </Label>
                <div className="text-xs text-slate-500">
                  Total: {totalDays} day{totalDays !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-3">
                {cities.map((city, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-8 h-10 text-sm font-medium text-slate-600">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <CityAutocompleteInput
                          value={city.city}
                          onSelect={(description) => updateCity(index, 'city', description)}
                          placeholder="e.g., Paris, Tuscany, Japan"
                          required
                        />
                      </div>
                      
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          max="90"
                          value={city.durationDays}
                          onChange={(e) => updateCity(index, 'durationDays', parseInt(e.target.value) || 1)}
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center text-xs text-slate-500 w-12">
                        day{city.durationDays !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCity(index)}
                      disabled={cities.length === 1}
                      className="h-10 w-10 p-0 text-slate-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCity}
                disabled={cities.length >= 10}
                className="mt-3 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </div>

            {/* Preview */}
            {cities.some(c => c.city.trim()) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-medium text-slate-700 mb-2">
                  Journey Preview:
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                  {cities.map((city, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {index > 0 && <span className="text-slate-400">→</span>}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{city.city.trim() || `Chapter ${index + 1}`}</span>
                        <span className="text-xs text-slate-400">
                          ({city.durationDays}d)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || cities.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSubmitting ? "Creating Trip..." : "Create Trip"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
