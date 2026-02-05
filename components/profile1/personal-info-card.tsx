"use client";

import { useState, useCallback } from "react";
import { User, MapPin, Calendar, ChevronDown, Trash2, Plus } from "lucide-react";
import { PlacesAutocompleteInput } from "@/components/ui/places-autocomplete-input";
import { updateUserProfile, addMultipleHomeAirports } from "@/lib/actions/profile-actions";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { UserProfile, Airport, Gender } from "@/lib/types/profile";
import { COUNTRIES, GENDER_OPTIONS, getCountryName } from "@/lib/data/countries";

interface PersonalInfoCardProps {
  initialProfile: UserProfile | null;
  onNearestAirportsFound?: (airports: Airport[]) => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all";
const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const cardClass = "bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-8";

export function PersonalInfoCard({
  initialProfile,
  onNearestAirportsFound,
}: PersonalInfoCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    dateOfBirth: initialProfile?.dateOfBirth
      ? new Date(initialProfile.dateOfBirth).toISOString().split("T")[0]
      : "",
    address: initialProfile?.address || "",
    city: initialProfile?.city || "",
    country: initialProfile?.country || "",
    gender: (initialProfile?.gender as Gender) || "",
    citizenship: (initialProfile?.citizenship as string[]) || [],
    countryOfResidence: initialProfile?.countryOfResidence || "",
  });

  // Auto-save handlers
  const saveFirstName = useCallback(
    async (value: string) => {
      await updateUserProfile({ firstName: value });
    },
    []
  );

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
    enabled:
      formData.dateOfBirth !==
      (initialProfile?.dateOfBirth
        ? new Date(initialProfile.dateOfBirth).toISOString().split("T")[0]
        : ""),
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

  // Handle gender change
  const handleGenderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Gender;
    setFormData({ ...formData, gender: value });
    try {
      await updateUserProfile({ gender: value });
      toast({ title: "Gender updated" });
    } catch (error) {
      console.error("Error updating gender:", error);
      toast({ title: "Error", description: "Failed to update gender", variant: "destructive" });
    }
  };

  // Handle adding citizenship
  const handleAddCitizenship = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (!code || formData.citizenship.includes(code)) return;
    const newCitizenship = [...formData.citizenship, code];
    setFormData({ ...formData, citizenship: newCitizenship });
    try {
      await updateUserProfile({ citizenship: newCitizenship });
      toast({ title: "Citizenship added" });
    } catch (error) {
      console.error("Error adding citizenship:", error);
      toast({ title: "Error", description: "Failed to add citizenship", variant: "destructive" });
    }
    // Reset select
    e.target.value = "";
  };

  // Handle removing citizenship
  const handleRemoveCitizenship = async (code: string) => {
    const newCitizenship = formData.citizenship.filter((c) => c !== code);
    setFormData({ ...formData, citizenship: newCitizenship });
    try {
      await updateUserProfile({ citizenship: newCitizenship });
      toast({ title: "Citizenship removed" });
    } catch (error) {
      console.error("Error removing citizenship:", error);
      toast({
        title: "Error",
        description: "Failed to remove citizenship",
        variant: "destructive",
      });
    }
  };

  // Handle place selection from autocomplete
  const handlePlaceSelect = async (placeDetails: any) => {
    setLoading(true);
    try {
      const addressComponents = placeDetails.addressComponents || [];

      let streetAddress = "";
      let city = "";
      let state = "";
      let country = "";
      let countryCode = "";

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
          countryCode = (component.short_name || "").toUpperCase();
        }
      }

      if (!city && state) {
        city = state;
      } else if (!city && placeDetails.formattedAddress) {
        const parts = placeDetails.formattedAddress.split(",");
        if (parts.length > 1) {
          city = parts[parts.length - 2].trim();
        }
      }

      const finalAddress = streetAddress.trim() || placeDetails.formattedAddress || "";
      const countryName = country || (countryCode ? getCountryName(countryCode) : "");

      const updateData: {
        address: string;
        city?: string;
        country?: string;
        countryOfResidence?: string;
      } = {
        address: finalAddress,
        city: city || "",
      };

      if (countryName) {
        updateData.country = countryName;
      }
      if (countryCode) {
        updateData.countryOfResidence = countryCode;
      }

      await updateUserProfile(updateData);

      setFormData({
        ...formData,
        address: finalAddress,
        city: city || "",
        country: countryName || formData.country,
        countryOfResidence: countryCode || formData.countryOfResidence,
      });

      cityAutoSave.markAsSaved();
      countryAutoSave.markAsSaved();

      toast({
        title: "Address updated",
        description: "Your address and location details have been saved",
      });

      // Find and auto-add nearest airports
      if (placeDetails.location && onNearestAirportsFound) {
        try {
          const airportResponse = await fetch(
            `/api/airports/nearest?lat=${placeDetails.location.lat}&lng=${placeDetails.location.lng}&limit=2`
          );

          if (airportResponse.ok) {
            const airportData = await airportResponse.json();

            if (airportData.airports && airportData.airports.length > 0) {
              const airportsToAdd = airportData.airports.map((a: any) => ({
                iataCode: a.iataCode,
                name: a.name,
                city: a.city,
                country: a.country,
              }));

              const result = await addMultipleHomeAirports(airportsToAdd);

              if (result.added > 0) {
                onNearestAirportsFound(airportData.airports);

                const airportNames = result.airports
                  .map(
                    (a: any) =>
                      `${a.iataCode} (${airportData.airports.find((ap: any) => ap.iataCode === a.iataCode)?.distance}km)`
                  )
                  .join(", ");

                toast({
                  title: "Home airports added",
                  description: `${airportNames} have been automatically added to your home airports`,
                  duration: 6000,
                });
              }
            }
          }
        } catch (airportError) {
          console.error("Error finding nearest airports:", airportError);
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

  return (
    <div className="space-y-6">
      {/* Basic Details Card */}
      <div className={cardClass}>
        <h3 className="text-lg font-serif font-medium mb-6 flex items-center gap-2">
          <User size={18} className="text-gray-400" />
          Basic Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              onBlur={firstNameAutoSave.saveImmediately}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              onBlur={lastNameAutoSave.saveImmediately}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Date of Birth</label>
            <div className="relative">
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                onBlur={dateOfBirthAutoSave.saveImmediately}
                className={inputClass}
              />
              <Calendar size={16} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Gender</label>
            <div className="relative">
              <select
                value={formData.gender}
                onChange={handleGenderChange}
                className={`${inputClass} appearance-none`}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className={labelClass}>Citizenship</label>
          <div className="flex flex-wrap gap-2">
            {formData.citizenship.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium"
              >
                {getCountryName(code)}
                <button
                  onClick={() => handleRemoveCitizenship(code)}
                  className="hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
            <div className="relative inline-block">
              <select
                onChange={handleAddCitizenship}
                defaultValue=""
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="" disabled>
                  + Add
                </option>
                {COUNTRIES.filter((c) => !formData.citizenship.includes(c.code)).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
              <Plus size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Address Card */}
      <div className={cardClass}>
        <h3 className="text-lg font-serif font-medium mb-6 flex items-center gap-2">
          <MapPin size={18} className="text-gray-400" />
          Address
        </h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className={labelClass}>Street Address</label>
            <PlacesAutocompleteInput
              onSelect={handlePlaceSelect}
              placeholder="Search for an address, city, or country..."
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                onBlur={cityAutoSave.saveImmediately}
                placeholder="Enter city"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                onBlur={countryAutoSave.saveImmediately}
                placeholder="Enter country"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
