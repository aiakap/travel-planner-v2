"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Languages, Plane, Hotel, UtensilsCrossed, Bus, AlertCircle, Sparkles } from "lucide-react"
import { IntelligenceSection, IntelligenceSectionGroup, type IntelligenceItem } from "./intelligence-section"
import { Card } from "./card"
import { useCachedIntelligence } from "../hooks/use-cached-intelligence"
import { IntelligenceLoading } from "./intelligence-loading"

interface LanguageViewProps {
  itinerary: ViewItinerary
}

interface LanguagePhrase {
  phrase: string
  translation: string
  romanization?: string
  reasoning?: string
}

interface LanguageVerb {
  verb: string
  conjugation: string
  usage: string
}

interface LanguageScenario {
  id: string
  scenario: string
  phrases: LanguagePhrase[]
  verbs: LanguageVerb[]
  relevanceScore: number
  reasoning: string
}

interface LanguageGuide {
  id: string
  targetLanguage: string
  targetLanguageCode: string
  userProficiency: 'beginner' | 'intermediate' | 'advanced'
  destinations?: string
  scenarios: LanguageScenario[]
}

type ViewState = 'questions' | 'loading' | 'loaded'

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Mandarin Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' }
]

export function LanguageView({ itinerary }: LanguageViewProps) {
  const { data, loading, invalidateCache, updateCache, initialCheckComplete } = useCachedIntelligence<{ guides: LanguageGuide[] }>(
    'language',
    itinerary.id,
    '/api/trip-intelligence/language'
  )

  const [viewState, setViewState] = useState<ViewState>('questions')
  const [guides, setGuides] = useState<LanguageGuide[]>([])
  const [savedPreferences, setSavedPreferences] = useState<any>(null)
  
  // Question form state
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set())
  const [proficiencies, setProficiencies] = useState<Record<string, 'beginner' | 'intermediate' | 'advanced'>>({})

  useEffect(() => {
    if (data?.guides && data.guides.length > 0) {
      setGuides(data.guides)
      setViewState('loaded')
    } else if (!loading) {
      loadPreferences()
      setViewState('questions')
    }
  }, [data, loading])

  const loadPreferences = async () => {
    try {
      const prefsResponse = await fetch('/api/profile/intelligence-preferences')
      const prefsData = await prefsResponse.json()
      if (prefsData.preferences?.language?.knownLanguages) {
        setSavedPreferences(prefsData.preferences.language)
        // Pre-fill form with saved data
        const langs = new Set<string>()
        const profs: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {}
        prefsData.preferences.language.knownLanguages.forEach((lang: any) => {
          langs.add(lang.code)
          profs[lang.code] = lang.proficiency
        })
        setSelectedLanguages(langs)
        setProficiencies(profs)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
        // Remove proficiency when deselecting
        setProficiencies(p => {
          const newP = { ...p }
          delete newP[code]
          return newP
        })
      } else {
        next.add(code)
        // Default to beginner
        setProficiencies(p => ({ ...p, [code]: 'beginner' }))
      }
      return next
    })
  }

  const setProficiency = (code: string, proficiency: 'beginner' | 'intermediate' | 'advanced') => {
    setProficiencies(prev => ({ ...prev, [code]: proficiency }))
  }

  const generateGuide = async () => {
    if (selectedLanguages.size === 0) {
      alert('Please select at least one language')
      return
    }

    setViewState('loading')

    try {
      const knownLanguages = Array.from(selectedLanguages).map(code => ({
        code,
        name: COMMON_LANGUAGES.find(l => l.code === code)?.name || code,
        proficiency: proficiencies[code] || 'beginner'
      }))

      const response = await fetch('/api/trip-intelligence/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: itinerary.id,
          knownLanguages
        })
      })

      if (response.ok) {
        const responseData = await response.json()
        setGuides(responseData.guides || [])
        updateCache({ guides: responseData.guides || [] }) // Update the cache
        setViewState('loaded')
      } else {
        const errorData = await response.json()
        setViewState('questions')
        alert(`Failed to generate language guide: ${errorData.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error generating guide:', error)
      setViewState('questions')
      alert('An error occurred while generating the language guide. Please try again.')
    }
  }

  const handleRegenerate = () => {
    invalidateCache() // Clear cache when regenerating
    setViewState('questions')
  }

  const getScenarioIcon = (scenario: string) => {
    const s = scenario.toLowerCase()
    if (s.includes('airport')) return <Plane size={20} />
    if (s.includes('hotel')) return <Hotel size={20} />
    if (s.includes('restaurant') || s.includes('dining')) return <UtensilsCrossed size={20} />
    if (s.includes('transport')) return <Bus size={20} />
    if (s.includes('emergency')) return <AlertCircle size={20} />
    if (s.includes('activit')) return <Sparkles size={20} />
    return <Languages size={20} />
  }

  // Show initial loading while checking cache
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="language" mode="checking" />
  }

  if (viewState === 'questions') {
    return (
      <div className="animate-fade-in">
        <Card className="p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
              <Languages className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Language Learning Guide</h3>
            <p className="text-slate-600 text-sm">
              We'll create a personalized phrase guide based on your destinations and travel style. 
              Select the languages you already speak and your proficiency level.
            </p>
          </div>

          <div className="space-y-6">
            {/* Question 1: Language Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                1. What languages do you already speak?
                <span className="ml-2 text-xs font-normal text-slate-500">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMMON_LANGUAGES.map(lang => (
                  <label
                    key={lang.code}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLanguages.has(lang.code)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.has(lang.code)}
                      onChange={() => toggleLanguage(lang.code)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">{lang.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 2: Proficiency Levels */}
            {selectedLanguages.size > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  2. What's your proficiency level in each language?
                </label>
                <div className="space-y-3">
                  {Array.from(selectedLanguages).map(code => {
                    const lang = COMMON_LANGUAGES.find(l => l.code === code)
                    return (
                      <div key={code} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-700">{lang?.name}</span>
                        <select
                          value={proficiencies[code] || 'beginner'}
                          onChange={(e) => setProficiency(code, e.target.value as any)}
                          className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={generateGuide}
              disabled={selectedLanguages.size === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Languages className="h-5 w-5" />
              Generate Language Guide
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (viewState === 'loading') {
    return <IntelligenceLoading feature="language" mode="generating" />
  }

  if (guides.length === 0) return null

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Languages className="h-6 w-6 text-purple-600" />
            Language Guides
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {guides.length} language{guides.length !== 1 ? 's' : ''} • Personalized for your destinations
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
        >
          Update Preferences
        </button>
      </div>

      {/* Each Language Guide */}
      {guides.map((guide) => (
        <div key={guide.id} className="space-y-6 border-t pt-8 first:border-t-0 first:pt-0">
          {/* Language Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Languages className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{guide.targetLanguage}</h3>
              {guide.destinations && (
                <p className="text-slate-600 text-sm">For: {guide.destinations}</p>
              )}
            </div>
          </div>

          {/* Proficiency Badge */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <Languages className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Your Level: {guide.userProficiency.charAt(0).toUpperCase() + guide.userProficiency.slice(1)}</h4>
                  <p className="text-sm text-slate-600">
                    {guide.userProficiency === 'beginner' && 'Focus on survival phrases and simple present tense'}
                    {guide.userProficiency === 'intermediate' && 'Including past/future tenses and polite forms'}
                    {guide.userProficiency === 'advanced' && 'With cultural nuances and sophisticated vocabulary'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Scenarios */}
          {guide.scenarios.map((scenario) => {
        // Phrases section
        const phraseItems: IntelligenceItem[] = scenario.phrases.map((phrase, idx) => ({
          label: phrase.phrase,
          value: phrase.romanization 
            ? `${phrase.translation} (${phrase.romanization})`
            : phrase.translation,
          reasoning: phrase.reasoning || `Translation: ${phrase.translation}${phrase.romanization ? `\nPronunciation: ${phrase.romanization}` : ''}`,
          expandable: true
        }))

        // Verbs section
        const verbItems: IntelligenceItem[] = scenario.verbs.map((verb, idx) => ({
          label: verb.verb,
          value: verb.conjugation,
          reasoning: `Usage: ${verb.usage}`,
          expandable: true
        }))

        return (
          <div key={scenario.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {getScenarioIcon(scenario.scenario)}
                {scenario.scenario}
              </h3>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                {scenario.relevanceScore}/100
              </div>
            </div>

            {scenario.reasoning && (
              <p className="text-sm text-slate-600 italic">{scenario.reasoning}</p>
            )}

            <IntelligenceSectionGroup>
              {phraseItems.length > 0 && (
                <IntelligenceSection
                  title="Essential Phrases"
                  icon={<Languages size={20} />}
                  items={phraseItems}
                />
              )}

              {verbItems.length > 0 && (
                <IntelligenceSection
                  title="Key Verbs"
                  icon={<Sparkles size={20} />}
                  items={verbItems}
                />
              )}
            </IntelligenceSectionGroup>
          </div>
        )
      })}
        </div>
      ))}

      {/* Learning Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 text-blue-700">
            <Sparkles size={20} />
            <h4 className="font-bold">Learning Tips</h4>
          </div>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Practice phrases out loud before your trip to build muscle memory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Write down key phrases on a card to carry with you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Locals appreciate any effort to speak their language, even if imperfect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              <span>Use hand gestures and pointing to supplement your phrases</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
