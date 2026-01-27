/**
 * Prompt System - Main Exports
 * 
 * This is the main entry point for the plugin-based prompt system.
 * Import from here to use the prompt builder and related utilities.
 */

// Core types
export type { PromptBuildContext, PromptPlugin, PromptRegistry } from './types';

// Main builder function and result type
export { buildExpPrompt } from './build-exp-prompt';
export type { BuildPromptResult } from './build-exp-prompt';

// Registry management
export { 
  createPromptRegistry,
  addPlugin,
  removePlugin,
  hasPlugin
} from './registry';

// Individual prompts (for reference or custom usage)
export { BASE_EXP_PROMPT } from './base-exp-prompt';
export { CARD_SYNTAX_PROMPT } from './card-syntax-prompt';
export { EMAIL_PARSING_PROMPT } from './email-parsing-prompt';
export { SMART_DEFAULTS_PROMPT } from './smart-defaults-prompt';
export { CONTEXT_AWARENESS_PROMPT } from './context-awareness-prompt';
export { EXAMPLES_PROMPT } from './examples-prompt';
