"use client";

import { useState, useEffect, useCallback } from "react";
import { Plane, Utensils, Accessibility, Trash2, Check, Loader2 } from "lucide-react";
import { AirportAutocompleteInput } from "@/components/ui/airport-autocomplete-input";
import {
  addHomeAirport,
  removeHomeAirport,
} from "@/lib/actions/profile-actions";
import {
  getCategoryBySlug,
  getUserProfileValues,
  addProfileValue,
  removeProfileValue,
} from "@/lib/actions/profile-relational-actions";
import { useToast } from "@/hooks/use-toast";
import { Airport } from "@/lib/types/profile";

interface TravelPreferencesProps {
  userId: string;
  initialHomeAirports: Airport[];
  newlyAddedAirports?: string[];
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentSlug: string;
}

const cardClass = "bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-8";
const inputClass =
  "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none transition-all";

// Special option slugs for mutual exclusivity
const NO_DIETARY_RESTRICTIONS = "no-dietary-restrictions";
const NO_ACCESSIBILITY_NEEDS = "no-accessibility-needs";

export function TravelPreferences({
  userId,
  initialHomeAirports,
  newlyAddedAirports = [],
}: TravelPreferencesProps) {
  const [homeAirports, setHomeAirports] = useState<Airport[]>(initialHomeAirports);
  const { toast } = useToast();

  // Dietary & Accessibility state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dietaryOptions, setDietaryOptions] = useState<CategoryOption[]>([]);
  const [accessibilityOptions, setAccessibilityOptions] = useState<CategoryOption[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<Set<string>>(new Set());
  const [selectedAccessibility, setSelectedAccessibility] = useState<Set<string>>(new Set());
  const [userValueIds, setUserValueIds] = useState<Map<string, string>>(new Map());

  // Load dietary and accessibility options
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dietary, accessibility, userValues] = await Promise.all([
          getCategoryBySlug("dietary"),
          getCategoryBySlug("accessibility-mobility"),
          getUserProfileValues(userId),
        ]);

        // Extract dietary options
        if (dietary?.children) {
          setDietaryOptions(
            dietary.children.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parentSlug: "dietary",
            }))
          );
        }

        // Extract accessibility options
        if (accessibility?.children) {
          const options: CategoryOption[] = [];
          for (const subcat of accessibility.children) {
            if (subcat.children && subcat.children.length > 0) {
              for (const opt of subcat.children) {
                options.push({
                  id: opt.id,
                  name: opt.name,
                  slug: opt.slug,
                  parentSlug: subcat.slug,
                });
              }
            }
          }
          if (options.length === 0) {
            for (const child of accessibility.children) {
              options.push({
                id: child.id,
                name: child.name,
                slug: child.slug,
                parentSlug: "accessibility-mobility",
              });
            }
          }
          setAccessibilityOptions(options);
        }

        // Build lookup maps
        const dietaryByName = new Map<string, string>();
        dietary?.children?.forEach((c: any) => dietaryByName.set(c.name, c.slug));

        const accessibilityByName = new Map<string, string>();
        accessibility?.children?.forEach((subcat: any) => {
          subcat.children?.forEach((opt: any) => accessibilityByName.set(opt.name, opt.slug));
        });

        // Process user's current selections
        const dietarySelected = new Set<string>();
        const accessSelected = new Set<string>();
        const valueIdMap = new Map<string, string>();

        for (const uv of userValues) {
          const valueName = uv.value?.value;
          const categorySlug = uv.value?.category?.slug;
          const parentSlug = uv.value?.category?.parent?.slug;
          const grandparentSlug = uv.value?.category?.parent?.parent?.slug;

          if (!valueName) continue;

          if (categorySlug === "dietary" || parentSlug === "dietary") {
            const slug = dietaryByName.get(valueName);
            if (slug) {
              dietarySelected.add(slug);
              valueIdMap.set(slug, uv.id);
            }
          }

          if (
            grandparentSlug === "accessibility-mobility" ||
            grandparentSlug === "accessibility" ||
            parentSlug === "accessibility-mobility" ||
            parentSlug === "accessibility" ||
            parentSlug === "accessibility-general"
          ) {
            const slug = accessibilityByName.get(valueName);
            if (slug) {
              accessSelected.add(slug);
              valueIdMap.set(slug, uv.id);
            }
          }
        }

        setSelectedDietary(dietarySelected);
        setSelectedAccessibility(accessSelected);
        setUserValueIds(valueIdMap);
      } catch (error) {
        console.error("Error loading travel needs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const handleAddAirport = async (airport: Airport) => {
    try {
      const alreadyHome = homeAirports.some((a) => a.iataCode === airport.iataCode);
      if (alreadyHome) {
        toast({
          title: "Already added",
          description: `${airport.iataCode} is already in your home airports`,
          variant: "destructive",
        });
        return;
      }

      await addHomeAirport(airport);
      setHomeAirports([...homeAirports, airport]);
      toast({
        title: "Airport added",
        description: `${airport.name} added to home airports`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add airport",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAirport = async (iataCode: string) => {
    try {
      await removeHomeAirport(iataCode);
      setHomeAirports(homeAirports.filter((a) => a.iataCode !== iataCode));
      toast({
        title: "Airport removed",
        description: "Airport removed from home airports",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove airport",
        variant: "destructive",
      });
    }
  };

  // Dietary toggle with mutual exclusivity
  const handleDietaryToggle = useCallback(
    async (option: CategoryOption) => {
      setSaving(option.slug);
      try {
        const isSelected = selectedDietary.has(option.slug);

        if (isSelected) {
          const userValueId = userValueIds.get(option.slug);
          if (userValueId) {
            await removeProfileValue(userId, userValueId);
          }
          setSelectedDietary((prev) => {
            const newSet = new Set(prev);
            newSet.delete(option.slug);
            return newSet;
          });
          setUserValueIds((prev) => {
            const newMap = new Map(prev);
            newMap.delete(option.slug);
            return newMap;
          });
        } else {
          // Handle mutual exclusivity
          if (option.slug === NO_DIETARY_RESTRICTIONS) {
            const currentSelected = Array.from(selectedDietary);
            for (const slug of currentSelected) {
              const userValueId = userValueIds.get(slug);
              if (userValueId) {
                await removeProfileValue(userId, userValueId);
              }
            }
            setSelectedDietary(new Set());
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              for (const slug of currentSelected) {
                newMap.delete(slug);
              }
              return newMap;
            });
          } else if (selectedDietary.has(NO_DIETARY_RESTRICTIONS)) {
            const noRestrictionsId = userValueIds.get(NO_DIETARY_RESTRICTIONS);
            if (noRestrictionsId) {
              await removeProfileValue(userId, noRestrictionsId);
            }
            setSelectedDietary((prev) => {
              const newSet = new Set(prev);
              newSet.delete(NO_DIETARY_RESTRICTIONS);
              return newSet;
            });
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              newMap.delete(NO_DIETARY_RESTRICTIONS);
              return newMap;
            });
          }

          const result = await addProfileValue(userId, option.name, option.parentSlug);
          if (result.success && result.data) {
            setSelectedDietary((prev) => {
              const newSet = new Set(prev);
              newSet.add(option.slug);
              return newSet;
            });
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              newMap.set(option.slug, result.data.id);
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error("Error toggling dietary preference:", error);
        toast({
          title: "Error",
          description: "Failed to update preference",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    },
    [userId, userValueIds, selectedDietary, toast]
  );

  // Accessibility toggle with mutual exclusivity
  const handleAccessibilityToggle = useCallback(
    async (option: CategoryOption) => {
      setSaving(option.slug);
      try {
        const isSelected = selectedAccessibility.has(option.slug);

        if (isSelected) {
          const userValueId = userValueIds.get(option.slug);
          if (userValueId) {
            await removeProfileValue(userId, userValueId);
          }
          setSelectedAccessibility((prev) => {
            const newSet = new Set(prev);
            newSet.delete(option.slug);
            return newSet;
          });
          setUserValueIds((prev) => {
            const newMap = new Map(prev);
            newMap.delete(option.slug);
            return newMap;
          });
        } else {
          if (option.slug === NO_ACCESSIBILITY_NEEDS) {
            const currentSelected = Array.from(selectedAccessibility);
            for (const slug of currentSelected) {
              const userValueId = userValueIds.get(slug);
              if (userValueId) {
                await removeProfileValue(userId, userValueId);
              }
            }
            setSelectedAccessibility(new Set());
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              for (const slug of currentSelected) {
                newMap.delete(slug);
              }
              return newMap;
            });
          } else if (selectedAccessibility.has(NO_ACCESSIBILITY_NEEDS)) {
            const noNeedsId = userValueIds.get(NO_ACCESSIBILITY_NEEDS);
            if (noNeedsId) {
              await removeProfileValue(userId, noNeedsId);
            }
            setSelectedAccessibility((prev) => {
              const newSet = new Set(prev);
              newSet.delete(NO_ACCESSIBILITY_NEEDS);
              return newSet;
            });
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              newMap.delete(NO_ACCESSIBILITY_NEEDS);
              return newMap;
            });
          }

          const result = await addProfileValue(userId, option.name, option.parentSlug);
          if (result.success && result.data) {
            setSelectedAccessibility((prev) => {
              const newSet = new Set(prev);
              newSet.add(option.slug);
              return newSet;
            });
            setUserValueIds((prev) => {
              const newMap = new Map(prev);
              newMap.set(option.slug, result.data.id);
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error("Error toggling accessibility preference:", error);
        toast({
          title: "Error",
          description: "Failed to update preference",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    },
    [userId, userValueIds, selectedAccessibility, toast]
  );

  // Determine dietary status display
  const hasDietaryNoRestrictions = selectedDietary.has(NO_DIETARY_RESTRICTIONS);
  const hasAccessibilityNoNeeds = selectedAccessibility.has(NO_ACCESSIBILITY_NEEDS);

  return (
    <div className="grid grid-cols-1 gap-8 max-w-4xl">
      {/* Home Airports */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-serif font-medium flex items-center gap-2">
            <Plane size={18} className="text-gray-400" />
            Home Airports
          </h3>
        </div>

        <div className="mb-6">
          <AirportAutocompleteInput
            onSelect={handleAddAirport}
            placeholder="Search for home airports..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homeAirports.map((airport) => {
            const isNewlyAdded = newlyAddedAirports.includes(airport.iataCode);
            return (
              <div
                key={airport.iataCode}
                className={`flex items-center gap-3 p-4 rounded-xl border bg-white hover:border-gray-300 transition-colors ${
                  isNewlyAdded ? "border-green-400 ring-2 ring-green-100" : "border-gray-200"
                }`}
              >
                <div className="h-10 w-14 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-800 text-sm tracking-wide">
                  {airport.iataCode}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {airport.city}, {airport.country}
                  </p>
                  <p className="text-xs text-gray-500">Primary Hub</p>
                </div>
                <button
                  onClick={() => handleRemoveAirport(airport.iataCode)}
                  className="text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {homeAirports.length === 0 && (
            <p className="text-gray-500 text-sm col-span-2 text-center py-4">
              No home airports added. Search above to add your airports.
            </p>
          )}
        </div>
      </div>

      {/* Dietary & Accessibility Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dietary Restrictions */}
        <div className={cardClass}>
          <h3 className="text-lg font-serif font-medium flex items-center gap-2 mb-4">
            <Utensils size={18} className="text-orange-400" />
            Dietary Restrictions
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Select any dietary requirements for restaurant recommendations.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : hasDietaryNoRestrictions ? (
            <div
              onClick={() => {
                const option = dietaryOptions.find((o) => o.slug === NO_DIETARY_RESTRICTIONS);
                if (option) handleDietaryToggle(option);
              }}
              className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3 cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div className="bg-green-100 p-1 rounded-full text-green-700 mt-0.5">
                <Check size={12} />
              </div>
              <div>
                <p className="font-medium text-green-900 text-sm">No Restrictions</p>
                <p className="text-green-700 text-xs">I eat everything</p>
              </div>
              {saving === NO_DIETARY_RESTRICTIONS && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto text-green-600" />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {dietaryOptions.map((option) => {
                const isSelected = selectedDietary.has(option.slug);
                const isNoRestrictions = option.slug === NO_DIETARY_RESTRICTIONS;
                return (
                  <div
                    key={option.slug}
                    onClick={() => handleDietaryToggle(option)}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? isNoRestrictions
                          ? "bg-green-50 border-green-100"
                          : "bg-orange-50 border-orange-100"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? isNoRestrictions
                            ? "bg-green-600 border-green-600"
                            : "bg-orange-500 border-orange-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{option.name}</span>
                    {saving === option.slug && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Accessibility & Mobility */}
        <div className={cardClass}>
          <h3 className="text-lg font-serif font-medium flex items-center gap-2 mb-4">
            <Accessibility size={18} className="text-blue-400" />
            Accessibility & Mobility
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Let us know your accessibility needs for accommodations.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : hasAccessibilityNoNeeds ? (
            <div
              onClick={() => {
                const option = accessibilityOptions.find((o) => o.slug === NO_ACCESSIBILITY_NEEDS);
                if (option) handleAccessibilityToggle(option);
              }}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="bg-gray-200 p-1 rounded-full text-gray-600 mt-0.5">
                <Check size={12} />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">No Special Needs</p>
                <p className="text-gray-500 text-xs">Standard accommodations</p>
              </div>
              {saving === NO_ACCESSIBILITY_NEEDS && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto text-gray-400" />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {accessibilityOptions.map((option) => {
                const isSelected = selectedAccessibility.has(option.slug);
                const isNoNeeds = option.slug === NO_ACCESSIBILITY_NEEDS;
                return (
                  <div
                    key={option.slug}
                    onClick={() => handleAccessibilityToggle(option)}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? isNoNeeds
                          ? "bg-gray-50 border-gray-200"
                          : "bg-blue-50 border-blue-100"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? isNoNeeds
                            ? "bg-gray-600 border-gray-600"
                            : "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{option.name}</span>
                    {saving === option.slug && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
