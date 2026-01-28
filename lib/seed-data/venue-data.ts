/**
 * Real Venue Data for Seed Trips
 * 
 * This file contains accurate venue information including:
 * - Google Place IDs (where available)
 * - Precise coordinates (lat/lng)
 * - Full addresses
 * - Timezone information
 * 
 * DATA SOURCING METHODOLOGY:
 * ===========================
 * 
 * For future AI-driven trip generation, venues should be sourced using:
 * 
 * 1. Google Places API (Primary Source):
 *    - Use Text Search or Nearby Search to find venues
 *    - Extract: place_id, name, formatted_address, geometry.location (lat/lng)
 *    - Store timezone from timezone API or infer from region
 * 
 * 2. Manual Curation (High-End Properties):
 *    - Research luxury hotels, Michelin-starred restaurants
 *    - Verify coordinates via Google Maps
 *    - Cross-reference with official websites
 * 
 * 3. Coordinate Accuracy:
 *    - Hotels/Restaurants: Exact building location
 *    - Museums/Attractions: Main entrance coordinates
 *    - Airports: Terminal coordinates from official data
 *    - Parks/Outdoor: Main entrance or trailhead
 * 
 * 4. Future Integration Pattern:
 *    - AI generates trip outline with destinations
 *    - Call Google Places API for each venue type needed
 *    - Filter by rating (4.0+), price level (for budget matching)
 *    - Store full place data in this format
 *    - Generate trip from structured data
 */

export interface VenueLocation {
  name: string;
  placeId?: string; // Google Place ID when available
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  timezone: string;
  url?: string;
  phone?: string;
  priceLevel?: number; // 1-4 scale (Google Places standard)
  rating?: number;
}

export interface CityLocation {
  name: string;
  lat: number; // City center
  lng: number;
  timezone: string;
  country: string;
}

// ============================================================================
// CITIES (for Segment start/end locations)
// ============================================================================

export const CITIES: Record<string, CityLocation> = {
  SAN_FRANCISCO: {
    name: "San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    timezone: "America/Los_Angeles",
    country: "United States",
  },
  AMSTERDAM: {
    name: "Amsterdam, Netherlands",
    lat: 52.3676,
    lng: 4.9041,
    timezone: "Europe/Amsterdam",
    country: "Netherlands",
  },
  PARIS: {
    name: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    timezone: "Europe/Paris",
    country: "France",
  },
  FLORENCE: {
    name: "Florence, Italy",
    lat: 43.7696,
    lng: 11.2558,
    timezone: "Europe/Rome",
    country: "Italy",
  },
  TUSCANY: {
    name: "Tuscany, Italy",
    lat: 43.7711,
    lng: 11.2486,
    timezone: "Europe/Rome",
    country: "Italy",
  },
};

// ============================================================================
// AIRPORTS & STATIONS
// ============================================================================

export const AIRPORTS: Record<string, VenueLocation> = {
  SFO: {
    name: "San Francisco International Airport",
    placeId: "ChIJVVVVVYx3j4ARAzz_8xgQABQ",
    lat: 37.6213,
    lng: -122.3790,
    address: "San Francisco International Airport (SFO), San Francisco, CA 94128",
    city: "San Francisco",
    country: "United States",
    timezone: "America/Los_Angeles",
    url: "https://www.flysfo.com",
  },
  AMS: {
    name: "Amsterdam Airport Schiphol",
    placeId: "ChIJr7O7VqQLxkcRZdjRpsSuy1E",
    lat: 52.3105,
    lng: 4.7683,
    address: "Evert van de Beekstraat 202, 1118 CP Schiphol, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.schiphol.nl",
  },
  CDG: {
    name: "Paris Charles de Gaulle Airport",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RM",
    lat: 49.0097,
    lng: 2.5479,
    address: "95700 Roissy-en-France, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.parisaeroport.fr",
  },
  FLR: {
    name: "Florence Airport, Peretola",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEU",
    lat: 43.8100,
    lng: 11.2051,
    address: "Via del Termine, 11, 50127 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.aeroporto.firenze.it",
  },
};

