/**
 * Location Chain Engine
 * 
 * Provides intelligent suggestions for chaining locations across trip segments.
 * Analyzes the complete journey and suggests logical location connections.
 */

interface Segment {
  id: string;
  dbId?: string;
  type: string;
  name: string;
  days: number;
  start_location: string;
  end_location: string;
  start_image: string | null;
  end_image: string | null;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  start_timezone?: string;
  end_timezone?: string;
  start_timezone_offset?: number;
  end_timezone_offset?: number;
  sameLocation?: boolean;
}

export interface ChainSuggestion {
  id: string;
  type: 'round-trip' | 'sequential' | 'travel-inference' | 'gap-fill' | 'single-location-sync';
  priority: number; // 1 = highest
  title: string;
  description: string;
  changes: Array<{
    segmentIndex: number;
    field: 'start_location' | 'end_location';
    currentValue: string;
    suggestedValue: string;
    segmentName: string;
  }>;
  autoApply?: boolean; // Auto-apply without user confirmation
}

export interface ValidationError {
  segmentIndex: number;
  field: 'start_location' | 'end_location';
  type: 'missing' | 'chain-break' | 'mismatch';
  message: string;
  severity: 'error' | 'warning';
}

export interface ChainAnalysis {
  suggestions: ChainSuggestion[];
  validationErrors: ValidationError[];
  isComplete: boolean;
  chainQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Check if a segment is single-location (start = end)
 * Now checks the toggle state instead of segment type
 */
function isSingleLocation(segment: Segment): boolean {
  return segment.sameLocation ?? false;
}

/**
 * Analyze all segments and generate intelligent chain suggestions
 */
export function analyzeLocationChain(
  segments: Segment[],
  segmentTypeMap?: Record<string, string>
): ChainAnalysis {
  const suggestions: ChainSuggestion[] = [];
  const validationErrors: ValidationError[] = [];
  
  if (segments.length === 0) {
    return {
      suggestions: [],
      validationErrors: [],
      isComplete: true,
      chainQuality: 'excellent'
    };
  }

  // 1. Round-trip detection
  const roundTripSuggestions = detectRoundTrip(segments);
  suggestions.push(...roundTripSuggestions);

  // 2. Sequential chaining
  const sequentialSuggestions = detectSequentialChains(segments);
  suggestions.push(...sequentialSuggestions);

  // 3. Travel segment inference
  const travelInferences = detectTravelSegments(segments);
  suggestions.push(...travelInferences);

  // 4. Single-location propagation
  const singleLocationSuggestions = detectSingleLocationSync(segments);
  suggestions.push(...singleLocationSuggestions);

  // 5. Validation errors
  const errors = validateLocationChain(segments);
  validationErrors.push(...errors);

  // Calculate chain quality
  const chainQuality = calculateChainQuality(segments, validationErrors);
  const isComplete = validationErrors.filter(e => e.severity === 'error').length === 0;

  return {
    suggestions: suggestions.sort((a, b) => a.priority - b.priority),
    validationErrors,
    isComplete,
    chainQuality
  };
}

/**
 * Detect round-trip patterns (first start = last end)
 */
function detectRoundTrip(segments: Segment[]): ChainSuggestion[] {
  const suggestions: ChainSuggestion[] = [];
  
  if (segments.length < 2) return suggestions;

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  // If first start is set but last end is not
  if (firstSegment.start_location && !lastSegment.end_location) {
    suggestions.push({
      id: 'round-trip-end',
      type: 'round-trip',
      priority: 1,
      title: 'Round Trip Detected',
      description: 'Complete your journey by returning to your starting point',
      changes: [{
        segmentIndex: segments.length - 1,
        field: 'end_location',
        currentValue: lastSegment.end_location,
        suggestedValue: firstSegment.start_location,
        segmentName: lastSegment.name
      }],
      autoApply: true
    });
  }

  // If last end is set but first start is not
  if (lastSegment.end_location && !firstSegment.start_location) {
    suggestions.push({
      id: 'round-trip-start',
      type: 'round-trip',
      priority: 1,
      title: 'Round Trip Detected',
      description: 'Set your starting point to match your return destination',
      changes: [{
        segmentIndex: 0,
        field: 'start_location',
        currentValue: firstSegment.start_location,
        suggestedValue: lastSegment.end_location,
        segmentName: firstSegment.name
      }],
      autoApply: true
    });
  }

  return suggestions;
}

/**
 * Detect sequential chain opportunities (segment N end → segment N+1 start)
 */
function detectSequentialChains(segments: Segment[]): ChainSuggestion[] {
  const suggestions: ChainSuggestion[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];

    // Skip if next is single-location (will be handled separately)
    if (isSingleLocation(next)) continue;

    // If current end is set but next start is not
    if (current.end_location && !next.start_location) {
      suggestions.push({
        id: `sequential-forward-${i}`,
        type: 'sequential',
        priority: 2,
        title: 'Continue Journey',
        description: `Connect ${current.name} to ${next.name}`,
        changes: [{
          segmentIndex: i + 1,
          field: 'start_location',
          currentValue: next.start_location,
          suggestedValue: current.end_location,
          segmentName: next.name
        }],
        autoApply: true
      });
    }

    // If next start is set but current end is not
    if (next.start_location && !current.end_location) {
      suggestions.push({
        id: `sequential-backward-${i}`,
        type: 'sequential',
        priority: 2,
        title: 'Connect Chapters',
        description: `Complete ${current.name} to connect with ${next.name}`,
        changes: [{
          segmentIndex: i,
          field: 'end_location',
          currentValue: current.end_location,
          suggestedValue: next.start_location,
          segmentName: current.name
        }],
        autoApply: true
      });
    }
  }

