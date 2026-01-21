"use client";

import { TripSuggestion } from "@/lib/personalization";
import { TripSuggestionCard } from "./trip-suggestion-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface TripSuggestionsCarouselProps {
  suggestions: TripSuggestion[];
}

export function TripSuggestionsCarousel({ suggestions }: TripSuggestionsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 350; // Width of one card + gap
    const newScrollPosition = scrollContainerRef.current.scrollLeft + 
      (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollContainerRef.current.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-slate-50 transition-smooth"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
      )}

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-slate-50 transition-smooth"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-slate-900" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex-shrink-0 w-[320px] snap-start"
          >
            <TripSuggestionCard suggestion={suggestion} />
          </div>
        ))}
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
