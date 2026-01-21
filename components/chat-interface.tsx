"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts";
import { UserPersonalizationData, ChatQuickAction, getHobbyBasedDestination, getPreferenceBudgetLevel } from "@/lib/personalization";
import { ChatWelcomeMessage } from "@/components/chat-welcome-message";
import { ChatQuickActions } from "@/components/chat-quick-actions";
import { SuggestionDetailModal } from "@/components/suggestion-detail-modal";
import { PlaceSuggestion, GooglePlaceData } from "@/lib/types/place-suggestion";

interface ChatInterfaceProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  profileData?: UserPersonalizationData | null;
  quickActions?: ChatQuickAction[];
  tripId?: string;
  onReservationAdded?: () => void;
}

// Helper to extract text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

// Helper to check for tool invocations in message parts
function getToolInvocations(message: UIMessage) {
  return message.parts.filter(
    (part: any) =>
      part.type && part.type.startsWith("tool-")
  );
}

// Helper to extract place suggestions from tool invocations
function getPlaceSuggestions(message: UIMessage): PlaceSuggestion[] {
  const suggestions: PlaceSuggestion[] = [];
  
  if (!message.parts) {
    console.log("🔍 [getPlaceSuggestions] No parts in message");
    return suggestions;
  }
  
  console.log("🔍 [getPlaceSuggestions] Analyzing message parts:", {
    totalParts: message.parts.length,
    partTypes: message.parts.map((p: any) => p.type),
  });
  
  message.parts.forEach((part: any, idx: number) => {
    console.log(`🔍 [getPlaceSuggestions] Part ${idx}:`, {
      type: part.type,
      toolName: part.toolName,
      hasResult: !!part.result,
      hasArgs: !!part.args,
      allKeys: Object.keys(part),
      FULL_PART: part, // Log the complete object
    });
    
    // AI SDK can return tool results in different formats:
    // 1. type: "tool-result" with toolName and result fields
    // 2. type: "tool-{toolName}" with args field
    // 3. Nested result structure
    
    const isSuggestPlaceTool = 
      (part.type === "tool-result" && part.toolName === "suggest_place") ||
      part.type === "tool-suggest_place" ||
      part.toolName === "suggest_place";
    
    if (isSuggestPlaceTool) {
      // Try to find the result in various locations
      let result = null;
      
      // Option 1: part.output (tool-result format from server)
      if (part.output) {
        result = part.output;
      }
      // Option 2: part.result (alternative tool-result format)
      else if (part.result) {
        result = part.result;
      }
      // Option 3: part.args (tool invocation format with arguments)
      else if (part.args) {
        // The args contain what was passed to the tool, so we need to construct the result
        result = {
          success: true,
          placeName: part.args.placeName,
          category: part.args.category,
          type: part.args.type,
          context: {
            dayNumber: part.args.dayNumber,
            timeOfDay: part.args.timeOfDay,
            specificTime: part.args.specificTime,
            notes: part.args.notes,
          },
          tripId: part.args.tripId,
          segmentId: part.args.segmentId,
        };
      }
      
      console.log("✨ [getPlaceSuggestions] Found suggest_place result:", {
        hasResult: !!result,
        placeName: result?.placeName,
        category: result?.category,
      });
      
      if (result?.placeName) {
        const suggestion: PlaceSuggestion = {
          placeName: result.placeName,
          category: result.category,
          type: result.type,
          context: result.context,
          tripId: result.tripId,
          segmentId: result.segmentId,
        };
        suggestions.push(suggestion);
        console.log("✅ [getPlaceSuggestions] Added suggestion:", suggestion.placeName);
      } else {
        console.error("❌ [getPlaceSuggestions] Invalid suggest_place result:", {
          hasResult: !!result,
          placeName: result?.placeName,
          partKeys: Object.keys(part),
        });
      }
    }
  });
  
  console.log(`🔍 [getPlaceSuggestions] Total suggestions extracted: ${suggestions.length}`);
  if (suggestions.length > 0) {
    console.log("📍 [getPlaceSuggestions] Place names:", suggestions.map(s => s.placeName));
  }
  
  return suggestions;
}

