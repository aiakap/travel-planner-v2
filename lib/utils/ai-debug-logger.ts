/**
 * AI Debug Logger
 * 
 * Structured logging for AI responses to help troubleshoot issues
 */

export function logAIResponse(
  input: string,
  rawResponse: string,
  parsed: any,
  success: boolean,
  error?: any
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== AI RESPONSE DEBUG ===');
    console.log('Input:', input);
    console.log('Raw (first 200 chars):', rawResponse.substring(0, 200));
    console.log('Parsed:', JSON.stringify(parsed, null, 2));
    console.log('Success:', success);
    
    if (parsed) {
      console.log('Auto-add items:', parsed.autoAddItems?.length || 0);
      console.log('Suggestions:', parsed.suggestions?.length || parsed.suggestionItems?.length || 0);
      console.log('Inline suggestions:', parsed.inlineSuggestions?.length || 0);
    }
    
    if (error) {
      console.error('Error:', error);
    }
    
    console.log('========================');
  }
}

export function logAIMetrics(metrics: {
  event: string;
  success: boolean;
  parseError?: string | null;
  responseLength: number;
  autoAddCount?: number;
  suggestionCount?: number;
  timestamp: Date;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 [AI Metrics]', {
      ...metrics,
      timestamp: metrics.timestamp.toISOString()
    });
  }
}
