"use client";

import { useState } from "react";
import { addHobby, removeHobby } from "@/lib/actions/profile-actions";

interface HobbiesSectionProps {
  initialHobbies: any[];
  availableHobbies: any[];
}

export function HobbiesSection({ initialHobbies, availableHobbies }: HobbiesSectionProps) {
  const [userHobbies, setUserHobbies] = useState(initialHobbies);

  const selectedHobbyIds = new Set(userHobbies.map(uh => uh.hobbyId));

  // Group all hobbies by category
  const groupedHobbies = availableHobbies.reduce((acc, hobby) => {
    const category = hobby.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(hobby);
    return acc;
  }, {} as Record<string, any[]>);

  const handleToggleHobby = async (hobby: any, isSelected: boolean) => {
    // Optimistically update UI first
    if (isSelected) {
      // Remove hobby
      const userHobby = userHobbies.find(uh => uh.hobbyId === hobby.id);
      if (userHobby) {
        setUserHobbies(userHobbies.filter(uh => uh.id !== userHobby.id));
        try {
          await removeHobby(userHobby.id);
        } catch (error) {
          console.error("Error removing hobby:", error);
          // Revert on error
          setUserHobbies([...userHobbies, userHobby]);
        }
      }
    } else {
      // Add hobby - create temporary entry
      const tempId = `temp-${hobby.id}`;
      const tempEntry = { id: tempId, hobbyId: hobby.id, hobby, userId: "", level: null, createdAt: new Date() };
      setUserHobbies([...userHobbies, tempEntry]);
      
      try {
        const added = await addHobby(hobby.id);
        // Replace temp entry with real one
        setUserHobbies(current => 
          current.map(uh => uh.id === tempId ? { ...added, hobby } : uh)
        );
      } catch (error) {
        console.error("Error adding hobby:", error);
        // Remove temp entry on error
        setUserHobbies(current => current.filter(uh => uh.id !== tempId));
      }
    }
  };

  const categoryLabels: Record<string, string> = {
    outdoor: "Outdoor & Adventure",
    culinary: "Culinary",
    arts: "Arts & Culture",
    relaxation: "Relaxation",
    sports: "Sports",
    urban: "Urban & Shopping",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Hobbies & Interests</h2>
        <p className="text-gray-600">Select all hobbies and activities you enjoy.</p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedHobbies).map(([category, hobbies]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              {categoryLabels[category] || category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(hobbies as any[]).map((hobby: any) => {
                const isSelected = selectedHobbyIds.has(hobby.id);
                return (
                  <label
                    key={hobby.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleHobby(hobby, isSelected)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isSelected ? "font-medium text-blue-900" : "text-gray-700"}`}>
                      {hobby.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
