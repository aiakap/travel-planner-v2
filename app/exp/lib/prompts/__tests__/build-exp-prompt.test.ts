/**
 * Tests for the plugin-based prompt builder
 */

import { buildExpPrompt } from '../build-exp-prompt';
import { PromptBuildContext } from '../types';

describe('buildExpPrompt', () => {
  describe('Base Prompt', () => {
    it('always includes base prompt', () => {
      const context: PromptBuildContext = {
        userMessage: 'Hello',
        messageCount: 10,
        hasExistingTrip: true
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.prompt).toContain('You are an expert AI travel planning assistant');
      expect(result.activePlugins).toContain('Base Prompt');
      expect(result.stats.pluginCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Card Syntax Plugin', () => {
    it('includes card syntax for trip creation keywords', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip to Tokyo',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Card Syntax Definitions');
      expect(result.prompt).toContain('TRIP_CARD');
      expect(result.prompt).toContain('SEGMENT_CARD');
    });

    it('includes card syntax when no trip exists', () => {
      const context: PromptBuildContext = {
        userMessage: 'Tell me about Paris',
        hasExistingTrip: false,
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Card Syntax Definitions');
    });

    it('excludes card syntax for simple queries with existing trip', () => {
      const context: PromptBuildContext = {
        userMessage: 'What time is checkout?',
        hasExistingTrip: true,
        messageCount: 10
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).not.toContain('Card Syntax Definitions');
    });
  });

  describe('Email Parsing Plugin', () => {
    it('includes email parsing for confirmation numbers', () => {
      const context: PromptBuildContext = {
        userMessage: 'Here is my confirmation number: ABC123',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Email Confirmation Parsing');
      expect(result.prompt).toContain('Hotel Confirmation Email Detection');
    });

    it('includes email parsing for long messages', () => {
      const longMessage = 'x'.repeat(600); // > 500 chars
      const context: PromptBuildContext = {
        userMessage: longMessage,
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Email Confirmation Parsing');
    });

    it('excludes email parsing for short normal messages', () => {
      const context: PromptBuildContext = {
        userMessage: 'I want to visit Paris',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).not.toContain('Email Confirmation Parsing');
    });
  });

  describe('Smart Defaults Plugin', () => {
    it('includes smart defaults for vague temporal terms', () => {
      const context: PromptBuildContext = {
        userMessage: 'I want to go next month',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Smart Default Inference');
      expect(result.prompt).toContain('Smart Defaults');
    });

    it('excludes smart defaults when not needed', () => {
      const context: PromptBuildContext = {
        userMessage: 'What restaurants are good?',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).not.toContain('Smart Default Inference');
    });
  });

  describe('Context Awareness Plugin', () => {
    it('includes context awareness for TRIP chat type', () => {
      const context: PromptBuildContext = {
        userMessage: 'Tell me about my trip',
        chatType: 'TRIP',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Entity-Focused Context');
      expect(result.prompt).toContain('CONVERSATION CONTEXT AWARENESS');
    });

    it('includes context awareness for SEGMENT chat type', () => {
      const context: PromptBuildContext = {
        userMessage: 'Update this segment',
        chatType: 'SEGMENT',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Entity-Focused Context');
    });

    it('excludes context awareness without chat type', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).not.toContain('Entity-Focused Context');
    });
  });

  describe('Examples Plugin', () => {
    it('includes examples for early messages', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip',
        messageCount: 2
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Conversation Examples');
      expect(result.prompt).toContain('Example Conversations');
    });

    it('includes examples when no trip exists', () => {
      const context: PromptBuildContext = {
        userMessage: 'Tell me more',
        messageCount: 10,
        hasExistingTrip: false
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).toContain('Conversation Examples');
    });

    it('excludes examples for later messages with existing trip', () => {
      const context: PromptBuildContext = {
        userMessage: 'What about hotels?',
        messageCount: 10,
        hasExistingTrip: true
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.activePlugins).not.toContain('Conversation Examples');
    });
  });

  describe('Plugin Priority', () => {
    it('orders plugins by priority', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip next summer',
        messageCount: 1,
        chatType: 'TRIP'
      };
      
      const result = buildExpPrompt(context);
      
      // Base should be first
      expect(result.prompt.indexOf('You are an expert AI travel planning assistant'))
        .toBeLessThan(result.prompt.indexOf('Card Syntax'));
      
      // Card syntax (priority 10) should come before Smart Defaults (priority 30)
      expect(result.prompt.indexOf('Card Syntax'))
        .toBeLessThan(result.prompt.indexOf('Smart Defaults'));
    });
  });

  describe('Statistics', () => {
    it('provides accurate statistics', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip',
        messageCount: 1
      };
      
      const result = buildExpPrompt(context);
      
      expect(result.stats.totalLength).toBeGreaterThan(0);
      expect(result.stats.pluginCount).toBeGreaterThanOrEqual(1);
      expect(result.stats.totalLength).toBe(result.prompt.length);
    });
  });

  describe('Multiple Plugins', () => {
    it('can include multiple plugins simultaneously', () => {
      const context: PromptBuildContext = {
        userMessage: 'Plan a trip next month',
        messageCount: 1,
        hasExistingTrip: false
      };
      
      const result = buildExpPrompt(context);
      
      // Should include: Base, Card Syntax, Smart Defaults, Examples
      expect(result.activePlugins.length).toBeGreaterThanOrEqual(4);
      expect(result.activePlugins).toContain('Base Prompt');
      expect(result.activePlugins).toContain('Card Syntax Definitions');
      expect(result.activePlugins).toContain('Smart Default Inference');
      expect(result.activePlugins).toContain('Conversation Examples');
    });
  });
});
