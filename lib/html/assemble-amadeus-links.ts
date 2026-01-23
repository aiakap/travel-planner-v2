import { 
  PlaceEntity,
  TransportEntity,
  HotelEntity,
  GooglePlaceData, 
  AmadeusTransportData,
  AmadeusHotelData,
  MessageSegment, 
  Stage4Output 
} from "@/lib/types/amadeus-pipeline";
import { parseXmlTags, XmlTag } from "@/lib/html/parse-xml-tags";

/**
 * Stage 4: HTML Assembly (XML-based with ID Matching)
 * 
 * Takes XML-marked text and resolved data maps, parses XML tags,
 * and creates interactive segments with hover cards.
 * 
 * Key features:
 * - Parses XML tags by ID for precise matching
 * - Supports context attributes for better resolution
 * - Merges Google Places + Amadeus data for hotels
 */
export function assembleAmadeusLinks(
  markedText: string,
  placeEntities: PlaceEntity[],
  transportEntities: TransportEntity[],
  hotelEntities: HotelEntity[],
  placeMap: { [id: string]: GooglePlaceData },
  transportMap: { [id: string]: AmadeusTransportData },
  hotelMap: { [id: string]: AmadeusHotelData }
): Stage4Output {
  console.log(`🔨 [Stage 4] Assembling HTML from XML-marked text (${markedText.length} chars)`);
  console.log(`   Entities: ${placeEntities.length} places, ${transportEntities.length} transport, ${hotelEntities.length} hotels`);
  console.log(`   Resolved data: ${Object.keys(placeMap).length} places, ${Object.keys(transportMap).length} transport, ${Object.keys(hotelMap).length} hotels`);

  const segments: MessageSegment[] = [];

  // Parse XML tags from marked text
  const xmlTags = parseXmlTags(markedText);
  
  console.log(`   Found ${xmlTags.length} XML tags to process`);

  // Build entity maps by ID
  const placeEntityMap = new Map(placeEntities.map(e => [e.id, e]));
  const transportEntityMap = new Map(transportEntities.map(e => [e.id, e]));
  const hotelEntityMap = new Map(hotelEntities.map(e => [e.id, e]));

  let lastIndex = 0;

  for (const tag of xmlTags) {
    // Add text segment before this tag
    if (tag.startIndex > lastIndex) {
      const textContent = markedText.substring(lastIndex, tag.startIndex);
      segments.push({
        type: "text",
        content: textContent,
      });
    }

    // Create segment based on tag type
    if (tag.type === "place") {
      const entity = placeEntityMap.get(tag.id);
      const placeData = placeMap[tag.id];
      
      segments.push({
        type: "place",
        suggestion: entity as any, // Convert entity to suggestion format
        placeData,
        display: tag.displayText,
      });
      
      console.log(`   ✅ Place: "${tag.displayText}" (id: ${tag.id}, found: ${!!placeData})`);
    } else if (tag.type === "flight") {
      const entity = transportEntityMap.get(tag.id);
      const transportData = transportMap[tag.id];
      
      segments.push({
        type: "transport",
        suggestion: entity as any,
        transportData,
        display: tag.displayText,
      });
      
      console.log(`   ✅ Flight: "${tag.displayText}" (id: ${tag.id}, found: ${!!transportData})`);
    } else if (tag.type === "hotel") {
      const entity = hotelEntityMap.get(tag.id);
      const googleData = placeMap[tag.id]; // Hotels can have Google data too
      const amadeusData = hotelMap[tag.id];
      
      segments.push({
        type: "hotel",
        suggestion: entity as any,
        placeData: googleData, // Primary display from Google
        hotelData: amadeusData, // Availability from Amadeus
        display: tag.displayText,
      });
      
      console.log(`   ✅ Hotel: "${tag.displayText}" (id: ${tag.id}, Google: ${!!googleData}, Amadeus: ${!!amadeusData})`);
    }

    lastIndex = tag.endIndex;
  }

  // Add remaining text after the last tag
  if (lastIndex < markedText.length) {
    const textContent = markedText.substring(lastIndex);
    segments.push({
      type: "text",
      content: textContent,
    });
  }

  const placeSegmentCount = segments.filter(s => s.type === "place").length;
  const transportSegmentCount = segments.filter(s => s.type === "transport" || s.type === "flight").length;
  const hotelSegmentCount = segments.filter(s => s.type === "hotel").length;
  
  console.log(`✅ [Stage 4] Created ${segments.length} segments:`);
  console.log(`   - ${placeSegmentCount} places`);
  console.log(`   - ${transportSegmentCount} transport`);
  console.log(`   - ${hotelSegmentCount} hotels`);

  return {
    segments,
  };
}

/**
 * Helper function to render segments as plain text (for debugging)
 */
export function segmentsToText(segments: MessageSegment[]): string {
  return segments
    .map(segment => {
      if (segment.type === "text") {
        return segment.content || "";
      } else {
        return segment.display || "";
      }
    })
    .join("");
}

/**
 * Helper function to extract all suggestion names from segments
 */
export function extractSuggestionNames(segments: MessageSegment[]): { 
  places: string[]; 
  transport: string[];
  hotels: string[]; 
} {
  return {
    places: segments
      .filter(s => s.type === "place")
      .map(s => s.display || "")
      .filter(Boolean),
    transport: segments
      .filter(s => s.type === "transport" || s.type === "flight")
      .map(s => s.display || "")
      .filter(Boolean),
    hotels: segments
      .filter(s => s.type === "hotel")
      .map(s => s.display || "")
      .filter(Boolean),
  };
}
