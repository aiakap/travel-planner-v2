/**
 * Parse Conversational Message Utility
 * 
 * Parses messages with [Bracketed Suggestions] syntax into structured data
 * for rendering inline clickable suggestions
 */

import { GraphCategory } from "@/lib/types/profile-graph";

export interface ConversationalSuggestion {
  id: string;
  text: string; // The bracketed text
  startIndex: number;
  endIndex: number;
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
}

export interface MessageSegment {
  type: 'text' | 'suggestion';
  content: string;
  suggestion?: ConversationalSuggestion;
}

export interface ParsedConversationalMessage {
  segments: MessageSegment[];
  suggestions: ConversationalSuggestion[];
}

/**
 * Parse a message with [Bracketed Suggestions] syntax
 * 
 * @param message - The message text with [Bracketed Text] placeholders
 * @param suggestions - Array of suggestion metadata from AI
 * @returns Parsed structure for rendering
 */
export function parseConversationalMessage(
  message: string,
  suggestions: Array<{
    text: string;
    category: GraphCategory;
    subcategory: string;
    metadata?: Record<string, string>;
  }>
): ParsedConversationalMessage {
  const segments: MessageSegment[] = [];
  const parsedSuggestions: ConversationalSuggestion[] = [];

  // Create a map of suggestion text to metadata for quick lookup
  const suggestionMap = new Map(
    suggestions.map((s, index) => [
      s.text.toLowerCase(),
      {
        ...s,
        id: `suggestion-${index}`
      }
    ])
  );

  // Find all [Bracketed Text] in the message
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  let suggestionIndex = 0;

  while ((match = regex.exec(message)) !== null) {
    // Add text before this bracket as a text segment
    if (match.index > lastIndex) {
      const textContent = message.substring(lastIndex, match.index);
      if (textContent) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }

    // Extract the bracketed text
    const bracketedText = match[1];
    
    // Find matching suggestion metadata
    const suggestionMeta = suggestionMap.get(bracketedText.toLowerCase()) || {
      text: bracketedText,
      category: 'other' as GraphCategory,
      subcategory: 'general',
      metadata: {},
      id: `suggestion-${suggestionIndex}`
    };

    // Create suggestion object
    const suggestion: ConversationalSuggestion = {
      id: suggestionMeta.id,
      text: bracketedText,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      category: suggestionMeta.category,
      subcategory: suggestionMeta.subcategory,
      metadata: suggestionMeta.metadata
    };

    parsedSuggestions.push(suggestion);

    // Add suggestion segment
    segments.push({
      type: 'suggestion',
      content: bracketedText,
      suggestion: suggestion
    });

    lastIndex = match.index + match[0].length;
    suggestionIndex++;
  }

  // Add remaining text after last bracket
  if (lastIndex < message.length) {
    const textContent = message.substring(lastIndex);
    if (textContent) {
      segments.push({
        type: 'text',
        content: textContent
      });
    }
  }

  // If no brackets found, treat entire message as one text segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: message
    });
  }

  return {
    segments,
    suggestions: parsedSuggestions
  };
}

/**
 * Check if a message contains bracketed suggestion syntax
 */
export function isConversationalMessage(message: string): boolean {
  return /\[([^\]]+)\]/.test(message);
}

/**
 * Extract plain text from a conversational message (remove all brackets)
 */
export function extractPlainText(message: string): string {
  return message.replace(/\[([^\]]+)\]/g, '$1');
}

/**
 * Count the number of suggestions in a message
 */
export function countSuggestions(message: string): number {
  const matches = message.match(/\[([^\]]+)\]/g);
  return matches ? matches.length : 0;
}
