import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfile, getContactTypes, getHobbies, getTravelPreferenceTypes } from "@/lib/actions/profile-actions";
import { ProfileClient } from "@/components/profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const profileData = await getUserProfile(session.user.id);
  const contactTypes = await getContactTypes();
  const hobbies = await getHobbies();
  const travelPreferenceTypes = await getTravelPreferenceTypes();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <ProfileClient
          userId={session.user.id}
          userName={session.user.name || ""}
          userEmail={session.user.email || ""}
          userImage={session.user.image || ""}
          initialProfile={profileData.profile}
          initialContacts={profileData.contacts}
          initialHobbies={profileData.hobbies}
          initialTravelPreferences={profileData.travelPreferences}
          initialRelationships={profileData.relationships}
          contactTypes={contactTypes}
          hobbies={hobbies}
          travelPreferenceTypes={travelPreferenceTypes}
        />
      </div>
    </div>
  );
}
