import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserProfile, getContactTypes } from "@/lib/actions/profile-actions";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { Profile1PageClient } from "@/components/profile/profile1-page-client";

export const metadata = {
  title: "My Profile",
  description: "Manage your profile and travel preferences",
};

export default async function Profile1Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const [profileData, contactTypes, profileGraph] = await Promise.all([
    getUserProfile(session.user.id),
    getContactTypes(),
    getUserProfileGraph(session.user.id),
  ]);

  return (
    <div className="pt-16">
      <Suspense fallback={<ProfileLoadingSkeleton />}>
        <Profile1PageClient
          userId={session.user.id}
          userName={session.user.name || ""}
          userEmail={session.user.email || ""}
          userImage={session.user.image || ""}
          initialProfile={profileData.profile}
          initialContacts={profileData.contacts}
          contactTypes={contactTypes}
          initialGraphData={profileGraph.graphData}
          initialXmlData={profileGraph.xmlData || null}
        />
      </Suspense>
    </div>
  );
}

function ProfileLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
        <div className="h-10 bg-gray-200 rounded w-full max-w-md mb-6"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