export default function ChatInterface({
  conversationId,
  initialMessages = [],
  profileData = null,
  quickActions = [],
  tripId,
  onReservationAdded,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    suggestion: PlaceSuggestion;
    tripId: string;
  } | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat" as any,
    body: { conversationId } as any,
    initialMessages,
  } as any);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === ("in_progress" as any);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle "Get Lucky" button click - now shows plan before creating
  const handleGetLucky = () => {
    if (isLoading) return;
    
    // Generate profile-aware lucky prompt
    const destination = profileData 
      ? getHobbyBasedDestination(profileData.hobbies) 
      : null;
    const budgetLevel = (profileData 
      ? getPreferenceBudgetLevel(profileData.preferences) 
      : 'moderate') as "moderate" | "budget" | "luxury";
    
    const luckyPrompt = generateGetLuckyPrompt(destination, budgetLevel);
    
    // Bot will show the plan and ask for confirmation
    const confirmationMessage = `I have a trip idea for you:

${luckyPrompt}

What would you like to change about this plan, or should I create it as is?`;
    
    sendMessage({ text: confirmationMessage });
  };

  // Helper function to find place name in text with flexible matching
  const findPlaceInText = (text: string, placeName: string, startFrom: number): number => {
    // Try exact match first
    let index = text.indexOf(placeName, startFrom);
    if (index !== -1) return index;
    
    // Try with "the " prefix (e.g., "the Grand Hotel" when placeName is "Grand Hotel")
    index = text.indexOf(`the ${placeName}`, startFrom);
    if (index !== -1) return index + 4; // Skip "the "
    
    // Try with "The " prefix
    index = text.indexOf(`The ${placeName}`, startFrom);
    if (index !== -1) return index + 4; // Skip "The "
    
    // Try case-insensitive search
    const lowerText = text.toLowerCase();
    const lowerPlace = placeName.toLowerCase();
    index = lowerText.indexOf(lowerPlace, startFrom);
    if (index !== -1) return index;
    
    // Try matching without common prefixes like "Hotel", "The", etc.
    const placeWithoutPrefix = placeName.replace(/^(Hotel|The|Le|La|L'|Restaurant)\s+/i, '');
    if (placeWithoutPrefix !== placeName) {
      index = lowerText.indexOf(placeWithoutPrefix.toLowerCase(), startFrom);
      if (index !== -1) {
        // Find the actual start in the original text (accounting for case)
        const actualText = text.substring(index);
        const match = actualText.match(new RegExp(`\\b${placeWithoutPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
        if (match) {
          return index + match.index!;
        }
      }
    }
    
    return -1;
  };

  // Render text with clickable place suggestions
  const renderTextWithPlaceLinks = (text: string, suggestions: PlaceSuggestion[]) => {
    console.log("🎨 [renderTextWithPlaceLinks] Called with:", {
      textLength: text.length,
      textPreview: text.substring(0, 100) + "...",
      suggestionsCount: suggestions.length,
      placeNames: suggestions.map(s => s.placeName),
    });
    
    if (suggestions.length === 0) {
      console.log("⚠️  [renderTextWithPlaceLinks] No suggestions, rendering plain text");
      return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
    }

    // Split text by place names and create clickable links
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let linkedCount = 0;

    suggestions.forEach((suggestion, idx) => {
      const placeIndex = findPlaceInText(text, suggestion.placeName, lastIndex);
      
      console.log(`🔍 [renderTextWithPlaceLinks] Looking for "${suggestion.placeName}":`, {
        found: placeIndex !== -1,
        position: placeIndex,
        searchStartedAt: lastIndex,
      });
      
      if (placeIndex !== -1) {
        // Add text before the place name
        if (placeIndex > lastIndex) {
          elements.push(
            <span key={`text-${idx}`}>
              {text.substring(lastIndex, placeIndex)}
            </span>
          );
        }

        // Determine the actual text to highlight (might include "the " prefix)
        const actualTextMatch = text.substring(placeIndex, placeIndex + suggestion.placeName.length);

        // Add clickable place name with visual indicator
        elements.push(
          <button
            key={`place-${idx}`}
            onClick={() => {
              console.log("🖱️  [renderTextWithPlaceLinks] Place clicked:", suggestion.placeName);
              if (tripId || suggestion.tripId) {
                setSelectedSuggestion({
                  suggestion,
                  tripId: tripId || suggestion.tripId!,
                });
              } else {
                console.warn("⚠️  [renderTextWithPlaceLinks] No tripId available for suggestion");
              }
            }}
            className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 cursor-pointer transition-colors font-medium inline-flex items-center gap-0.5"
            title="Click to see details and add to itinerary"
          >
            {actualTextMatch}
            <MapPin className="h-3 w-3 inline" />
          </button>
        );

        linkedCount++;
        lastIndex = placeIndex + suggestion.placeName.length;
      } else {
        console.warn(`❌ [renderTextWithPlaceLinks] Place name "${suggestion.placeName}" NOT FOUND in text`);
        console.warn(`   Text around this area: "${text.substring(Math.max(0, lastIndex - 50), lastIndex + 100)}"`);
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      );
    }

    console.log(`✅ [renderTextWithPlaceLinks] Rendered ${linkedCount}/${suggestions.length} clickable links`);

    return <div className="whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  // Handle adding suggestion to itinerary
  const handleAddToItinerary = async (data: {
    placeName: string;
    placeData: GooglePlaceData | null;
    day: number;
    startTime: string;
    endTime: string;
    cost: number;
    category: string;
    type: string;
  }) => {
    try {
      // Import the create reservation action
      const { createReservationFromSuggestion } = await import(
        "@/lib/actions/create-reservation"
      );

      await createReservationFromSuggestion({
        tripId: selectedSuggestion!.tripId,
        placeName: data.placeName,
        placeData: data.placeData,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost,
        category: data.category,
        type: data.type,
      });

      // Notify parent component
      if (onReservationAdded) {
        onReservationAdded();
      }
    } catch (error) {
      console.error("Error adding to itinerary:", error);
      throw error;
    }
  };

  return (
    <>
      {selectedSuggestion && (
        <SuggestionDetailModal
          suggestion={selectedSuggestion.suggestion}
          tripId={selectedSuggestion.tripId}
          onClose={() => setSelectedSuggestion(null)}
          onAddToItinerary={handleAddToItinerary}
        />
      )}
      
      <div className="flex flex-col h-[calc(100vh-12rem)] bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="space-y-8">
            {/* Personalized Welcome Message */}
            <ChatWelcomeMessage
              userName={profileData?.profile?.firstName || undefined}
              hobbies={profileData?.hobbies.map(h => h.hobby.name) || []}
              recentTrips={profileData?.recentTrips || []}
            />
            
            {/* Quick Action Buttons */}
            {quickActions.length > 0 && (
              <ChatQuickActions
                suggestions={quickActions}
                onSelect={(prompt) => {
                  sendMessage({ text: prompt });
                }}
              />
            )}
            
            {/* Surprise Me Button - Minimal Style */}
            <div className="max-w-2xl mx-auto mt-6">
              <button
                onClick={handleGetLucky}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Surprise me with a trip idea
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                I'll show you a plan that you can adjust before creating
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const textContent = getMessageText(message);
          const toolInvocations = getToolInvocations(message);
          const placeSuggestions = getPlaceSuggestions(message);

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-5 py-3 ${
                  message.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-900 border border-slate-100"
                }`}
              >
                {message.role === "assistant" && placeSuggestions.length > 0
                  ? renderTextWithPlaceLinks(textContent, placeSuggestions)
                  : <div className="whitespace-pre-wrap leading-relaxed">{textContent}</div>
                }

                {/* Show tool calls if present */}
                {toolInvocations.length > 0 && (
                  <div className="mt-3 text-xs opacity-60 border-t border-current/10 pt-2 space-y-1">
                    {toolInvocations.map((tool: any, idx: number) => (
                      <div key={idx}>
                        {(tool.toolName?.includes("create_trip") || tool.toolInvocation?.toolName === "create_trip") && "Created trip"}
                        {(tool.toolName?.includes("add_segment") || tool.toolInvocation?.toolName === "add_segment") && "Added segment"}
                        {(tool.toolName?.includes("suggest_reservation") || tool.toolInvocation?.toolName === "suggest_reservation") && "Added reservation"}
                        {(tool.toolName?.includes("suggest_place") || tool.toolInvocation?.toolName === "suggest_place") && "Suggested place"}
                        {(tool.toolName?.includes("get_user_trips") || tool.toolInvocation?.toolName === "get_user_trips") && "Fetched trips"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-lg px-5 py-3 flex items-center gap-2 border border-slate-100">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200 p-6 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-3 max-w-4xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your trip..."
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {error && (
          <div className="mt-3 text-sm text-red-600 max-w-4xl mx-auto">
            {error.message}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