  return suggestions;
}

/**
 * Detect travel segments that can be inferred from surrounding chapters
 */
function detectTravelSegments(segments: Segment[]): ChainSuggestion[] {
  const suggestions: ChainSuggestion[] = [];

  for (let i = 1; i < segments.length - 1; i++) {
    const segment = segments[i];
    
    // Only suggest for TRAVEL segments
    if (segment.type.toUpperCase() !== 'TRAVEL') continue;

    const prev = segments[i - 1];
    const next = segments[i + 1];

    const changes: ChainSuggestion['changes'] = [];

    // Infer travel segment from previous end to next start
    if (prev.end_location && !segment.start_location) {
      changes.push({
        segmentIndex: i,
        field: 'start_location',
        currentValue: segment.start_location,
        suggestedValue: prev.end_location,
        segmentName: segment.name
      });
    }

    if (next.start_location && !segment.end_location) {
      changes.push({
        segmentIndex: i,
        field: 'end_location',
        currentValue: segment.end_location,
        suggestedValue: next.start_location,
        segmentName: segment.name
      });
    }

    if (changes.length > 0) {
      suggestions.push({
        id: `travel-inference-${i}`,
        type: 'travel-inference',
        priority: 3,
        title: 'Travel Route Detected',
        description: `Auto-fill ${segment.name} based on surrounding destinations`,
        changes,
        autoApply: true
      });
    }
  }

  return suggestions;
}

/**
 * Detect single-location segments that need start/end sync
 */
function detectSingleLocationSync(segments: Segment[]): ChainSuggestion[] {
  const suggestions: ChainSuggestion[] = [];

  segments.forEach((segment, index) => {
    if (!isSingleLocation(segment)) return;

    const changes: ChainSuggestion['changes'] = [];

    // If start is set but end is not, sync end to start
    if (segment.start_location && !segment.end_location) {
      changes.push({
        segmentIndex: index,
        field: 'end_location',
        currentValue: segment.end_location,
        suggestedValue: segment.start_location,
        segmentName: segment.name
      });
    }

    // If end is set but start is not, sync start to end
    if (segment.end_location && !segment.start_location) {
      changes.push({
        segmentIndex: index,
        field: 'start_location',
        currentValue: segment.start_location,
        suggestedValue: segment.end_location,
        segmentName: segment.name
      });
    }

    if (changes.length > 0) {
      suggestions.push({
        id: `single-location-sync-${index}`,
        type: 'single-location-sync',
        priority: 1,
        title: 'Single Location Sync',
        description: `${segment.name} stays in one location`,
        changes,
        autoApply: true
      });
    }
  });

  return suggestions;
}

