# Profile Category Seed Scripts

## Overview

This document contains the seed data for the relational profile graph system. The categories are organized hierarchically with self-referential relationships.

## Seed Script Structure

```typescript
// scripts/seed-profile-categories.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  level: number;
  sortOrder: number;
  parentSlug?: string;
  children?: CategorySeed[];
}
```

## Complete Category Hierarchy

### 1. Travel Style (Level 0)

```typescript
{
  name: "Travel Style",
  slug: "travel-style",
  description: "How you prefer to travel",
  icon: "Compass",
  color: "#8b5cf6", // purple
  level: 0,
  sortOrder: 1,
  children: [
    {
      name: "Pace",
      slug: "pace",
      description: "Travel speed preference",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Slow Travel", slug: "slow-travel", level: 2, sortOrder: 1 },
        { name: "Moderate Pace", slug: "moderate-pace", level: 2, sortOrder: 2 },
        { name: "Fast-Paced", slug: "fast-paced", level: 2, sortOrder: 3 }
      ]
    },
    {
      name: "Group Preference",
      slug: "group-preference",
      description: "Solo vs group travel",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Solo", slug: "solo", level: 2, sortOrder: 1 },
        { name: "Couple", slug: "couple", level: 2, sortOrder: 2 },
        { name: "Family", slug: "family", level: 2, sortOrder: 3 },
        { name: "Small Group", slug: "small-group", level: 2, sortOrder: 4 },
        { name: "Large Group", slug: "large-group", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Luxury Level",
      slug: "luxury-level",
      description: "Budget to luxury spectrum",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Budget", slug: "budget", level: 2, sortOrder: 1 },
        { name: "Mid-Range", slug: "mid-range", level: 2, sortOrder: 2 },
        { name: "Luxury", slug: "luxury", level: 2, sortOrder: 3 },
        { name: "Ultra-Luxury", slug: "ultra-luxury", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Adventure Level",
      slug: "adventure-level",
      description: "Relaxation to extreme adventure",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Relaxation", slug: "relaxation", level: 2, sortOrder: 1 },
        { name: "Moderate", slug: "moderate", level: 2, sortOrder: 2 },
        { name: "Adventure", slug: "adventure", level: 2, sortOrder: 3 },
        { name: "Extreme", slug: "extreme", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 2. Destinations (Level 0)

```typescript
{
  name: "Destinations",
  slug: "destinations",
  description: "Places you want to visit or have visited",
  icon: "MapPin",
  color: "#06b6d4", // cyan
  level: 0,
  sortOrder: 2,
  children: [
    {
      name: "Regions",
      slug: "regions",
      description: "Geographic regions",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "North America", slug: "north-america", level: 2, sortOrder: 1 },
        { name: "Central America", slug: "central-america", level: 2, sortOrder: 2 },
        { name: "South America", slug: "south-america", level: 2, sortOrder: 3 },
        { name: "Europe", slug: "europe", level: 2, sortOrder: 4 },
        { name: "Africa", slug: "africa", level: 2, sortOrder: 5 },
        { name: "Middle East", slug: "middle-east", level: 2, sortOrder: 6 },
        { name: "Asia", slug: "asia", level: 2, sortOrder: 7 },
        { name: "Oceania", slug: "oceania", level: 2, sortOrder: 8 },
        { name: "Caribbean", slug: "caribbean", level: 2, sortOrder: 9 },
        { name: "Antarctica", slug: "antarctica", level: 2, sortOrder: 10 }
      ]
    },
    {
      name: "Countries",
      slug: "countries",
      description: "Specific countries",
      level: 1,
      sortOrder: 2
      // Countries added dynamically as users mention them
    },
    {
      name: "Cities",
      slug: "cities",
      description: "Specific cities",
      level: 1,
      sortOrder: 3
      // Cities added dynamically as users mention them
    },
    {
      name: "Climate",
      slug: "climate",
      description: "Weather preferences",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Tropical", slug: "tropical", level: 2, sortOrder: 1 },
        { name: "Temperate", slug: "temperate", level: 2, sortOrder: 2 },
        { name: "Cold", slug: "cold", level: 2, sortOrder: 3 },
        { name: "Desert", slug: "desert", level: 2, sortOrder: 4 },
        { name: "Mediterranean", slug: "mediterranean", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Setting",
      slug: "setting",
      description: "Type of location",
      level: 1,
      sortOrder: 5,
      children: [
        { name: "Urban", slug: "urban", level: 2, sortOrder: 1 },
        { name: "Rural", slug: "rural", level: 2, sortOrder: 2 },
        { name: "Coastal", slug: "coastal", level: 2, sortOrder: 3 },
        { name: "Mountain", slug: "mountain", level: 2, sortOrder: 4 },
        { name: "Island", slug: "island", level: 2, sortOrder: 5 },
        { name: "Desert", slug: "desert-setting", level: 2, sortOrder: 6 },
        { name: "Forest", slug: "forest", level: 2, sortOrder: 7 }
      ]
    },
    {
      name: "Status",
      slug: "status",
      description: "Visit status",
      level: 1,
      sortOrder: 6,
      children: [
        { name: "Visited", slug: "visited", level: 2, sortOrder: 1 },
        { name: "Wishlist", slug: "wishlist", level: 2, sortOrder: 2 },
        { name: "Favorites", slug: "favorites", level: 2, sortOrder: 3 },
        { name: "Bucket List", slug: "bucket-list", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 3. Accommodations (Level 0)

```typescript
{
  name: "Accommodations",
  slug: "accommodations",
  description: "Where you prefer to stay",
  icon: "Hotel",
  color: "#f97316", // orange
  level: 0,
  sortOrder: 3,
  children: [
    {
      name: "Types",
      slug: "types",
      description: "Accommodation types",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Hotels", slug: "hotels", level: 2, sortOrder: 1 },
        { name: "Resorts", slug: "resorts", level: 2, sortOrder: 2 },
        { name: "Boutique Hotels", slug: "boutique-hotels", level: 2, sortOrder: 3 },
        { name: "Vacation Rentals", slug: "vacation-rentals", level: 2, sortOrder: 4 },
        { name: "Hostels", slug: "hostels", level: 2, sortOrder: 5 },
        { name: "Camping", slug: "camping", level: 2, sortOrder: 6 },
        { name: "Glamping", slug: "glamping", level: 2, sortOrder: 7 },
        { name: "Bed & Breakfast", slug: "bed-breakfast", level: 2, sortOrder: 8 },
        { name: "Apartments", slug: "apartments", level: 2, sortOrder: 9 },
        { name: "Villas", slug: "villas", level: 2, sortOrder: 10 }
      ]
    },
    {
      name: "Brands",
      slug: "brands",
      description: "Hotel brands and programs",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Marriott", slug: "marriott", level: 2, sortOrder: 1 },
        { name: "Hilton", slug: "hilton", level: 2, sortOrder: 2 },
        { name: "Hyatt", slug: "hyatt", level: 2, sortOrder: 3 },
        { name: "IHG", slug: "ihg", level: 2, sortOrder: 4 },
        { name: "Accor", slug: "accor", level: 2, sortOrder: 5 },
        { name: "Four Seasons", slug: "four-seasons", level: 2, sortOrder: 6 },
        { name: "Ritz-Carlton", slug: "ritz-carlton", level: 2, sortOrder: 7 },
        { name: "Airbnb", slug: "airbnb", level: 2, sortOrder: 8 },
        { name: "VRBO", slug: "vrbo", level: 2, sortOrder: 9 },
        { name: "Amex Fine Hotels", slug: "amex-fine-hotels", level: 2, sortOrder: 10 },
        { name: "Virtuoso", slug: "virtuoso", level: 2, sortOrder: 11 }
      ]
    },
    {
      name: "Amenities",
      slug: "amenities",
      description: "Must-have amenities",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Pool", slug: "pool", level: 2, sortOrder: 1 },
        { name: "Gym", slug: "gym", level: 2, sortOrder: 2 },
        { name: "Spa", slug: "spa", level: 2, sortOrder: 3 },
        { name: "Kitchen", slug: "kitchen", level: 2, sortOrder: 4 },
        { name: "WiFi", slug: "wifi", level: 2, sortOrder: 5 },
        { name: "Parking", slug: "parking", level: 2, sortOrder: 6 },
        { name: "Pet-Friendly", slug: "pet-friendly", level: 2, sortOrder: 7 },
        { name: "Beach Access", slug: "beach-access", level: 2, sortOrder: 8 },
        { name: "Concierge", slug: "concierge", level: 2, sortOrder: 9 },
        { name: "Restaurant", slug: "restaurant", level: 2, sortOrder: 10 }
      ]
    }
  ]
}
```

### 4. Transportation (Level 0)

```typescript
{
  name: "Transportation",
  slug: "transportation",
  description: "How you prefer to travel",
  icon: "Plane",
  color: "#0ea5e9", // sky
  level: 0,
  sortOrder: 4,
  children: [
    {
      name: "Airlines",
      slug: "airlines",
      description: "Preferred airlines",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "United", slug: "united", level: 2, sortOrder: 1 },
        { name: "Delta", slug: "delta", level: 2, sortOrder: 2 },
        { name: "American Airlines", slug: "american-airlines", level: 2, sortOrder: 3 },
        { name: "Southwest", slug: "southwest", level: 2, sortOrder: 4 },
        { name: "JetBlue", slug: "jetblue", level: 2, sortOrder: 5 },
        { name: "Alaska Airlines", slug: "alaska-airlines", level: 2, sortOrder: 6 },
        { name: "Spirit", slug: "spirit", level: 2, sortOrder: 7 },
        { name: "Frontier", slug: "frontier", level: 2, sortOrder: 8 }
      ]
    },
    {
      name: "Travel Class",
      slug: "travel-class",
      description: "Cabin class preference",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Economy", slug: "economy", level: 2, sortOrder: 1 },
        { name: "Premium Economy", slug: "premium-economy", level: 2, sortOrder: 2 },
        { name: "Business Class", slug: "business-class", level: 2, sortOrder: 3 },
        { name: "First Class", slug: "first-class", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Loyalty Programs",
      slug: "loyalty-programs",
      description: "Airline loyalty status",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "1K", slug: "1k", level: 2, sortOrder: 1 },
        { name: "Platinum", slug: "platinum", level: 2, sortOrder: 2 },
        { name: "Gold", slug: "gold", level: 2, sortOrder: 3 },
        { name: "Silver", slug: "silver", level: 2, sortOrder: 4 },
        { name: "Diamond", slug: "diamond", level: 2, sortOrder: 5 },
        { name: "Premier", slug: "premier", level: 2, sortOrder: 6 }
      ]
    },
    {
      name: "Ground Transport",
      slug: "ground-transport",
      description: "On-the-ground transportation",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Rental Car", slug: "rental-car", level: 2, sortOrder: 1 },
        { name: "Public Transit", slug: "public-transit", level: 2, sortOrder: 2 },
        { name: "Rideshare", slug: "rideshare", level: 2, sortOrder: 3 },
        { name: "Private Driver", slug: "private-driver", level: 2, sortOrder: 4 },
        { name: "Taxi", slug: "taxi", level: 2, sortOrder: 5 },
        { name: "Bicycle", slug: "bicycle", level: 2, sortOrder: 6 },
        { name: "Walking", slug: "walking", level: 2, sortOrder: 7 }
      ]
    }
  ]
}
```

### 5. Activities (Level 0)

```typescript
{
  name: "Activities",
  slug: "activities",
  description: "What you like to do while traveling",
  icon: "Activity",
  color: "#14b8a6", // teal
  level: 0,
  sortOrder: 5,
  children: [
    {
      name: "Outdoor",
      slug: "outdoor",
      description: "Outdoor activities",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Hiking", slug: "hiking", level: 2, sortOrder: 1 },
        { name: "Camping", slug: "camping-activity", level: 2, sortOrder: 2 },
        { name: "Rock Climbing", slug: "rock-climbing", level: 2, sortOrder: 3 },
        { name: "Surfing", slug: "surfing", level: 2, sortOrder: 4 },
        { name: "Swimming", slug: "swimming", level: 2, sortOrder: 5 },
        { name: "Snorkeling", slug: "snorkeling", level: 2, sortOrder: 6 },
        { name: "Diving", slug: "diving", level: 2, sortOrder: 7 },
        { name: "Kayaking", slug: "kayaking", level: 2, sortOrder: 8 },
        { name: "Skiing", slug: "skiing", level: 2, sortOrder: 9 },
        { name: "Snowboarding", slug: "snowboarding", level: 2, sortOrder: 10 },
        { name: "Mountain Biking", slug: "mountain-biking", level: 2, sortOrder: 11 },
        { name: "Zip-lining", slug: "zip-lining", level: 2, sortOrder: 12 }
      ]
    },
    {
      name: "Sports",
      slug: "sports",
      description: "Sports activities",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Running", slug: "running", level: 2, sortOrder: 1 },
        { name: "Marathon", slug: "marathon", level: 2, sortOrder: 2 },
        { name: "Triathlon", slug: "triathlon", level: 2, sortOrder: 3 },
        { name: "Cycling", slug: "cycling", level: 2, sortOrder: 4 },
        { name: "Tennis", slug: "tennis", level: 2, sortOrder: 5 },
        { name: "Golf", slug: "golf", level: 2, sortOrder: 6 },
        { name: "Yoga", slug: "yoga", level: 2, sortOrder: 7 },
        { name: "Pilates", slug: "pilates", level: 2, sortOrder: 8 }
      ]
    },
    {
      name: "Cultural",
      slug: "cultural",
      description: "Cultural activities",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Museums", slug: "museums", level: 2, sortOrder: 1 },
        { name: "Art Galleries", slug: "art-galleries", level: 2, sortOrder: 2 },
        { name: "Theater", slug: "theater", level: 2, sortOrder: 3 },
        { name: "Opera", slug: "opera", level: 2, sortOrder: 4 },
        { name: "Concerts", slug: "concerts", level: 2, sortOrder: 5 },
        { name: "Architecture", slug: "architecture", level: 2, sortOrder: 6 },
        { name: "Historical Sites", slug: "historical-sites", level: 2, sortOrder: 7 },
        { name: "Local Markets", slug: "local-markets", level: 2, sortOrder: 8 }
      ]
    },
    {
      name: "Culinary",
      slug: "culinary-activities",
      description: "Food-related activities",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Cooking Classes", slug: "cooking-classes", level: 2, sortOrder: 1 },
        { name: "Wine Tasting", slug: "wine-tasting", level: 2, sortOrder: 2 },
        { name: "Food Tours", slug: "food-tours", level: 2, sortOrder: 3 },
        { name: "Brewery Tours", slug: "brewery-tours", level: 2, sortOrder: 4 },
        { name: "Farm Visits", slug: "farm-visits", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Wellness",
      slug: "wellness",
      description: "Wellness activities",
      level: 1,
      sortOrder: 5,
      children: [
        { name: "Spa", slug: "spa-activity", level: 2, sortOrder: 1 },
        { name: "Meditation", slug: "meditation", level: 2, sortOrder: 2 },
        { name: "Yoga Retreats", slug: "yoga-retreats", level: 2, sortOrder: 3 },
        { name: "Hot Springs", slug: "hot-springs", level: 2, sortOrder: 4 },
        { name: "Wellness Retreats", slug: "wellness-retreats", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Adventure",
      slug: "adventure-activities",
      description: "Extreme/adventure activities",
      level: 1,
      sortOrder: 6,
      children: [
        { name: "Skydiving", slug: "skydiving", level: 2, sortOrder: 1 },
        { name: "Bungee Jumping", slug: "bungee-jumping", level: 2, sortOrder: 2 },
        { name: "Paragliding", slug: "paragliding", level: 2, sortOrder: 3 },
        { name: "White Water Rafting", slug: "white-water-rafting", level: 2, sortOrder: 4 },
        { name: "Safari", slug: "safari", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Nightlife",
      slug: "nightlife",
      description: "Evening entertainment",
      level: 1,
      sortOrder: 7,
      children: [
        { name: "Bars", slug: "bars", level: 2, sortOrder: 1 },
        { name: "Clubs", slug: "clubs", level: 2, sortOrder: 2 },
        { name: "Live Music", slug: "live-music", level: 2, sortOrder: 3 },
        { name: "Comedy Shows", slug: "comedy-shows", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Shopping",
      slug: "shopping",
      description: "Shopping preferences",
      level: 1,
      sortOrder: 8,
      children: [
        { name: "Local Crafts", slug: "local-crafts", level: 2, sortOrder: 1 },
        { name: "Designer Shopping", slug: "designer-shopping", level: 2, sortOrder: 2 },
        { name: "Souvenirs", slug: "souvenirs", level: 2, sortOrder: 3 },
        { name: "Antiques", slug: "antiques", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 6. Dining & Cuisine (Level 0)

```typescript
{
  name: "Dining & Cuisine",
  slug: "dining",
  description: "Food and dining preferences",
  icon: "UtensilsCrossed",
  color: "#ef4444", // red
  level: 0,
  sortOrder: 6,
  children: [
    {
      name: "Cuisines",
      slug: "cuisines",
      description: "Types of cuisine",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Italian", slug: "italian", level: 2, sortOrder: 1 },
        { name: "French", slug: "french", level: 2, sortOrder: 2 },
        { name: "Japanese", slug: "japanese", level: 2, sortOrder: 3 },
        { name: "Chinese", slug: "chinese", level: 2, sortOrder: 4 },
        { name: "Mexican", slug: "mexican", level: 2, sortOrder: 5 },
        { name: "Thai", slug: "thai", level: 2, sortOrder: 6 },
        { name: "Indian", slug: "indian", level: 2, sortOrder: 7 },
        { name: "Mediterranean", slug: "mediterranean-cuisine", level: 2, sortOrder: 8 },
        { name: "Korean", slug: "korean", level: 2, sortOrder: 9 },
        { name: "Vietnamese", slug: "vietnamese", level: 2, sortOrder: 10 },
        { name: "Greek", slug: "greek", level: 2, sortOrder: 11 },
        { name: "Spanish", slug: "spanish", level: 2, sortOrder: 12 },
        { name: "Middle Eastern", slug: "middle-eastern-cuisine", level: 2, sortOrder: 13 }
      ]
    },
    {
      name: "Dietary",
      slug: "dietary",
      description: "Dietary restrictions and preferences",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Vegetarian", slug: "vegetarian", level: 2, sortOrder: 1 },
        { name: "Vegan", slug: "vegan", level: 2, sortOrder: 2 },
        { name: "Gluten-Free", slug: "gluten-free", level: 2, sortOrder: 3 },
        { name: "Kosher", slug: "kosher", level: 2, sortOrder: 4 },
        { name: "Halal", slug: "halal", level: 2, sortOrder: 5 },
        { name: "Pescatarian", slug: "pescatarian", level: 2, sortOrder: 6 },
        { name: "Dairy-Free", slug: "dairy-free", level: 2, sortOrder: 7 },
        { name: "Nut-Free", slug: "nut-free", level: 2, sortOrder: 8 }
      ]
    },
    {
      name: "Dining Style",
      slug: "dining-style",
      description: "How you prefer to dine",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Fine Dining", slug: "fine-dining", level: 2, sortOrder: 1 },
        { name: "Casual Dining", slug: "casual-dining", level: 2, sortOrder: 2 },
        { name: "Street Food", slug: "street-food", level: 2, sortOrder: 3 },
        { name: "Food Trucks", slug: "food-trucks", level: 2, sortOrder: 4 },
        { name: "Michelin Star", slug: "michelin-star", level: 2, sortOrder: 5 },
        { name: "Local Favorites", slug: "local-favorites", level: 2, sortOrder: 6 }
      ]
    },
    {
      name: "Beverages",
      slug: "beverages",
      description: "Drink preferences",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Wine", slug: "wine", level: 2, sortOrder: 1 },
        { name: "Craft Beer", slug: "craft-beer", level: 2, sortOrder: 2 },
        { name: "Cocktails", slug: "cocktails", level: 2, sortOrder: 3 },
        { name: "Coffee", slug: "coffee", level: 2, sortOrder: 4 },
        { name: "Tea", slug: "tea", level: 2, sortOrder: 5 },
        { name: "Spirits", slug: "spirits", level: 2, sortOrder: 6 }
      ]
    }
  ]
}
```

### 7. Budget & Spending (Level 0)

```typescript
{
  name: "Budget & Spending",
  slug: "budget",
  description: "Financial preferences and priorities",
  icon: "DollarSign",
  color: "#84cc16", // lime
  level: 0,
  sortOrder: 7,
  children: [
    {
      name: "Daily Budget",
      slug: "daily-budget",
      description: "Daily spending range",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Under $50", slug: "under-50", level: 2, sortOrder: 1 },
        { name: "$50-$100", slug: "50-100", level: 2, sortOrder: 2 },
        { name: "$100-$200", slug: "100-200", level: 2, sortOrder: 3 },
        { name: "$200-$500", slug: "200-500", level: 2, sortOrder: 4 },
        { name: "Over $500", slug: "over-500", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Splurge Categories",
      slug: "splurge-categories",
      description: "Where you're willing to spend more",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Accommodations", slug: "accommodations-splurge", level: 2, sortOrder: 1 },
        { name: "Food", slug: "food-splurge", level: 2, sortOrder: 2 },
        { name: "Activities", slug: "activities-splurge", level: 2, sortOrder: 3 },
        { name: "Transportation", slug: "transportation-splurge", level: 2, sortOrder: 4 },
        { name: "Shopping", slug: "shopping-splurge", level: 2, sortOrder: 5 }
      ]
    },
    {
      name: "Payment Methods",
      slug: "payment-methods",
      description: "Preferred payment types",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Credit Cards", slug: "credit-cards", level: 2, sortOrder: 1 },
        { name: "Points", slug: "points", level: 2, sortOrder: 2 },
        { name: "Cash", slug: "cash", level: 2, sortOrder: 3 },
        { name: "Travel Credits", slug: "travel-credits", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 8. Travel Companions (Level 0)

```typescript
{
  name: "Travel Companions",
  slug: "companions",
  description: "Who you travel with",
  icon: "Users",
  color: "#a855f7", // purple
  level: 0,
  sortOrder: 8,
  children: [
    {
      name: "Companion Type",
      slug: "companion-type",
      description: "Types of travel companions",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Solo", slug: "solo-companion", level: 2, sortOrder: 1 },
        { name: "Partner", slug: "partner", level: 2, sortOrder: 2 },
        { name: "Spouse", slug: "spouse", level: 2, sortOrder: 3 },
        { name: "Family", slug: "family-companion", level: 2, sortOrder: 4 },
        { name: "Friends", slug: "friends", level: 2, sortOrder: 5 },
        { name: "Organized Groups", slug: "organized-groups", level: 2, sortOrder: 6 }
      ]
    },
    {
      name: "Special Needs",
      slug: "special-needs",
      description: "Accessibility and special requirements",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Accessibility", slug: "accessibility", level: 2, sortOrder: 1 },
        { name: "Children", slug: "children", level: 2, sortOrder: 2 },
        { name: "Infants", slug: "infants", level: 2, sortOrder: 3 },
        { name: "Pets", slug: "pets", level: 2, sortOrder: 4 },
        { name: "Elderly", slug: "elderly", level: 2, sortOrder: 5 }
      ]
    }
  ]
}
```

### 9. Travel Timing (Level 0)

```typescript
{
  name: "Travel Timing",
  slug: "timing",
  description: "When you prefer to travel",
  icon: "Calendar",
  color: "#06b6d4", // cyan
  level: 0,
  sortOrder: 9,
  children: [
    {
      name: "Seasons",
      slug: "seasons",
      description: "Preferred seasons",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Spring", slug: "spring", level: 2, sortOrder: 1 },
        { name: "Summer", slug: "summer", level: 2, sortOrder: 2 },
        { name: "Fall", slug: "fall", level: 2, sortOrder: 3 },
        { name: "Winter", slug: "winter", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Peak vs Off-Peak",
      slug: "peak-vs-offpeak",
      description: "Crowd preferences",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Peak Season", slug: "peak-season", level: 2, sortOrder: 1 },
        { name: "Shoulder Season", slug: "shoulder-season", level: 2, sortOrder: 2 },
        { name: "Off-Peak", slug: "off-peak", level: 2, sortOrder: 3 }
      ]
    },
    {
      name: "Trip Length",
      slug: "trip-length",
      description: "Typical trip duration",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Weekend", slug: "weekend", level: 2, sortOrder: 1 },
        { name: "Week", slug: "week", level: 2, sortOrder: 2 },
        { name: "Two Weeks", slug: "two-weeks", level: 2, sortOrder: 3 },
        { name: "Extended", slug: "extended", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Holidays",
      slug: "holidays",
      description: "Holiday travel preferences",
      level: 1,
      sortOrder: 4,
      children: [
        { name: "Christmas", slug: "christmas", level: 2, sortOrder: 1 },
        { name: "New Year", slug: "new-year", level: 2, sortOrder: 2 },
        { name: "Thanksgiving", slug: "thanksgiving", level: 2, sortOrder: 3 },
        { name: "Summer Holidays", slug: "summer-holidays", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 10. Travel Logistics (Level 0)

```typescript
{
  name: "Travel Logistics",
  slug: "travel-logistics",
  description: "Planning and booking preferences",
  icon: "Settings",
  color: "#64748b", // slate
  level: 0,
  sortOrder: 10,
  children: [
    {
      name: "Booking Preferences",
      slug: "booking-preferences",
      description: "How you book travel",
      level: 1,
      sortOrder: 1,
      children: [
        { name: "Direct", slug: "direct", level: 2, sortOrder: 1 },
        { name: "OTA", slug: "ota", level: 2, sortOrder: 2 },
        { name: "Travel Agent", slug: "travel-agent", level: 2, sortOrder: 3 },
        { name: "Package Deals", slug: "package-deals", level: 2, sortOrder: 4 }
      ]
    },
    {
      name: "Insurance",
      slug: "insurance",
      description: "Travel insurance preferences",
      level: 1,
      sortOrder: 2,
      children: [
        { name: "Always", slug: "always", level: 2, sortOrder: 1 },
        { name: "Sometimes", slug: "sometimes", level: 2, sortOrder: 2 },
        { name: "Never", slug: "never", level: 2, sortOrder: 3 }
      ]
    },
    {
      name: "Packing Style",
      slug: "packing-style",
      description: "How you pack",
      level: 1,
      sortOrder: 3,
      children: [
        { name: "Carry-On Only", slug: "carry-on-only", level: 2, sortOrder: 1 },
        { name: "Checked Bag", slug: "checked-bag", level: 2, sortOrder: 2 },
        { name: "Minimalist", slug: "minimalist", level: 2, sortOrder: 3 },
        { name: "Over-Packer", slug: "over-packer", level: 2, sortOrder: 4 }
      ]
    }
  ]
}
```

### 11. Other (Level 0)

```typescript
{
  name: "Other",
  slug: "other",
  description: "Miscellaneous preferences",
  icon: "MoreHorizontal",
  color: "#6b7280", // gray
  level: 0,
  sortOrder: 99,
  children: [
    {
      name: "General",
      slug: "general",
      description: "General preferences",
      level: 1,
      sortOrder: 1
    }
  ]
}
```

## Implementation Script

```typescript
// scripts/seed-profile-categories.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('Starting category seed...');
  
  // Helper function to recursively create categories
  async function createCategory(
    cat: CategorySeed,
    parentId: string | null = null
  ): Promise<string> {
    const category = await prisma.profileCategory.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        level: cat.level,
        sortOrder: cat.sortOrder,
        parentId: parentId,
        isActive: true
      }
    });
    
    console.log(`Created: ${cat.name} (level ${cat.level})`);
    
    // Recursively create children
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        await createCategory(child, category.id);
      }
    }
    
    return category.id;
  }
  
  // Seed all top-level categories
  const categories = [
    // ... all category definitions from above
  ];
  
  for (const category of categories) {
    await createCategory(category);
  }
  
  console.log('Category seed complete!');
}

seedCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Summary

**Total Categories**: ~250+ categories across 3 levels
- **Level 0** (Root): 11 categories
- **Level 1** (Subcategories): ~50 categories
- **Level 2** (Sub-subcategories): ~190 categories

**Key Improvements**:
1. Added more granular subcategories (e.g., climate, setting for destinations)
2. Added payment methods and insurance preferences
3. Added packing style and booking preferences
4. Expanded dining to include more cuisines and dietary options
5. Added wellness and adventure activity categories
6. More specific ground transport options
7. Holiday timing preferences

This structure is flexible and can grow as users add new values!
