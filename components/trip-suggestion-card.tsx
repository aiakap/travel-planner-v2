"use client";

import { TripSuggestion } from "@/lib/personalization";
import { MapPin, Calendar, DollarSign, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";

interface TripSuggestionCardProps {
  suggestion: TripSuggestion;
}

export function TripSuggestionCard({ suggestion }: TripSuggestionCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={suggestion.imageUrl}
          alt={suggestion.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Tags */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {suggestion.tags.slice(0, 2).map((tag) => (
            <Badge 
              key={tag} 
              className="bg-white/90 text-slate-900 hover:bg-white"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Destination */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{suggestion.destination}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-display font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
          {suggestion.title}
        </h3>
        
        {/* Description */}
        <p className="text-slate-600 text-sm mb-3 line-clamp-2">
          {suggestion.description}
        </p>
        
        {/* Reason */}
        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-slate-600 italic">
            💡 {suggestion.reason}
          </p>
        </div>
        
        {/* Details */}
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 mt-auto">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{suggestion.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{suggestion.estimatedBudget}</span>
          </div>
        </div>
        
        {/* CTA */}
        <Link
          href={`/chat?suggestion=${encodeURIComponent(suggestion.title)}`}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-lg font-medium transition-smooth group-hover:gap-3"
        >
          Plan This Trip
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
