"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { setTravelPreference } from "@/lib/actions/profile-actions";

interface TravelPreferencesSectionProps {
  initialPreferences: any[];
  preferenceTypes: any[];
}

export function TravelPreferencesSection({
  initialPreferences,
  preferenceTypes,
}: TravelPreferencesSectionProps) {
  const [preferences, setPreferences] = useState(initialPreferences);

  const getSelectedOption = (preferenceTypeId: string) => {
    const pref = preferences.find(p => p.preferenceTypeId === preferenceTypeId);
    return pref?.optionId || "";
  };

  const getSelectedOptionIndex = (preferenceTypeId: string, options: any[]) => {
    const selectedId = getSelectedOption(preferenceTypeId);
    return options.findIndex(opt => opt.id === selectedId);
  };

  const handlePreferenceChange = async (preferenceTypeId: string, optionId: string) => {
    try {
      await setTravelPreference(preferenceTypeId, optionId);
      setPreferences(preferences.map(p => 
        p.preferenceTypeId === preferenceTypeId
          ? { ...p, optionId }
          : p
      ).concat(preferences.find(p => p.preferenceTypeId === preferenceTypeId) ? [] : [{
        preferenceTypeId,
        optionId,
        preferenceType: preferenceTypes.find(pt => pt.id === preferenceTypeId),
        option: preferenceTypes.find(pt => pt.id === preferenceTypeId)?.options.find((o: any) => o.id === optionId),
      }]));
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  // Determine if a preference is a scale (4 progressive options) or discrete choices
  const isScalePreference = (prefType: any) => {
    return prefType.options.length === 4 && 
           (prefType.name === 'budget_level' || prefType.name === 'activity_level' || prefType.name === 'pace_preference');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Travel Preferences</h2>
        <p className="text-gray-600">Customize your travel style and preferences.</p>
      </div>

      <div className="space-y-8">
        {preferenceTypes.map((prefType) => {
          const selectedOptionIndex = getSelectedOptionIndex(prefType.id, prefType.options);
          const selectedOption = prefType.options[selectedOptionIndex] || null;
          
          if (isScalePreference(prefType)) {
            // Slider for scale-based preferences
            return (
              <div key={prefType.id} className="space-y-3">
                <div>
                  <Label className="text-lg font-semibold">{prefType.label}</Label>
                  {prefType.description && (
                    <p className="text-sm text-gray-500 mt-1">{prefType.description}</p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max={prefType.options.length - 1}
                    value={selectedOptionIndex >= 0 ? selectedOptionIndex : 1}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      handlePreferenceChange(prefType.id, prefType.options[index].id);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  
                  <div className="flex justify-between text-sm">
                    {prefType.options.map((option: any, index: number) => (
                      <span
                        key={option.id}
                        className={`text-center ${
                          index === selectedOptionIndex ? "font-bold text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {option.label}
                      </span>
                    ))}
                  </div>
                  
                  {selectedOption && selectedOption.description && (
                    <p className="text-sm text-gray-600 text-center italic">
                      {selectedOption.description}
                    </p>
                  )}
                </div>
              </div>
            );
          } else {
            // Checkbox grid for discrete options (like accommodation)
            return (
              <div key={prefType.id} className="space-y-3">
                <div>
                  <Label className="text-lg font-semibold">{prefType.label}</Label>
                  {prefType.description && (
                    <p className="text-sm text-gray-500 mt-1">{prefType.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {prefType.options.map((option: any) => {
                    const isSelected = getSelectedOption(prefType.id) === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={prefType.id}
                          checked={isSelected}
                          onChange={() => handlePreferenceChange(prefType.id, option.id)}
                          className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium block ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                            {option.label}
                          </span>
                          {option.description && (
                            <span className={`text-xs block mt-0.5 ${isSelected ? "text-blue-700" : "text-gray-500"}`}>
                              {option.description}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
