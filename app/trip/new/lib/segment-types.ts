import { Home, Car, Flag, Compass, MapPin } from 'lucide-react';

export interface SegmentTypeConfig {
  id: string;
  label: string;
  description: string;
  typicalMoments: string[];
  usage: string;
  color: string;
  overlayColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  singleLocation: boolean;
}

// UI segment type configurations
// Note: IDs will be populated from database at runtime
export const SEGMENT_TYPES: Record<string, SegmentTypeConfig> = {
  STAY: {
    id: '', // Will be set from DB
    label: 'Stay',
    description: "A chapter where you remain in one location",
    typicalMoments: ["Hotels", "Dining reservations", "Activities", "Local experiences"],
    usage: "Use for extended stays in cities or destinations where you'll have multiple moments",
    color: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    overlayColor: 'bg-indigo-900/75',
    icon: Home,
    singleLocation: true,
  },
  RETREAT: {
    id: '', // Will be set from DB
    label: 'Retreat',
    description: "A chapter at an all-inclusive retreat or resort",
    typicalMoments: ["Retreat booking", "Spa treatments", "Wellness activities"],
    usage: "Use when checking into a retreat that handles all details (food, activities, etc.). Often just one main reservation",
    color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    overlayColor: 'bg-emerald-900/75',
    icon: MapPin,
    singleLocation: true,
  },
  TOUR: {
    id: '', // Will be set from DB
    label: 'Tour',
    description: "A chapter where a tour company manages your itinerary",
    typicalMoments: ["Tour bookings", "Group activities", "Guided experiences"],
    usage: "Use when your itinerary is handed over to a tour operator. Can have multiple moments or just one tour booking",
    color: 'bg-orange-100 border-orange-300 text-orange-900',
    overlayColor: 'bg-orange-900/75',
    icon: Flag,
    singleLocation: true,
  },
  ROAD_TRIP: {
    id: '', // Will be set from DB
    label: 'Road Trip',
    description: "A chapter involving travel along a route with stops",
    typicalMoments: ["Car rental", "Accommodation stops", "Roadside attractions", "Scenic viewpoints"],
    usage: "Use for journeys where the travel itself is part of the experience",
    color: 'bg-cyan-100 border-cyan-300 text-cyan-900',
    overlayColor: 'bg-cyan-900/75',
    icon: Compass,
    singleLocation: false,
  },
  TRAVEL: {
    id: '', // Will be set from DB
    label: 'Travel',
    description: "A chapter focused on getting from one place to another",
    typicalMoments: ["Flights", "Train tickets", "Car rentals", "Airport transfers"],
    usage: "Use for transit days or journeys between destinations",
    color: 'bg-stone-100 border-stone-300 text-stone-700',
    overlayColor: 'bg-stone-900/75',
    icon: Car,
    singleLocation: false,
  },
};

/**
 * Map segment type names from DB to UI keys
 */
export const DB_NAME_TO_UI_KEY: Record<string, string> = {
  'Stay': 'STAY',
  'Retreat': 'RETREAT',
  'Tour': 'TOUR',
  'Road Trip': 'ROAD_TRIP',
  'Travel': 'TRAVEL',
};

/**
 * Initialize segment types with database IDs
 */
export function initializeSegmentTypes(
  dbSegmentTypes: Array<{ id: string; name: string }>
): Record<string, string> {
  const typeMap: Record<string, string> = {};

  dbSegmentTypes.forEach((dbType) => {
    const uiKey = DB_NAME_TO_UI_KEY[dbType.name];
    if (uiKey && SEGMENT_TYPES[uiKey]) {
      SEGMENT_TYPES[uiKey].id = dbType.id;
      typeMap[uiKey] = dbType.id;
    }
  });

  return typeMap;
}

/**
 * Get segment type config by UI key
 */
export function getSegmentStyle(typeKey: string): SegmentTypeConfig {
  return SEGMENT_TYPES[typeKey] || SEGMENT_TYPES.STAY;
}
