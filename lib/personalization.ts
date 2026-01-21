import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Types for personalization data
export interface UserPersonalizationData {
  profile: {
    firstName: string | null;
    lastName: string | null;
    city: string | null;
    country: string | null;
  } | null;
  hobbies: Array<{
    hobby: {
      name: string;
      category: string | null;
    };
    level: string | null;
  }>;
  preferences: Array<{
    preferenceType: {
      name: string;
      label: string;
    };
    option: {
      value: string;
      label: string;
    };
  }>;
  relationships: Array<{
    relationshipType: string;
    nickname: string | null;
  }>;
  recentTrips: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
  }>;
}

export interface TripSuggestion {
  id: string;
  title: string;
  destination: string;
  description: string;
  reason: string; // Why this matches their profile
  duration: string;
  estimatedBudget: string;
  imageUrl: string;
  tags: string[];
}

export interface ChatQuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'hobby' | 'preference' | 'location' | 'relationship';
}

// Hobby to destination mapping
const hobbyDestinations: Record<string, Array<{ name: string; description: string }>> = {
  'wine': [
    { name: 'Tuscany, Italy', description: 'World-renowned vineyards and wine tasting' },
    { name: 'Napa Valley, USA', description: 'Premium California wine country' },
    { name: 'Bordeaux, France', description: 'Historic French wine region' },
    { name: 'Douro Valley, Portugal', description: 'Port wine and scenic river valleys' }
  ],
  'hiking': [
    { name: 'Iceland', description: 'Volcanic landscapes and glacier hikes' },
    { name: 'Patagonia, Chile', description: 'Epic mountain trails and pristine nature' },
    { name: 'Swiss Alps, Switzerland', description: 'Alpine hiking with stunning views' },
    { name: 'Banff, Canada', description: 'Rocky Mountain wilderness' }
  ],
  'photography': [
    { name: 'Kyoto, Japan', description: 'Temples, gardens, and traditional architecture' },
    { name: 'Santorini, Greece', description: 'Iconic white buildings and blue domes' },
    { name: 'Morocco', description: 'Vibrant markets and desert landscapes' },
    { name: 'Iceland', description: 'Northern lights and dramatic scenery' }
  ],
  'culinary': [
    { name: 'Tokyo, Japan', description: 'Michelin-starred dining and street food' },
    { name: 'Paris, France', description: 'Classic French cuisine and bakeries' },
    { name: 'Bangkok, Thailand', description: 'Street food paradise' },
    { name: 'Barcelona, Spain', description: 'Tapas and Mediterranean flavors' }
  ],
  'history': [
    { name: 'Rome, Italy', description: 'Ancient ruins and Renaissance art' },
    { name: 'Athens, Greece', description: 'Birthplace of Western civilization' },
    { name: 'Cairo, Egypt', description: 'Pyramids and ancient wonders' },
    { name: 'Kyoto, Japan', description: 'Imperial palaces and temples' }
  ],
  'art': [
    { name: 'Florence, Italy', description: 'Renaissance masterpieces' },
    { name: 'Paris, France', description: 'World-class museums and galleries' },
    { name: 'New York, USA', description: 'Modern art and cultural diversity' },
    { name: 'Amsterdam, Netherlands', description: 'Dutch masters and canal culture' }
  ],
  'beach': [
    { name: 'Maldives', description: 'Luxury overwater bungalows' },
    { name: 'Bali, Indonesia', description: 'Tropical paradise with culture' },
    { name: 'Amalfi Coast, Italy', description: 'Mediterranean coastline charm' },
    { name: 'Seychelles', description: 'Pristine beaches and nature' }
  ],
  'adventure': [
    { name: 'New Zealand', description: 'Extreme sports and stunning landscapes' },
    { name: 'Costa Rica', description: 'Zip-lining and wildlife adventures' },
    { name: 'Nepal', description: 'Trekking and mountain adventures' },
    { name: 'Queenstown, New Zealand', description: 'Adventure capital of the world' }
  ]
};

