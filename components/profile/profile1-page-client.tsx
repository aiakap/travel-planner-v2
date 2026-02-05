"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileAvatarCard } from "@/components/profile1/profile-avatar-card";
import { PersonalInfoCard } from "@/components/profile1/personal-info-card";
import { ContactsList } from "@/components/profile1/contacts-list";
import { TravelPreferences } from "@/components/profile1/travel-preferences";
import { DossierTabContent } from "@/components/profile/dossier-tab-content";
import { GraphData } from "@/lib/types/profile-graph";
import { UserProfile, UserContact, ContactType, Airport } from "@/lib/types/profile";

interface Profile1PageClientProps {
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

type ProfileTab = "personal" | "contacts" | "travel" | "dossier";

const tabItems: { id: ProfileTab; label: string }[] = [
  { id: "personal", label: "Personal Information" },
  { id: "contacts", label: "Contact Details" },
  { id: "travel", label: "Travel Preferences" },
  { id: "dossier", label: "Dossier" },
];

export function Profile1PageClient({
  userId,
  userName,
  userEmail,
  userImage,
  initialProfile,
  initialContacts,
  contactTypes,
  initialGraphData,
  initialXmlData,
}: Profile1PageClientProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const homeAirports: Airport[] = (initialProfile?.homeAirports as Airport[]) || [];
  const [newlyAddedAirports, setNewlyAddedAirports] = useState<string[]>([]);
  const travelSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as ProfileTab;
      // Map old hash values to new ones
      const hashMap: Record<string, ProfileTab> = {
        account: "personal",
        personal: "personal",
        contacts: "contacts",
        travel: "travel",
        dossier: "dossier",
      };
      const mappedTab = hashMap[hash];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleNearestAirportsFound = (airports: Airport[]) => {
    const airportCodes = airports.map((a) => a.iataCode);
    setNewlyAddedAirports(airportCodes);

    // Switch to travel tab and scroll
    setActiveTab("travel");
    setTimeout(() => {
      if (travelSectionRef.current) {
        travelSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 500);

    setTimeout(() => {
      setNewlyAddedAirports([]);
    }, 5000);
  };

  const changeTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  const displayName =
    initialProfile?.firstName || initialProfile?.lastName
      ? `${initialProfile?.firstName || ""} ${initialProfile?.lastName || ""}`.trim()
      : userName || "Traveler";

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 selection:bg-gray-200">
      <main className="max-w-5xl mx-auto px-6 py-12 pt-20">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-500">
            Manage your personal information, travel preferences, and dossier.
          </p>
        </div>

        {/* Tabs / Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300 ease-in-out">
          {/* PERSONAL INFORMATION TAB */}
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="md:col-span-1">
                <ProfileAvatarCard
                  displayName={displayName}
                  userEmail={userEmail}
                  userImage={userImage}
                />
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2">
                <PersonalInfoCard
                  initialProfile={initialProfile}
                  onNearestAirportsFound={handleNearestAirportsFound}
                />
              </div>
            </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === "contacts" && (
            <ContactsList initialContacts={initialContacts} contactTypes={contactTypes} />
          )}

          {/* TRAVEL PREFERENCES TAB */}
          {activeTab === "travel" && (
            <div ref={travelSectionRef}>
              <TravelPreferences
                userId={userId}
                initialHomeAirports={homeAirports}
                newlyAddedAirports={newlyAddedAirports}
              />
            </div>
          )}

          {/* DOSSIER TAB */}
          {activeTab === "dossier" && (
            <div className="max-w-4xl bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