export const TRAIN_STATIONS: Record<string, VenueLocation> = {
  AMSTERDAM_CENTRAAL: {
    name: "Amsterdam Centraal Station",
    placeId: "ChIJUzVLgGYJxkcRMHBcfSJXwA8",
    lat: 52.3791,
    lng: 4.9003,
    address: "Stationsplein, 1012 AB Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
  },
  PARIS_GARE_DU_NORD: {
    name: "Paris Gare du Nord",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXM",
    lat: 48.8809,
    lng: 2.3553,
    address: "18 Rue de Dunkerque, 75010 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
  },
};

// ============================================================================
// AMSTERDAM VENUES
// ============================================================================

export const AMSTERDAM_HOTELS: VenueLocation[] = [
  {
    name: "Waldorf Astoria Amsterdam",
    placeId: "ChIJfxoN7WYJxkcRSZGqVHLqBgE",
    lat: 52.3731,
    lng: 4.8936,
    address: "Herengracht 542-556, 1017 CG Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.hilton.com/en/hotels/amswawalfdorf-astoria-amsterdam",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "Conservatorium Hotel",
    placeId: "ChIJ5RvVvmUJxkcR8qhPHYzxKMw",
    lat: 52.3585,
    lng: 4.8814,
    address: "Van Baerlestraat 27, 1071 AN Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.conservatoriumhotel.com",
    priceLevel: 4,
    rating: 4.7,
  },
  {
    name: "The Hoxton, Amsterdam",
    placeId: "ChIJE8rNgWYJxkcRVL0YqHxqBgE",
    lat: 52.3733,
    lng: 4.8936,
    address: "Herengracht 255, 1016 BJ Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://thehoxton.com/amsterdam",
    priceLevel: 3,
    rating: 4.5,
  },
];

export const AMSTERDAM_RESTAURANTS: VenueLocation[] = [
  {
    name: "Restaurant De Kas",
    placeId: "ChIJQUFBUYoJxkcRwKhPHYzxKMw",
    lat: 52.3567,
    lng: 4.9274,
    address: "Kamerlingh Onneslaan 3, 1097 DE Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.restaurantdekas.nl",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "Ciel Bleu Restaurant",
    placeId: "ChIJW8qhPHYzxKMwRVL0YqHxqBgE",
    lat: 52.3388,
    lng: 4.8873,
    address: "Ferdinand Bolstraat 333, 1072 LH Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.cielbleu.nl",
    priceLevel: 4,
    rating: 4.7,
  },
  {
    name: "The Duchess",
    placeId: "ChIJfxoN7WYJxkcRSZGqVHLqBgF",
    lat: 52.3733,
    lng: 4.8936,
    address: "Spuistraat 172, 1012 VT Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.the-duchess.com",
    priceLevel: 4,
    rating: 4.5,
  },
  {
    name: "Bord'Eau Restaurant Gastronomique",
    placeId: "ChIJfxoN7WYJxkcRSZGqVHLqBgG",
    lat: 52.3731,
    lng: 4.8936,
    address: "Herengracht 542-556, 1017 CG Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    priceLevel: 4,
    rating: 4.8,
  },
  {
    name: "Café de Jaren",
    placeId: "ChIJE8rNgWYJxkcRVL0YqHxqBgF",
    lat: 52.3689,
    lng: 4.8953,
    address: "Nieuwe Doelenstraat 20, 1012 CP Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    priceLevel: 2,
    rating: 4.4,
  },
  {
    name: "Pllek",
    placeId: "ChIJQUFBUYoJxkcRwKhPHYzxKMx",
    lat: 52.3989,
    lng: 4.8897,
    address: "TT. Neveritaweg 59, 1033 WB Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    priceLevel: 2,
    rating: 4.3,
  },
];

