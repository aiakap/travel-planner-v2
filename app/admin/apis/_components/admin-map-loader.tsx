"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Centralized Google Maps loader for admin section
 * Prevents multiple script loads and provides consistent error handling
 */
export const useAdminMapsLoader = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  return useJsApiLoader({
    id: "admin-google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: ["places", "geometry", "drawing"],
  });
};

interface MapLoaderWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export const MapLoaderWrapper = ({ 
  children, 
  loadingMessage = "Loading map..." 
}: MapLoaderWrapperProps) => {
  const { isLoaded, loadError } = useAdminMapsLoader();

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Google Maps. Check your API key configuration.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Export map usage tracking
export const trackMapUsage = (action: string, details?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    const usage = {
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    
    // Store in session storage for admin tracking
    const existingUsage = sessionStorage.getItem("admin_map_usage");
    const usageLog = existingUsage ? JSON.parse(existingUsage) : [];
    usageLog.push(usage);
    sessionStorage.setItem("admin_map_usage", JSON.stringify(usageLog));
    
    console.log("[Admin Map Usage]", usage);
  }
};

// Get map usage statistics
export const getMapUsageStats = () => {
  if (typeof window === "undefined") return [];
  
  const usage = sessionStorage.getItem("admin_map_usage");
  return usage ? JSON.parse(usage) : [];
};

// Clear map usage tracking
export const clearMapUsageStats = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("admin_map_usage");
  }
};
