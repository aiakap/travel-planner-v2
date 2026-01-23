"use client";

/**
 * Mad-Lib Message Component
 * 
 * Renders assistant messages with inline clickable suggestion bubbles
 * Parses {option1|option2|option3} syntax and renders as interactive elements
 */

import { InlineSuggestionBubble } from "./inline-suggestion-bubble";
import { parseMadLibMessage, isMadLibMessage } from "@/lib/ai/parse-madlib-message";
import { GraphCategory } from "@/lib/types/profile-graph";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

export interface MadLibMessageProps {
  message: string;
  inlineSuggestions: Array<{
    id: string;
    options: string[];
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

export function MadLibMessage({
  message,
  inlineSuggestions,
  onSuggestionClick,
  onNewTopicClick,
  className = ""
}: MadLibMessageProps) {
  // Check if this is a mad-lib message
  if (!isMadLibMessage(message) || !inlineSuggestions || inlineSuggestions.length === 0) {
    // Render as plain text
    return (
      <div className={className}>
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    );
  }

  // Parse the message
  const parsed = parseMadLibMessage(message, inlineSuggestions);

  // Handle suggestion selection
  const handleSelect = (slotId: string, value: string) => {
    const slot = parsed.slots.find(s => s.id === slotId);
    if (!slot) return;

    onSuggestionClick({
      category: slot.category,
      subcategory: slot.subcategory,
      value: value,
      metadata: slot.metadata
    });
  };

  // Render the message with inline bubbles
  return (
    <div className={`${className} space-y-3`}>
      {/* Main message with inline bubbles */}
      <div className="text-sm leading-relaxed">
        {parsed.textSegments.map((segment, segmentIndex) => (
          <span key={`segment-${segmentIndex}`}>
            {segment}
            {/* Render slot options after this text segment */}
            {segmentIndex < parsed.slots.length && (
              <span className="inline-flex flex-wrap gap-1 items-center">
                {parsed.slots[segmentIndex].options.map((option, optionIndex) => (
                  <InlineSuggestionBubble
                    key={`${parsed.slots[segmentIndex].id}-option-${optionIndex}`}
                    value={option}
                    category={parsed.slots[segmentIndex].category}
                    subcategory={parsed.slots[segmentIndex].subcategory}
                    metadata={parsed.slots[segmentIndex].metadata}
                    isOther={option.toLowerCase() === 'other'}
                    onSelect={(value) => handleSelect(parsed.slots[segmentIndex].id, value)}
                  />
                ))}
              </span>
            )}
          </span>
        ))}
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
