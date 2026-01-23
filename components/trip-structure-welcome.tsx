"use client";

import { MapPin, Calendar, Sparkles, ArrowRight } from "lucide-react";
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
            Plan Your Trip Structure
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Start by outlining the big picture. Break your trip into parts - destinations, transportation, and timing. 
            We'll add the details like hotels and activities later.
          </p>
        </div>

        {/* Examples Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide text-center">
            What You Can Create
          </h2>
          
          <div className="grid gap-3">
            {/* Simple Trip Example */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Quick Getaway</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Single-part trips for short adventures
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">Example:</span>
                    <span>"Weekend in Napa" or "Lunch and a hike in Boulder"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-City Example */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                  2-5
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Multi-City Adventure</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Multiple destinations with travel between them
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">Example:</span>
                      <span>"2 weeks: Paris → Amsterdam → Berlin"</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5 text-slate-500">
                      <ArrowRight className="h-3 w-3" />
                      <span>Part 1: Fly to Paris (4 days)</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5 text-slate-500">
                      <ArrowRight className="h-3 w-3" />
                      <span>Part 2: Train to Amsterdam (3 days)</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5 text-slate-500">
                      <ArrowRight className="h-3 w-3" />
                      <span>Part 3: Train to Berlin (4 days)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Road Trip Example */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                  3+
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Road Trip or Complex Journey</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Multiple stops with driving, hiking, or extended exploration
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">Example:</span>
                    <span>"SF → Monterey → Big Sur → Portland"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What Comes Next */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Just the Structure For Now</h3>
              <p className="text-sm text-slate-600">
                Focus on <span className="font-medium">where you're going</span>, <span className="font-medium">how you'll get there</span>, 
                and <span className="font-medium">how long you'll stay</span>. 
                The specific hotels, restaurants, and activities come in the next step!
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={onStartChat}
            size="lg"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Describe My Trip
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onStartChat}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use the Form
          </Button>
        </div>

        <p className="text-xs text-center text-slate-500">
          You can use the form on the left, chat here, or combine both approaches
        </p>
      </div>
    </div>
  );
}