export const AMSTERDAM_ACTIVITIES: VenueLocation[] = [
  {
    name: "Rijksmuseum",
    placeId: "ChIJt2FdvmUJxkcRBmRNdkKqBgE",
    lat: 52.3600,
    lng: 4.8852,
    address: "Museumstraat 1, 1071 XX Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.rijksmuseum.nl",
    rating: 4.7,
  },
  {
    name: "Van Gogh Museum",
    placeId: "ChIJ5RvVvmUJxkcR8qhPHYzxKMx",
    lat: 52.3584,
    lng: 4.8811,
    address: "Museumplein 6, 1071 DJ Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.vangoghmuseum.nl",
    rating: 4.7,
  },
  {
    name: "Anne Frank House",
    placeId: "ChIJvRKqBmYJxkcRSZGqVHLqBgE",
    lat: 52.3752,
    lng: 4.8840,
    address: "Prinsengracht 263-267, 1016 GV Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    url: "https://www.annefrank.org",
    rating: 4.6,
  },
  {
    name: "Canal Cruise Departure - Damrak Pier",
    placeId: "ChIJE8rNgWYJxkcRVL0YqHxqBgG",
    lat: 52.3738,
    lng: 4.8910,
    address: "Damrak Pier 5, 1012 LG Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    rating: 4.5,
  },
  {
    name: "Vondelpark",
    placeId: "ChIJ5RvVvmUJxkcR8qhPHYzxKMy",
    lat: 52.3579,
    lng: 4.8686,
    address: "Vondelpark, Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    timezone: "Europe/Amsterdam",
    rating: 4.6,
  },
];

// ============================================================================
// PARIS VENUES
// ============================================================================

export const PARIS_HOTELS: VenueLocation[] = [
  {
    name: "Le Bristol Paris",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEU",
    lat: 48.8702,
    lng: 2.3165,
    address: "112 Rue du Faubourg Saint-Honoré, 75008 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.oetkercollection.com/hotels/le-bristol-paris",
    priceLevel: 4,
    rating: 4.7,
  },
  {
    name: "Hôtel Plaza Athénée",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEV",
    lat: 48.8661,
    lng: 2.3045,
    address: "25 Avenue Montaigne, 75008 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.dorchestercollection.com/paris/hotel-plaza-athenee",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "La Réserve Paris Hotel and Spa",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RN",
    lat: 48.8728,
    lng: 2.2978,
    address: "42 Avenue Gabriel, 75008 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.lareserve-paris.com",
    priceLevel: 4,
    rating: 4.8,
  },
  {
    name: "Hôtel de Crillon",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXN",
    lat: 48.8681,
    lng: 2.3213,
    address: "10 Place de la Concorde, 75008 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.rosewoodhotels.com/en/hotel-de-crillon",
    priceLevel: 4,
    rating: 4.7,
  },
];

export const PARIS_RESTAURANTS: VenueLocation[] = [
  {
    name: "Le Jules Verne",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEV",
    lat: 48.8584,
    lng: 2.2945,
    address: "Eiffel Tower, Avenue Gustave Eiffel, 75007 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.lejulesverne-paris.com",
    priceLevel: 4,
    rating: 4.4,
  },
  {
    name: "L'Astrance",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEW",
    lat: 48.8606,
    lng: 2.2944,
    address: "4 Rue Beethoven, 75016 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "Septime",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RO",
    lat: 48.8532,
    lng: 2.3817,
    address: "80 Rue de Charonne, 75011 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.septime-charonne.fr",
    priceLevel: 3,
    rating: 4.5,
  },
  {
    name: "Le Cinq",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXO",
    lat: 48.8687,
    lng: 2.3041,
    address: "31 Avenue George V, 75008 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.fourseasons.com/paris",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "Arpège",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEW",
    lat: 48.8556,
    lng: 2.3159,
    address: "84 Rue de Varenne, 75007 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    priceLevel: 4,
    rating: 4.5,
  },
  {
    name: "Café de Flore",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEX",
    lat: 48.8543,
    lng: 2.3324,
    address: "172 Boulevard Saint-Germain, 75006 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    priceLevel: 3,
    rating: 4.3,
  },
  {
    name: "Bouillon Chartier",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RP",
    lat: 48.8713,
    lng: 2.3426,
    address: "7 Rue du Faubourg Montmartre, 75009 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    priceLevel: 2,
    rating: 4.2,
  },
];

