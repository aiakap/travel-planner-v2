"use client";

import { Card } from "@/components/ui/card";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { ContactsSection } from "@/components/profile/contacts-section";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <PersonalInfoSection
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          initialProfile={initialProfile}
        />
      </Card>

      <Card className="p-4">
        <ContactsSection
          initialContacts={initialContacts}
          contactTypes={contactTypes}
        />
      </Card>
    </div>
  );
}
