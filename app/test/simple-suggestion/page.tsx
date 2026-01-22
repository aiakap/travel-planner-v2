import { auth } from "@/auth";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { SimpleSuggestionClient } from "./client";

export default async function SimpleSuggestionPage() {
  const session = await auth();
  
  let user = null;
  let profileData = null;

  if (session?.user?.id) {
    profileData = await getUserProfile(session.user.id);
    user = {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || "",
    };
  }

  return <SimpleSuggestionClient user={user} profileData={profileData} />;
}
