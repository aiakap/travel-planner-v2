/**
 * Services Index
 * Exports all service modules
 */

// API Resolution
export {
  apiResolutionService,
  resolveAllAPIs,
  resolveSinglePlace,
  type ResolutionOptions,
  type ResolutionResult,
} from "./api-resolution-service";

// Entity Matching
export {
  entityMatcher,
  matchEntities,
  findMatchForName,
  type MatchCandidate,
  type MatchGroup,
  type MatchingOptions,
} from "./entity-matcher";

// Consolidation Pipeline (integration with existing pipeline)
export {
  consolidationPipeline,
  enhancePipelineWithConsolidation,
  type ConsolidationPipelineOptions,
  type ConsolidationPipelineResult,
} from "./consolidation-pipeline";
