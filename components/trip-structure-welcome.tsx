"use client";

import { MapPin, Calendar, Sparkles, ArrowRight, Layers } from "lucide-react";
import { Button } from "./ui/button";

interface TripStructureWelcomeProps {
  onStartChat: () => void;
}

export function TripStructureWelcome({ onStartChat }: TripStructureWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 lg:p-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Journey Architect
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Describe your journey below to get started. I'll draft a complete timeline structure for you immediately.
          </p>
        </div>

        {/* Visual Hierarchy Definition */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Understanding Your Journey
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* Journey Level */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Journey</h3>
                <p className="text-sm text-slate-600">
                  The complete adventure from start to finish
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-slate-400 rotate-90" />
            </div>

            {/* Chapter Level */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Chapters</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Distinct phases or blocks of time
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Travel</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Stay</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Tour</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Retreat</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-slate-400 rotate-90" />
            </div>

            {/* Moment Level */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Moments</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Specific activities and reservations (added later)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Suggested</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Planned</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Booked</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Input */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide text-center">
            Example Input
          </h2>
          
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3 text-slate-400">
              <Sparkles className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm italic">
                "10 days in Hokkaido from SFO, Jan 29 - Feb 7th, skiing"
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ArrowRight className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">What Happens Next</h3>
                <p className="text-sm text-slate-600">
                  I'll analyze your input and immediately draft a complete timeline with Chapters. 
                  You'll see the structure appear on the right as we chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What I Focus On */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">I Focus on Chapters, Not Moments</h3>
              <p className="text-sm text-slate-600">
                I help you define <span className="font-medium">where you're going</span>, <span className="font-medium">how you'll get there</span>, 
                and <span className="font-medium">how long each Chapter lasts</span>. 
                Specific hotels, restaurants, and activities (Moments) come after you lock in the structure!
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={onStartChat}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Describing Your Journey
          </Button>
        </div>

        <p className="text-xs text-center text-slate-500">
          I'll draft a complete structure based on what you tell me
        </p>
      </div>
    </div>
  );
}
