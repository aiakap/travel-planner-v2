"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ProfileTabs } from "@/components/profile-tabs";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { ContactsSection } from "@/components/profile/contacts-section";
import { UnifiedAirportSection } from "@/components/profile/unified-airport-section";
import { DossierTabContent } from "@/components/profile/dossier-tab-content";
import { TravelNeedsSection } from "@/components/profile/travel-needs-section";
import { GraphData } from "@/lib/types/profile-graph";
import { UserProfile, UserContact, ContactType, Airport } from "@/lib/types/profile";

interface ProfilePageClientProps {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
  initialProfile: UserProfile | null;
  initialContacts: UserContact[];
  contactTypes: ContactType[];
  initialGraphData: GraphData;
  initialXmlData: string | null;
}

export function ProfilePageClient({
  userId,
  userName,
  userEmail,
  userImage,
  initialProfile,
  initialContacts,
  contactTypes,
  initialGraphData,
  initialXmlData,
}: ProfilePageClientProps) {
  const homeAirports: Airport[] = (initialProfile?.homeAirports as Airport[]) || [];
  const preferredAirports: Airport[] = (initialProfile?.preferredAirports as Airport[]) || [];
  const [newlyAddedAirports, setNewlyAddedAirports] = useState<string[]>([]);
  const airportSectionRef = useRef<HTMLDivElement>(null);

  const handleNearestAirportsFound = (airports: Airport[]) => {
    // Mark these airports as newly added for highlighting
    const airportCodes = airports.map((a) => a.iataCode);
    setNewlyAddedAirports(airportCodes);

    // Scroll to airport section after a brief delay
    setTimeout(() => {
      if (airportSectionRef.current) {
        airportSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 500);

    // Clear highlighting after a few seconds
    setTimeout(() => {
      setNewlyAddedAirports([]);
    }, 5000);
  };

  // Account tab content
  const accountContent = (
    <div className="container mx-auto px-4 max-w-4xl">
      <Card className="p-4 sm:p-6">
        <PersonalInfoSection
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          initialProfile={initialProfile}
          onNearestAirportsFound={handleNearestAirportsFound}
        />
      </Card>
    </div>
  );

  // Dossier tab content (chat + profile visualization)
  const dossierContent = (
    <DossierTabContent
      initialGraphData={initialGraphData}
      initialXmlData={initialXmlData}
      user={{
        id: userId,
        name: userName,
        email: userEmail,
        image: userImage,
      }}
    />
  );

  // Contacts tab content
  const contactsContent = (
    <div className="container mx-auto px-4 max-w-4xl">
      <Card className="p-4 sm:p-6">
        <ContactsSection
          initialContacts={initialContacts}
          contactTypes={contactTypes}
        />
      </Card>
    </div>
  );

  // Travel tab content
  const travelContent = (
    <div className="container mx-auto px-4 max-w-4xl space-y-6">
      <Card
        ref={airportSectionRef}
        className={`p-4 sm:p-6 transition-all duration-300 ${
          newlyAddedAirports.length > 0 ? "ring-2 ring-green-400 shadow-lg" : ""
        }`}
      >
        <UnifiedAirportSection
          initialHomeAirports={homeAirports}
          initialPreferredAirports={preferredAirports}
          autoAddAirports={newlyAddedAirports.length > 0}
          newlyAddedAirports={newlyAddedAirports}
        />
      </Card>
      
      <Card className="p-4 sm:p-6">
        <TravelNeedsSection userId={userId} />
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal information and travel preferences
          </p>
        </div>

        <ProfileTabs
          defaultTab="account"
          accountContent={accountContent}
          dossierContent={dossierContent}
          contactsContent={contactsContent}
          travelContent={travelContent}
        />
      </div>
    </div>
  );
}
