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
  ): Promise<MessageSegment[]> => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:entry',message:'getSegmentsForMessage called',data:{textLength:text.length,textPreview:text.substring(0,100),suggestionsCount:suggestions.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    // Create cache key based on text and number of suggestions
    const cacheKey = `${text.substring(0, 100)}-${suggestions.length}`;
    
    // Return cached result if available
    if (cache.has(cacheKey)) {
      console.log('📦 [useMessageSegments] Returning cached segments');
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:cache-hit',message:'Returning cached segments',data:{segmentCount:cache.get(cacheKey)!.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return cache.get(cacheKey)!;
    }

    // If no suggestions, just return text segment
    if (suggestions.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:no-suggestions',message:'No suggestions, returning text segment',data:{textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      return [{ type: 'text', content: text }];
    }

    setIsProcessing(true);
    console.log('🔄 [useMessageSegments] Processing message:', {
      textLength: text.length,
      suggestionsCount: suggestions.length,
      placeNames: suggestions.map(s => s.placeName),
    });

    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:before-fetch',message:'About to call pipeline API',data:{query:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Call the pipeline API to generate segments
      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: text,
          stages: ['stage1', 'stage2', 'stage3']
        }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:after-fetch',message:'Pipeline API responded',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        throw new Error(`Pipeline API returned ${response.status}`);
      }

      const result = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:after-json',message:'Pipeline result parsed',data:{success:result.success,hasStage3:!!result.data?.stage3,segmentCount:result.data?.stage3?.segments?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      if (result.success && result.data?.stage3?.segments) {
        const segments = result.data.stage3.segments;
        console.log('✅ [useMessageSegments] Pipeline generated segments:', {
          segmentCount: segments.length,
          placeSegments: segments.filter((s: MessageSegment) => s.type === 'place').length,
        });
        
        // Cache the result
        setCache(prev => new Map(prev).set(cacheKey, segments));
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:success',message:'Returning segments',data:{segmentCount:segments.length,placeCount:segments.filter((s: MessageSegment) => s.type === 'place').length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        
        return segments;
      }
      
      console.warn('⚠️  [useMessageSegments] Pipeline succeeded but no segments returned');
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:no-segments',message:'Pipeline succeeded but no segments',data:{resultSuccess:result.success,hasData:!!result.data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      return [{ type: 'text', content: text }];
    } catch (error) {
      console.error('❌ [useMessageSegments] Failed to generate segments:', error);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:error',message:'Pipeline failed',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Fallback to plain text on error
      return [{ type: 'text', content: text }];
    } finally {
      setIsProcessing(false);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-message-segments.ts:finally',message:'setIsProcessing(false) called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
    }
  };

  return { getSegmentsForMessage, isProcessing };
}
