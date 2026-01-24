"use server";

interface AddressComponent {
  longText: string;
  shortText: string;
  componentType: string;
}

interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  formattedAddress: string;
  addressComponents: AddressComponent[];
  location?: {
    lat: number;
    lng: number;
  };
  suggestions?: string[];
  issues?: string[];
}

/**
 * Validate an address using Google Address Validation API
 */
export async function validateAddress(
  address: string
): Promise<ValidationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return {
      isValid: false,
      isComplete: false,
      formattedAddress: address,
      addressComponents: [],
      issues: ["API key not configured"],
    };
  }

  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      isComplete: false,
      formattedAddress: "",
      addressComponents: [],
      issues: ["Address is required"],
    };
  }

  try {
    const url = "https://addressvalidation.googleapis.com/v1:validateAddress";
    
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: {
          addressLines: [address],
        },
        enableUspsCass: false,
      }),
    });

    if (!response.ok) {
      console.error("Address Validation API error:", response.status);
      // Fallback to basic geocoding
      return await fallbackGeocodeValidation(address);
    }

    const data = await response.json();
    
    if (!data.result) {
      return {
        isValid: false,
        isComplete: false,
        formattedAddress: address,
        addressComponents: [],
        issues: ["Unable to validate address"],
      };
    }

    const result = data.result;
    const verdict = result.verdict;
    const postalAddress = result.address?.postalAddress;
    const geocode = result.geocode;

    const issues: string[] = [];
    
    // Check validation verdict
    if (!verdict?.addressComplete) {
      issues.push("Address appears incomplete");
    }
    
    if (verdict?.hasUnconfirmedComponents) {
      issues.push("Some address components could not be confirmed");
    }
    
    if (verdict?.hasInferredComponents) {
      issues.push("Some address components were inferred");
    }

    // Extract formatted address
    const formattedAddress = postalAddress
      ? formatPostalAddress(postalAddress)
      : address;

    // Extract address components
    const addressComponents: AddressComponent[] = result.address?.addressComponents || [];

    // Extract location
    const location = geocode?.location
      ? {
          lat: geocode.location.latitude,
          lng: geocode.location.longitude,
        }
      : undefined;

    return {
      isValid: verdict?.addressComplete || false,
      isComplete: verdict?.addressComplete || false,
      formattedAddress,
      addressComponents,
      location,
      issues: issues.length > 0 ? issues : undefined,
    };
  } catch (error) {
    console.error("Error validating address:", error);
    // Fallback to basic geocoding
    return await fallbackGeocodeValidation(address);
  }
}

/**
 * Fallback validation using Geocoding API
 */
async function fallbackGeocodeValidation(
  address: string
): Promise<ValidationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return {
      isValid: false,
      isComplete: false,
      formattedAddress: address,
      addressComponents: [],
      issues: ["Unable to validate address"],
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      
      return {
        isValid: true,
        isComplete: result.partial_match !== true,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components.map((comp: any) => ({
          longText: comp.long_name,
          shortText: comp.short_name,
          componentType: comp.types[0],
        })),
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        issues: result.partial_match ? ["Partial match only"] : undefined,
      };
    }

    return {
      isValid: false,
      isComplete: false,
      formattedAddress: address,
      addressComponents: [],
      issues: ["Address not found"],
    };
  } catch (error) {
    console.error("Geocoding fallback error:", error);
    return {
      isValid: false,
      isComplete: false,
      formattedAddress: address,
      addressComponents: [],
      issues: ["Validation failed"],
    };
  }
}

/**
 * Format postal address from Address Validation API response
 */
function formatPostalAddress(postalAddress: any): string {
  const lines: string[] = [];
  
  if (postalAddress.addressLines) {
    lines.push(...postalAddress.addressLines);
  }
  
  if (postalAddress.locality) {
    lines.push(postalAddress.locality);
  }
  
  const regionAndPostal = [];
  if (postalAddress.administrativeArea) {
    regionAndPostal.push(postalAddress.administrativeArea);
  }
  if (postalAddress.postalCode) {
    regionAndPostal.push(postalAddress.postalCode);
  }
  if (regionAndPostal.length > 0) {
    lines.push(regionAndPostal.join(" "));
  }
  
  if (postalAddress.regionCode) {
    lines.push(postalAddress.regionCode);
  }

  return lines.join(", ");
}

/**
 * Get address suggestions based on partial input
 */
export async function getAddressSuggestions(
  input: string,
  sessionToken?: string
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || !input || input.length < 3) {
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&types=address&key=${apiKey}`;
    
    const response = await fetch(sessionToken ? `${url}&sessiontoken=${sessionToken}` : url);
    const data = await response.json();

    if (data.status === "OK" && data.predictions) {
      return data.predictions.map((pred: any) => pred.description).slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error("Error getting address suggestions:", error);
    return [];
  }
}

/**
 * Get place autocomplete suggestions with structured data
 * Supports cities, establishments (airports, hotels, landmarks), and addresses
 */
export async function getPlaceAutocompleteSuggestions(
  input: string,
  sessionToken?: string
): Promise<Array<{
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || !input || input.length < 3) {
    return [];
  }

  try {
    // Use a combination of types to get comprehensive results
    // This will return cities, establishments (airports, hotels, landmarks), and addresses
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}`;
    
    const response = await fetch(sessionToken ? `${url}&sessiontoken=${sessionToken}` : url);
    const data = await response.json();

    if (data.status === "OK" && data.predictions) {
      return data.predictions.slice(0, 8).map((pred: any) => ({
        placeId: pred.place_id,
        description: pred.description,
        mainText: pred.structured_formatting?.main_text || pred.description,
        secondaryText: pred.structured_formatting?.secondary_text || "",
        types: pred.types || [],
      }));
    }

    return [];
  } catch (error) {
    console.error("Error getting place autocomplete suggestions:", error);
    return [];
  }
}

/**
 * Get detailed information about a place by place_id
 */
export async function getPlaceDetailsByPlaceId(
  placeId: string
): Promise<{
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  placeId: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || !placeId) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=name,formatted_address,geometry&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      const result = data.result;
      return {
        name: result.name || result.formatted_address,
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}
