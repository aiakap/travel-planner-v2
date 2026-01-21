// Random trip idea generator for "Get Lucky" feature

interface TripIdea {
  destination: string;
  duration: string;
  theme: string;
  season: string;
  budget: string;
  travelers: string;
}

const destinations = [
  { name: "Tokyo, Japan", highlights: "temples, ramen, anime culture, cherry blossoms" },
  { name: "Paris, France", highlights: "Eiffel Tower, Louvre, cafes, croissants" },
  { name: "Rome, Italy", highlights: "Colosseum, Vatican, pasta, gelato" },
  { name: "Barcelona, Spain", highlights: "Sagrada Familia, beaches, tapas, Gaudi architecture" },
  { name: "Bali, Indonesia", highlights: "temples, rice terraces, beaches, yoga retreats" },
  { name: "New York City, USA", highlights: "Broadway, Central Park, museums, pizza" },
  { name: "Marrakech, Morocco", highlights: "souks, riads, tagine, desert tours" },
  { name: "Reykjavik, Iceland", highlights: "Northern Lights, geysers, waterfalls, glaciers" },
  { name: "Cape Town, South Africa", highlights: "Table Mountain, wine country, safaris, beaches" },
  { name: "Lisbon, Portugal", highlights: "trams, pastéis de nata, fado music, tiles" },
  { name: "Kyoto, Japan", highlights: "geishas, bamboo forests, zen gardens, matcha" },
  { name: "Amsterdam, Netherlands", highlights: "canals, Van Gogh, bikes, tulips" },
  { name: "Santorini, Greece", highlights: "sunsets, white buildings, wine, beaches" },
  { name: "Cartagena, Colombia", highlights: "old town, salsa, ceviche, Caribbean vibes" },
  { name: "Queenstown, New Zealand", highlights: "bungee jumping, fjords, LOTR scenery, adventure" },
  { name: "Dubai, UAE", highlights: "Burj Khalifa, desert safaris, luxury shopping" },
  { name: "Prague, Czech Republic", highlights: "castle, old town, beer, Gothic architecture" },
  { name: "Buenos Aires, Argentina", highlights: "tango, steak, La Boca, wine" },
  { name: "Vietnam (Hanoi to Ho Chi Minh)", highlights: "pho, Ha Long Bay, Cu Chi tunnels, motorbikes" },
  { name: "Machu Picchu, Peru", highlights: "Inca ruins, Sacred Valley, ceviche, alpacas" },
];

const durations = [
  { days: "3-4 days", type: "long weekend" },
  { days: "5-7 days", type: "one week" },
  { days: "10-14 days", type: "two weeks" },
  { days: "3 weeks", type: "extended adventure" },
];

const themes = [
  "relaxation and spa",
  "adventure and adrenaline",
  "food and culinary exploration",
  "history and culture",
  "nature and hiking",
  "romance and honeymoon",
  "photography and sightseeing",
  "wellness and yoga retreat",
  "beach and water sports",
  "city exploration and nightlife",
];

const budgets = [
  { level: "budget-friendly", perDay: "$50-100/day" },
  { level: "moderate", perDay: "$150-250/day" },
  { level: "comfortable", perDay: "$300-500/day" },
  { level: "luxury", perDay: "$500+/day" },
];

const travelers = [
  "solo traveler",
  "couple",
  "group of friends (4 people)",
  "family with kids",
  "family with teenagers",
];

const seasons = ["spring", "summer", "fall", "winter"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getUpcomingDates(daysAhead: number = 30): { startDate: string; endDate: string; duration: typeof durations[0] } {
  const duration = getRandomItem(durations);
  const daysMatch = duration.days.match(/(\d+)/);
  const tripLength = daysMatch ? parseInt(daysMatch[1]) : 7;
  
  // Random start date between 2 weeks and 3 months from now
  const startOffset = Math.floor(Math.random() * 75) + 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + startOffset);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + tripLength);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    duration,
  };
}

export function generateGetLuckyPrompt(
  preferredDestination: string | null = null,
  budgetLevel: 'budget' | 'moderate' | 'luxury' = 'moderate'
): string {
  // Use preferred destination from profile or random
  let destination;
  if (preferredDestination) {
    const matchingDest = destinations.find(d => 
      d.name.toLowerCase().includes(preferredDestination.toLowerCase())
    );
    destination = matchingDest || getRandomItem(destinations);
  } else {
    destination = getRandomItem(destinations);
  }
  
  const { startDate, endDate, duration } = getUpcomingDates();
  const theme = getRandomItem(themes);
  
  // Use budget based on profile preferences
  let budget;
  if (budgetLevel === 'budget') {
    budget = budgets[0]; // budget-friendly
  } else if (budgetLevel === 'luxury') {
    budget = budgets[3]; // luxury
  } else {
    budget = budgets[1]; // moderate
  }
  
  const traveler = getRandomItem(travelers);
  
  const prompt = `🎲 **Get Lucky Trip Request**

Please create a complete trip itinerary for me with the following details:

**Destination:** ${destination.name}
**Dates:** ${startDate} to ${endDate} (${duration.type})
**Theme:** ${theme}
**Budget:** ${budget.level} (${budget.perDay})
**Travelers:** ${traveler}

I want you to:
1. **Create the trip** with an exciting title and description
2. **Add 4-6 segments** covering:
   - Outbound travel (flight/train)
   - Daily activities and exploration
   - Return travel
3. **Add reservations** for each segment including:
   - Accommodation (hotel/Airbnb)
   - Key activities and tours
   - Restaurant recommendations
   - Transportation

Known highlights of ${destination.name}: ${destination.highlights}

Please be creative and create a memorable, well-organized trip! Use the tools to actually create everything in my trip planner.`;

  return prompt;
}

// Shorter version for the button tooltip/preview
export function getGetLuckyPreview(): string {
  return "✨ Generate a random dream trip with a complete itinerary!";
}


