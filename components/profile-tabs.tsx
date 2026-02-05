"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, BookOpen, Users, Plane } from "lucide-react";

export type ProfileTab = "account" | "dossier" | "contacts" | "travel";

interface ProfileTabsProps {
  defaultTab?: ProfileTab;
  accountContent: React.ReactNode;
  dossierContent: React.ReactNode;
  contactsContent: React.ReactNode;
  travelContent: React.ReactNode;
}

export function ProfileTabs({
  defaultTab = "account",
  accountContent,
  dossierContent,
  contactsContent,
  travelContent,
}: ProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(defaultTab);

  // Handle URL hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as ProfileTab;
      if (["account", "dossier", "contacts", "travel"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Also check for tab query param (for backward compatibility)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as ProfileTab | null;
    if (tabParam && ["account", "dossier", "contacts", "travel"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const tab = value as ProfileTab;
    setActiveTab(tab);
    // Update URL hash without triggering navigation
    window.history.replaceState(null, "", `#${tab}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-0">
        <TabsTrigger
          value="account"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
        </TabsTrigger>
        <TabsTrigger
          value="dossier"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Dossier</span>
        </TabsTrigger>
        <TabsTrigger
          value="contacts"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Contacts</span>
        </TabsTrigger>
        <TabsTrigger
          value="travel"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2"
        >
          <Plane className="h-4 w-4" />
          <span className="hidden sm:inline">Travel</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-6">
        {accountContent}
      </TabsContent>

      <TabsContent value="dossier" className="mt-0 flex-1">
        {dossierContent}
      </TabsContent>

      <TabsContent value="contacts" className="mt-6">
        {contactsContent}
      </TabsContent>

      <TabsContent value="travel" className="mt-6">
        {travelContent}
      </TabsContent>
    </Tabs>
  );
}
