// Client-safe avatar types and constants
// This file can be imported in both client and server components

// Avatar style definitions
export type AvatarStyle = 
  | "minimalist"
  | "watercolor"
  | "travel-explorer"
  | "abstract-art"
  | "professional";

export interface AvatarStyleOption {
  id: AvatarStyle;
  name: string;
  description: string;
  promptModifier: string;
}

// Available avatar styles with their prompt modifiers
export const AVATAR_STYLES: AvatarStyleOption[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean geometric shapes with single accent color",
    promptModifier: "Minimalist geometric avatar, clean lines, single accent color, negative space, simple shapes",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft artistic brushstrokes with dreamy tones",
    promptModifier: "Soft watercolor style avatar, artistic brushstrokes, dreamy pastel tones, gentle color blending",
  },
  {
    id: "travel-explorer",
    name: "Travel Explorer",
    description: "Adventure-inspired with mountains and horizons",
    promptModifier: "Adventurer silhouette avatar, mountains and horizon, sunset gradient colors, wanderlust spirit",
  },
  {
    id: "abstract-art",
    name: "Abstract Art",
    description: "Bold shapes with vibrant colors",
    promptModifier: "Abstract artistic avatar, bold geometric shapes, vibrant complementary colors, modern art style",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Corporate-friendly with subtle gradients",
    promptModifier: "Professional portrait style avatar, subtle gradient background, corporate-friendly, elegant and refined",
  },
];

/**
 * Get avatar style by ID
 */
export function getAvatarStyle(styleId: AvatarStyle): AvatarStyleOption | undefined {
  return AVATAR_STYLES.find(s => s.id === styleId);
}
