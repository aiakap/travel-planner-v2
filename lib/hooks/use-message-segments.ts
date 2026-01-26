import { useState } from 'react';
import { MessageSegment, PlaceSuggestion } from '@/lib/types/place-pipeline';

/**
 * Hook to convert chat messages into MessageSegments using the pipeline
 * 
 * This hook takes text and place suggestions from chat messages and runs them
 * through the 3-stage pipeline to generate properly formatted segments with
 * clickable place links and Google Places data.
 */
export function useMessageSegments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cache, setCache] = useState<Map<string, MessageSegment[]>>(new Map());

  /**
   * Convert text and place suggestions into MessageSegments
   * 
   * @param text - The assistant's message text
   * @param suggestions - Place suggestions extracted from the message
   * @returns Array of MessageSegments ready for rendering
   */
  const getSegmentsForMessage = async (
    text: string, 
    suggestions: PlaceSuggestion[]
  ): Promise<MessageSegment[]> => {    // Create cache key based on text and number of suggestions
    const cacheKey = `${text.substring(0, 100)}-${suggestions.length}`;
    
    // Return cached result if available
    if (cache.has(cacheKey)) {
      console.log('📦 [useMessageSegments] Returning cached segments');      return cache.get(cacheKey)!;
    }

    // If no suggestions, just return text segment
    if (suggestions.length === 0) {      return [{ type: 'text', content: text }];
    }

    setIsProcessing(true);
    console.log('🔄 [useMessageSegments] Processing message:', {
      textLength: text.length,
      suggestionsCount: suggestions.length,
      placeNames: suggestions.map(s => s.placeName),
    });

    try {      // Call the pipeline API to generate segments
      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: text,
          stages: ['stage1', 'stage2', 'stage3']
        }),
      });      if (!response.ok) {
        throw new Error(`Pipeline API returned ${response.status}`);
      }

      const result = await response.json();      if (result.success && result.data?.stage3?.segments) {
        const segments = result.data.stage3.segments;
        console.log('✅ [useMessageSegments] Pipeline generated segments:', {
          segmentCount: segments.length,
          placeSegments: segments.filter((s: MessageSegment) => s.type === 'place').length,
        });
        
        // Cache the result
        setCache(prev => new Map(prev).set(cacheKey, segments));        return segments;
      }
      
      console.warn('⚠️  [useMessageSegments] Pipeline succeeded but no segments returned');      return [{ type: 'text', content: text }];
    } catch (error) {
      console.error('❌ [useMessageSegments] Failed to generate segments:', error);      // Fallback to plain text on error
      return [{ type: 'text', content: text }];
    } finally {
      setIsProcessing(false);    }
  };

  return { getSegmentsForMessage, isProcessing };
}
