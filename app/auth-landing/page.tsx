import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingSuggestion, clearPendingSuggestion } from "@/lib/pending-suggestions";
import { PlaceSuggestionCard } from "@/components/place-suggestion-card";
import { AuthLandingClient } from "./client";

export default async function AuthLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ suggestion?: string }>;
}) {
  const session = await auth();
  
  // Must be authenticated
  if (!session?.user) {
    redirect("/");
  }

  // Get pending suggestion
  const params = await searchParams;
  const suggestionId = params.suggestion;
  const pendingSuggestion = await getPendingSuggestion(suggestionId);

  // No suggestion found - redirect to trips
  if (!pendingSuggestion) {
    redirect("/trips");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6">
          <AuthLandingClient 
            suggestion={pendingSuggestion} 
            suggestionId={suggestionId || undefined}
          />
        </div>
      </div>
    </div>
  );
}
