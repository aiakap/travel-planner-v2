"use client";

/**
 * Conversational Message Component
 * 
 * Renders assistant messages with inline clickable suggestion bubbles
 * Parses [Bracketed Text] syntax and renders as interactive elements
 */

import { parseConversationalMessage, isConversationalMessage } from "@/lib/ai/parse-conversational-message";
import { GraphCategory, GRAPH_CATEGORIES } from "@/lib/types/profile-graph";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

export interface ConversationalMessageProps {
  message: string;
  suggestions: Array<{
    text: string;
    category: GraphCategory;
    subcategory: string;
    metadata?: Record<string, string>;
  }>;
  onSuggestionClick: (suggestion: {
    category: GraphCategory;
    subcategory: string;
    value: string;
    metadata?: Record<string, string>;
  }) => void;
  onNewTopicClick: () => void;
  className?: string;
}

/**
 * Inline Suggestion Bubble Component
 * Renders a clickable suggestion with category color coding
 */
function SuggestionBubble({
  text,
  category,
  subcategory,
  metadata,
  onClick
}: {
  text: string;
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
  onClick: () => void;
}) {
  // Get category color
  const getCategoryColor = () => {
    const categoryConfig = GRAPH_CATEGORIES.find(c => c.id === category);
    return categoryConfig?.color || "#6b7280";
  };

  const categoryColor = getCategoryColor();

  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center px-2 py-0.5 mx-0.5
        text-sm font-medium rounded
        transition-all duration-200 ease-out
        hover:brightness-110 hover:scale-105
        active:scale-95
        cursor-pointer
        border-b-2
      "
      style={{
        color: categoryColor,
        borderBottomColor: categoryColor,
        backgroundColor: `${categoryColor}10`
      }}
    >
      {text}
    </button>
  );
}

export function ConversationalMessage({
  message,
  suggestions,
  onSuggestionClick,
  onNewTopicClick,
  className = ""
}: ConversationalMessageProps) {
  // Check if this is a conversational message with suggestions
  if (!isConversationalMessage(message) || !suggestions || suggestions.length === 0) {
    // Render as plain text with paragraph breaks
    return (
      <div className={className}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed space-y-3">
          {message.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    );
  }

  // Parse the message
  const parsed = parseConversationalMessage(message, suggestions);

  // Handle suggestion selection
  const handleSelect = (suggestionId: string) => {
    const suggestion = parsed.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    onSuggestionClick({
      category: suggestion.category,
      subcategory: suggestion.subcategory,
      value: suggestion.text,
      metadata: suggestion.metadata
    });
  };

  // Split message by paragraph breaks and render each paragraph
  const paragraphs = message.split('\n\n');
  
  return (
    <div className={`${className} space-y-4`}>
      {/* Render paragraphs with inline suggestions */}
      <div className="text-sm leading-relaxed space-y-3">
        {paragraphs.map((paragraph, paragraphIndex) => {
          // Parse this paragraph for suggestions
          const paragraphParsed = parseConversationalMessage(paragraph, suggestions);
          
          return (
            <p key={paragraphIndex} className="leading-relaxed">
              {paragraphParsed.segments.map((segment, segmentIndex) => {
                if (segment.type === 'text') {
                  return <span key={`text-${segmentIndex}`}>{segment.content}</span>;
                } else if (segment.type === 'suggestion' && segment.suggestion) {
                  return (
                    <SuggestionBubble
                      key={`suggestion-${segmentIndex}`}
                      text={segment.suggestion.text}
                      category={segment.suggestion.category}
                      subcategory={segment.suggestion.subcategory}
                      metadata={segment.suggestion.metadata}
                      onClick={() => handleSelect(segment.suggestion!.id)}
                    />
                  );
                }
                return null;
              })}
            </p>
          );
        })}
      </div>

      {/* "Suggest a new topic" button */}
      <div className="flex justify-start pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewTopicClick}
          className="text-xs"
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          Suggest a new topic
        </Button>
      </div>
    </div>
  );
}
