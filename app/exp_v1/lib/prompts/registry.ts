/**
 * Plugin Registry - Central registration of all prompt plugins
 * 
 * This file defines all built-in plugins and provides functions
 * for managing the plugin registry.
 */

import { PromptPlugin, PromptRegistry, PromptBuildContext } from './types';
import { CARD_SYNTAX_PROMPT } from './card-syntax-prompt';
import { EMAIL_PARSING_PROMPT } from './email-parsing-prompt';
import { SMART_DEFAULTS_PROMPT } from './smart-defaults-prompt';
import { CONTEXT_AWARENESS_PROMPT } from './context-awareness-prompt';
import { EXAMPLES_PROMPT } from './examples-prompt';

/** Helper to register a plugin */
function registerPlugin(registry: PromptRegistry, plugin: PromptPlugin): void {
  if (registry.has(plugin.id)) {
    console.warn(`[PromptRegistry] Plugin ${plugin.id} already registered, overwriting`);
  }
  registry.set(plugin.id, plugin);
}

/** Card Syntax Plugin */
const cardSyntaxPlugin: PromptPlugin = {
  id: 'card-syntax',
  name: 'Card Syntax Definitions',
  content: CARD_SYNTAX_PROMPT,
  priority: 10,
  shouldInclude: (context: PromptBuildContext) => {
    const creationKeywords = ['create', 'plan', 'trip to', 'going to', 'visiting', 'book'];
    return !context.hasExistingTrip || 
           creationKeywords.some(kw => context.userMessage.toLowerCase().includes(kw));
  }
};

/** Email Parsing Plugin */
const emailParsingPlugin: PromptPlugin = {
  id: 'email-parsing',
  name: 'Email Confirmation Parsing',
  content: EMAIL_PARSING_PROMPT,
  priority: 20,
  shouldInclude: (context: PromptBuildContext) => {
    const emailPatterns = [
      /confirmation.*number/i,
      /itinerary.*number/i,
      /booking.*reference/i,
      /check.?in.*check.?out/i,
      /hotels\.com|booking\.com|expedia|airbnb/i
    ];
    return context.userMessage.length > 500 || // Long paste likely
           emailPatterns.some(pattern => pattern.test(context.userMessage));
  }
};

/** Smart Defaults Plugin */
const smartDefaultsPlugin: PromptPlugin = {
  id: 'smart-defaults',
  name: 'Smart Default Inference',
  content: SMART_DEFAULTS_PROMPT,
  priority: 30,
  shouldInclude: (context: PromptBuildContext) => {
    const vagueTerms = ['next month', 'summer', 'winter', 'spring', 'fall', 'soon', 'weekend'];
    return vagueTerms.some(term => context.userMessage.toLowerCase().includes(term));
  }
};

/** Context Awareness Plugin */
const contextAwarenessPlugin: PromptPlugin = {
  id: 'context-awareness',
  name: 'Entity-Focused Context',
  content: CONTEXT_AWARENESS_PROMPT,
  priority: 40,
  shouldInclude: (context: PromptBuildContext) => {
    return !!context.chatType; // Include if focused on specific entity
  }
};

/** Examples Plugin */
const examplesPlugin: PromptPlugin = {
  id: 'examples',
  name: 'Conversation Examples',
  content: EXAMPLES_PROMPT,
  priority: 50,
  shouldInclude: (context: PromptBuildContext) => {
    // Include for first 3 messages or if no trip exists yet
    return !context.messageCount || context.messageCount <= 3 || !context.hasExistingTrip;
  }
};

/** Create the default prompt registry */
export function createPromptRegistry(): PromptRegistry {
  const registry = new Map<string, PromptPlugin>();
  
  // Register all built-in plugins
  registerPlugin(registry, cardSyntaxPlugin);
  registerPlugin(registry, emailParsingPlugin);
  registerPlugin(registry, smartDefaultsPlugin);
  registerPlugin(registry, contextAwarenessPlugin);
  registerPlugin(registry, examplesPlugin);
  
  return registry;
}

/** Add a plugin to the registry */
export function addPlugin(registry: PromptRegistry, plugin: PromptPlugin): void {
  registerPlugin(registry, plugin);
}

/** Remove a plugin from the registry */
export function removePlugin(registry: PromptRegistry, pluginId: string): boolean {
  return registry.delete(pluginId);
}

/** Check if a plugin exists in the registry */
export function hasPlugin(registry: PromptRegistry, pluginId: string): boolean {
  return registry.has(pluginId);
}
