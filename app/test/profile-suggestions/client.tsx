"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  User,
  Mail,
  MapPin as MapPinIcon,
  Phone,
  Heart,
  Plane,
  Sparkles,
} from "lucide-react";
import { TripSuggestionCard } from "@/components/trip-suggestion-card";
import { TripSuggestionDetailModal } from "@/components/trip-suggestion-detail-modal";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import { searchPlace } from "@/lib/actions/google-places";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";
import { generateLoadingMessages } from "@/lib/loading-messages";

interface ProfileSuggestionsClientProps {
  user: { id: string; name: string; email: string; image?: string };
  profileData: {
    profile: any | null;
    contacts: any[];
    hobbies: any[];
    travelPreferences: any[];
    relationships: any[];
  } | null;
}

export function ProfileSuggestionsClient({ user, profileData }: ProfileSuggestionsClientProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  
  // AI Trip Suggestions state
  const [tripSuggestions, setTripSuggestions] = useState<AITripSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestionImages, setSuggestionImages] = useState<Record<number, string>>({});
  const [selectedSuggestion, setSelectedSuggestion] = useState<AITripSuggestion | null>(null);
  const [selectedSuggestionImage, setSelectedSuggestionImage] = useState<string | undefined>();
  
  // Loading messages state
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Load trip suggestions on mount
  useEffect(() => {
    if (profileData && tripSuggestions.length === 0) {
      loadTripSuggestions();
    }
  }, [profileData]);

  const loadTripSuggestions = async () => {
    if (!profileData) return;
    
    // Generate loading messages before starting
    const messages = generateLoadingMessages({
      hobbies: profileData.hobbies,
      preferences: profileData.travelPreferences,
      relationships: profileData.relationships,
    });
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
          hobbies: profileData.hobbies,
          preferences: profileData.travelPreferences,
          relationships: profileData.relationships,
          profile: profileData.profile,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate suggestions");
      
      const data = await response.json();
      setTripSuggestions(data.suggestions);
    } catch (error) {
      console.error("Error loading trip suggestions:", error);
      setSuggestionsError("Could not load trip suggestions");
    } finally {
      clearInterval(messageInterval);
      setLoadingSuggestions(false);
    }
  };

  // Fetch images for trip suggestions progressively
  useEffect(() => {
    if (tripSuggestions.length > 0) {
      // Fetch images in parallel, but update state as each one completes
      tripSuggestions.forEach(async (suggestion, idx) => {
        try {
          // Use the same approach as the working hover card
          const query = suggestion.imageQuery || suggestion.destination;
          const place = await searchPlace(query);
          
          if (place?.photos?.[0]) {
            // Get Google Places photo URL
            const photo = place.photos[0] as any;
            if (photo.reference) {
              const photoUrl = await getPhotoUrl(photo.reference, 800);
              setSuggestionImages(prev => ({ ...prev, [idx]: photoUrl }));
            }
          } else {
            // Fallback to Unsplash
            const searchTerms = suggestion.destinationKeywords?.length 
              ? suggestion.destinationKeywords.join(',')
              : query;
            const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`;
            setSuggestionImages(prev => ({ ...prev, [idx]: unsplashUrl }));
          }
        } catch (error) {
          console.error(`Failed to fetch image for suggestion ${idx}:`, error);
          // Fallback to Unsplash on error
          const searchTerms = suggestion.destinationKeywords?.join(',') || suggestion.destination;
          const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerms)},travel`;
          setSuggestionImages(prev => ({ ...prev, [idx]: unsplashUrl }));
        }
      });
    }
  }, [tripSuggestions]);

  const handleSuggestionClick = (suggestion: AITripSuggestion, imageUrl?: string) => {
    setSelectedSuggestion(suggestion);
    setSelectedSuggestionImage(imageUrl);
  };

  const handleCreateTripFromSuggestion = (suggestion: AITripSuggestion) => {
    // For now, just log - in the future this could navigate to trip creation
    console.log("Create trip from suggestion:", suggestion);
    alert(`Creating trip: ${suggestion.title}\n\nThis would navigate to trip creation with pre-filled data.`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile & Trip Suggestions</h1>
          <p className="text-slate-600">View your profile and get AI-powered personalized trip ideas</p>
        </div>

        {/* Profile Information */}
        {profileData && (
          <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profileOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="text-left">
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>
                          {profileData.hobbies.length} hobbies, {profileData.travelPreferences.length} preferences
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-4">
                  {/* Personal Info */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Info
                    </h4>
                    <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {user.email}</div>
                      {profileData.profile?.city && (
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-3 w-3" />
                          {profileData.profile.city}{profileData.profile.country && `, ${profileData.profile.country}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  {profileData.contacts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contacts ({profileData.contacts.length})
                      </h4>
                      <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                        {profileData.contacts.slice(0, 3).map((contact: any, idx: number) => (
                          <div key={idx}>
                            {contact.contactType.label}: {contact.value}
                            {contact.label && ` (${contact.label})`}
                            {contact.isPrimary && <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>}
                          </div>
                        ))}
                        {profileData.contacts.length > 3 && (
                          <div className="italic">+{profileData.contacts.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hobbies */}
                  {profileData.hobbies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Hobbies & Interests ({profileData.hobbies.length})
                      </h4>
                      <div className="pl-6 flex flex-wrap gap-2">
                        {profileData.hobbies.map((hobby: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {hobby.hobby.name}
                            {hobby.level && ` (${hobby.level})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Travel Preferences */}
                  {profileData.travelPreferences.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Travel Preferences ({profileData.travelPreferences.length})
                      </h4>
                      <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                        {profileData.travelPreferences.slice(0, 5).map((pref: any, idx: number) => (
                          <div key={idx}>
                            {pref.preferenceType.label}: {pref.option.label}
                          </div>
                        ))}
                        {profileData.travelPreferences.length > 5 && (
                          <div className="italic">+{profileData.travelPreferences.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Relationships */}
                  {profileData.relationships.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Relationships ({profileData.relationships.length})</h4>
                      <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                        {profileData.relationships.map((rel: any, idx: number) => (
                          <div key={idx}>
                            {rel.relationshipType}: {rel.relatedUser?.name || "Unknown"}
                            {rel.nickname && ` (${rel.nickname})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* AI Trip Suggestions */}
        {profileData && (
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Personalized Trip Ideas
                  </CardTitle>
                  <CardDescription>
                    AI-generated suggestions based on your profile
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTripSuggestions}
                  disabled={loadingSuggestions}
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Refresh Ideas
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {suggestionsError ? (
                <div className="text-sm text-red-600">{suggestionsError}</div>
              ) : loadingSuggestions && tripSuggestions.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600 mb-4" />
                    {loadingMessages.length > 0 && (
                      <p className="text-lg font-medium text-slate-700 animate-fade-in" key={currentMessageIndex}>
                        {loadingMessages[currentMessageIndex]}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tripSuggestions.map((suggestion, idx) => (
                    <TripSuggestionCard
                      key={idx}
                      suggestion={suggestion}
                      imageUrl={suggestionImages[idx]}
                      onClick={() => handleSuggestionClick(suggestion, suggestionImages[idx])}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trip Suggestion Detail Modal */}
        <TripSuggestionDetailModal
          suggestion={selectedSuggestion}
          imageUrl={selectedSuggestionImage}
          isOpen={!!selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onCreateTrip={handleCreateTripFromSuggestion}
        />
      </div>
    </div>
  );
}
