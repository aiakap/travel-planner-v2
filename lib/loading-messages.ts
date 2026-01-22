/**
 * Generate humorous, personalized loading messages based on user profile
 */

interface ProfileData {
  hobbies: Array<{ hobby: { name: string; category?: string | null } }>;
  preferences: Array<{ preferenceType: { name: string }; option: { label: string } }>;
  relationships: Array<{ relationshipType: string; nickname?: string | null }>;
}

export function generateLoadingMessages(profileData: ProfileData): string[] {
  const messages: string[] = [];
  
  // Extract data for templates
  const hobbies = profileData.hobbies.map(h => h.hobby.name);
  const preferences = profileData.preferences.map(p => ({
    type: p.preferenceType.name,
    value: p.option.label
  }));
  const relationships = profileData.relationships.map(r => r.relationshipType);

  // Hobby-based messages
  if (hobbies.length > 0) {
    const randomHobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    messages.push(`Finding the perfect spot for your ${randomHobby} obsession...`);
    messages.push(`Searching for destinations where ${randomHobby} is practically mandatory...`);
    
    if (hobbies.length > 1) {
      const hobby1 = hobbies[0];
      const hobby2 = hobbies[1];
      messages.push(`Combining ${hobby1} and ${hobby2} in ways you never imagined...`);
    }
  }

  // Preference-based messages
  if (preferences.length > 0) {
    const budgetPref = preferences.find(p => p.type.toLowerCase().includes('budget'));
    if (budgetPref) {
      messages.push(`Calculating the perfect ${budgetPref.value} adventure...`);
    }
    
    const accommodationPref = preferences.find(p => p.type.toLowerCase().includes('accommodation'));
    if (accommodationPref) {
      messages.push(`Finding ${accommodationPref.value} that won't break the bank (or will, we don't judge)...`);
    }

    const pacePref = preferences.find(p => p.type.toLowerCase().includes('pace'));
    if (pacePref) {
      messages.push(`Planning a ${pacePref.value} itinerary (because you know yourself)...`);
    }
  }

  // Relationship-based messages
  if (relationships.length > 0) {
    const relationship = relationships[0];
    messages.push(`Planning adventures your ${relationship} will actually enjoy...`);
    messages.push(`Finding activities that won't cause ${relationship} drama...`);
  }

  // Generic travel humor (always include these)
  messages.push("Consulting our crystal ball... it says 'pack sunscreen'...");
  messages.push("Asking the travel gods for their best recommendations...");
  messages.push("Spinning the globe really fast and seeing where it lands...");
  messages.push("Bribing our AI with virtual cookies for better suggestions...");
  messages.push("Checking if your passport is still valid... just kidding, we can't do that...");
  messages.push("Calculating optimal vacation-to-work ratio (spoiler: more vacation)...");
  messages.push("Summoning the spirit of wanderlust...");
  messages.push("Teaching our AI the difference between a vacation and an adventure...");
  messages.push("Convincing our database that 'everywhere' is a valid destination...");
  messages.push("Loading inspiration from travelers who've been there, done that...");

  // Shuffle and return
  return shuffleArray(messages);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