/**
 * Validate location chain and detect issues
 */
function validateLocationChain(segments: Segment[]): ValidationError[] {
  const errors: ValidationError[] = [];

  segments.forEach((segment, index) => {
    // Check for missing locations
    if (!segment.start_location) {
      errors.push({
        segmentIndex: index,
        field: 'start_location',
        type: 'missing',
        message: 'Start location is required',
        severity: 'error'
      });
    }

    if (!segment.end_location) {
      errors.push({
        segmentIndex: index,
        field: 'end_location',
        type: 'missing',
        message: 'End location is required',
        severity: 'error'
      });
    }

    // Check for chain breaks between segments
    if (index < segments.length - 1) {
      const next = segments[index + 1];
      
      if (segment.end_location && next.start_location) {
        if (segment.end_location !== next.start_location) {
          errors.push({
            segmentIndex: index,
            field: 'end_location',
            type: 'chain-break',
            message: `Disconnected from ${next.name}. You'll need to travel from ${segment.end_location} to ${next.start_location}`,
            severity: 'warning'
          });
        }
      }
    }

    // Check for single-location mismatch
    if (isSingleLocation(segment)) {
      if (segment.start_location && segment.end_location) {
        if (segment.start_location !== segment.end_location) {
          errors.push({
            segmentIndex: index,
            field: 'end_location',
            type: 'mismatch',
            message: `This segment is set to same location but has different start and end`,
            severity: 'warning'
          });
        }
      }
    }
  });

  return errors;
}

/**
 * Calculate overall chain quality
 */
function calculateChainQuality(
  segments: Segment[],
  errors: ValidationError[]
): 'excellent' | 'good' | 'fair' | 'poor' {
  const totalFields = segments.length * 2;
  const filledFields = segments.reduce((count, seg) => {
    return count + (seg.start_location ? 1 : 0) + (seg.end_location ? 1 : 0);
  }, 0);
  
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  const completionRate = filledFields / totalFields;

  if (errorCount > 0) return 'poor';
  if (warningCount > 2) return 'fair';
  if (completionRate < 0.5) return 'fair';
  if (completionRate < 0.8) return 'good';
  if (warningCount > 0) return 'good';
  
  return 'excellent';
}

/**
 * Apply a suggestion to segments
 */
export function applySuggestion(
  segments: Segment[],
  suggestion: ChainSuggestion
): Segment[] {
  const updated = [...segments];
  
  suggestion.changes.forEach(change => {
    if (updated[change.segmentIndex]) {
      updated[change.segmentIndex] = {
        ...updated[change.segmentIndex],
        [change.field]: change.suggestedValue
      };
    }
  });
  
  return updated;
}

/**
 * Apply multiple suggestions to segments
 */
export function applyMultipleSuggestions(
  segments: Segment[],
  suggestions: ChainSuggestion[]
): Segment[] {
  let updated = [...segments];
  
  suggestions.forEach(suggestion => {
    updated = applySuggestion(updated, suggestion);
  });
  
  return updated;
}

/**
 * Get chain status for a specific segment
 */