// Raw data fetcher (not exported)
async function fetchUserProfileData(userId: string): Promise<UserPersonalizationData> {
  const [profile, hobbies, preferences, relationships, recentTrips] = 
    await Promise.all([
      prisma.userProfile.findUnique({ 
        where: { userId },
        select: {
          firstName: true,
          lastName: true,
          city: true,
          country: true
        }
      }),
      prisma.userHobby.findMany({ 
        where: { userId },
        include: { 
          hobby: {
            select: {
              name: true,
              category: true
            }
          }
        }
      }),
      prisma.userTravelPreference.findMany({ 
        where: { userId },
        include: { 
          preferenceType: {
            select: {
              name: true,
              label: true
            }
          },
          option: {
            select: {
              value: true,
              label: true
            }
          }
        }
      }),
      prisma.userRelationship.findMany({ 
        where: { userId },
        select: {
          relationshipType: true,
          nickname: true
        }
      }),
      prisma.trip.findMany({ 
        where: { userId },
        orderBy: { startDate: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true
        }
      })
    ]);
    
  return { 
    profile, 
    hobbies, 
    preferences, 
    relationships, 
    recentTrips 
  };
}

// Cached version (exported)
export const getUserPersonalizationData = unstable_cache(
  fetchUserProfileData,
  ['user-personalization'],
  {
    tags: (userId: string) => [`user-profile-${userId}`],
    revalidate: 300 // 5 minutes
  }
);

// Generate trip suggestions based on profile
export function generateTripSuggestions(profileData: UserPersonalizationData): TripSuggestion[] {
  const suggestions: TripSuggestion[] = [];
  
  // Generate suggestions based on hobbies
  profileData.hobbies.forEach((userHobby, index) => {
    const hobbyName = userHobby.hobby.name.toLowerCase();
    const destinations = hobbyDestinations[hobbyName];
    
    if (destinations && destinations.length > 0) {
      const destination = destinations[index % destinations.length];
      suggestions.push({
        id: `hobby-${hobbyName}-${index}`,
        title: `${userHobby.hobby.name} Lover's ${destination.name.split(',')[0]} Escape`,
        destination: destination.name,
        description: destination.description,
        reason: `Based on your love of ${userHobby.hobby.name.toLowerCase()}`,
        duration: '5-7 days',
        estimatedBudget: getBudgetEstimate(profileData.preferences),
        imageUrl: getDestinationImage(destination.name),
        tags: [userHobby.hobby.name, destination.name.split(',')[0]]
      });
    }
  });
  
  // Generate preference-based suggestions
  const budgetPref = profileData.preferences.find(p => 
    p.preferenceType.name.toLowerCase().includes('budget')
  );
  
  if (budgetPref?.option.value === 'luxury') {
    suggestions.push({
      id: 'luxury-1',
      title: 'Maldives Luxury Resort Experience',
      destination: 'Maldives',
      description: 'Overwater villas and world-class spa treatments',
      reason: 'Matches your preference for luxury travel',
      duration: '7 days',
      estimatedBudget: '$500-800/day',
      imageUrl: '/luxury-hotel-room.png',
      tags: ['Luxury', 'Beach', 'Relaxation']
    });
  }
  
  // Generate location-based weekend trip
  if (profileData.profile?.city) {
    suggestions.push({
      id: 'weekend-local',
      title: `Weekend Getaway from ${profileData.profile.city}`,
      destination: 'Nearby destinations',
      description: 'Perfect for a quick escape',
      reason: `Close to home in ${profileData.profile.city}`,
      duration: '2-3 days',
      estimatedBudget: '$200-400 total',
      imageUrl: '/travel-activity-adventure.jpg',
      tags: ['Weekend', 'Quick Trip']
    });
  }
  
  // Generate family trip if has relationships
  const hasFamily = profileData.relationships.some(r => 
    ['spouse', 'partner', 'child'].includes(r.relationshipType)
  );
  
  if (hasFamily) {
    suggestions.push({
      id: 'family-1',
      title: 'Family Adventure in Costa Rica',
      destination: 'Costa Rica',
      description: 'Wildlife, beaches, and adventure for all ages',
      reason: 'Great for family travel',
      duration: '7-10 days',
      estimatedBudget: '$300-500/day for family',
      imageUrl: '/travel-activity-adventure.jpg',
      tags: ['Family', 'Adventure', 'Nature']
    });
  }
  
  // Return top 6 suggestions
  return suggestions.slice(0, 6);
}

