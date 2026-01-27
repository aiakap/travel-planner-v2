/**
 * Profile Preference Helper Utilities
 * 
 * Extract and process user profile preferences for trip generation
 */

export interface ActivityDensity {
  activitiesPerDay: number;
  restaurantsPerDay: number;
}

/**
 * Calculate activity density based on user's activity level preference
 */
export function getActivityDensity(activityLevel: string): ActivityDensity {
  const densityMap: Record<string, ActivityDensity> = {
    'Relaxed': { activitiesPerDay: 1, restaurantsPerDay: 1 },
    'Moderate': { activitiesPerDay: 2, restaurantsPerDay: 2 },
    'Active': { activitiesPerDay: 2, restaurantsPerDay: 3 },
    'Adventurous': { activitiesPerDay: 3, restaurantsPerDay: 3 },
  };
  
  return densityMap[activityLevel] || densityMap['Moderate'];
}

/**
 * Extract activity level preference from user preferences array
 */
export function getPreferenceActivityLevel(preferences: any[]): string {
  if (!preferences || !Array.isArray(preferences)) {
    return 'Moderate';
  }
  
  const activityPref = preferences.find(
    (p: any) => p.preferenceType?.name === 'activity_level'
  );
  
  return activityPref?.option?.label || 'Moderate';
}

/**
 * Extract budget level preference from user preferences array
 */
export function getPreferenceBudgetLevel(preferences: any[]): 'budget' | 'moderate' | 'luxury' {
  if (!preferences || !Array.isArray(preferences)) {
    return 'moderate';
  }
  
  const budgetPref = preferences.find(
    (p: any) => p.preferenceType?.name === 'budget_level'
  );
  
  const budgetLabel = budgetPref?.option?.label?.toLowerCase();
  
  if (budgetLabel === 'budget') return 'budget';
  if (budgetLabel === 'upscale' || budgetLabel === 'luxury') return 'luxury';
  return 'moderate';
}

/**
 * Extract accommodation preference from user preferences array
 */
export function getPreferenceAccommodation(preferences: any[]): string {
  if (!preferences || !Array.isArray(preferences)) {
    return 'Hotel';
  }
  
  const accomPref = preferences.find(
    (p: any) => p.preferenceType?.name === 'accommodation_preference'
  );
  
  return accomPref?.option?.label || 'Hotel';
}

/**
 * Extract travel pace preference from user preferences array
 */
export function getPreferenceTravelPace(preferences: any[]): string {
  if (!preferences || !Array.isArray(preferences)) {
    return 'Balanced';
  }
  
  const pacePref = preferences.find(
    (p: any) => p.preferenceType?.name === 'pace_preference'
  );
  
  return pacePref?.option?.label || 'Balanced';
}

/**
 * Calculate total items per day based on activity density
 */
export function getTotalItemsPerDay(activityLevel: string): number {
  const density = getActivityDensity(activityLevel);
  return density.activitiesPerDay + density.restaurantsPerDay;
}

/**
 * Determine number of stay segments based on trip duration
 */
export function calculateStaySegments(durationDays: number): number {
  if (durationDays <= 4) return 1;
  if (durationDays <= 7) return 1;
  if (durationDays <= 14) return 2;
  return Math.min(Math.floor(durationDays / 5), 5);
}

/**
 * Distribute days across multiple stay segments
 */
export function distributeDaysAcrossStays(totalDays: number, numStays: number): number[] {
  const daysPerStay = Math.floor(totalDays / numStays);
  const remainder = totalDays % numStays;
  
  const distribution: number[] = [];
  for (let i = 0; i < numStays; i++) {
    // Add extra day to first segments if there's a remainder
    distribution.push(daysPerStay + (i < remainder ? 1 : 0));
  }
  
  return distribution;
}
