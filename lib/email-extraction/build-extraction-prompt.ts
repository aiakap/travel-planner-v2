/**
 * Extraction Prompt Builder - Main orchestrator
 * 
 * This is the core orchestrator that evaluates all plugins and
 * assembles them into a complete extraction prompt based on email content.
 */

import { ExtractionContext, ExtractionPlugin, BuildExtractionResult } from './types';
import { createExtractionRegistry } from './registry';
import { BASE_EXTRACTION_PROMPT } from './base-extraction-prompt';

/**
 * Calculate a score for how well a plugin matches the email content
 * Returns the number of matching keywords
 */
function getPluginScore(plugin: ExtractionPlugin, context: ExtractionContext): number {
  // Call shouldInclude to check if plugin matches
  // We need to extract the keyword count from the plugin's logic
  // For now, we'll use a simple approach: if shouldInclude returns true, 
  // we need to count the keywords
  
  if (!plugin.shouldInclude(context)) {
    return 0;
  }
  
  // Extract keywords from the plugin by checking common patterns
  const lowerText = context.emailText.toLowerCase();
  
  // Define keyword sets for each plugin type
  const keywordSets: Record<string, string[]> = {
    'hotel-extraction': [
      'hotel', 'reservation', 'check-in', 'check-out', 'room', 'guest', 
      'nights', 'accommodation', 'booking', 'stay', 'resort', 'inn', 'lodge',
      'hotels.com', 'booking.com', 'expedia', 'airbnb'
    ],
    'flight-extraction': [
      'flight', 'airline', 'boarding', 'departure', 'arrival', 
      'terminal', 'gate', 'seat', 'passenger', 'aircraft', 
      'aviation', 'e-ticket', 'confirmation code', 'record locator'
    ],
    'car-rental-extraction': [
      'car rental', 'rent a car', 'rental car', 'vehicle rental',
      'pick-up', 'pickup', 'drop-off', 'return location',
      'hertz', 'enterprise', 'avis', 'budget', 'toyota rent',
      'sixt', 'alamo', 'national', 'thrifty', 'europcar', 'dollar',
      'reservation number', 'rental agreement', 'vehicle class',
      'rental confirmation', 'car hire'
    ]
  };
  
  const keywords = keywordSets[plugin.id] || [];
  return keywords.filter(kw => lowerText.includes(kw)).length;
}

/**
 * Build a complete extraction prompt from base + active plugins
 * 
 * @param context - The context for this extraction
 * @param customRegistry - Optional custom registry (defaults to built-in registry)
 * @returns The assembled prompt with schema and metadata
 */
export function buildExtractionPrompt(
  context: ExtractionContext,
  customRegistry?: Map<string, ExtractionPlugin>
): BuildExtractionResult {
  const registry = customRegistry || createExtractionRegistry();
  
  // Start with base prompt (always included)
  const parts: Array<{ priority: number; content: string; id: string }> = [
    { priority: 0, content: BASE_EXTRACTION_PROMPT, id: 'base' }
  ];
  
  const activePlugins: string[] = ['Base Prompt'];
  let selectedPlugin: ExtractionPlugin | null = null;
  let highestScore = 0;
  
  // Evaluate each plugin to find the best match based on keyword count
  for (const [id, plugin] of registry.entries()) {
    try {
      // Get keyword count for this plugin
      const score = getPluginScore(plugin, context);
      
      if (score > 0) {
        console.log(`[ExtractionBuilder] Plugin ${plugin.name} scored ${score} keywords`);
        
        // Select plugin with highest score
        if (score > highestScore) {
          highestScore = score;
          selectedPlugin = plugin;
          console.log(`[ExtractionBuilder] New best match: ${plugin.name} (score: ${score})`);
        }
      }
    } catch (error) {
      console.error(`[ExtractionBuilder] Error evaluating plugin ${id}:`, error);
    }
  }
  
  // Add the selected plugin
  if (selectedPlugin) {
    parts.push({
      priority: selectedPlugin.priority || 999,
      content: selectedPlugin.content,
      id: selectedPlugin.id
    });
    activePlugins.push(selectedPlugin.name);
    
    // Apply context transformation if provided
    if (selectedPlugin.transformContext) {
      context = selectedPlugin.transformContext(context);
    }
    
    console.log(`[ExtractionBuilder] Final selection: ${selectedPlugin.name} (score: ${highestScore})`);
  }
  
  // If no plugin matched, throw error
  if (!selectedPlugin) {
    throw new Error('No extraction plugin matched the email content. Unable to determine reservation type.');
  }
  
  // Sort by priority (lower = earlier)
  parts.sort((a, b) => a.priority - b.priority);
  
  // Join with clear separators
  const prompt = parts.map(p => p.content).join('\n\n---\n\n');
  
  return {
    prompt,
    schema: selectedPlugin.schema,
    extractionType: selectedPlugin.id,
    activePlugins,
    stats: {
      totalLength: prompt.length,
      pluginCount: parts.length
    }
  };
}

/** Export registry creator for custom plugin management */
export { createExtractionRegistry } from './registry';
export { addPlugin, removePlugin, hasPlugin } from './registry';
