/**
 * Prompt Builder - Main function to build prompts from plugins
 * 
 * This is the core orchestrator that evaluates all plugins and
 * assembles them into a complete prompt based on context.
 */

import { PromptBuildContext, PromptPlugin } from './types';
import { createPromptRegistry } from './registry';
import { BASE_EXP_PROMPT } from './base-exp-prompt';

/** Result of building a prompt */
export interface BuildPromptResult {
  /** The complete assembled prompt */
  prompt: string;
  /** Names of active plugins that were included */
  activePlugins: string[];
  /** Statistics about the prompt */
  stats: {
    /** Total character length of the prompt */
    totalLength: number;
    /** Number of plugins included (including base) */
    pluginCount: number;
  };
}

/**
 * Build a complete prompt from base + active plugins
 * 
 * @param context - The context for this prompt generation
 * @param customRegistry - Optional custom registry (defaults to built-in registry)
 * @returns The assembled prompt with metadata
 */
export function buildExpPrompt(
  context: PromptBuildContext,
  customRegistry?: Map<string, PromptPlugin>
): BuildPromptResult {
  const registry = customRegistry || createPromptRegistry();
  
  // Start with base prompt (always included)
  const parts: Array<{ priority: number; content: string; id: string }> = [
    { priority: 0, content: BASE_EXP_PROMPT, id: 'base' }
  ];
  
  const activePlugins: string[] = ['Base Prompt'];
  
  // Evaluate each plugin
  for (const [id, plugin] of registry.entries()) {
    try {
      if (plugin.shouldInclude(context)) {
        parts.push({
          priority: plugin.priority || 999,
          content: plugin.content,
          id: plugin.id
        });
        activePlugins.push(plugin.name);
        
        // Apply context transformation if provided
        if (plugin.transformContext) {
          context = plugin.transformContext(context);
        }
      }
    } catch (error) {
      console.error(`[PromptBuilder] Error evaluating plugin ${id}:`, error);
    }
  }
  
  // Sort by priority (lower = earlier)
  parts.sort((a, b) => a.priority - b.priority);
  
  // Join with clear separators
  const prompt = parts.map(p => p.content).join('\n\n---\n\n');
  
  return {
    prompt,
    activePlugins,
    stats: {
      totalLength: prompt.length,
      pluginCount: parts.length
    }
  };
}

/** Export registry creator for custom plugin management */
export { createPromptRegistry } from './registry';
export { addPlugin, removePlugin, hasPlugin } from './registry';
