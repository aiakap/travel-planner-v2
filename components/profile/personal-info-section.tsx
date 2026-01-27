"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlacesAutocompleteInput } from "@/components/ui/places-autocomplete-input";
import { updateUserProfile, addMultipleHomeAirports } from "@/lib/actions/profile-actions";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";

interface PersonalInfoSectionProps {
  userName: string;
  userEmail: string;
  userImage: string;
  initialProfile: any;
  onNearestAirportsFound?: (airports: any[]) => void;
}

export function PersonalInfoSection({
  userName,
  userEmail,
  userImage,
  initialProfile,
  onNearestAirportsFound,
}: PersonalInfoSectionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    dateOfBirth: initialProfile?.dateOfBirth ? new Date(initialProfile.dateOfBirth).toISOString().split('T')[0] : "",
    address: initialProfile?.address || "",
    city: initialProfile?.city || "",
    country: initialProfile?.country || "",
  });

  // Auto-save handlers for each field
  const saveFirstName = useCallback(async (value: string) => {
    await updateUserProfile({ firstName: value });
  }, []);

  const saveLastName = useCallback(async (value: string) => {
    await updateUserProfile({ lastName: value });
  }, []);

  const saveDateOfBirth = useCallback(async (value: string) => {
    await updateUserProfile({ dateOfBirth: value ? new Date(value) : undefined });
  }, []);

  const saveCity = useCallback(async (value: string) => {
    await updateUserProfile({ city: value });
  }, []);

  const saveCountry = useCallback(async (value: string) => {
    await updateUserProfile({ country: value });
  }, []);

  // Auto-save hooks
  const firstNameAutoSave = useAutoSave({
    value: formData.firstName,
    onSave: saveFirstName,
    enabled: formData.firstName !== initialProfile?.firstName,
  });

  const lastNameAutoSave = useAutoSave({
    value: formData.lastName,
    onSave: saveLastName,
    enabled: formData.lastName !== initialProfile?.lastName,
  });

  const dateOfBirthAutoSave = useAutoSave({
    value: formData.dateOfBirth,
    onSave: saveDateOfBirth,
    enabled: formData.dateOfBirth !== (initialProfile?.dateOfBirth ? new Date(initialProfile.dateOfBirth).toISOString().split('T')[0] : ""),
  });

  const cityAutoSave = useAutoSave({
    value: formData.city,
    onSave: saveCity,
    enabled: formData.city !== initialProfile?.city,
  });

  const countryAutoSave = useAutoSave({
    value: formData.country,
    onSave: saveCountry,
    enabled: formData.country !== initialProfile?.country,
  });

  // Determine overall save status
  const overallSaveStatus = [
    firstNameAutoSave.saveStatus,
    lastNameAutoSave.saveStatus,
    dateOfBirthAutoSave.saveStatus,
    cityAutoSave.saveStatus,
    countryAutoSave.saveStatus,
  ].includes("saving") ? "saving" : [
    firstNameAutoSave.saveStatus,
    lastNameAutoSave.saveStatus,
    dateOfBirthAutoSave.saveStatus,
    cityAutoSave.saveStatus,
    countryAutoSave.saveStatus,
  ].includes("saved") ? "saved" : [
    firstNameAutoSave.saveStatus,
    lastNameAutoSave.saveStatus,
    dateOfBirthAutoSave.saveStatus,
    cityAutoSave.saveStatus,
    countryAutoSave.saveStatus,
  ].includes("error") ? "error" : "idle";

  // Handle place selection from autocomplete
  const handlePlaceSelect = async (placeDetails: any) => {
    setLoading(true);
    try {
      console.log("Place details received:", placeDetails);
      console.log("All address components:", placeDetails.addressComponents);
      
      // Parse address components
      const addressComponents = placeDetails.addressComponents || [];
      
      let streetAddress = "";
      let city = "";
      let state = "";
      let country = "";
      
      for (const component of addressComponents) {
        const types = component.types || [];
        
        if (types.includes("street_number")) {
          streetAddress = component.long_name + " ";
        } else if (types.includes("route")) {
          streetAddress += component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
          console.log("Country found:", country, "Component:", component);
        }
      }
      
      // Debug log for country
      const countryComponent = addressComponents.find((c: any) => c.types.includes("country"));
      console.log("Country component:", countryComponent);
      
      // If no city found, try using state or first part of formatted address
      if (!city && state) {
        city = state;
      } else if (!city && placeDetails.formattedAddress) {
        const parts = placeDetails.formattedAddress.split(',');
        if (parts.length > 1) {
          city = parts[parts.length - 2].trim();
        }
      }
      
      // Use formatted address if no street address was found
      const finalAddress = streetAddress.trim() || placeDetails.formattedAddress || "";
      
      console.log("Parsed address data:", { finalAddress, city, country });
      
      // ALWAYS update all three fields, even if they already have values
      const updateData = {
        address: finalAddress,
        city: city || "",
        country: country || "",
      };
      
      await updateUserProfile(updateData);
      
      setFormData({
        ...formData,
        address: finalAddress,
        city: city || "",
        country: country || "",
      });
      
      // Mark auto-save fields as saved to prevent double-saving
      cityAutoSave.markAsSaved();
      countryAutoSave.markAsSaved();
      
      toast({
        title: "Address updated",
        description: "Your address and location details have been saved",
      });

      // Find and auto-add nearest airports
      if (placeDetails.location) {
        console.log("Finding nearest airports for location:", placeDetails.location);
        
        try {
          const airportResponse = await fetch(
            `/api/airports/nearest?lat=${placeDetails.location.lat}&lng=${placeDetails.location.lng}&limit=2`
          );
          
          if (airportResponse.ok) {
            const airportData = await airportResponse.json();
            console.log("Nearest airports found:", airportData.airports);
            
            if (airportData.airports && airportData.airports.length > 0) {
              // Auto-add the airports
              const airportsToAdd = airportData.airports.map((a: any) => ({
                iataCode: a.iataCode,
                name: a.name,
                city: a.city,
                country: a.country,
              }));
              
              const result = await addMultipleHomeAirports(airportsToAdd);
              console.log("Airports added result:", result);
              
              if (result.added > 0) {
                // Notify parent component about the newly added airports
                if (onNearestAirportsFound) {
                  onNearestAirportsFound(airportData.airports);
                }
                
                // Show toast with airport info
                const airportNames = result.airports
                  .map((a: any) => `${a.iataCode} (${airportData.airports.find((ap: any) => ap.iataCode === a.iataCode)?.distance}km)`)
                  .join(", ");
                
                toast({
                  title: "Home airports added",
                  description: `${airportNames} have been automatically added to your home airports`,
                  duration: 6000,
                });
              } else {
                toast({
                  title: "Airports already added",
                  description: "The nearest airports are already in your home airports",
                  duration: 4000,
                });
              }
            }
          }
        } catch (airportError) {
          console.error("Error finding nearest airports:", airportError);
          // Don't show error to user - this is a nice-to-have feature
        }
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inlineInputClass = "px-3 py-2 border-none bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:border-gray-300 focus:shadow-sm rounded-md transition-all cursor-text";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <SaveStatusIndicator status={overallSaveStatus} />
      </div>

      <div className="flex items-center gap-3 pb-3 border-b">
        {userImage ? (
          <img src={userImage} alt={userName} className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <div>
          <div className="font-semibold">{userName}</div>
          <div className="text-xs text-gray-500">{userEmail}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">First Name</Label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              onBlur={firstNameAutoSave.saveImmediately}
              placeholder="Enter first name"
              className={inlineInputClass}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Last Name</Label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              onBlur={lastNameAutoSave.saveImmediately}
              placeholder="Enter last name"
              className={inlineInputClass}
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Date of Birth</Label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            onBlur={dateOfBirthAutoSave.saveImmediately}
            className={inlineInputClass}
          />
        </div>

        {/* Address - uses autocomplete */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Address (optional)</Label>
          <PlacesAutocompleteInput
            onSelect={handlePlaceSelect}
            placeholder="Search for an address, city, or country..."
            value={formData.address}
            onChange={(val) => setFormData({ ...formData, address: val })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">City (optional)</Label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              onBlur={cityAutoSave.saveImmediately}
              placeholder="Enter city"
              className={inlineInputClass}
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Country (optional)</Label>
            <Input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              onBlur={countryAutoSave.saveImmediately}
              placeholder="Enter country"
              className={inlineInputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
