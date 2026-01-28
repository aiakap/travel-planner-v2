const { PrismaClient } = require("../app/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed SegmentTypes
  const segmentTypes = [
    { name: "Travel", description: "Flights, trains, ferries, and transfers" },
    { name: "Stay", description: "Hotels and accommodation periods" },
    { name: "Tour", description: "Guided experiences and sightseeing" },
    { name: "Retreat", description: "Relaxation, wellness, and spa time" },
    { name: "Road Trip", description: "Self-drive adventures and scenic routes" },
  ];

  for (const type of segmentTypes) {
    await prisma.segmentType.upsert({
      where: { name: type.name },
      update: { description: type.description },
      create: type,
    });
  }
  console.log("✓ Segment types seeded");

  // Seed Reservation Categories and Types
  const reservationData = [
    {
      category: "Travel",
      types: ["Flight", "Train", "Car Rental", "Private Driver", "Ride Share", "Taxi", "Bus", "Ferry", "Cruise", "Parking"],
    },
    {
      category: "Stay",
      types: ["Hotel", "Airbnb", "Hostel", "Resort", "Vacation Rental", "Ski Resort"],
    },
    {
      category: "Activity",
      types: ["Tour", "Event Tickets", "Museum", "Hike", "Excursion", "Adventure", "Sport", "Concert", "Theater", "Ski Pass", "Equipment Rental", "Spa & Wellness", "Golf"],
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

  // Seed Reservation Display Groups
  const displayGroups = [
    {
      name: "POINT_TO_POINT_TRANSPORT",
      displayName: "Point-to-Point Transport",
      description: "Transportation with distinct departure and arrival locations (flights, trains, buses, ferries)",
    },
    {
      name: "SHORT_DISTANCE_TRANSPORT",
      displayName: "Short Distance Transport",
      description: "Point-to-point transportation within a city/region (ride shares, taxis, private drivers)",
    },
    {
      name: "RENTAL_SERVICE",
      displayName: "Rental Service",
      description: "Services rented over a period (car rentals, equipment rentals, parking)",
    },
    {
      name: "MULTI_DAY_STAY",
      displayName: "Multi-Day Stay",
      description: "Accommodations spanning multiple nights (hotels, Airbnb, resorts)",
    },
    {
      name: "TIMED_RESERVATION",
      displayName: "Timed Reservation",
      description: "Activities/dining with specific time slots (restaurants, tours, concerts, museums)",
    },
    {
      name: "FLEXIBLE_ACTIVITY",
      displayName: "Flexible Activity",
      description: "Activities without strict time requirements (hikes, excursions, day passes)",
    },
    {
      name: "DEFAULT",
      displayName: "Default",
      description: "Fallback for any type not fitting other groups",
    },
  ];

  const displayGroupMap = {};
  for (const group of displayGroups) {
    const created = await prisma.reservationDisplayGroup.upsert({
      where: { name: group.name },
      update: { displayName: group.displayName, description: group.description },
      create: group,
    });
    displayGroupMap[group.name] = created.id;
  }
  console.log("✓ Reservation display groups seeded");

  // Assign types to display groups
  const typeGroupAssignments = [
    // POINT_TO_POINT_TRANSPORT
    { category: "Travel", type: "Flight", group: "POINT_TO_POINT_TRANSPORT" },
    { category: "Travel", type: "Train", group: "POINT_TO_POINT_TRANSPORT" },
    { category: "Travel", type: "Bus", group: "POINT_TO_POINT_TRANSPORT" },
    { category: "Travel", type: "Ferry", group: "POINT_TO_POINT_TRANSPORT" },
    { category: "Travel", type: "Cruise", group: "POINT_TO_POINT_TRANSPORT" },
    
    // SHORT_DISTANCE_TRANSPORT
    { category: "Travel", type: "Ride Share", group: "SHORT_DISTANCE_TRANSPORT" },
    { category: "Travel", type: "Taxi", group: "SHORT_DISTANCE_TRANSPORT" },
    { category: "Travel", type: "Private Driver", group: "SHORT_DISTANCE_TRANSPORT" },
    
    // RENTAL_SERVICE
    { category: "Travel", type: "Car Rental", group: "RENTAL_SERVICE" },
    { category: "Travel", type: "Parking", group: "RENTAL_SERVICE" },
    { category: "Activity", type: "Equipment Rental", group: "RENTAL_SERVICE" },
    
    // MULTI_DAY_STAY
    { category: "Stay", type: "Hotel", group: "MULTI_DAY_STAY" },
    { category: "Stay", type: "Airbnb", group: "MULTI_DAY_STAY" },
    { category: "Stay", type: "Hostel", group: "MULTI_DAY_STAY" },
    { category: "Stay", type: "Resort", group: "MULTI_DAY_STAY" },
    { category: "Stay", type: "Vacation Rental", group: "MULTI_DAY_STAY" },
    { category: "Stay", type: "Ski Resort", group: "MULTI_DAY_STAY" },
    
    // TIMED_RESERVATION
    { category: "Dining", type: "Restaurant", group: "TIMED_RESERVATION" },
    { category: "Dining", type: "Cafe", group: "TIMED_RESERVATION" },
    { category: "Dining", type: "Bar", group: "TIMED_RESERVATION" },
    { category: "Dining", type: "Food Tour", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Tour", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Museum", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Concert", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Theater", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Event Tickets", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Spa & Wellness", group: "TIMED_RESERVATION" },
    { category: "Activity", type: "Golf", group: "TIMED_RESERVATION" },
    
    // FLEXIBLE_ACTIVITY
    { category: "Activity", type: "Hike", group: "FLEXIBLE_ACTIVITY" },
    { category: "Activity", type: "Excursion", group: "FLEXIBLE_ACTIVITY" },
    { category: "Activity", type: "Adventure", group: "FLEXIBLE_ACTIVITY" },
    { category: "Activity", type: "Sport", group: "FLEXIBLE_ACTIVITY" },
    { category: "Activity", type: "Ski Pass", group: "FLEXIBLE_ACTIVITY" },
  ];

  for (const assignment of typeGroupAssignments) {
    const category = await prisma.reservationCategory.findUnique({
      where: { name: assignment.category },
    });
    
    if (category) {
      await prisma.reservationType.updateMany({
        where: {
          categoryId: category.id,
          name: assignment.type,
        },
        data: {
          displayGroupId: displayGroupMap[assignment.group],
        },
      });
    }
  }
  console.log("✓ Reservation types assigned to display groups");

  // Seed Image Prompt Styles (define styles first)
  const imagePromptStyles = [
    {
      name: "Retro Gouache",
      slug: "retro_gouache",
      description: "Classic mid-century travel poster aesthetic with gouache paint style",
      isDefault: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Golden Hour",
      slug: "golden_hour",
      description: "Dramatic lighting and silhouettes at sunset",
      isDefault: false,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Stylized Map Journey",
      slug: "map_journey",
      description: "Artistic cartography and illustrated maps",
      isDefault: false,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Travel Scrapbook",
      slug: "scrapbook_collage",
      description: "Nostalgic collage with layered memories and ephemera",
      isDefault: false,
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const styleData of imagePromptStyles) {
    await prisma.imagePromptStyle.upsert({
      where: { slug: styleData.slug },
      update: {
        name: styleData.name,
        description: styleData.description,
        isDefault: styleData.isDefault,
        isActive: styleData.isActive,
        sortOrder: styleData.sortOrder,
      },
      create: styleData,
    });
  }
  console.log("✓ Image prompt styles seeded");

  // Get style IDs for prompt seeding
  const retroStyle = await prisma.imagePromptStyle.findUnique({ where: { slug: "retro_gouache" } });
  const goldenStyle = await prisma.imagePromptStyle.findUnique({ where: { slug: "golden_hour" } });
  const mapStyle = await prisma.imagePromptStyle.findUnique({ where: { slug: "map_journey" } });
  const scrapbookStyle = await prisma.imagePromptStyle.findUnique({ where: { slug: "scrapbook_collage" } });

  // Seed Image Prompts
  // Detailed, prescriptive prompts for high-quality AI image generation
  const imagePrompts = [
    // 1. Retro Gouache Travel Poster - TRIP
    {
      name: "Retro Gouache - Trip",
      category: "trip",
      styleId: retroStyle.id,
      lightness: "light",
      isActive: true,
      sortOrder: 1,
      prompt: `Create a vintage mid-century travel poster (1950s/60s). Vertical 9:16 format.

STYLE: Gouache paint aesthetic - matte finish, opaque colors, dry-brush texture. Stylized geometric shapes, flattened perspective, bold simplified forms.

COMPOSITION: Iconic landmark/view as focal point. 2-3 depth layers (foreground, mid-ground, background). Strong diagonal/curved lines.

COLOR: Rich vintage palette - mustard yellow, terracotta red, teal blue, olive green, cream. Accents: burnt orange, sage, dusty rose, navy. 4-6 colors max.

LIGHTING: Season-appropriate mood (warm for summer, cool for winter). Romanticized, idyllic feel.

RULES: NO text, logos, modern elements, photorealism, or detailed faces. Illustrated/painted only. Vertical orientation.

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 1. Retro Gouache Travel Poster - SEGMENT
    {
      name: "Retro Gouache - Segment",
      category: "segment",
      styleId: retroStyle.id,
      lightness: "medium",
      isActive: true,
      sortOrder: 1,
      prompt: `Create vintage mid-century journey poster (1950s/60s). Vertical 9:16 format.

STYLE: Gouache paint - matte, opaque, dry-brush texture. Stylized transportation shapes, flattened perspective, graphic composition.

COMPOSITION: Transportation mode (plane, train, car, boat) as simplified silhouette. Movement elements (curved paths, motion lines). Departure/arrival environments in layered forms. Adventure and transition feel.

COLOR: Warm vintage palette, slightly saturated. Mustard, terracotta, teal, olive, cream. Transport accents: aviation blue, rail red, road orange.

LIGHTING: Timing-appropriate (morning, golden hour, twilight). Season-based atmosphere. Dynamic, suggesting motion.

RULES: NO text, logos, modern tech, photorealism, detailed faces, or literal route maps. Vertical orientation.

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 1. Retro Gouache Travel Poster - RESERVATION
    {
      name: "Retro Gouache - Reservation",
      category: "reservation",
      styleId: retroStyle.id,
      lightness: "dark",
      isActive: true,
      sortOrder: 1,
      prompt: `Create intimate vintage mid-century illustration (1950s/60s). Vertical 9:16 format.

STYLE: Gouache paint - matte, opaque, dry-brush texture. Stylized shapes, darker/richer tones for intimacy.

COMPOSITION: Focus on reservation type - hotel room view, restaurant setting, activity scene. Intimate vignette, closeup perspective. Characteristic venue elements (hotel: window/bed, restaurant: table, activity: equipment/environment).

COLOR: Deep rich vintage tones. Base: deep terracotta, warm mustard, rich teal, olive, cream. Category accents - Hotel: warm gold/deep blue. Dining: burgundy/amber. Activity: environment colors (ocean blue, forest green, sunset orange).

LIGHTING: Warm intimate. Evening/golden hour for sophistication. Indoor: warm interior glow. Outdoor: rich afternoon/evening light. Deeper shadows.

RULES: NO text, logos, modern elements, photorealism, or detailed faces. Illustrated style. Vertical orientation.

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 2. Golden Hour Silhouette - TRIP
    {
      name: "Golden Hour Silhouette",
      category: "trip",
      styleId: goldenStyle.id,
      lightness: "light",
      isActive: true,
      sortOrder: 1,
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
      styleId: goldenStyle.id,
      lightness: "medium",
      isActive: true,
      sortOrder: 1,
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
      styleId: goldenStyle.id,
      lightness: "dark",
      isActive: true,
      sortOrder: 1,
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
      styleId: mapStyle.id,
      lightness: "light",
      isActive: true,
      sortOrder: 1,
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
      styleId: mapStyle.id,
      lightness: "medium",
      isActive: true,
      sortOrder: 1,
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
      styleId: mapStyle.id,
      lightness: "dark",
      isActive: true,
      sortOrder: 1,
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

    // 4. Travel Scrapbook - TRIP
    {
      name: "Travel Scrapbook - Trip",
      category: "trip",
      styleId: scrapbookStyle.id,
      lightness: "light",
      isActive: true,
      sortOrder: 1,
      prompt: `Create a vintage travel scrapbook page with layered memories. Vertical 9:16 format.

CENTER: Clean white rectangular card with journey dates, title, and duration in dark serif font. Add one simple line-art icon (beach umbrella, mountain, cityscape). Tape/photo corners attach card to background.

BACKGROUND: Layered vintage travel ephemera - faded photos, map fragments, postage stamps, ticket stubs, travel stickers. Warm nostalgic palette (cream, sepia, faded blues). Visible paper textures, torn edges, washi tape. Soft overhead lighting with subtle shadows.

RULES: NO readable text except on white card. NO logos, modern elements, or digital items. Background decorative only - frame the card without overwhelming it.

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 4. Travel Scrapbook - SEGMENT
    {
      name: "Travel Scrapbook - Segment",
      category: "segment",
      styleId: scrapbookStyle.id,
      lightness: "medium",
      isActive: true,
      sortOrder: 1,
      prompt: `Create a vintage travel scrapbook page focused on journey between destinations. Vertical 9:16 format.

CENTER: Clean white card with chapter name, departure→arrival cities, times, and duration in dark serif font. Add simple transportation icon (plane, train, car, ship). Tape/corners attach card.

BACKGROUND: Layered transportation ephemera - vintage travel photos, route maps, compass roses, boarding passes, tickets, luggage tags, travel stamps. Warm palette (blues for aviation, reds for rail, earth tones for road). Dynamic composition suggesting movement.

RULES: NO readable text except on white card. NO logos, modern tech, or branding. Background decorative only - artistic routes, not GPS.

TRAVEL CONTEXT TO VISUALIZE:`
    },

    // 4. Travel Scrapbook - RESERVATION
    {
      name: "Travel Scrapbook - Reservation",
      category: "reservation",
      styleId: scrapbookStyle.id,
      lightness: "dark",
      isActive: true,
      sortOrder: 1,
      prompt: `Create an intimate vintage scrapbook page for a specific moment/venue. Vertical 9:16 format.

CENTER: Clean white card with moment name, venue, date/time, and duration in dark serif font. Add simple icon (bed for hotel, fork/knife for dining, activity-specific icon). Attach with tape/corners.

BACKGROUND: Category-specific ephemera - Hotel: keys, postcards, city views. Dining: menu fragments, wine labels. Activity: tickets, badges, trail maps. Rich saturated palette (deep blues for hotels, burgundy/amber for dining, environment colors for activities). Intimate, curated layering.

RULES: NO readable text except on white card. NO logos or modern elements. Background decorative only - vintage/artistic style.

TRAVEL CONTEXT TO VISUALIZE:`
    },
  ];

  for (const prompt of imagePrompts) {
    await prisma.imagePrompt.upsert({
      where: { name: prompt.name },
      update: {
        prompt: prompt.prompt,
        category: prompt.category,
        styleId: prompt.styleId,
        lightness: prompt.lightness,
        isActive: prompt.isActive,
        sortOrder: prompt.sortOrder
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

  // Verify critical reservation types and statuses exist
  console.log("\n🔍 Verifying critical reservation data...");

  const criticalChecks = [
    { category: "Travel", type: "Flight" },
    { category: "Travel", type: "Train" },
    { category: "Travel", type: "Car Rental" },
    { category: "Travel", type: "Cruise" },
    { category: "Stay", type: "Hotel" },
    { category: "Activity", type: "Tour" },
    { category: "Activity", type: "Event Tickets" },
    { category: "Activity", type: "Museum" },
    { category: "Dining", type: "Restaurant" },
    { status: "Confirmed" },
    { status: "Pending" },
    { status: "Cancelled" },
  ];

  for (const check of criticalChecks) {
    if (check.category && check.type) {
      const found = await prisma.reservationType.findFirst({
        where: { 
          name: check.type,
          category: { name: check.category }
        },
        include: { category: true }
      });
      if (!found) {
        throw new Error(`❌ Critical reservation type missing: ${check.category}/${check.type}`);
      }
      console.log(`  ✓ ${check.category}/${check.type}`);
    } else if (check.status) {
      const found = await prisma.reservationStatus.findFirst({
        where: { name: check.status }
      });
      if (!found) {
        throw new Error(`❌ Critical status missing: ${check.status}`);
      }
      console.log(`  ✓ Status: ${check.status}`);
    }
  }

  console.log("✅ All critical reservation data verified");
  console.log("\nDatabase seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
