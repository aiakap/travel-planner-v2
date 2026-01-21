interface GeocodeResult {
  country: string;
  formattedAddress: string;
}

export async function getCountryFromCoordinates(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
    
    if (!apiKey) {
      console.warn("Google Maps API key not configured");
      return {
        country: "Unknown",
        formattedAddress: `${lat}, ${lng}`,
      };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();

    // Check if we have valid results
    if (!data.results || data.results.length === 0) {
      console.warn(`No geocode results for coordinates: ${lat}, ${lng}`);
      return {
        country: "Unknown",
        formattedAddress: `${lat}, ${lng}`,
      };
    }

    const result = data.results[0];
    
    // Check if address_components exists
    if (!result.address_components) {
      console.warn(`No address components for coordinates: ${lat}, ${lng}`);
      return {
        country: "Unknown",
        formattedAddress: result.formatted_address || `${lat}, ${lng}`,
      };
    }

    const countryComponent = result.address_components.find((component: any) =>
      component.types.includes("country")
    );

    return {
      country: countryComponent?.long_name || "Unknown",
      formattedAddress: result.formatted_address || `${lat}, ${lng}`,
    };
  } catch (error) {
    console.error("Error in getCountryFromCoordinates:", error);
    return {
      country: "Unknown",
      formattedAddress: `${lat}, ${lng}`,
    };
  }
}