// Generate chat quick actions based on profile
export function generateChatQuickActions(profileData: UserPersonalizationData): ChatQuickAction[] {
  const actions: ChatQuickAction[] = [];
  
  // Hobby-based actions
  profileData.hobbies.slice(0, 2).forEach(userHobby => {
    const hobbyName = userHobby.hobby.name;
    actions.push({
      id: `hobby-${hobbyName}`,
      label: `Plan a ${hobbyName.toLowerCase()} trip`,
      prompt: `I'd love to plan a trip focused on ${hobbyName.toLowerCase()}. Can you suggest some destinations and help me create an itinerary?`,
      icon: '🎯',
      category: 'hobby'
    });
  });
  
  // Preference-based actions
  const luxuryPref = profileData.preferences.find(p => 
    p.option.value === 'luxury'
  );
  if (luxuryPref) {
    actions.push({
      id: 'luxury-retreat',
      label: 'Find luxury spa retreats',
      prompt: 'I want to plan a luxurious spa and wellness retreat. Show me some premium destinations with world-class amenities.',
      icon: '✨',
      category: 'preference'
    });
  }
  
  // Location-based action
  if (profileData.profile?.city) {
    actions.push({
      id: 'weekend-near',
      label: `Weekend trips near ${profileData.profile.city}`,
      prompt: `What are some great weekend getaway destinations within a few hours of ${profileData.profile.city}?`,
      icon: '🚗',
      category: 'location'
    });
  }
  
  // Relationship-based action
  const hasKids = profileData.relationships.some(r => r.relationshipType === 'child');
  if (hasKids) {
    actions.push({
      id: 'family-vacation',
      label: 'Family vacation ideas',
      prompt: 'Help me plan a family-friendly vacation that will be fun and memorable for both kids and adults.',
      icon: '👨‍👩‍👧‍👦',
      category: 'relationship'
    });
  }
  
  // General inspiration action
  actions.push({
    id: 'inspire-me',
    label: 'Inspire me with something unique',
    prompt: 'Based on my interests and travel style, surprise me with a unique destination I might not have considered!',
    icon: '💡',
    category: 'preference'
  });
  
  return actions.slice(0, 6);
}

// Helper function to get budget estimate
function getBudgetEstimate(preferences: UserPersonalizationData['preferences']): string {
  const budgetPref = preferences.find(p => 
    p.preferenceType.name.toLowerCase().includes('budget')
  );
  
  if (!budgetPref) return '$150-250/day';
  
  const budgetValue = budgetPref.option.value.toLowerCase();
  if (budgetValue.includes('budget') || budgetValue.includes('low')) {
    return '$50-100/day';
  } else if (budgetValue.includes('luxury') || budgetValue.includes('high')) {
    return '$400-800/day';
  } else {
    return '$150-250/day';
  }
}

// Helper function to get destination image
function getDestinationImage(destination: string): string {
  const destLower = destination.toLowerCase();
  
  if (destLower.includes('italy') || destLower.includes('tuscany') || destLower.includes('rome')) {
    return '/restaurant-dining-food.jpg';
  } else if (destLower.includes('hotel') || destLower.includes('luxury') || destLower.includes('maldives')) {
    return '/luxury-hotel-room.png';
  } else if (destLower.includes('flight') || destLower.includes('travel')) {
    return '/airplane-flight-travel.jpg';
  } else {
    return '/travel-activity-adventure.jpg';
  }
}

// Helper to get hobby-based destinations for Get Lucky
export function getHobbyBasedDestination(hobbies: UserPersonalizationData['hobbies']): string | null {
  if (hobbies.length === 0) return null;
  
  const primaryHobby = hobbies[0].hobby.name.toLowerCase();
  const destinations = hobbyDestinations[primaryHobby];
  
  if (destinations && destinations.length > 0) {
    const randomIndex = Math.floor(Math.random() * destinations.length);
    return destinations[randomIndex].name;
  }
  
  return null;
}

// Helper to get preference-based budget level
export function getPreferenceBudgetLevel(preferences: UserPersonalizationData['preferences']): string {
  const budgetPref = preferences.find(p => 
    p.preferenceType.name.toLowerCase().includes('budget')
  );
  
  if (!budgetPref) return 'moderate';
  
  const budgetValue = budgetPref.option.value.toLowerCase();
  if (budgetValue.includes('budget') || budgetValue.includes('low')) {
    return 'budget';
  } else if (budgetValue.includes('luxury') || budgetValue.includes('high')) {
    return 'luxury';
  } else {
    return 'moderate';
  }
}
