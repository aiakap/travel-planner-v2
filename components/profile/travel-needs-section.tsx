"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Accessibility, Languages, Loader2, Star, Circle } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentSlug: string; // The category slug to use when adding/removing
}

interface TravelNeedsSectionProps {
  userId: string;
}

// Server action imports need to be called directly
import {
  getCategoryBySlug,
  getUserProfileValues,
  addProfileValue,
  removeProfileValue,
} from "@/lib/actions/profile-relational-actions";

export function TravelNeedsSection({ userId }: TravelNeedsSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // State for each category's options
  const [dietaryOptions, setDietaryOptions] = useState<CategoryOption[]>([]);
  const [accessibilityOptions, setAccessibilityOptions] = useState<CategoryOption[]>([]);
  const [languageOptions, setLanguageOptions] = useState<CategoryOption[]>([]);

  // State for user's selected values
  const [selectedDietary, setSelectedDietary] = useState<Set<string>>(new Set());
  const [selectedAccessibility, setSelectedAccessibility] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());

  // Map slug to userValueId for removal
  const [userValueIds, setUserValueIds] = useState<Map<string, string>>(new Map());

  // Language proficiency levels
  const [languageProficiency, setLanguageProficiency] = useState<Map<string, string>>(new Map());

  // Special option slugs for mutual exclusivity
  const NO_DIETARY_RESTRICTIONS = "no-dietary-restrictions";
  const NO_ACCESSIBILITY_NEEDS = "no-accessibility-needs";

  // Load categories and user selections
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load category options in parallel
        const [dietary, accessibility, languages, userValues] = await Promise.all([
          getCategoryBySlug("dietary"),
          getCategoryBySlug("accessibility-mobility"),
          getCategoryBySlug("languages"),
          getUserProfileValues(userId),
        ]);

        // Extract options from categories (children of level 1 subcategories)
        if (dietary?.children) {
          // Dietary items are direct children (level 2) - use parent "dietary" as the category
          setDietaryOptions(
            dietary.children.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              parentSlug: "dietary",
            }))
          );
        }

        if (accessibility?.children) {
          // Flatten all level 2 children from all level 1 subcategories
          const options: CategoryOption[] = [];
          for (const subcat of accessibility.children) {
            if (subcat.children && subcat.children.length > 0) {
              for (const opt of subcat.children) {
                options.push({
                  id: opt.id,
                  name: opt.name,
                  slug: opt.slug,
                  parentSlug: subcat.slug, // Use the subcategory slug (mobility-needs, sensory-needs, etc.)
                });
              }
            }
          }
          // If no grandchildren, use children directly
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

        if (languages?.children) {
          // Flatten language options (they're nested under primary-languages)
          const options: CategoryOption[] = [];
          for (const subcat of languages.children) {
            if (subcat.children && subcat.children.length > 0) {
              for (const opt of subcat.children) {
                options.push({
                  id: opt.id,
                  name: opt.name,
                  slug: opt.slug,
                  parentSlug: subcat.slug, // Use the subcategory slug (primary-languages)
                });
              }
            }
          }
          // If no grandchildren, use children directly
          if (options.length === 0) {
            for (const child of languages.children) {
              options.push({
                id: child.id,
                name: child.name,
                slug: child.slug,
                parentSlug: "languages",
              });
            }
          }
          setLanguageOptions(options);
        }

        // Build lookup maps for options by name
        const dietaryByName = new Map<string, string>(); // name -> slug
        dietary?.children?.forEach((c: any) => dietaryByName.set(c.name, c.slug));

        const accessibilityByName = new Map<string, string>();
        accessibility?.children?.forEach((subcat: any) => {
          subcat.children?.forEach((opt: any) => accessibilityByName.set(opt.name, opt.slug));
        });

        const languagesByName = new Map<string, string>();
        languages?.children?.forEach((subcat: any) => {
          subcat.children?.forEach((opt: any) => languagesByName.set(opt.name, opt.slug));
        });

        // Process user's current selections
        const dietarySelected = new Set<string>();
        const accessSelected = new Set<string>();
        const langSelected = new Set<string>();
        const valueIdMap = new Map<string, string>();
        const proficiencyMap = new Map<string, string>();

        for (const uv of userValues) {
          const valueName = uv.value?.value;
          const categorySlug = uv.value?.category?.slug;
          const parentSlug = uv.value?.category?.parent?.slug;
          const grandparentSlug = uv.value?.category?.parent?.parent?.slug;

          if (!valueName) continue;

          // Check if this is a dietary value
          if (categorySlug === "dietary" || parentSlug === "dietary") {
            const slug = dietaryByName.get(valueName);
            if (slug) {
              dietarySelected.add(slug);
              valueIdMap.set(slug, uv.id);
            }
          }

          // Check if this is an accessibility value (parent is mobility-needs, sensory-needs, etc.)
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

          // Check if this is a language value
          if (
            grandparentSlug === "languages" ||
            parentSlug === "languages" ||
            categorySlug === "primary-languages"
          ) {
            const slug = languagesByName.get(valueName);
            if (slug) {
              langSelected.add(slug);
              valueIdMap.set(slug, uv.id);
              // Load proficiency from metadata
              const metadata = uv.metadata as any;
              if (metadata?.proficiency) {
                proficiencyMap.set(slug, metadata.proficiency);
              } else {
                proficiencyMap.set(slug, "conversational"); // Default
              }
            }
          }
        }

        setSelectedDietary(dietarySelected);
        setSelectedAccessibility(accessSelected);
        setSelectedLanguages(langSelected);
        setUserValueIds(valueIdMap);
        setLanguageProficiency(proficiencyMap);
      } catch (error) {
        console.error("Error loading travel needs:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, toast]);

  // Handle toggling a dietary preference with mutual exclusivity
  const handleDietaryToggle = useCallback(
    async (option: CategoryOption) => {
      setSaving(option.slug);
      try {
        const isSelected = selectedDietary.has(option.slug);

        if (isSelected) {
          // Remove this option
          const userValueId = userValueIds.get(option.slug);
          if (userValueId) {
            const result = await removeProfileValue(userId, userValueId);
            if (result.success) {
              setSelectedDietary(prev => {
                const newSet = new Set(prev);
                newSet.delete(option.slug);
                return newSet;
              });
              setUserValueIds(prev => {
                const newMap = new Map(prev);
                newMap.delete(option.slug);
                return newMap;
              });
            } else {
              console.error("Failed to remove dietary option:", result.error);
            }
          } else {
            // No userValueId found - just update local state
            setSelectedDietary(prev => {
              const newSet = new Set(prev);
              newSet.delete(option.slug);
              return newSet;
            });
          }
        } else {
          // Adding a new option
          if (option.slug === NO_DIETARY_RESTRICTIONS) {
            // Selecting "No Restrictions" - remove ALL other dietary options first
            const currentSelected = Array.from(selectedDietary);
            for (const slug of currentSelected) {
              const userValueId = userValueIds.get(slug);
              if (userValueId) {
                await removeProfileValue(userId, userValueId);
              }
            }
            // Clear all dietary selections
            setSelectedDietary(new Set());
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              for (const slug of currentSelected) {
                newMap.delete(slug);
              }
              return newMap;
            });
          } else if (selectedDietary.has(NO_DIETARY_RESTRICTIONS)) {
            // Selecting a restriction - remove "No Restrictions" first
            const noRestrictionsId = userValueIds.get(NO_DIETARY_RESTRICTIONS);
            if (noRestrictionsId) {
              await removeProfileValue(userId, noRestrictionsId);
            }
            setSelectedDietary(prev => {
              const newSet = new Set(prev);
              newSet.delete(NO_DIETARY_RESTRICTIONS);
              return newSet;
            });
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              newMap.delete(NO_DIETARY_RESTRICTIONS);
              return newMap;
            });
          }

          // Add the new option
          const result = await addProfileValue(userId, option.name, option.parentSlug);
          if (result.success && result.data) {
            setSelectedDietary(prev => {
              const newSet = new Set(prev);
              newSet.add(option.slug);
              return newSet;
            });
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              newMap.set(option.slug, result.data.id);
              return newMap;
            });
          } else {
            console.error("Failed to add dietary option:", result.error);
            toast({
              title: "Error",
              description: "Failed to save preference",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error toggling dietary preference:", error);
        toast({
          title: "Error",
          description: "Failed to update dietary preference",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    },
    [userId, userValueIds, selectedDietary, toast]
  );

  // Handle toggling an accessibility preference with mutual exclusivity
  const handleAccessibilityToggle = useCallback(
    async (option: CategoryOption) => {
      setSaving(option.slug);
      try {
        const isSelected = selectedAccessibility.has(option.slug);

        if (isSelected) {
          // Remove this option
          const userValueId = userValueIds.get(option.slug);
          if (userValueId) {
            const result = await removeProfileValue(userId, userValueId);
            if (result.success) {
              setSelectedAccessibility(prev => {
                const newSet = new Set(prev);
                newSet.delete(option.slug);
                return newSet;
              });
              setUserValueIds(prev => {
                const newMap = new Map(prev);
                newMap.delete(option.slug);
                return newMap;
              });
            } else {
              console.error("Failed to remove accessibility option:", result.error);
            }
          } else {
            // No userValueId found - just update local state
            setSelectedAccessibility(prev => {
              const newSet = new Set(prev);
              newSet.delete(option.slug);
              return newSet;
            });
          }
        } else {
          // Adding a new option
          if (option.slug === NO_ACCESSIBILITY_NEEDS) {
            // Selecting "No Special Needs" - remove ALL other accessibility options first
            const currentSelected = Array.from(selectedAccessibility);
            for (const slug of currentSelected) {
              const userValueId = userValueIds.get(slug);
              if (userValueId) {
                await removeProfileValue(userId, userValueId);
              }
            }
            // Clear all accessibility selections
            setSelectedAccessibility(new Set());
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              for (const slug of currentSelected) {
                newMap.delete(slug);
              }
              return newMap;
            });
          } else if (selectedAccessibility.has(NO_ACCESSIBILITY_NEEDS)) {
            // Selecting a need - remove "No Special Needs" first
            const noNeedsId = userValueIds.get(NO_ACCESSIBILITY_NEEDS);
            if (noNeedsId) {
              await removeProfileValue(userId, noNeedsId);
            }
            setSelectedAccessibility(prev => {
              const newSet = new Set(prev);
              newSet.delete(NO_ACCESSIBILITY_NEEDS);
              return newSet;
            });
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              newMap.delete(NO_ACCESSIBILITY_NEEDS);
              return newMap;
            });
          }

          // Add the new option
          const result = await addProfileValue(userId, option.name, option.parentSlug);
          if (result.success && result.data) {
            setSelectedAccessibility(prev => {
              const newSet = new Set(prev);
              newSet.add(option.slug);
              return newSet;
            });
            setUserValueIds(prev => {
              const newMap = new Map(prev);
              newMap.set(option.slug, result.data.id);
              return newMap;
            });
          } else {
            console.error("Failed to add accessibility option:", result.error);
            toast({
              title: "Error",
              description: "Failed to save preference",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error toggling accessibility preference:", error);
        toast({
          title: "Error",
          description: "Failed to update accessibility preference",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    },
    [userId, userValueIds, selectedAccessibility, toast]
  );

  // Handle toggling a language with proficiency
  const handleLanguageToggle = useCallback(
    async (option: CategoryOption) => {
      setSaving(option.slug);
      try {
        const isSelected = selectedLanguages.has(option.slug);

        if (isSelected) {
          // Remove
          const userValueId = userValueIds.get(option.slug);
          if (userValueId) {
            const result = await removeProfileValue(userId, userValueId);
            if (result.success) {
              const newSelected = new Set(selectedLanguages);
              newSelected.delete(option.slug);
              setSelectedLanguages(newSelected);

              const newMap = new Map(userValueIds);
              newMap.delete(option.slug);
              setUserValueIds(newMap);

              const newProficiency = new Map(languageProficiency);
              newProficiency.delete(option.slug);
              setLanguageProficiency(newProficiency);
            }
          }
        } else {
          // Add with default proficiency
          const defaultProficiency = "conversational";
          const result = await addProfileValue(userId, option.name, option.parentSlug, {
            proficiency: defaultProficiency,
          });
          if (result.success && result.data) {
            const newSelected = new Set(selectedLanguages);
            newSelected.add(option.slug);
            setSelectedLanguages(newSelected);

            const newMap = new Map(userValueIds);
            newMap.set(option.slug, result.data.id);
            setUserValueIds(newMap);

            const newProficiency = new Map(languageProficiency);
            newProficiency.set(option.slug, defaultProficiency);
            setLanguageProficiency(newProficiency);
          }
        }
      } catch (error) {
        console.error("Error toggling language:", error);
        toast({
          title: "Error",
          description: "Failed to update language preference",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    },
    [userId, userValueIds, selectedLanguages, languageProficiency, toast]
  );

  // Handle changing language proficiency level
  const handleProficiencyChange = useCallback(
    async (slug: string, proficiency: string) => {
      const userValueId = userValueIds.get(slug);
      if (!userValueId) return;

      try {
        const { updateProfileValueMetadata } = await import("@/lib/actions/profile-relational-actions");
        await updateProfileValueMetadata(userId, userValueId, { proficiency });
        
        const newProficiency = new Map(languageProficiency);
        newProficiency.set(slug, proficiency);
        setLanguageProficiency(newProficiency);
      } catch (error) {
        console.error("Error updating proficiency:", error);
        toast({
          title: "Error",
          description: "Failed to update proficiency level",
          variant: "destructive",
        });
      }
    },
    [userId, userValueIds, languageProficiency, toast]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Travel Needs & Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">
          Help us personalize your travel recommendations
        </p>
      </div>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Dietary Restrictions</CardTitle>
          </div>
          <CardDescription>
            Select any dietary requirements for restaurant and meal recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedDietary.has(NO_DIETARY_RESTRICTIONS) ? (
              // Show only "No Restrictions" when selected
              (() => {
                const option = dietaryOptions.find(o => o.slug === NO_DIETARY_RESTRICTIONS);
                if (!option) return null;
                return (
                  <label
                    key={option.slug}
                    className="col-span-2 md:col-span-4 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors bg-green-50 border-green-200"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleDietaryToggle(option)}
                      disabled={saving === option.slug}
                    />
                    <span className="text-sm font-medium">{option.name}</span>
                    {saving === option.slug && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </label>
                );
              })()
            ) : (
              // Show all options when "No Restrictions" is not selected
              dietaryOptions.map((option) => {
                const isNoRestrictions = option.slug === NO_DIETARY_RESTRICTIONS;
                return (
                  <label
                    key={option.slug}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDietary.has(option.slug)
                        ? isNoRestrictions
                          ? "bg-green-50 border-green-200"
                          : "bg-orange-50 border-orange-200"
                        : "hover:bg-gray-50"
                    } ${isNoRestrictions ? "col-span-2 md:col-span-4" : ""}`}
                  >
                    <Checkbox
                      checked={selectedDietary.has(option.slug)}
                      onCheckedChange={() => handleDietaryToggle(option)}
                      disabled={saving === option.slug}
                    />
                    <span className={`text-sm ${isNoRestrictions ? "font-medium" : ""}`}>
                      {option.name}
                    </span>
                    {saving === option.slug && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility & Mobility */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-cyan-500" />
            <CardTitle className="text-lg">Accessibility & Mobility</CardTitle>
          </div>
          <CardDescription>
            Let us know your accessibility needs for accommodations and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedAccessibility.has(NO_ACCESSIBILITY_NEEDS) ? (
              // Show only "No Special Needs" when selected
              (() => {
                const option = accessibilityOptions.find(o => o.slug === NO_ACCESSIBILITY_NEEDS);
                if (!option) return null;
                return (
                  <label
                    key={option.slug}
                    className="col-span-2 md:col-span-3 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors bg-green-50 border-green-200"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleAccessibilityToggle(option)}
                      disabled={saving === option.slug}
                    />
                    <span className="text-sm font-medium">{option.name}</span>
                    {saving === option.slug && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </label>
                );
              })()
            ) : (
              // Show all options when "No Special Needs" is not selected
              accessibilityOptions.map((option) => {
                const isNoNeeds = option.slug === NO_ACCESSIBILITY_NEEDS;
                return (
                  <label
                    key={option.slug}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAccessibility.has(option.slug)
                        ? isNoNeeds
                          ? "bg-green-50 border-green-200"
                          : "bg-cyan-50 border-cyan-200"
                        : "hover:bg-gray-50"
                    } ${isNoNeeds ? "col-span-2 md:col-span-3" : ""}`}
                  >
                    <Checkbox
                      checked={selectedAccessibility.has(option.slug)}
                      onCheckedChange={() => handleAccessibilityToggle(option)}
                      disabled={saving === option.slug}
                    />
                    <span className={`text-sm ${isNoNeeds ? "font-medium" : ""}`}>
                      {option.name}
                    </span>
                    {saving === option.slug && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Languages Spoken */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-lg">Languages Spoken</CardTitle>
          </div>
          <CardDescription>
            Select languages you speak and your proficiency level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedLanguages.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from(selectedLanguages).map((slug) => {
                const option = languageOptions.find((o) => o.slug === slug);
                const proficiency = languageProficiency.get(slug) || "conversational";
                const proficiencyLabel = {
                  native: "Native",
                  fluent: "Fluent",
                  conversational: "Conversational",
                  basic: "Basic",
                }[proficiency] || proficiency;
                return option ? (
                  <Badge 
                    key={slug} 
                    variant="secondary" 
                    className={`${
                      proficiency === "native" || proficiency === "fluent"
                        ? "bg-violet-200 text-violet-800"
                        : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {proficiency === "native" && <Star className="w-3 h-3 mr-1 fill-current" />}
                    {option.name} ({proficiencyLabel})
                  </Badge>
                ) : null;
              })}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {languageOptions.map((option) => {
              const isSelected = selectedLanguages.has(option.slug);
              const proficiency = languageProficiency.get(option.slug) || "conversational";
              return (
                <div
                  key={option.slug}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-violet-50 border-violet-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleLanguageToggle(option)}
                    disabled={saving === option.slug}
                  />
                  <span className="text-sm flex-1">{option.name}</span>
                  {saving === option.slug && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {isSelected && (
                    <Select
                      value={proficiency}
                      onValueChange={(level) => handleProficiencyChange(option.slug, level)}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="native">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            Native
                          </div>
                        </SelectItem>
                        <SelectItem value="fluent">Fluent</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
