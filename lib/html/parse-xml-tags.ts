/**
 * XML Tag Parser Utility
 * 
 * Extracts XML tags from marked text and parses their attributes.
 * Used in Stage 4 (HTML Assembly) to replace XML tags with HTML hover cards.
 */

export interface XmlTag {
  type: "place" | "hotel" | "flight" | "transport";
  id: string;
  displayText: string;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  attributes: Record<string, string>;
}

/**
 * Parse all XML tags from marked text
 * 
 * Supports tags: <place>, <hotel>, <flight>
 * 
 * Example:
 * <place id="le-meurice-1" context="Paris France" type="Restaurant">Le Meurice</place>
 * 
 * Returns array of parsed tags with positions for replacement
 */
export function parseXmlTags(markedText: string): XmlTag[] {
  const tags: XmlTag[] = [];
  
  // Regex patterns for each tag type
  const tagPatterns = [
    { type: "place" as const, regex: /<place\s+([^>]+)>([^<]+)<\/place>/g },
    { type: "hotel" as const, regex: /<hotel\s+([^>]+)>([^<]+)<\/hotel>/g },
    { type: "flight" as const, regex: /<flight\s+([^>]+)>([^<]+)<\/flight>/g },
  ];

  for (const { type, regex } of tagPatterns) {
    let match;
    while ((match = regex.exec(markedText)) !== null) {
      const fullMatch = match[0];
      const attributesString = match[1];
      const displayText = match[2];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      // Parse attributes
      const attributes = parseAttributes(attributesString);
      
      // Get ID
      const id = attributes.id || `${type}-${tags.length}`;

      tags.push({
        type,
        id,
        displayText,
        fullMatch,
        startIndex,
        endIndex,
        attributes,
      });
    }
  }

  // Sort by start index
  tags.sort((a, b) => a.startIndex - b.startIndex);

  return tags;
}

/**
 * Parse XML attributes from attribute string
 * 
 * Example: 'id="le-meurice-1" context="Paris France" type="Restaurant"'
 * Returns: { id: "le-meurice-1", context: "Paris France", type: "Restaurant" }
 */
function parseAttributes(attributesString: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  // Regex to match attribute="value" pairs
  const attrRegex = /(\w+)="([^"]*)"/g;
  let match;
  
  while ((match = attrRegex.exec(attributesString)) !== null) {
    const key = match[1];
    const value = match[2];
    attributes[key] = value;
  }

  return attributes;
}

/**
 * Replace a single XML tag with HTML content
 * 
 * Used to replace <place id="x">Name</place> with <span>...</span>
 */
export function replaceXmlTag(
  markedText: string,
  tag: XmlTag,
  replacement: string
): string {
  return (
    markedText.substring(0, tag.startIndex) +
    replacement +
    markedText.substring(tag.endIndex)
  );
}

/**
 * Replace all XML tags with HTML replacements
 * 
 * Takes a map of id -> replacement HTML and processes all tags
 */
export function replaceAllXmlTags(
  markedText: string,
  replacements: Map<string, string>
): string {
  const tags = parseXmlTags(markedText);
  
  // Process tags in reverse order to maintain indices
  let result = markedText;
  let offset = 0;

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const replacement = replacements.get(tag.id) || tag.displayText;
    
    result = replaceXmlTag(result, {
      ...tag,
      startIndex: tag.startIndex + offset,
      endIndex: tag.endIndex + offset,
    }, replacement);
    
    // Update offset for subsequent tags
    offset += replacement.length - tag.fullMatch.length;
  }

  return result;
}

/**
 * Extract just the entity IDs and display text from marked text
 * 
 * Useful for quick extraction without full parsing
 */
export function extractEntityIds(markedText: string): Array<{ type: string; id: string; name: string }> {
  const tags = parseXmlTags(markedText);
  return tags.map(tag => ({
    type: tag.type,
    id: tag.id,
    name: tag.displayText,
  }));
}
