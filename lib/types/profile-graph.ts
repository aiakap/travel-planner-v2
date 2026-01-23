/**
 * Profile Graph Types
 * 
 * Types for the interactive profile graph visualization and data structures
 */

export type GraphNodeType = 
  | "user"
  | "category"
  | "subnode"
  | "item";

export type GraphCategory = 
  | "travel-preferences"
  | "family"
  | "hobbies"
  | "spending-priorities"
  | "travel-style"
  | "destinations"
  | "other";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  category?: GraphCategory;
  label: string;
  value?: string;
  metadata?: Record<string, string>;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  subcategory?: string;
  itemCount?: number;
}

export interface ReactFlowNodeData extends GraphNode {
  onDelete?: (nodeId: string) => void;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ProfileGraphItem {
  id: string;
  category: GraphCategory;
  value: string;
  metadata?: Record<string, string>;
}

export interface PendingSuggestion {
  id: string;
  category: GraphCategory;
  subcategory: string;
  value: string;
  metadata?: Record<string, string>;
}

export interface BubbleSuggestion extends PendingSuggestion {
  type: 'add' | 'prompt';
}

export interface PromptSuggestion {
  id: string;
  value: string;
  type: 'prompt';
}

export type SuggestionDimension = 'direct' | 'related' | 'destination' | 'culture' | 'tangential';

export interface SmartSuggestion {
  id: string;
  value: string;
  type: 'extracted' | 'similar' | 'prompt';
  category?: GraphCategory;
  subcategory?: string;
  metadata?: Record<string, string>;
  isLoading?: boolean;
  dimension?: SuggestionDimension;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pendingSuggestions?: PendingSuggestion[];
}

export interface InlineSuggestion {
  id: string;
  options: string[];
  category: GraphCategory;
  subcategory: string;
  metadata?: Record<string, string>;
}

export interface ProfileGraphChatResponse {
  message: string;
  items: ProfileGraphItem[];
  pendingSuggestions: PendingSuggestion[];
  suggestions: string[];
  similarSuggestions?: ProfileGraphItem[];
  updatedGraphData?: GraphData;
  inlineSuggestions?: InlineSuggestion[];
}

export interface CategoryConfig {
  id: GraphCategory;
  label: string;
  color: string;
  icon?: string;
  subcategories?: string[];
}

export const GRAPH_CATEGORIES: CategoryConfig[] = [
  {
    id: "travel-preferences",
    label: "Travel Preferences",
    color: "#3b82f6", // blue
    subcategories: ["airlines", "hotels", "travel-class", "loyalty-programs"]
  },
  {
    id: "family",
    label: "Family & Relationships",
    color: "#ec4899", // pink
    subcategories: ["spouse", "children", "parents", "siblings", "friends"]
  },
  {
    id: "hobbies",
    label: "Hobbies & Interests",
    color: "#10b981", // green
    subcategories: ["sports", "arts", "outdoor", "culinary", "entertainment"]
  },
  {
    id: "spending-priorities",
    label: "Spending Priorities",
    color: "#f59e0b", // amber
    subcategories: ["budget-allocation", "priorities"]
  },
  {
    id: "travel-style",
    label: "Travel Style",
    color: "#8b5cf6", // purple
    subcategories: ["solo-vs-group", "luxury-vs-budget", "adventure-vs-relaxation"]
  },
  {
    id: "destinations",
    label: "Destinations",
    color: "#06b6d4", // cyan
    subcategories: ["visited", "wishlist", "favorites"]
  },
  {
    id: "other",
    label: "Other",
    color: "#6b7280", // gray
    subcategories: []
  }
];

export const SAMPLE_PROMPTS = [
  "I like flying on United and staying at Hyatt",
  "I prefer to spend my money on food over accommodations",
  "I have 5 kids",
  "I like to travel solo to exotic places, but with my wife to tropical places",
  "I fly first class whenever possible",
  "I'm a photographer",
  "I enjoy running marathons",
  "Tell me more about yourself"
];
