/**
 * Bespoke Theme Configuration
 * 
 * Provides persona-based theme settings for luxury vs adventure travelers
 */

export type PersonaType = 'luxury' | 'adventure' | 'default';

export interface ThemeConfig {
  persona: PersonaType;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  heroImage: string;
  heroOverlay: string;
}

export const themes: Record<PersonaType, ThemeConfig> = {
  luxury: {
    persona: 'luxury',
    colors: {
      primary: '#0a1628', // Deep navy
      secondary: '#c9a959', // Champagne gold
      tertiary: '#f5f5f0', // Ivory
    },
    fonts: {
      display: 'var(--font-display)', // Playfair Display
      body: 'var(--font-sans)', // Inter
    },
    heroImage: '/hero-luxury.jpg',
    heroOverlay: 'linear-gradient(to top, rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.3), transparent)',
  },
  adventure: {
    persona: 'adventure',
    colors: {
      primary: '#1a4d3e', // Forest green
      secondary: '#e85d04', // Sunset orange
      tertiary: '#f4f1ea', // Earth tone
    },
    fonts: {
      display: 'var(--font-adventure)', // Outfit
      body: 'var(--font-sans)', // Inter
    },
    heroImage: '/hero-adventure.jpg',
    heroOverlay: 'linear-gradient(to top, rgba(26, 77, 62, 0.85), rgba(26, 77, 62, 0.3), transparent)',
  },
  default: {
    persona: 'default',
    colors: {
      primary: '#0a1628',
      secondary: '#c9a959',
      tertiary: '#f5f5f0',
    },
    fonts: {
      display: 'var(--font-display)',
      body: 'var(--font-sans)',
    },
    heroImage: '/hero-default.jpg',
    heroOverlay: 'linear-gradient(to top, rgba(10, 22, 40, 0.85), rgba(10, 22, 40, 0.3), transparent)',
  },
};

/**
 * Get theme configuration based on user persona
 * Can be extended to read from user profile/preferences
 */
export function getTheme(persona?: PersonaType): ThemeConfig {
  return themes[persona || 'default'];
}

/**
 * Get persona attribute for HTML element
 */
export function getPersonaAttribute(persona?: PersonaType): string | undefined {
  if (persona && persona !== 'default') {
    return persona;
  }
  return undefined;
}
