"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssistedTripWizard } from '@/components/assisted-trip-wizard';
import type { ProfileGraphItem } from '@/lib/types/profile-graph';

interface WizardClientProps {
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  profileItems: ProfileGraphItem[];
}

export default function WizardClient({ userProfile, profileItems }: WizardClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16">
      {/* Back Navigation */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/suggestions">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Guided Trip Planning</h1>
          <p className="text-slate-600">
            Answer a few simple questions and let AI craft the perfect trip for you
          </p>
        </div>

        {/* Wizard Component */}
        <AssistedTripWizard
          profileItems={profileItems}
          userProfile={userProfile}
        />
      </div>
    </div>
  );
}
