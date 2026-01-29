'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface IntelligenceCache {
  currency?: any
  emergency?: any
  cultural?: any
  activities?: any
  dining?: any
  language?: any
  packing?: any
}

interface IntelligenceContextType {
  cache: IntelligenceCache
  setCache: (feature: keyof IntelligenceCache, data: any) => void
  clearCache: (feature?: keyof IntelligenceCache) => void
  hasCache: (feature: keyof IntelligenceCache) => boolean
}

const IntelligenceContext = createContext<IntelligenceContextType | null>(null)

export function IntelligenceProvider({ children }: { children: ReactNode }) {
  const [cache, setCacheState] = useState<IntelligenceCache>({})

  const setCache = (feature: keyof IntelligenceCache, data: any) => {
    setCacheState(prev => ({ ...prev, [feature]: data }))
  }

  const clearCache = (feature?: keyof IntelligenceCache) => {
    if (feature) {
      setCacheState(prev => {
        const next = { ...prev }
        delete next[feature]
        return next
      })
    } else {
      setCacheState({})
    }
  }

  const hasCache = (feature: keyof IntelligenceCache) => {
    return cache[feature] !== undefined
  }

  return (
    <IntelligenceContext.Provider value={{ cache, setCache, clearCache, hasCache }}>
      {children}
    </IntelligenceContext.Provider>
  )
}

export function useIntelligenceCache() {
  const context = useContext(IntelligenceContext)
  if (!context) {
    throw new Error('useIntelligenceCache must be used within IntelligenceProvider')
  }
  return context
}