export function getSegmentChainStatus(
  segment: Segment,
  index: number,
  segments: Segment[]
): {
  startStatus: 'complete' | 'missing' | 'suggested';
  endStatus: 'complete' | 'missing' | 'suggested';
  hasChainIssue: boolean;
} {
  const startStatus = segment.start_location ? 'complete' : 'missing';
  const endStatus = segment.end_location ? 'complete' : 'missing';
  
  let hasChainIssue = false;
  
  // Check if there's a chain break with next segment
  if (index < segments.length - 1) {
    const next = segments[index + 1];
    if (segment.end_location && next.start_location) {
      hasChainIssue = segment.end_location !== next.start_location;
    }
  }
  
  // Check if there's a chain break with previous segment
  if (index > 0) {
    const prev = segments[index - 1];
    if (prev.end_location && segment.start_location) {
      hasChainIssue = hasChainIssue || (prev.end_location !== segment.start_location);
    }
  }
  
  return { startStatus, endStatus, hasChainIssue };
}

/**
 * Generate suggestions when a location is updated
 * (Used for real-time suggestions as user types)
 */
export function generateLiveChainSuggestions(
  segments: Segment[],
  updatedIndex: number,
  updatedField: 'start_location' | 'end_location',
  newValue: string
): ChainSuggestion[] {
  // Create a temporary updated segments array
  const tempSegments = [...segments];
  tempSegments[updatedIndex] = {
    ...tempSegments[updatedIndex],
    [updatedField]: newValue
  };
  
  // Re-analyze with the temporary change
  const analysis = analyzeLocationChain(tempSegments);
  
  // Filter to only show suggestions that are relevant to this change
  return analysis.suggestions.filter(suggestion => {
    // Include if it involves the updated segment
    return suggestion.changes.some(change => 
      change.segmentIndex === updatedIndex ||
      change.segmentIndex === updatedIndex - 1 ||
      change.segmentIndex === updatedIndex + 1
    );
  });
}

/**
 * Get a visual representation of the location chain
 */
export interface ChainNode {
  segmentIndex: number;
  segmentName: string;
  segmentType: string;
  location: string;
  nodeType: 'start' | 'end';
  hasIssue: boolean;
  isEmpty: boolean;
}

export interface ChainConnection {
  from: number; // Index in nodes array
  to: number;   // Index in nodes array
  isConnected: boolean;
  isSameLocation: boolean;
}

export function getChainVisualization(segments: Segment[]): {
  nodes: ChainNode[];
  connections: ChainConnection[];
} {
  const nodes: ChainNode[] = [];
  const connections: ChainConnection[] = [];

  // Build nodes
  segments.forEach((segment, index) => {
    const isSingleLoc = isSingleLocation(segment);
    
    // Add start node
    nodes.push({
      segmentIndex: index,
      segmentName: segment.name,
      segmentType: segment.type,
      location: segment.start_location,
      nodeType: 'start',
      hasIssue: !segment.start_location,
      isEmpty: !segment.start_location
    });

    // Add end node (unless single-location)
    if (!isSingleLoc) {
      nodes.push({
        segmentIndex: index,
        segmentName: segment.name,
        segmentType: segment.type,
        location: segment.end_location,
        nodeType: 'end',
        hasIssue: !segment.end_location,
        isEmpty: !segment.end_location
      });
    }
  });

  // Build connections
  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    
    // Find the node indices for connection
    const currentEndNodeIndex = nodes.findIndex(
      n => n.segmentIndex === i && n.nodeType === 'end'
    );
    const nextStartNodeIndex = nodes.findIndex(
      n => n.segmentIndex === i + 1 && n.nodeType === 'start'
    );

    // For single-location segments, use the start node as the end
    const fromIndex = currentEndNodeIndex !== -1 ? currentEndNodeIndex : 
      nodes.findIndex(n => n.segmentIndex === i && n.nodeType === 'start');

    if (fromIndex !== -1 && nextStartNodeIndex !== -1) {
      const fromLocation = currentEndNodeIndex !== -1 ? 
        current.end_location : current.start_location;
      const toLocation = next.start_location;

      connections.push({
        from: fromIndex,
        to: nextStartNodeIndex,
        isConnected: !!(fromLocation && toLocation),
        isSameLocation: fromLocation === toLocation
      });
    }
  }

  return { nodes, connections };
}
