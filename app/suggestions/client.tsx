"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  Heart,
  Plane,
  Sparkles,
  Users,
  DollarSign,
  Map as MapIcon,
  MapPin,
  MoreHorizontal,
  X,
  Send,
  Plus,
} from "lucide-react";

const MapPinIcon = MapPin;
import { TripSuggestionCard } from "@/components/trip-suggestion-card";
import { TripSuggestionDetailModal } from "@/components/trip-suggestion-detail-modal";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import { searchPlace } from "@/lib/actions/google-places";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";
import { generateLoadingMessages } from "@/lib/loading-messages";
import { ProfileGraphItem, GraphCategory, GraphData } from "@/lib/types/profile-graph";
import { parseXmlToGraph } from "@/lib/profile-graph-xml";

interface SuggestionsClientProps {
  user: { id: string; name: string; email: string; image?: string };
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  profileItems: ProfileGraphItem[];
  xmlData: string | null;
}

interface GroupedProfile {
  [category: string]: ProfileGraphItem[];
}

// Category configuration with icons and labels
const CATEGORY_CONFIG: Record<GraphCategory, { icon: any; label: string; color: string }> = {
  "travel-preferences": { icon: Plane, label: "Travel Preferences", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "family": { icon: Users, label: "Family & Travel Companions", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "hobbies": { icon: Heart, label: "Hobbies & Interests", color: "bg-pink-50 text-pink-700 border-pink-200" },
  "spending-priorities": { icon: DollarSign, label: "Spending Priorities", color: "bg-green-50 text-green-700 border-green-200" },
  "travel-style": { icon: MapPinIcon, label: "Travel Style", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "destinations": { icon: MapIcon, label: "Destinations", color: "bg-teal-50 text-teal-700 border-teal-200" },
  "other": { icon: MoreHorizontal, label: "Other", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function SuggestionsClient({ user, userProfile, profileItems: initialProfileItems, xmlData: initialXmlData }: SuggestionsClientProps) {
  const [profileOpen, setProfileOpen] = useState(true); // Open by default
  
  // Profile state (local updates)
  const [profileItems, setProfileItems] = useState<ProfileGraphItem[]>(initialProfileItems);
  const [xmlData, setXmlData] = useState<string | null>(initialXmlData);
  const [graphData, setGraphData] = useState<GraphData>(() => {
    if (initialXmlData) {
      return parseXmlToGraph(initialXmlData);
    }
    return { nodes: [], edges: [] };
  });
  
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
  
  // Track if suggestions have been loaded
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Hover state for delete buttons
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Mini chat state
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  // Animation state
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<string>>(new Set());
  const [animatingItems, setAnimatingItems] = useState<Map<string, { from: { x: number; y: number }; category: string }>>(new Map());

  // Group profile items by category
  const groupedProfile: GroupedProfile = profileItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as GroupedProfile);

  const loadTripSuggestions = async () => {
    if (!profileItems || profileItems.length === 0) {
      setSuggestionsError("Please build your profile first before generating suggestions");
      return;
    }
    
    // Generate loading messages before starting - format data correctly
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
    
    const messages = generateLoadingMessages({
      hobbies,
      preferences,
      relationships
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
          profileItems,
          xmlData,
          userProfile,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate suggestions");
      
      const data = await response.json();
      setTripSuggestions(data.suggestions);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Error loading trip suggestions:", error);
      setSuggestionsError("Could not load trip suggestions");
    } finally {
      clearInterval(messageInterval);
      setLoadingSuggestions(false);
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (item: ProfileGraphItem) => {
    try {
      const node = graphData.nodes.find(n => n.id === item.id);
      if (!node) return;
      
      const response = await fetch("/api/profile-graph/delete-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: item.id,
          category: item.category,
          subcategory: item.metadata?.subcategory,
          value: item.value
        })
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const data = await response.json();

      // Update local state
      if (data.graphData) {
        setGraphData(data.graphData);
        // Re-extract items from updated XML
        const updatedItems = data.graphData.nodes
          .filter((n: any) => n.type === 'item')
          .map((n: any) => ({
            id: n.id,
            category: n.category,
            value: n.value,
            metadata: n.metadata
          }));
        setProfileItems(updatedItems);
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item deleted from profile");
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Handle chat submit
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userInput = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);
    
    // Ensure profile is expanded when adding items
    if (!profileOpen) {
      setProfileOpen(true);
    }

    // Capture input position for animation
    const inputRect = chatInputRef.current?.getBoundingClientRect();

    try {
      const response = await fetch("/api/profile-graph/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: [] // Direct add mode - no history
        })
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      const data = await response.json();

      // Update graph with any auto-added items
      if (data.graphData) {
        setGraphData(data.graphData);
        // Re-extract items from updated XML
        const updatedItems = data.graphData.nodes
          .filter((n: any) => n.type === 'item')
          .map((n: any) => ({
            id: n.id,
            category: n.category,
            value: n.value,
            metadata: n.metadata
          }));
        setProfileItems(updatedItems);
        
        // NOW trigger animations - wait for React to render new items
        if (inputRect && data.addedItems && data.addedItems.length > 0) {
          setTimeout(() => {
            const newAnimations = new Map();
            const newItems = new Set<string>();
            
            data.addedItems.forEach((item: any) => {
              const itemId = item.id || `${item.category}-${item.value}`;
              newAnimations.set(itemId, {
                from: { x: inputRect.x, y: inputRect.y },
                category: item.category
              });
              newItems.add(itemId);
            });
            
            setAnimatingItems(newAnimations);
            setNewlyAddedItems(newItems);
            
            // Clear animation state after duration
            setTimeout(() => {
              setAnimatingItems(new Map());
              setNewlyAddedItems(new Set());
            }, 1200);
          }, 100); // Wait for DOM update
        }
      }
      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Profile updated via chat");
    } catch (error) {
      console.error("Error sending chat message:", error);
    } finally {
      setIsChatLoading(false);
      chatInputRef.current?.focus();
    }
  };

  // Handle key down in chat
  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
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

  // Calculate total items count
  const totalItems = profileItems.length;
  
  // Helper function to get category background color for animation
  const getCategoryBgColor = (category: GraphCategory): string => {
    const colors: Record<GraphCategory, string> = {
      "travel-preferences": "#dbeafe",
      "family": "#f3e8ff",
      "hobbies": "#fce7f3",
      "spending-priorities": "#d1fae5",
      "travel-style": "#fed7aa",
      "destinations": "#ccfbf1",
      "other": "#f1f5f9"
    };
    return colors[category] || colors.other;
  };
  
  // Animation variants for input pulse
  const inputPulseVariants = {
    idle: {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)"
    },
    pulsing: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 0 0 0px rgba(59, 130, 246, 0)",
        "0 0 0 4px rgba(59, 130, 246, 0.3)",
        "0 0 0 0px rgba(59, 130, 246, 0)"
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Trip Suggestions</h1>
          <p className="text-slate-600">Get AI-powered personalized trip ideas based on your profile</p>
        </div>

        {/* Profile Information */}
        {profileItems.length > 0 ? (
          <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                    {profileOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <CardTitle>Dossier</CardTitle>
                    <CardDescription className="ml-2">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </CardDescription>
                  </CollapsibleTrigger>
                  
                  {/* Inline Quick Add */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <motion.div
                      variants={inputPulseVariants}
                      animate={isChatLoading ? "pulsing" : "idle"}
                    >
                      <Input
                        ref={chatInputRef}
                        type="text"
                        placeholder={isChatLoading ? "" : "Add item..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleChatKeyDown}
                        disabled={isChatLoading}
                        className={`h-8 w-48 text-xs transition-all ${isChatLoading ? 'border-blue-400' : ''}`}
                      />
                    </motion.div>
                    <Button
                      onClick={handleChatSubmit}
                      disabled={!chatInput.trim() || isChatLoading}
                      size="sm"
                      className="h-8 bg-green-600 hover:bg-green-700"
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Thinking state message */}
                <AnimatePresence>
                  {isChatLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-slate-500 italic mt-2 text-right"
                    >
                      thinking about what you said...
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-2">
                  {/* Category Tiles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(groupedProfile).map(([category, items]) => {
                      const config = CATEGORY_CONFIG[category as GraphCategory] || CATEGORY_CONFIG.other;
                      const Icon = config.icon;
                      
                      return (
                        <Card key={category} className={`border ${config.color}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <CardTitle className="text-sm font-semibold">{config.label}</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                              {items.length} {items.length === 1 ? 'item' : 'items'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-1.5">
                              <AnimatePresence>
                                {items.map((item, idx) => {
                                  const isAnimating = animatingItems.has(item.id);
                                  const animData = animatingItems.get(item.id);
                                  
                                  return (
                                    <motion.div
                                      key={item.id}
                                      data-item-id={item.id}
                                      className="relative inline-flex items-center group"
                                      onMouseEnter={() => setHoveredItem(item.id)}
                                      onMouseLeave={() => setHoveredItem(null)}
                                      initial={isAnimating && animData ? {
                                        position: 'fixed',
                                        left: animData.from.x,
                                        top: animData.from.y,
                                        scale: 0.8,
                                        opacity: 0.8,
                                        zIndex: 1000
                                      } : false}
                                      animate={isAnimating ? {
                                        position: 'relative',
                                        left: 0,
                                        top: 0,
                                        scale: 1,
                                        opacity: 1,
                                        zIndex: 1
                                      } : {}}
                                      transition={{
                                        type: 'spring',
                                        duration: 0.8,
                                        bounce: 0.3
                                      }}
                                    >
                                      <motion.div
                                        initial={isAnimating ? {
                                          backgroundColor: getCategoryBgColor(item.category as GraphCategory)
                                        } : false}
                                        animate={isAnimating ? {
                                          backgroundColor: '#e2e8f0'
                                        } : {}}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                        className="rounded-full"
                                      >
                                        <Badge 
                                          variant="secondary" 
                                          className="text-xs font-normal hover:bg-slate-300 transition-colors cursor-default"
                                        >
                                          {item.value}
                                        </Badge>
                                      </motion.div>
                                      {hoveredItem === item.id && (
                                        <button
                                          onClick={() => handleDeleteItem(item)}
                                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors z-10"
                                          title="Delete"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Profile Data</CardTitle>
              <CardDescription>
                Build your profile first to get personalized trip suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit your <a href="/profile/graph" className="text-blue-600 hover:underline">Profile Graph</a> to start building your travel profile.
              </p>
            </CardContent>
          </Card>
        )}

        {/* AI Trip Suggestions */}
        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-3">
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
                disabled={loadingSuggestions || profileItems.length === 0}
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {hasLoadedOnce ? "Refresh Ideas" : "Show Ideas"}
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
            ) : tripSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tripSuggestions.map((suggestion, idx) => (
                  <TripSuggestionCard
                    key={idx}
                    suggestion={suggestion}
                    imageUrl={suggestionImages[idx]}
                    onClick={() => handleSuggestionClick(suggestion, suggestionImages[idx])}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">
                  Click &quot;Show Ideas&quot; to generate personalized trip suggestions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
