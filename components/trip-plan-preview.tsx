"use client";

import { MapPin, Calendar, Sparkles, Users, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export interface TripPlanData {
  destination: string;
  dates: string;
  duration?: string;
  tripStyle?: string;
  budget?: string;
  travelers?: string;
  highlights?: string[];
}

interface TripPlanPreviewProps {
  plan: TripPlanData;
  onApprove?: () => void;
  onModify?: () => void;
}

export function TripPlanPreview({ plan, onApprove, onModify }: TripPlanPreviewProps) {
  const [highlightsExpanded, setHighlightsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto my-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-4">
        <h3 className="text-xl font-display font-bold">Your Trip Plan</h3>
        <p className="text-sm text-white/80 mt-1">Review and customize your journey</p>
      </div>

      {/* Plan Details */}
      <div className="p-6 space-y-4">
        {/* Destination */}
        <PlanSection icon={MapPin} title="Destination">
          <p className="text-lg font-semibold text-slate-900">{plan.destination}</p>
        </PlanSection>

        {/* Dates */}
        <PlanSection icon={Calendar} title="Dates">
          <p className="text-slate-900">{plan.dates}</p>
          {plan.duration && (
            <p className="text-sm text-slate-600 mt-1">({plan.duration})</p>
          )}
        </PlanSection>

        {/* Trip Style */}
        {plan.tripStyle && (
          <PlanSection icon={Sparkles} title="Trip Style">
            <p className="text-slate-900">{plan.tripStyle}</p>
            {plan.budget && (
              <p className="text-sm text-slate-600 mt-1">{plan.budget}</p>
            )}
          </PlanSection>
        )}

        {/* Travelers */}
        {plan.travelers && (
          <PlanSection icon={Users} title="Travelers">
            <p className="text-slate-900">{plan.travelers}</p>
          </PlanSection>
        )}

        {/* Highlights - Collapsible */}
        {plan.highlights && plan.highlights.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setHighlightsExpanded(!highlightsExpanded)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-700">Highlights</span>
              </div>
              {highlightsExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </button>
            
            {highlightsExpanded && (
              <div className="mt-3 ml-8 space-y-2">
                {plan.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-slate-400 text-sm mt-1">•</span>
                    <p className="text-slate-700 text-sm flex-1">{highlight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onApprove}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium"
        >
          Looks perfect! Create this trip
        </Button>
        <Button
          onClick={onModify}
          variant="outline"
          className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          Let me change something
        </Button>
      </div>
    </div>
  );
}

interface PlanSectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function PlanSection({ icon: Icon, title, children }: PlanSectionProps) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
      <Icon className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}
