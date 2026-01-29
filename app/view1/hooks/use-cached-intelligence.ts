import { useState, useEffect } from 'react'
import { useIntelligenceCache } from '../contexts/intelligence-context'

export function useCachedIntelligence<T>(
  feature: 'currency' | 'emergency' | 'cultural' | 'activities' | 'dining' | 'language' | 'packing',
  tripId: string,
  apiEndpoint: string
) {
  const { cache, setCache, hasCache } = useIntelligenceCache()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialCheckComplete, setInitialCheckComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setInitialCheckComplete(false)
      
      // Small delay to show the checking cache state
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check cache first
      if (hasCache(feature)) {
        setData(cache[feature])
        setLoading(false)
        setInitialCheckComplete(true)
        return
      }

      // No cache - don't make any API calls
      // The view component will show the questions form and make POST request
      setData(null)
      setLoading(false)
      setInitialCheckComplete(true)
    }

    fetchData()
  }, [tripId, feature]) // Only re-fetch if tripId changes

  const invalidateCache = () => {
    setCache(feature, undefined)
    setData(null)
  }

  return { data, loading, initialCheckComplete, error, invalidateCache }
}
