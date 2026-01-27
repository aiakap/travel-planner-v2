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
    <div className="pt-20 sm:pt-24">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your personal information and preferences</p>
          </div>
          
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
    </div>
  );
}
