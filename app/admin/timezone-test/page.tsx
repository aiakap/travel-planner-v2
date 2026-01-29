"use client"

import { useState } from "react"
import { DatePopover } from "@/components/ui/date-popover"
import { dateToUTC, utcToDate } from "@/lib/utils/date-timezone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function TimezoneTestPage() {
  const [selectedDate, setSelectedDate] = useState("2026-01-29")
  const [timezone, setTimezone] = useState("America/Los_Angeles")
  const [isEndDate, setIsEndDate] = useState(false)
  
  // Compute conversions
  const utcISO = selectedDate ? dateToUTC(selectedDate, timezone, isEndDate) : ""
  const roundTrip = utcISO ? utcToDate(utcISO, timezone) : ""
  const matches = roundTrip === selectedDate
  
  // Predefined test cases
  const testCases = [
    { date: "2026-01-29", tz: "America/Los_Angeles", label: "Jan 29 PST" },
    { date: "2026-03-09", tz: "America/Los_Angeles", label: "DST Start PST" },
    { date: "2026-11-01", tz: "America/Los_Angeles", label: "DST End PST" },
    { date: "2026-12-31", tz: "America/New_York", label: "Year End EST" },
    { date: "2026-01-01", tz: "Asia/Tokyo", label: "New Year JST" },
  ]
  
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Timezone Date Conversion Test</h1>
        <p className="text-muted-foreground">
          Test dateToUTC and utcToDate conversions to debug timezone issues
        </p>
      </div>
      
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Input Controls
          </CardTitle>
          <CardDescription>
            Select a date, timezone, and mode to test conversions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Date</label>
            <DatePopover 
              value={selectedDate} 
              onChange={setSelectedDate}
              label="Select date"
              className="w-full justify-start"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Timezone</label>
            <select 
              value={timezone} 
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/Los_Angeles">Pacific (PST/PDT) - UTC-8/-7</option>
              <option value="America/New_York">Eastern (EST/EDT) - UTC-5/-4</option>
              <option value="America/Chicago">Central (CST/CDT) - UTC-6/-5</option>
              <option value="Asia/Tokyo">Japan (JST) - UTC+9</option>
              <option value="Europe/London">London (GMT/BST) - UTC+0/+1</option>
              <option value="UTC">UTC - UTC+0</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Date Mode</label>
            <Button 
              onClick={() => setIsEndDate(!isEndDate)}
              variant={isEndDate ? "default" : "outline"}
              className="w-full"
            >
              {isEndDate ? "End Date (11:59:59 PM)" : "Start Date (12:01 AM)"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Display */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Results</CardTitle>
          <CardDescription>
            Shows the UTC conversion and round-trip verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-slate-600">Selected Date:</div>
            <div className="text-sm font-mono">{selectedDate}</div>
            
            <div className="text-sm font-medium text-slate-600">Timezone:</div>
            <div className="text-sm font-mono">{timezone}</div>
            
            <div className="text-sm font-medium text-slate-600">Mode:</div>
            <div className="text-sm font-mono">
              {isEndDate ? "End (11:59:59 PM)" : "Start (12:01 AM)"}
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">UTC ISO Output:</div>
                <div className="text-sm font-mono bg-slate-100 p-2 rounded border">
                  {utcISO || "(none)"}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Round-trip (UTC → Local):</div>
                <div className="text-sm font-mono bg-slate-100 p-2 rounded border">
                  {roundTrip || "(none)"}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <div className="text-sm font-medium">Verification:</div>
                <div className={`text-lg font-bold ${matches ? "text-green-600" : "text-red-600"}`}>
                  {matches ? "✅ Match" : "❌ Mismatch"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Expected Values Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
          <CardDescription>
            What the conversions should produce
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Start Date (12:01 AM):</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">
              <li>Jan 29 PST → 2026-01-29T08:01:00.000Z (UTC)</li>
              <li>Jan 29 EST → 2026-01-29T05:01:00.000Z (UTC)</li>
              <li>Jan 29 JST → 2026-01-28T15:01:00.000Z (UTC)</li>
            </ul>
          </div>
          
          <div className="space-y-1 pt-2">
            <div className="font-medium">End Date (11:59:59 PM):</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">
              <li>Jan 29 PST → 2026-01-30T07:59:59.000Z (UTC)</li>
              <li>Jan 29 EST → 2026-01-30T04:59:59.000Z (UTC)</li>
              <li>Jan 29 JST → 2026-01-29T14:59:59.000Z (UTC)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Cases</CardTitle>
          <CardDescription>
            Common edge cases to test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testCases.map((testCase, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(testCase.date)
                  setTimezone(testCase.tz)
                }}
                className="text-xs"
              >
                {testCase.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Debug Info */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1 font-mono">
          <div>Browser Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
          <div>Current Time: {new Date().toISOString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