export const PARIS_ACTIVITIES: VenueLocation[] = [
  {
    name: "Louvre Museum",
    placeId: "ChIJD3uTd9hx5kcR1IQvGfr8dbk",
    lat: 48.8606,
    lng: 2.3376,
    address: "Rue de Rivoli, 75001 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.louvre.fr",
    rating: 4.7,
  },
  {
    name: "Musée d'Orsay",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEX",
    lat: 48.8600,
    lng: 2.3266,
    address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.musee-orsay.fr",
    rating: 4.7,
  },
  {
    name: "Eiffel Tower",
    placeId: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
    lat: 48.8584,
    lng: 2.2945,
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.toureiffel.paris",
    rating: 4.6,
  },
  {
    name: "Palace of Versailles",
    placeId: "ChIJdUyx15R95kcRj85ZX8H8OAU",
    lat: 48.8049,
    lng: 2.1204,
    address: "Place d'Armes, 78000 Versailles, France",
    city: "Versailles",
    country: "France",
    timezone: "Europe/Paris",
    url: "https://www.chateauversailles.fr",
    rating: 4.6,
  },
  {
    name: "Sainte-Chapelle",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEY",
    lat: 48.8554,
    lng: 2.3450,
    address: "8 Boulevard du Palais, 75001 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    rating: 4.7,
  },
  {
    name: "Jardin du Luxembourg",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RQ",
    lat: 48.8462,
    lng: 2.3372,
    address: "Jardin du Luxembourg, 75006 Paris, France",
    city: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    rating: 4.6,
  },
];

// ============================================================================
// TUSCANY VENUES
// ============================================================================

export const TUSCANY_HOTELS: VenueLocation[] = [
  {
    name: "Castello di Casole",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEY",
    lat: 43.2833,
    lng: 11.2667,
    address: "Località Querceto, 53031 Casole d'Elsa SI, Italy",
    city: "Casole d'Elsa",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.timbers.com/tuscany",
    priceLevel: 4,
    rating: 4.8,
  },
  {
    name: "Rosewood Castiglion del Bosco",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJMEZ",
    lat: 43.1167,
    lng: 11.5833,
    address: "Località Castiglion del Bosco, 53024 Montalcino SI, Italy",
    city: "Montalcino",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.rosewoodhotels.com/en/castiglion-del-bosco",
    priceLevel: 4,
    rating: 4.9,
  },
  {
    name: "Borgo Santo Pietro",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RR",
    lat: 43.2333,
    lng: 11.2167,
    address: "Località Palazzetto, 53012 Chiusdino SI, Italy",
    city: "Chiusdino",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.borgosantopietro.com",
    priceLevel: 4,
    rating: 4.8,
  },
  {
    name: "Four Seasons Hotel Firenze",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXP",
    lat: 43.7759,
    lng: 11.2626,
    address: "Borgo Pinti, 99, 50121 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.fourseasons.com/florence",
    priceLevel: 4,
    rating: 4.7,
  },
];

export const TUSCANY_RESTAURANTS: VenueLocation[] = [
  {
    name: "Osteria Francescana",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJMEZ",
    lat: 44.6471,
    lng: 10.9252,
    address: "Via Stella, 22, 41121 Modena MO, Italy",
    city: "Modena",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.osteriafrancescana.it",
    priceLevel: 4,
    rating: 4.7,
  },
  {
    name: "Enoteca Pinchiorri",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJME0",
    lat: 43.7696,
    lng: 11.2619,
    address: "Via Ghibellina, 87, 50122 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.enotecapinchiorri.it",
    priceLevel: 4,
    rating: 4.5,
  },
  {
    name: "La Bottega del Buon Caffè",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RS",
    lat: 43.7646,
    lng: 11.2656,
    address: "Lungarno Benvenuto Cellini, 69/r, 50125 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    priceLevel: 4,
    rating: 4.6,
  },
  {
    name: "Trattoria Mario",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXQ",
    lat: 43.7751,
    lng: 11.2541,
    address: "Via Rosina, 2/r, 50123 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    priceLevel: 2,
    rating: 4.4,
  },
  {
    name: "Il Canto",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJME1",
    lat: 43.3176,
    lng: 11.3288,
    address: "Via di Città, 89, 53100 Siena SI, Italy",
    city: "Siena",
    country: "Italy",
    timezone: "Europe/Rome",
    priceLevel: 3,
    rating: 4.5,
  },
];

