"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripSuggestionCard } from "@/components/trip-suggestion-card";
import { generateLoadingMessages } from "@/lib/loading-messages";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";

interface IdeasClientProps {
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  profileItems: ProfileGraphItem[];
}

// Storage key for suggestions
const SUGGESTIONS_STORAGE_KEY = "trip-suggestions-data";

export default function IdeasClient({ userProfile, profileItems }: IdeasClientProps) {
  const router = useRouter();
  const [tripSuggestions, setTripSuggestions] = useState<AITripSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestionImages, setSuggestionImages] = useState<Record<number, string>>({});
  
  // Loading messages state
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Track if suggestions have been loaded
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Memoize profile data for loading messages
  const loadingMessagesData = useMemo(() => {
    const hobbies = profileItems
      .filter(item => item.category === 'hobbies')
      .map(item => ({ hobby: { name: item.value, category: null } }));
    
    const travelPrefs = profileItems.filter(
      item => item.category === 'travel-preferences' || item.category === 'travel-style'
    );
    const preferences = travelPrefs.map(item => ({
      preferenceType: {
        name: item.metadata?.subcategory || item.category || 'preference'
      },
      option: {
        label: item.value
      }
    }));
    
    const relationships = profileItems
      .filter(item => item.category === 'family')
      .map(item => ({ relationshipType: item.value, nickname: null }));
    
    return { hobbies, preferences, relationships };
  }, [profileItems]);

  const loadTripSuggestions = useCallback(async () => {
    if (!profileItems || profileItems.length === 0) {
      setSuggestionsError("Please build your profile first before generating suggestions");
      return;
    }
    
    const messages = generateLoadingMessages(loadingMessagesData);
    setLoadingMessages(messages);
    setCurrentMessageIndex(0);
    
    setLoadingSuggestions(true);
    setSuggestionsError(null);
    
    // Start rotating messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    
    try {
      const response = await fetch("/api/suggestions/trip-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileItems,
          userProfile,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate suggestions");
      
      const data = await response.json();
      setTripSuggestions(data.suggestions);
      setHasLoadedOnce(true);
      
      // Store suggestions in sessionStorage for the detail page
      try {
        sessionStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify({
          suggestions: data.suggestions,
          userProfile,
          profileItems,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.debug("Failed to store suggestions:", e);
      }
    } catch (error) {
      console.error("Error loading trip suggestions:", error);
      setSuggestionsError("Could not load trip suggestions");
    } finally {
      clearInterval(messageInterval);
      setLoadingSuggestions(false);
    }
  }, [profileItems, loadingMessagesData, userProfile]);

  // Fetch images for trip suggestions
  useEffect(() => {
    if (tripSuggestions.length > 0) {
      const cacheKey = `suggestion-images-${tripSuggestions
        .map(s => s.imageQuery || s.destination)
        .sort()
        .join('|')}`;
      
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedImages = JSON.parse(cached) as Record<number, string>;
          if (Object.keys(cachedImages).length === tripSuggestions.length) {
            setSuggestionImages(cachedImages);
            return;
          }
        }
      } catch (e) {
        console.debug("SessionStorage not available:", e);
      }

      const queries = tripSuggestions.map((suggestion, idx) => ({
        query: suggestion.imageQuery || suggestion.destination,
        index: idx,
        fallbackKeywords: suggestion.destinationKeywords,
      }));

      fetch("/api/places/batch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            const newImages: Record<number, string> = {};
            data.results.forEach((result: { index: number; url: string }) => {
              newImages[result.index] = result.url;
            });
            setSuggestionImages(newImages);
            
            // Cache images
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(newImages));
              
              // Also update stored suggestions with images
              const stored = sessionStorage.getItem(SUGGESTIONS_STORAGE_KEY);
              if (stored) {
                const data = JSON.parse(stored);
                data.images = newImages;
                sessionStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(data));
              }
            } catch (e) {
              console.debug("Failed to cache images:", e);
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch suggestion images:", error);
          const fallbackImages: Record<number, string> = {};
          tripSuggestions.forEach((suggestion, idx) => {
            const searchTerms = suggestion.destinationKeywords?.join(",") || suggestion.destination;
            fallbackImages[idx] = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`;
          });
          setSuggestionImages(fallbackImages);
        });
    }
  }, [tripSuggestions]);

  // Handle suggestion click - navigate to detail page
  const handleSuggestionClick = useCallback((suggestion: AITripSuggestion, index: number) => {
    // Ensure current data is in storage
    try {
      sessionStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify({
        suggestions: tripSuggestions,
        images: suggestionImages,
        userProfile,
        profileItems,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.debug("Failed to store suggestions:", e);
    }
    
    router.push(`/suggestions/ideas/${index}`);
  }, [tripSuggestions, suggestionImages, userProfile, profileItems, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16">
      {/* Back Navigation */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/suggestions">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto mb-4">
            <Lightbulb className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">AI-Generated Trip Ideas</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Get 4 unique trip ideas based on your travel profile. From quick local experiences to multi-city adventures.
          </p>
        </div>

        {/* No Profile Warning */}
        {profileItems.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-6 text-center">
              <p className="text-amber-800 mb-4">
                Build your travel profile first to get personalized trip ideas.
              </p>
              <Link href="/profile#dossier">
                <Button variant="outline" className="border-amber-300 hover:bg-amber-100">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Build Your Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        {profileItems.length > 0 && !hasLoadedOnce && !loadingSuggestions && (
          <Card className="border-2 border-dashed border-amber-200 bg-amber-50/50">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-amber-400 mb-4" />
              <p className="text-slate-600 mb-6">
                Click below to generate 4 personalized trip ideas based on your profile
              </p>
              <Button 
                onClick={loadTripSuggestions}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Trip Ideas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loadingSuggestions && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mx-auto">
                  <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Generating Your Ideas
                  </h3>
                  {loadingMessages.length > 0 && (
                    <motion.p
                      key={currentMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-slate-500"
                    >
                      {loadingMessages[currentMessageIndex]}
                    </motion.p>
                  )}
                </div>
                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  {loadingMessages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentMessageIndex
                          ? "bg-amber-600"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {suggestionsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-center">
              <p className="text-red-600">{suggestionsError}</p>
            </CardContent>
          </Card>
        )}

        {/* Suggestions Grid */}
        {tripSuggestions.length > 0 && !loadingSuggestions && (
          <div className="space-y-4">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTripSuggestions}
                disabled={loadingSuggestions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Ideas
              </Button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tripSuggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <TripSuggestionCard
                    suggestion={suggestion}
                    imageUrl={suggestionImages[idx]}
                    onClick={() => handleSuggestionClick(suggestion, idx)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
