import Amadeus from 'amadeus';

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

export interface FlightSearchParams {
  origin: string; // IATA code (e.g., "JFK")
  destination: string; // IATA code (e.g., "LAX")
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for one-way)
  adults: number; // Number of passengers
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  max?: number; // Max results (default 10)
}

export interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string; // ISO 8601 duration (e.g., "PT5H30M")
    segments: Array<{
      departure: {
        iataCode: string;
        at: string; // ISO 8601 datetime
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string; // Airline code (e.g., "AA")
      number: string; // Flight number
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  validatingAirlineCodes: string[];
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: params.max || 10,
    });

    return response.data as FlightOffer[];
  } catch (error) {
    console.error('Amadeus API error:', error);
    throw new Error('Failed to search flights');
  }
}
