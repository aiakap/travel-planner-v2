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
  isPreloaded: boolean
}

interface IntelligenceProviderProps {
  children: ReactNode
  initialCache?: IntelligenceCache
}

const IntelligenceContext = createContext<IntelligenceContextType | null>(null)

export function IntelligenceProvider({ children, initialCache = {} }: IntelligenceProviderProps) {
  // Filter out null values from initialCache so hasCache works correctly
  const filteredInitialCache = Object.fromEntries(
    Object.entries(initialCache).filter(([_, v]) => v !== null && v !== undefined)
  ) as IntelligenceCache
  
  const [cache, setCacheState] = useState<IntelligenceCache>(filteredInitialCache)
  
  // Track if we were initialized with pre-loaded data
  const isPreloaded = Object.keys(filteredInitialCache).length > 0

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
    <IntelligenceContext.Provider value={{ cache, setCache, clearCache, hasCache, isPreloaded }}>
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
