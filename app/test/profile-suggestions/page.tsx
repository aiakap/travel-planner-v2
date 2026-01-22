import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { ProfileSuggestionsClient } from "./client";

export default async function ProfileSuggestionsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/test/profile-suggestions");
  }

  // Fetch profile data
  const profileData = await getUserProfile(session.user.id);

  const user = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || undefined,
  };

  return (
    <ProfileSuggestionsClient
      user={user}
      profileData={profileData}
    />
  );
}
