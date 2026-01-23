/**
 * Parse Mad-Lib Message Utility
 * 
 * Parses messages with {option1|option2|option3} syntax into structured data
 * for rendering inline clickable bubbles
 */

import { GraphCategory } from "@/lib/types/profile-graph";

export interface MadLibSlot {
  id: string;
  startIndex: number;
  endIndex: number;
  options: string[];
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
}

export interface ParsedMadLibMessage {
  textSegments: string[]; // Text between slots
  slots: MadLibSlot[];
  hasOtherOption: boolean;
}

/**
 * Parse a message with {option1|option2|option3} syntax
 * 
 * @param message - The message text with {} placeholders
 * @param inlineSuggestions - Array of suggestion metadata from AI
 * @returns Parsed structure for rendering
 */
export function parseMadLibMessage(
  message: string,
  inlineSuggestions: Array<{
    id: string;
    options: string[];
    category: GraphCategory;
    subcategory: string;
    metadata?: Record<string, string>;
  }>
): ParsedMadLibMessage {
  const textSegments: string[] = [];
  const slots: MadLibSlot[] = [];
  let hasOtherOption = false;

  // Find all {} blocks in the message
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  let slotIndex = 0;

  while ((match = regex.exec(message)) !== null) {
    // Add text before this slot
    if (match.index > lastIndex) {
      textSegments.push(message.substring(lastIndex, match.index));
    }

    // Parse options from the slot
    const optionsText = match[1];
    const options = optionsText.split('|').map(opt => opt.trim());

    // Check if "other" is an option
    if (options.some(opt => opt.toLowerCase() === 'other')) {
      hasOtherOption = true;
    }

    // Get corresponding suggestion metadata
    const suggestionMeta = inlineSuggestions[slotIndex] || {
      id: `slot-${slotIndex + 1}`,
      options: options,
      category: 'other' as GraphCategory,
      subcategory: 'general',
      metadata: {}
    };

    // Create slot
    slots.push({
      id: suggestionMeta.id,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      options: options,
      category: suggestionMeta.category,
      subcategory: suggestionMeta.subcategory,
      metadata: suggestionMeta.metadata
    });

    lastIndex = match.index + match[0].length;
    slotIndex++;
  }

  // Add remaining text after last slot
  if (lastIndex < message.length) {
    textSegments.push(message.substring(lastIndex));
  }

  // If no slots found, treat entire message as one text segment
  if (slots.length === 0) {
    textSegments.push(message);
  }

  return {
    textSegments,
    slots,
    hasOtherOption
  };
}

/**
 * Check if a message contains mad-lib syntax
 */
export function isMadLibMessage(message: string): boolean {
  return /\{[^}]+\}/.test(message);
}

/**
 * Extract plain text from a mad-lib message (remove all {} blocks)
 */
export function extractPlainText(message: string): string {
  return message.replace(/\{[^}]+\}/g, '[...]');
}