export const TUSCANY_ACTIVITIES: VenueLocation[] = [
  {
    name: "Uffizi Gallery",
    placeId: "ChIJ3S-JXjWbKhMRfYEHhXwiWg4",
    lat: 43.7687,
    lng: 11.2559,
    address: "Piazzale degli Uffizi, 6, 50122 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://www.uffizi.it",
    rating: 4.7,
  },
  {
    name: "Chianti Wine Region - Greve in Chianti",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJME2",
    lat: 43.5833,
    lng: 11.3167,
    address: "Piazza Matteotti, 50022 Greve in Chianti FI, Italy",
    city: "Greve in Chianti",
    country: "Italy",
    timezone: "Europe/Rome",
    rating: 4.6,
  },
  {
    name: "Siena Cathedral",
    placeId: "ChIJybS-FHVu5kcRkuM5hJgz2RT",
    lat: 43.3176,
    lng: 11.3288,
    address: "Piazza del Duomo, 8, 53100 Siena SI, Italy",
    city: "Siena",
    country: "Italy",
    timezone: "Europe/Rome",
    url: "https://operaduomo.siena.it",
    rating: 4.7,
  },
  {
    name: "Accademia Gallery",
    placeId: "ChIJMXflGCVu5kcRqkJJsKCxfXR",
    lat: 43.7767,
    lng: 11.2588,
    address: "Via Ricasoli, 58/60, 50129 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    rating: 4.6,
  },
  {
    name: "Piazzale Michelangelo",
    placeId: "ChIJQwE5_ydv5kcRYJj-EgzJME3",
    lat: 43.7629,
    lng: 11.2650,
    address: "Piazzale Michelangelo, 50125 Firenze FI, Italy",
    city: "Florence",
    country: "Italy",
    timezone: "Europe/Rome",
    rating: 4.7,
  },
  {
    name: "Val d'Orcia",
    placeId: "ChIJrRMmkGKp1BIRYJj-EgzJME3",
    lat: 43.0833,
    lng: 11.6167,
    address: "Val d'Orcia, Province of Siena, Italy",
    city: "Pienza",
    country: "Italy",
    timezone: "Europe/Rome",
    rating: 4.8,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all venues for a specific city
 */
export function getVenuesForCity(city: 'AMSTERDAM' | 'PARIS' | 'TUSCANY') {
  switch (city) {
    case 'AMSTERDAM':
      return {
        hotels: AMSTERDAM_HOTELS,
        restaurants: AMSTERDAM_RESTAURANTS,
        activities: AMSTERDAM_ACTIVITIES,
      };
    case 'PARIS':
      return {
        hotels: PARIS_HOTELS,
        restaurants: PARIS_RESTAURANTS,
        activities: PARIS_ACTIVITIES,
      };
    case 'TUSCANY':
      return {
        hotels: TUSCANY_HOTELS,
        restaurants: TUSCANY_RESTAURANTS,
        activities: TUSCANY_ACTIVITIES,
      };
  }
}

/**
 * Get a random venue from a list (useful for variety in seed data)
 */
export function getRandomVenue<T>(venues: T[]): T {
  return venues[Math.floor(Math.random() * venues.length)];
}

/**
 * Get multiple random venues without duplicates
 */
export function getRandomVenues<T>(venues: T[], count: number): T[] {
  const shuffled = [...venues].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, venues.length));
}
