"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Trip {
  id: string
  title: string
  startDate: string
  endDate: string
}

export default function TripIntelligenceTestPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      const data = await response.json()
      setTrips(data.trips || [])
      if (data.trips?.length > 0) {
        setSelectedTripId(data.trips[0].id)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    }
  }

  const testFeature = async (feature: string, payload: any) => {
    setLoading(prev => ({ ...prev, [feature]: true }))
    
    try {
      const response = await fetch(`/api/trip-intelligence/${feature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: selectedTripId, ...payload })
      })

      const data = await response.json()
      setResults(prev => ({ ...prev, [feature]: data }))
    } catch (error) {
      console.error(`Error testing ${feature}:`, error)
      setResults(prev => ({ ...prev, [feature]: { error: String(error) } }))
    } finally {
      setLoading(prev => ({ ...prev, [feature]: false }))
    }
  }

  const testCurrency = () => testFeature('currency', {
    citizenship: 'USA',
    residence: 'USA'
  })

  const testEmergency = () => testFeature('emergency', {
    citizenship: 'USA',
    residence: 'USA',
    medicalConditions: 'None'
  })

  const testCultural = () => testFeature('cultural', {
    interestedInEvents: true,
    crowdPreference: 'flexible'
  })

  const testActivities = () => testFeature('activities', {
    activityPace: 'moderate',
    dailyBudget: '50-100'
  })

  const testDining = () => testFeature('dining', {
    adventurousness: 'somewhat',
    mealBudget: '$$'
  })

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trip Intelligence Test Dashboard</h1>
        <p className="text-slate-600">Test all trip intelligence features with real trip data</p>
      </div>

      {/* Trip Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Trip</CardTitle>
          <CardDescription>Choose a trip to test intelligence features</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.title} ({new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Feature Tests */}
      <Tabs defaultValue="currency" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="cultural">Cultural</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="dining">Dining</TabsTrigger>
        </TabsList>

        {/* Currency Test */}
        <TabsContent value="currency">
          <Card>
            <CardHeader>
              <CardTitle>Currency Advice Test</CardTitle>
              <CardDescription>Test currency advice generation with exchange rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testCurrency} 
                disabled={loading.currency || !selectedTripId}
                className="w-full"
              >
                {loading.currency ? 'Generating...' : 'Generate Currency Advice'}
              </Button>

              {results.currency && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(results.currency, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Test */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Info Test</CardTitle>
              <CardDescription>Test emergency information generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testEmergency} 
                disabled={loading.emergency || !selectedTripId}
                className="w-full"
              >
                {loading.emergency ? 'Generating...' : 'Generate Emergency Info'}
              </Button>

              {results.emergency && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(results.emergency, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Test */}
        <TabsContent value="cultural">
          <Card>
            <CardHeader>
              <CardTitle>Cultural Calendar Test</CardTitle>
              <CardDescription>Test cultural event detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testCultural} 
                disabled={loading.cultural || !selectedTripId}
                className="w-full"
              >
                {loading.cultural ? 'Generating...' : 'Generate Cultural Calendar'}
              </Button>

              {results.cultural && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(results.cultural, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Test */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Suggestions Test</CardTitle>
              <CardDescription>Test gap detection and activity recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testActivities} 
                disabled={loading.activities || !selectedTripId}
                className="w-full"
              >
                {loading.activities ? 'Generating...' : 'Generate Activity Suggestions'}
              </Button>

              {results.activities && (
                <div className="mt-4 space-y-2">
                  {results.activities.gapsDetected !== undefined && (
                    <Badge>Gaps Detected: {results.activities.gapsDetected}</Badge>
                  )}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(results.activities, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dining Test */}
        <TabsContent value="dining">
          <Card>
            <CardHeader>
              <CardTitle>Dining Recommendations Test</CardTitle>
              <CardDescription>Test restaurant recommendations with Yelp integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testDining} 
                disabled={loading.dining || !selectedTripId}
                className="w-full"
              >
                {loading.dining ? 'Generating...' : 'Generate Dining Recommendations'}
              </Button>

              {results.dining && (
                <div className="mt-4 space-y-2">
                  {results.dining.mealsAnalyzed !== undefined && (
                    <Badge>Meals Analyzed: {results.dining.mealsAnalyzed}</Badge>
                  )}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(results.dining, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
