const { PrismaClient } = require("../app/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed SegmentTypes
  const segmentTypes = [
    "Flight",
    "Drive",
    "Train",
    "Ferry",
    "Walk",
    "Other",
  ];

  for (const name of segmentTypes) {
    await prisma.segmentType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Segment types seeded");

  // Seed Reservation Categories and Types
  const reservationData = [
    {
      category: "Travel",
      types: ["Flight", "Train", "Car Rental", "Bus", "Ferry"],
    },
    {
      category: "Stay",
      types: ["Hotel", "Airbnb", "Hostel", "Resort", "Vacation Rental"],
    },
    {
      category: "Activity",
      types: ["Tour", "Event Tickets", "Museum", "Hike", "Excursion", "Adventure"],
    },
    {
      category: "Dining",
      types: ["Restaurant", "Cafe", "Bar", "Food Tour"],
    },
  ];

  for (const { category, types } of reservationData) {
    const cat = await prisma.reservationCategory.upsert({
      where: { name: category },
      update: {},
      create: { name: category },
    });

    for (const typeName of types) {
      await prisma.reservationType.upsert({
        where: { 
          categoryId_name: {
            categoryId: cat.id,
            name: typeName
          }
        },
        update: {},
        create: {
          name: typeName,
          categoryId: cat.id,
        },
      });
    }
  }
  console.log("✓ Reservation categories and types seeded");

  // Seed Reservation Statuses
  const statuses = ["Pending", "Confirmed", "Cancelled", "Completed", "Waitlisted"];

  for (const name of statuses) {
    await prisma.reservationStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Reservation statuses seeded");

  // Seed Image Prompts
  // Detailed, prescriptive prompts for high-quality AI image generation
  const imagePrompts = [
    // 1. Retro Gouache Travel Poster - TRIP
    {
      name: "Retro Gouache Travel Poster",
      category: "trip",
      style: "retro_gouache",
      lightness: "light",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Create a vintage mid-century travel poster illustration (1950s/60s era)
- Emulate the look of gouache paint: matte finish, opaque colors, and visible dry-brush texture at the edges of shapes
- Simplify the geographic features of the destination into stylized, confident geometric shapes
- Flatten the perspective to create a two-dimensional poster aesthetic
- Use bold, simplified forms for landmarks, landscape features, and architectural elements

COMPOSITION
- Vertical format optimized for 9:16 or 2:3 aspect ratio
- Feature the most iconic view or landmark of the destination as the central focal point
- Include 2-3 layers of depth: foreground detail, mid-ground subject, background sky/mountains
- Leave some breathing room at top and bottom (where text would traditionally go in vintage posters, though NO TEXT will be included)
- Create strong diagonal or curved compositional lines to guide the eye

LIGHTING & ATMOSPHERE
- The lighting should capture the mood of the travel dates provided (warm golden tones for summer months, cooler tones for winter, fresh bright tones for spring, rich warm tones for autumn)
- Time of day should reflect the season and destination character: golden hour for romantic destinations, bright midday for vibrant cities
- The scene should feel romanticized and idyllic, not documentary

COLOR PALETTE
- Rich, warm, slightly desaturated "vintage" colors with visible texture
- Primary palette: mustard yellows, terracotta reds, teal blues, olive greens, and cream whites
- Secondary accents: burnt orange, sage green, dusty rose, navy blue
- Avoid neon, fluorescent, or digital-looking colors
- Use a limited palette of 4-6 colors maximum for authentic mid-century feel

ABSOLUTE RULES
- NO text, typography, logos, or written words of any kind
- NO modern elements (smartphones, modern cars, contemporary fashion) even if implied by the description
- NO photorealism - must be clearly illustrated/painted
- NO people's faces in detail - use silhouettes or simplified forms only
- Must be vertical orientation

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 1. Retro Gouache Travel Poster - SEGMENT
    {
      name: "Retro Gouache Travel Poster",
      category: "segment",
      style: "retro_gouache",
      lightness: "medium",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Create a vintage mid-century travel poster illustration (1950s/60s era) focusing on transportation and journey
- Emulate gouache paint technique: matte, opaque colors with visible dry-brush texture
- Simplify the mode of transportation into confident, stylized shapes
- Flatten perspective and create graphic, poster-style composition
- Show the journey/route in an artistic, non-literal way

COMPOSITION
- Vertical format (9:16 or 2:3 aspect ratio)
- Feature the transportation mode (plane, train, car, boat) as a simplified silhouette or stylized form
- Include visual elements suggesting movement: curved paths, motion lines, or journey progression
- Show departure and arrival environments in simplified, layered forms
- Create a sense of adventure and transition between the two locations

LIGHTING & ATMOSPHERE
- Lighting appropriate to the segment timing: morning light for early departures, golden hour for afternoon journeys, twilight for evening segments
- Season-appropriate atmosphere based on travel dates
- Capture the excitement and anticipation of the journey itself
- More dynamic than trip-level images, suggesting motion and transition

COLOR PALETTE
- Warm vintage palette consistent with retro gouache style
- Slightly more saturated than trip-level to show energy of travel
- Mustard, terracotta, teal, olive, cream as base colors
- Add transport-specific accent colors: aviation blue for flights, rail red for trains, road orange for drives
- Maintain vintage matte finish

ABSOLUTE RULES
- NO text, typography, or logos
- NO modern technology visible (use vintage-era transportation silhouettes)
- NO photorealism
- NO detailed human faces
- Must be vertical orientation
- NO route maps with lines and dots - show journey artistically

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 1. Retro Gouache Travel Poster - RESERVATION
    {
      name: "Retro Gouache Travel Poster",
      category: "reservation",
      style: "retro_gouache",
      lightness: "dark",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Create a vintage mid-century travel illustration (1950s/60s era) focusing on intimate destination detail
- Emulate gouache paint: matte finish, opaque colors, visible dry-brush texture
- Simplify the specific activity, venue, or accommodation into stylized, confident shapes
- More intimate and detailed than trip/segment level while maintaining vintage poster aesthetic
- Slightly darker, richer tones to create depth and intimacy

COMPOSITION
- Vertical format (9:16 or 2:3)
- Focus on the specific reservation type: hotel room view, restaurant setting, activity scene, or attraction detail
- Create an intimate vignette rather than wide landscape
- Include characteristic elements of the venue type (hotel: window with view and bed; restaurant: table setting; activity: key equipment or environment)
- More closeup perspective than trip-level, personal and inviting

LIGHTING & ATMOSPHERE
- Warmer, more intimate lighting than trip-level
- Evening or golden hour preferred for romantic, sophisticated mood
- For indoor reservations: warm interior glow with hints of outside environment
- For outdoor reservations: rich afternoon or early evening light
- Capture the specific time of day the reservation occurs when provided
- Deeper shadows and richer tones create visual weight

COLOR PALETTE
- Deeper, richer vintage tones than trip/segment level
- Base palette: deep terracotta, warm mustard, rich teal, olive green, cream
- Add category-specific accents:
  * Hotel/Stay: warm golden interiors, deep blue twilight outside
  * Dining: rich food tones, deep burgundy, warm amber
  * Activity: environment-specific colors (ocean blue, forest green, sunset orange)
- Maintain vintage matte gouache texture with more saturation and depth

ABSOLUTE RULES
- NO text, typography, logos, or written words
- NO modern elements or technology
- NO photorealism - clearly illustrated/painted style
- NO detailed faces - use silhouettes or simplified forms
- Must be vertical orientation
- NO generic stock imagery - must reflect the specific location and activity type

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 2. Golden Hour Silhouette - TRIP
    {
      name: "Golden Hour Silhouette",
      category: "trip",
      style: "golden_hour",
      lightness: "light",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Warm, photographic style focused on silhouettes and golden hour light
- The image should feel intimate, romantic, and slightly mysterious
- High contrast between bright warm sky and dark silhouetted foreground
- Professional travel photography aesthetic with cinematic color grading
- Focus on shapes and atmosphere rather than detail

COMPOSITION
- Vertical format (9:16 or 2:3 aspect ratio)
- Low horizon line (bottom third) to emphasize dramatic sky
- Destination landmarks, landscapes, or characteristic scenery silhouetted against sunset
- Optional: couple or solo traveler silhouette in the scene, looking toward the view
- Create layers of silhouetted depth: foreground, mid-ground, background
- Strong sense of place through recognizable destination shapes

LIGHTING
- Intense, warm golden and orange light from setting sun
- Time of day: 30-60 minutes before sunset (golden hour)
- Dramatic gradient sky: deep orange near horizon transitioning to pink, then purple, then deep blue at top
- All foreground elements completely black silhouettes with no visible details
- Possible rim lighting on silhouette edges from backlight
- Adjust lighting intensity based on season: more intense for summer dates, softer for winter

COLOR PALETTE
- Dominant: warm oranges, deep golds, amber
- Mid-tones: coral pink, salmon, peach
- Upper sky: lavender, soft purple, deepening to twilight blue
- Silhouettes: pure black or very deep navy
- Overall warm color temperature (3000-4000K)
- NO cool tones except in upper sky gradient

ABSOLUTE RULES
- NO text, typography, words, letters, or readable characters of any kind - absolutely critical
- Subjects must be in complete shadow - no details of clothing, features, or textures visible in silhouettes
- NO daytime or bright scenes - must be golden hour
- NO artificial lighting or modern light sources in frame
- Must be vertical orientation
- NO faces or identifying features visible

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 2. Golden Hour Silhouette - SEGMENT
    {
      name: "Golden Hour Silhouette",
      category: "segment",
      style: "golden_hour",
      lightness: "medium",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Warm, photographic silhouette style with golden hour lighting
- Capture the journey or transition between locations
- Romantic and atmospheric with high contrast
- Professional travel photography with cinematic color grading
- Emphasis on movement and travel through silhouette forms

COMPOSITION
- Vertical format (9:16 or 2:3)
- Show transportation mode in silhouette: airplane, train, car, boat, or travelers in motion
- Include environmental context: transitioning between departure and arrival landscapes
- Horizon line in lower to middle third
- Create sense of direction and movement through composition
- Possible: silhouettes of travelers with luggage, looking toward their destination

LIGHTING
- Golden hour backlighting, 30-60 minutes before sunset
- Slightly more dramatic than trip-level with stronger contrast
- Sun position suggests direction of travel when possible
- Gradient sky: intense orange/gold at horizon, transitioning through pink to purple
- All subjects and transportation in complete silhouette
- Time of day matches segment departure time when evening, otherwise golden hour aesthetic

COLOR PALETTE
- Warm golden oranges and ambers dominating
- Rich coral and salmon pinks in mid-sky
- Deepening to burgundy and purple tones in upper frame
- Silhouettes in pure black
- Slightly more saturated than trip-level to convey energy of travel
- Warmer overall than trip-level (movement creates warmth)

ABSOLUTE RULES
- NO text or typography
- Complete silhouettes only - no details visible
- NO bright daytime scenes
- NO modern tech visible (use timeless transportation silhouettes)
- Must be vertical orientation
- NO faces or identifying details

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 2. Golden Hour Silhouette - RESERVATION
    {
      name: "Golden Hour Silhouette",
      category: "reservation",
      style: "golden_hour",
      lightness: "dark",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Intimate, photographic silhouette style with warm evening backlight
- More closeup and personal than trip/segment level
- Romantic and moody with rich colors
- Professional travel photography with deep cinematic color grading
- Emphasis on intimate moments and specific activities

COMPOSITION
- Vertical format (9:16 or 2:3)
- Intimate scale: close to subjects or specific venue silhouette
- Show activity or venue characteristic in silhouette: diners at table, hikers on trail, building interior with view, etc.
- Horizon line or light source in frame creating dramatic backlight
- More enclosed/intimate composition than wider trip/segment views
- For indoor reservations: silhouettes against bright window showing sunset outside

LIGHTING
- Deep golden evening light or sunset backlight
- Richer, darker tones than trip/segment levels
- For indoor scenes: warm interior vs bright golden exterior creating silhouettes
- For outdoor scenes: subjects silhouetted against rich amber/burgundy sunset
- Time matches reservation time when evening, otherwise romantic sunset timing
- Deeper shadows, more dramatic contrast, intimate mood lighting

COLOR PALETTE
- Deeper, richer golden tones: amber, deep orange, burgundy
- Rich warm mid-tones: burnt sienna, deep coral, wine reds
- Upper tones: deep purple, plum, twilight blue
- Silhouettes in deep black or very dark navy
- More saturated and darker than trip/segment to create intimacy and depth
- Warmer color temperature overall (2800-3500K)

ABSOLUTE RULES
- NO text or typography
- Complete silhouettes - no facial features or details visible
- NO bright or daytime lighting
- NO modern technology visible
- Must be vertical orientation
- NO identifying features on people
- Must reflect the specific reservation type (hotel, restaurant, activity, etc.) through silhouette context

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 3. Stylized Map Journey - TRIP
    {
      name: "Stylized Map Journey",
      category: "trip",
      style: "map_journey",
      lightness: "light",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Hand-drawn illustrated map in contemporary artistic style
- Not a technical/accurate map, but an artistic interpretation showing journey flow
- Watercolor and ink illustration aesthetic
- Whimsical yet sophisticated, suitable for luxury travel magazine
- Emphasize the romance of the journey and destinations

COMPOSITION
- Vertical format (9:16 or 2:3)
- Show the geographic area covered by the trip from above/aerial perspective
- Artistic route line connecting key destinations (not technical GPS line)
- Illustrated landmarks, geographic features, and points of interest at destination locations
- Decorative elements: compass rose, distance scale, artistic borders
- More illustration than map - emphasize beauty over accuracy

LIGHTING & ATMOSPHERE
- Bright, optimistic color scheme
- Flat lighting (no dramatic shadows in map view)
- Light, airy background (cream, pale blue, or soft warm white)
- Destination illustrations have subtle shadows for depth
- Overall cheerful, inspiring tone

COLOR PALETTE
- Light base: cream, pale blue, or soft white background
- Geographic features: soft blues for water, muted greens/browns for land
- Route line: warm terracotta, coral, or teal - bold but not harsh
- Landmark illustrations: varied warm colors (terracotta, mustard, teal, coral)
- Decorative elements: gold or warm brown ink
- Text-like decorative elements in warm brown (though NO actual readable text)

ABSOLUTE RULES
- NO actual text, city names, labels, or readable typography
- NO technical/GPS-accurate mapping - artistic interpretation only
- NO modern map UI elements (zoom buttons, pins, etc.)
- Must be vertical orientation
- NO corporate logos or branding
- Routes should be artistic swooping lines, not precise paths
- Show journey flow, not turn-by-turn directions

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 3. Stylized Map Journey - SEGMENT
    {
      name: "Stylized Map Journey",
      category: "segment",
      style: "map_journey",
      lightness: "medium",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Hand-drawn illustrated map focusing on a single journey segment
- Contemporary artistic cartography style
- Combination of watercolor wash and ink line illustration
- More detailed than trip-level map, showing the specific route
- Sophisticated travel illustration aesthetic

COMPOSITION
- Vertical format (9:16 or 2:3)
- Aerial/map view of the specific route between start and end points
- Departure point illustrated at bottom or lower portion, arrival at top
- Artistic route line showing the path taken (flight arc, driving route, rail line, ferry path)
- Illustrated geographic features along the route
- Transportation mode icon in artistic style (vintage plane, train, car, ferry silhouette)
- More zoomed in than trip-level - focus on this specific journey

LIGHTING & ATMOSPHERE
- Bright, clear illustration lighting
- Slightly more dramatic than trip-level with richer colors
- Subtle gradient suggesting time of day if journey timing is significant
- Clean, optimistic feel with subtle depth

COLOR PALETTE
- Light background: pale cream or soft sky blue
- Geographic features: water in soft blues/teals, land in muted greens/tans
- Route line: bold warm color (terracotta, coral, or teal) showing path
- Departure/arrival points: illustrated with warm accent colors
- Transportation mode: silhouette in deep teal or navy
- Medium saturation, warmer than trip-level to show movement

ABSOLUTE RULES
- NO text, labels, or readable typography
- NO technical GPS tracks or precise mapping
- NO modern UI elements
- Must be vertical orientation
- NO corporate branding
- Show artistic journey flow, not navigation directions
- Transportation mode should be vintage/timeless illustration style

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 3. Stylized Map Journey - RESERVATION
    {
      name: "Stylized Map Journey",
      category: "reservation",
      style: "map_journey",
      lightness: "dark",
      prompt: `Create a vertical, high-end travel magazine background image.

VISUAL STYLE & MEDIUM
- Hand-drawn illustrated map vignette focusing on reservation location
- Contemporary artistic cartography with intimate detail
- Watercolor and ink illustration combining map view with location detail
- Most detailed and zoomed-in of the three map levels
- Sophisticated travel illustration showing "you are here" aesthetic

COMPOSITION
- Vertical format (9:16 or 2:3)
- Zoomed-in map view of the specific reservation location area
- The venue/activity location illustrated at center or focal point
- Surrounding streets, landmarks, or geographic context in map style
- Larger illustrated detail of the venue itself (building, activity site, natural feature)
- Decorative elements suggesting reservation type (hotel icon, dining utensils, activity symbols) in artistic style
- More intimate and detailed than trip/segment levels

LIGHTING & ATMOSPHERE
- Warm, inviting illustration
- Darker, richer tones than trip/segment maps
- Time-of-day coloring matching reservation time:
  * Morning reservations: fresh bright colors
  * Afternoon: warm clear colors
  * Evening: rich golden tones, possible twilight gradient
- Intimate, personal scale

COLOR PALETTE
- Warm background: cream with warm undertones or pale golden
- Geographic context: richer colors than trip/segment levels
- Venue illustration: warm terracotta, deep teal, mustard, coral
- Darker values overall: deeper watercolor washes
- Category-specific accents:
  * Hotel/Stay: deep blue-green, warm gold
  * Dining: rich burgundy, warm amber
  * Activity: environment-specific (ocean blue, forest green, etc.)
- More saturated and intimate than trip/segment

ABSOLUTE RULES
- NO readable text, labels, street names, typography, words, or letters of any kind
- NO literal map pins or modern map UI
- NO technical/GPS accuracy required
- Must be vertical orientation
- NO corporate logos or branding
- Show artistic location context, not navigation
- Venue should be clearly the focal point
- Decorative elements only - no actual readable text even in decorative style

TRAVEL CONTEXT TO VISUALIZE:`
    },
  ];

  for (const prompt of imagePrompts) {
    await prisma.imagePrompt.upsert({
      where: { name: prompt.name },
      update: {
        prompt: prompt.prompt,
        category: prompt.category,
        style: prompt.style,
        lightness: prompt.lightness
      },
      create: prompt,
    });
  }
  console.log("✓ Image prompts seeded");

  // Seed Contact Types
  const contactTypes = [
    { name: "phone", label: "Phone", icon: "phone", sortOrder: 1 },
    { name: "email", label: "Email", icon: "mail", sortOrder: 2 },
    { name: "whatsapp", label: "WhatsApp", icon: "message-circle", sortOrder: 3 },
    { name: "website", label: "Website", icon: "globe", sortOrder: 4 },
    { name: "instagram", label: "Instagram", icon: "instagram", sortOrder: 5 },
    { name: "linkedin", label: "LinkedIn", icon: "linkedin", sortOrder: 6 },
    { name: "twitter", label: "Twitter/X", icon: "twitter", sortOrder: 7 },
    { name: "facebook", label: "Facebook", icon: "facebook", sortOrder: 8 },
  ];

  for (const ct of contactTypes) {
    await prisma.contactType.upsert({
      where: { name: ct.name },
      update: ct,
      create: ct,
    });
  }
  console.log("✓ Contact types seeded");

  // Seed Hobbies
  const hobbies = [
    // Outdoor & Adventure
    { name: "Hiking", category: "outdoor", sortOrder: 1 },
    { name: "Camping", category: "outdoor", sortOrder: 2 },
    { name: "Skiing", category: "outdoor", sortOrder: 3 },
    { name: "Scuba Diving", category: "outdoor", sortOrder: 4 },
    { name: "Surfing", category: "outdoor", sortOrder: 5 },
    { name: "Rock Climbing", category: "outdoor", sortOrder: 6 },
    { name: "Cycling", category: "outdoor", sortOrder: 7 },
    { name: "Kayaking", category: "outdoor", sortOrder: 8 },
    { name: "Fishing", category: "outdoor", sortOrder: 9 },
    
    // Culinary
    { name: "Wine Tasting", category: "culinary", sortOrder: 10 },
    { name: "Cooking Classes", category: "culinary", sortOrder: 11 },
    { name: "Food Tours", category: "culinary", sortOrder: 12 },
    { name: "Craft Beer", category: "culinary", sortOrder: 13 },
    { name: "Street Food", category: "culinary", sortOrder: 14 },
    
    // Arts & Culture
    { name: "Photography", category: "arts", sortOrder: 15 },
    { name: "Museums", category: "arts", sortOrder: 16 },
    { name: "Architecture", category: "arts", sortOrder: 17 },
    { name: "Live Music", category: "arts", sortOrder: 18 },
    { name: "Theater", category: "arts", sortOrder: 19 },
    { name: "History", category: "arts", sortOrder: 20 },
    { name: "Art Galleries", category: "arts", sortOrder: 21 },
    
    // Relaxation
    { name: "Beach", category: "relaxation", sortOrder: 22 },
    { name: "Spa & Wellness", category: "relaxation", sortOrder: 23 },
    { name: "Golf", category: "relaxation", sortOrder: 24 },
    { name: "Yoga", category: "relaxation", sortOrder: 25 },
    { name: "Meditation", category: "relaxation", sortOrder: 26 },
    
    // Sports
    { name: "Running", category: "sports", sortOrder: 27 },
    { name: "Tennis", category: "sports", sortOrder: 28 },
    { name: "Water Sports", category: "sports", sortOrder: 29 },
    { name: "Swimming", category: "sports", sortOrder: 30 },
    
    // Urban & Shopping
    { name: "Shopping", category: "urban", sortOrder: 31 },
    { name: "Nightlife", category: "urban", sortOrder: 32 },
    { name: "Cafes & Coffee", category: "urban", sortOrder: 33 },
  ];

  for (const hobby of hobbies) {
    await prisma.hobby.upsert({
      where: { name: hobby.name },
      update: hobby,
      create: hobby,
    });
  }
  console.log("✓ Hobbies seeded");

  // Seed Travel Preference Types and Options
  const travelPreferences = [
    {
      type: {
        name: "budget_level",
        label: "Budget Level",
        description: "What's your typical travel budget preference?",
        icon: "dollar-sign",
        sortOrder: 1,
        isRequired: false,
      },
      options: [
        { value: "budget", label: "Budget", description: "Cost-conscious travel", sortOrder: 1 },
        { value: "moderate", label: "Moderate", description: "Comfortable without splurging", sortOrder: 2 },
        { value: "upscale", label: "Upscale", description: "Premium experiences", sortOrder: 3 },
        { value: "luxury", label: "Luxury", description: "Top-tier experiences", sortOrder: 4 },
      ],
    },
    {
      type: {
        name: "activity_level",
        label: "Activity Level",
        description: "How active do you like to be when traveling?",
        icon: "activity",
        sortOrder: 2,
        isRequired: false,
      },
      options: [
        { value: "relaxed", label: "Relaxed", description: "Leisure and downtime", sortOrder: 1 },
        { value: "moderate", label: "Moderate", description: "Mix of activities and rest", sortOrder: 2 },
        { value: "active", label: "Active", description: "Busy schedule with activities", sortOrder: 3 },
        { value: "adventurous", label: "Adventurous", description: "High-energy adventures", sortOrder: 4 },
      ],
    },
    {
      type: {
        name: "accommodation_preference",
        label: "Accommodation Preference",
        description: "What type of accommodation do you prefer?",
        icon: "home",
        sortOrder: 3,
        isRequired: false,
      },
      options: [
        { value: "hostel", label: "Hostel", description: "Social and budget-friendly", sortOrder: 1 },
        { value: "hotel", label: "Hotel", description: "Traditional hotels", sortOrder: 2 },
        { value: "vacation_rental", label: "Vacation Rental", description: "Airbnb, VRBO, etc.", sortOrder: 3 },
        { value: "boutique", label: "Boutique", description: "Unique boutique hotels", sortOrder: 4 },
        { value: "resort", label: "Resort", description: "All-inclusive resorts", sortOrder: 5 },
      ],
    },
    {
      type: {
        name: "pace_preference",
        label: "Travel Pace",
        description: "How do you like to pace your trips?",
        icon: "clock",
        sortOrder: 4,
        isRequired: false,
      },
      options: [
        { value: "slow", label: "Slow Travel", description: "Deep dive in fewer places", sortOrder: 1 },
        { value: "balanced", label: "Balanced", description: "Mix of exploration and rest", sortOrder: 2 },
        { value: "fast", label: "Fast-Paced", description: "See as much as possible", sortOrder: 3 },
      ],
    },
  ];

  for (const pref of travelPreferences) {
    const prefType = await prisma.travelPreferenceType.upsert({
      where: { name: pref.type.name },
      update: pref.type,
      create: pref.type,
    });

    for (const option of pref.options) {
      await prisma.travelPreferenceOption.upsert({
        where: {
          preferenceTypeId_value: {
            preferenceTypeId: prefType.id,
            value: option.value,
          },
        },
        update: option,
        create: {
          ...option,
          preferenceTypeId: prefType.id,
        },
      });
    }
  }
  console.log("✓ Travel preferences seeded");

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
