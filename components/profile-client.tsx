"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { ContactsSection } from "@/components/profile/contacts-section";
import { UnifiedAirportSection } from "@/components/profile/unified-airport-section";

interface ProfileClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
  initialProfile: any;
  initialContacts: any[];
  initialHobbies: any[];
  initialTravelPreferences: any[];
  initialRelationships: any[];
  contactTypes: any[];
  hobbies: any[];
  travelPreferenceTypes: any[];
}

export function ProfileClient({
  userId,
  userName,
  userEmail,
  userImage,
  initialProfile,
  initialContacts,
  contactTypes,
}: ProfileClientProps) {
  const homeAirports = (initialProfile?.homeAirports as any[]) || [];
  const preferredAirports = (initialProfile?.preferredAirports as any[]) || [];
  const [newlyAddedAirports, setNewlyAddedAirports] = useState<string[]>([]);
  const airportSectionRef = useRef<HTMLDivElement>(null);

  const handleNearestAirportsFound = (airports: any[]) => {
    // Mark these airports as newly added for highlighting
    const airportCodes = airports.map(a => a.iataCode);
    setNewlyAddedAirports(airportCodes);
    
    // Scroll to airport section after a brief delay
    setTimeout(() => {
      if (airportSectionRef.current) {
        airportSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 500);
    
    // Clear highlighting after a few seconds
    setTimeout(() => {
      setNewlyAddedAirports([]);
    }, 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="p-4 sm:p-6">
        <PersonalInfoSection
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          initialProfile={initialProfile}
          onNearestAirportsFound={handleNearestAirportsFound}
        />
      </Card>

      <Card className="p-4 sm:p-6">
        <ContactsSection
          initialContacts={initialContacts}
          contactTypes={contactTypes}
        />
      </Card>

      <Card 
        ref={airportSectionRef}
        className={`p-4 sm:p-6 lg:col-span-2 transition-all duration-300 ${
          newlyAddedAirports.length > 0 ? 'ring-2 ring-green-400 shadow-lg' : ''
        }`}
      >
        <UnifiedAirportSection
          initialHomeAirports={homeAirports}
          initialPreferredAirports={preferredAirports}
          autoAddAirports={newlyAddedAirports.length > 0}
          newlyAddedAirports={newlyAddedAirports}
        />
      </Card>
    </div>
  );
}
