import { useState, useEffect, useRef } from 'react'
import { useIntelligenceCache } from '../contexts/intelligence-context'

export function useCachedIntelligence<T>(
  feature: 'currency' | 'emergency' | 'cultural' | 'activities' | 'dining' | 'language' | 'packing',
  tripId: string,
  apiEndpoint: string
) {
  const { cache, setCache, hasCache, isPreloaded } = useIntelligenceCache()
  
  // Check cache synchronously on first render - this is key for instant display
  const cachedData = hasCache(feature) ? cache[feature] : null
  const hasInitialData = cachedData !== null && cachedData !== undefined
  
  const [data, setData] = useState<T | null>(cachedData as T | null)
  const [loading, setLoading] = useState(!hasInitialData)
  const [initialCheckComplete, setInitialCheckComplete] = useState(hasInitialData)
  const [error, setError] = useState<string | null>(null)
  
  // Track if we've already processed initial data
  const initializedRef = useRef(hasInitialData)

  useEffect(() => {
    // If we already have data from cache (preloaded), we're done
    if (initializedRef.current) {
      return
    }
    
    const checkCache = async () => {
      // Re-check cache in case it was updated
      if (hasCache(feature)) {
        setData(cache[feature] as T)
        setLoading(false)
        setInitialCheckComplete(true)
        initializedRef.current = true
        return
      }

      // Only show checking delay if cache wasn't preloaded
      // This gives time for the UI to show "checking" state
      if (!isPreloaded) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Check cache again after delay
      if (hasCache(feature)) {
        setData(cache[feature] as T)
        setLoading(false)
        setInitialCheckComplete(true)
        initializedRef.current = true
        return
      }

      // No cache - show questions form
      setData(null)
      setLoading(false)
      setInitialCheckComplete(true)
      initializedRef.current = true
    }

    checkCache()
  }, [tripId, feature, isPreloaded]) // Re-run if tripId changes

  // Update local state if cache changes externally (e.g., after POST)
  useEffect(() => {
    if (initializedRef.current && hasCache(feature)) {
      const newData = cache[feature] as T
      if (newData !== data) {
        setData(newData)
      }
    }
  }, [cache, feature])

  const invalidateCache = () => {
    setCache(feature, undefined)
    setData(null)
    initializedRef.current = false
    setInitialCheckComplete(false)
    setLoading(true)
  }

  const updateCache = (newData: T) => {
    setCache(feature, newData)
    setData(newData)
  }

  return { 
    data, 
    loading, 
    initialCheckComplete, 
    error, 
    invalidateCache,
    updateCache 
  }
}
