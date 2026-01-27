/**
 * Email Extraction System - Main exports
 * 
 * Plugin-based architecture for extracting structured data from
 * confirmation emails (hotels, flights, car rentals, etc.)
 */

// Core types
export type { 
  ExtractionContext, 
  ExtractionPlugin, 
  ExtractionRegistry,
  BuildExtractionResult 
} from './types';

// Main builder
export { buildExtractionPrompt } from './build-extraction-prompt';

// Registry management
export { 
  createExtractionRegistry,
  addPlugin,
  removePlugin,
  hasPlugin
} from './registry';

// Plugins
export { hotelExtractionPlugin } from './plugins/hotel-extraction-plugin';
export { flightExtractionPlugin } from './plugins/flight-extraction-plugin';
export { carRentalExtractionPlugin } from './plugins/car-rental-extraction-plugin';
