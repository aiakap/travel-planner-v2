"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface RouteData {
  path: Array<{ lat: number; lng: number }>
  distance: {
    meters: number
    text: string
  }
  duration: {
    seconds: number
    text: string
  }
}

interface RouteRequest {
  id: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
}

interface UseRoadRoutesResult {
  routes: Map<string, RouteData>
  isLoading: boolean
  errors: Map<string, boolean>
  fetchRoute: (request: RouteRequest) => Promise<void>
  fetchRoutes: (requests: RouteRequest[]) => Promise<void>
}

// Global cache to persist across component remounts
const globalRouteCache = new Map<string, RouteData>()

function getCacheKey(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `${originLat.toFixed(5)},${originLng.toFixed(5)}-${destLat.toFixed(5)},${destLng.toFixed(5)}`
}

/**
 * Hook to fetch and manage road routes for map display
 * Includes caching and batch fetching support
 */
export function useRoadRoutes(): UseRoadRoutesResult {
  const [routes, setRoutes] = useState<Map<string, RouteData>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Map<string, boolean>>(new Map())
  const pendingRequests = useRef<Set<string>>(new Set())

  // Fetch a single route
  const fetchRoute = useCallback(async (request: RouteRequest) => {
    const cacheKey = getCacheKey(
      request.originLat,
      request.originLng,
      request.destLat,
      request.destLng
    )

    // Check global cache
    const cached = globalRouteCache.get(cacheKey)
    if (cached) {
      setRoutes(prev => new Map(prev).set(request.id, cached))
      return
    }

    // Check if already pending
    if (pendingRequests.current.has(cacheKey)) {
      return
    }

    pendingRequests.current.add(cacheKey)
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        originLat: request.originLat.toString(),
        originLng: request.originLng.toString(),
        destLat: request.destLat.toString(),
        destLng: request.destLng.toString(),
        mode: "DRIVE",
      })

      const response = await fetch(`/api/route/display?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch route")
      }

      const data: RouteData = await response.json()

      // Cache globally
      globalRouteCache.set(cacheKey, data)

      setRoutes(prev => new Map(prev).set(request.id, data))
      setErrors(prev => {
        const next = new Map(prev)
        next.delete(request.id)
        return next
      })
    } catch (error) {
      console.error("Error fetching road route:", error)
      setErrors(prev => new Map(prev).set(request.id, true))
    } finally {
      pendingRequests.current.delete(cacheKey)
      setIsLoading(false)
    }
  }, [])

  // Fetch multiple routes (with rate limiting)
  const fetchRoutes = useCallback(async (requests: RouteRequest[]) => {
    if (requests.length === 0) return

    setIsLoading(true)

    // Filter out already cached routes
    const uncachedRequests = requests.filter(req => {
      const cacheKey = getCacheKey(
        req.originLat,
        req.originLng,
        req.destLat,
        req.destLng
      )
      const cached = globalRouteCache.get(cacheKey)
      if (cached) {
        setRoutes(prev => new Map(prev).set(req.id, cached))
        return false
      }
      return !pendingRequests.current.has(cacheKey)
    })

    // Fetch in batches to avoid overwhelming the API
    const batchSize = 3
    for (let i = 0; i < uncachedRequests.length; i += batchSize) {
      const batch = uncachedRequests.slice(i, i + batchSize)
      await Promise.all(batch.map(req => fetchRoute(req)))
    }

    setIsLoading(false)
  }, [fetchRoute])

  return {
    routes,
    isLoading,
    errors,
    fetchRoute,
    fetchRoutes,
  }
}

/**
 * Check if a segment type is ground transport (not a flight)
 */
export function isGroundTransportSegment(segmentType: string): boolean {
  const type = segmentType.toLowerCase()
  return (
    !type.includes("flight") &&
    !type.includes("air") &&
    (type.includes("drive") ||
      type.includes("car") ||
      type.includes("train") ||
      type.includes("bus") ||
      type.includes("ferry") ||
      type.includes("transport") ||
      type.includes("travel") ||
      type.includes("road"))
  )
}
