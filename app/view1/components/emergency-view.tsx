"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Phone, MapPin, AlertTriangle, Shield, Hospital, Building2 } from "lucide-react"
import { IntelligenceQuestionForm, type Question } from "./intelligence-question-form"
import { IntelligenceCard, IntelligenceCardItem } from "./intelligence-card"
import { RelevanceTooltip, type ProfileReference } from "./relevance-tooltip"
import { Card } from "./card"
import { Badge } from "./badge"

interface EmergencyViewProps {
  itinerary: ViewItinerary
}

interface EmergencyInfo {
  id: string
  destination: string
  country: string
  embassyName: string
  embassyAddress: string
  embassyPhone: string
  embassyEmail: string | null
  emergencyNumbers: {
    police: string
    ambulance: string
    fire: string
    touristPolice?: string
  }
  nearestHospitals: Array<{
    name: string
    address: string
    phone: string
    specialties: string
  }>
  pharmacyInfo: string
  safetyLevel: string
  commonScams: string[]
  culturalSafety: string
  reasoning: string
  relevanceScore: number
  profileReferences: ProfileReference[]
}

type ViewState = 'questions' | 'loading' | 'loaded'

export function EmergencyView({ itinerary }: EmergencyViewProps) {
  const [viewState, setViewState] = useState<ViewState>('questions')
  const [info, setInfo] = useState<EmergencyInfo[]>([])

  useEffect(() => {
    checkExistingData()
  }, [itinerary.id])

  const checkExistingData = async () => {
    try {
      // Check for existing info in database
      const infoResponse = await fetch(`/api/trip-intelligence/emergency?tripId=${itinerary.id}`)
      const infoData = await infoResponse.json()

      if (infoData.info && infoData.info.length > 0) {
        setInfo(infoData.info)
        setViewState('loaded')
        return
      }

      // No DB data = show questions (don't auto-generate)
      setViewState('questions')
    } catch (error) {
      console.error('Error checking existing data:', error)
      setViewState('questions')
    }
  }

  const questions: Question[] = [
    {
      id: 'citizenship',
      label: 'What is your citizenship/passport country?',
      type: 'select',
      options: [
        { value: 'USA', label: 'United States' },
        { value: 'Canada', label: 'Canada' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'Australia', label: 'Australia' },
        { value: 'Germany', label: 'Germany' },
        { value: 'France', label: 'France' },
        { value: 'Japan', label: 'Japan' },
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      id: 'residence',
      label: 'What is your country of residence?',
      type: 'select',
      options: [
        { value: 'USA', label: 'United States' },
        { value: 'Canada', label: 'Canada' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'Australia', label: 'Australia' },
        { value: 'Germany', label: 'Germany' },
        { value: 'France', label: 'France' },
        { value: 'Japan', label: 'Japan' },
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      id: 'medicalConditions',
      label: 'Do you have any medical conditions we should consider?',
      type: 'text',
      placeholder: 'e.g., Allergic to penicillin, diabetic, etc.',
      optional: true
    }
  ]

  const generateInfo = async (answers: Record<string, string>) => {
    setViewState('loading')

    try {
      const response = await fetch('/api/trip-intelligence/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          citizenship: answers.citizenship,
          residence: answers.residence,
          medicalConditions: answers.medicalConditions
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInfo(data.info)
        setViewState('loaded')
      } else {
        setViewState('questions')
        alert('Failed to generate emergency information. Please try again.')
      }
    } catch (error) {
      console.error('Error generating info:', error)
      setViewState('questions')
      alert('An error occurred. Please try again.')
    }
  }

  const handleRegenerate = () => {
    setViewState('questions')
  }

  const getSafetyColor = (level: string) => {
    if (level.includes('Low')) return 'bg-green-100 text-green-800 border-green-200'
    if (level.includes('Moderate')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  if (viewState === 'questions') {
    return (
      <IntelligenceQuestionForm
        title="Emergency Information"
        description="Get personalized safety information and emergency contacts for your destinations."
        questions={questions}
        onSubmit={generateInfo}
        loading={false}
      />
    )
  }

  if (viewState === 'loading') {
    return (
      <div className="animate-fade-in">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Gathering Emergency Information...</h3>
          <p className="text-slate-600 text-sm">
            Compiling embassy contacts, emergency numbers, and safety information
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Emergency Information</h2>
          <p className="text-slate-600 text-sm mt-1">Essential contacts and safety information</p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Information
        </button>
      </div>

      <div className="space-y-6">
        {info.map((item) => (
          <IntelligenceCard
            key={item.id}
            title={item.country}
            icon={<Shield className="h-5 w-5" />}
            expandable={false}
          >
            <div className="space-y-6">
              {/* Safety Level */}
              <div className="flex items-center justify-between">
                <Badge className={`${getSafetyColor(item.safetyLevel)} px-4 py-2`}>
                  <Shield className="h-4 w-4 mr-2" />
                  {item.safetyLevel}
                </Badge>
                <RelevanceTooltip
                  score={item.relevanceScore}
                  reasoning={item.reasoning}
                  profileReferences={item.profileReferences}
                />
              </div>

              {/* Embassy Information */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">{item.embassyName}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-900">{item.embassyAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <a href={`tel:${item.embassyPhone}`} className="text-blue-900 hover:underline font-semibold">
                      {item.embassyPhone}
                    </a>
                  </div>
                  {item.embassyEmail && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">✉️</span>
                      <a href={`mailto:${item.embassyEmail}`} className="text-blue-900 hover:underline">
                        {item.embassyEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Numbers */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5 text-red-600" />
                  <h4 className="font-bold text-red-900">Emergency Numbers</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-red-700 uppercase mb-1">Police</div>
                    <a href={`tel:${item.emergencyNumbers.police}`} className="text-2xl font-bold text-red-900 hover:underline">
                      {item.emergencyNumbers.police}
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-red-700 uppercase mb-1">Ambulance</div>
                    <a href={`tel:${item.emergencyNumbers.ambulance}`} className="text-2xl font-bold text-red-900 hover:underline">
                      {item.emergencyNumbers.ambulance}
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-red-700 uppercase mb-1">Fire</div>
                    <a href={`tel:${item.emergencyNumbers.fire}`} className="text-2xl font-bold text-red-900 hover:underline">
                      {item.emergencyNumbers.fire}
                    </a>
                  </div>
                  {item.emergencyNumbers.touristPolice && (
                    <div className="text-center">
                      <div className="text-xs font-semibold text-red-700 uppercase mb-1">Tourist Police</div>
                      <a href={`tel:${item.emergencyNumbers.touristPolice}`} className="text-2xl font-bold text-red-900 hover:underline">
                        {item.emergencyNumbers.touristPolice}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Hospitals */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hospital className="h-5 w-5 text-slate-600" />
                  <h4 className="font-bold text-slate-900">Nearest Hospitals</h4>
                </div>
                <div className="space-y-3">
                  {item.nearestHospitals.map((hospital, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">{hospital.name}</div>
                      <div className="text-sm text-slate-600 mb-1">{hospital.address}</div>
                      <div className="flex items-center justify-between">
                        <a href={`tel:${hospital.phone}`} className="text-sm text-blue-600 hover:underline font-medium">
                          {hospital.phone}
                        </a>
                        <span className="text-xs text-slate-500">{hospital.specialties}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Scams */}
              {item.commonScams.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                    <h4 className="font-bold text-yellow-900">Common Scams to Avoid</h4>
                  </div>
                  <ul className="space-y-2">
                    {item.commonScams.map((scam, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-yellow-900">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0"></span>
                        <span>{scam}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cultural Safety & Pharmacy Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <IntelligenceCardItem
                  label="🏥 Pharmacy Information"
                  value={item.pharmacyInfo}
                  expandable={true}
                />
                <IntelligenceCardItem
                  label="🌍 Cultural Safety Tips"
                  value={item.culturalSafety}
                  expandable={true}
                />
              </div>
            </div>
          </IntelligenceCard>
        ))}
      </div>

      {/* General Safety Tips */}
      <Card className="bg-orange-50 border-orange-200">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 text-orange-700">
            <Shield size={20} />
            <h4 className="font-bold">General Safety Tips</h4>
          </div>
          <ul className="space-y-2 text-sm text-orange-900">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-600 flex-shrink-0"></span>
              <span>Register with your embassy's travel registration program before departure</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-600 flex-shrink-0"></span>
              <span>Keep digital and physical copies of important documents separately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-600 flex-shrink-0"></span>
              <span>Share your itinerary with family or friends back home</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-600 flex-shrink-0"></span>
              <span>Download offline maps and save emergency contacts in your phone</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
