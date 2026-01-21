"use client";

import { Card } from "@/components/ui/card";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { ContactsSection } from "@/components/profile/contacts-section";
import { HobbiesSection } from "@/components/profile/hobbies-section";
import { TravelPreferencesSection } from "@/components/profile/travel-preferences-section";
import { RelationshipsSection } from "@/components/profile/relationships-section";

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
  initialHobbies,
  initialTravelPreferences,
  initialRelationships,
  contactTypes,
  hobbies,
  travelPreferenceTypes,
}: ProfileClientProps) {
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <PersonalInfoSection
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          initialProfile={initialProfile}
        />
      </Card>

      <Card className="p-6">
        <ContactsSection
          initialContacts={initialContacts}
          contactTypes={contactTypes}
        />
      </Card>

      <Card className="p-6">
        <HobbiesSection
          initialHobbies={initialHobbies}
          availableHobbies={hobbies}
        />
      </Card>

      <Card className="p-6">
        <TravelPreferencesSection
          initialPreferences={initialTravelPreferences}
          preferenceTypes={travelPreferenceTypes}
        />
      </Card>

      <Card className="p-6">
        <RelationshipsSection
          initialRelationships={initialRelationships}
        />
      </Card>
    </div>
  );
}
