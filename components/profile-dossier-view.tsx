"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileDossierViewProps {
  content: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProfileDossierView({ 
  content, 
  isLoading, 
  onRefresh 
}: ProfileDossierViewProps) {
  return (
    <div 
      className="h-full overflow-y-auto p-8 bg-cover bg-center relative"
      style={{
        backgroundColor: "#f5f1e8",
        backgroundImage: `
          linear-gradient(90deg, rgba(245, 241, 232, 0.9) 1px, transparent 1px),
          linear-gradient(rgba(245, 241, 232, 0.9) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px"
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Dossier Header */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border-2 border-amber-900/20 p-8">
          <div className="flex items-center justify-between mb-6 border-b-2 border-amber-900/30 pb-4">
            <div>
              <h1 className="text-3xl font-serif text-amber-900 mb-1">
                Traveler Dossier
              </h1>
              <p className="text-sm text-amber-800/70 italic">
                Confidential Guest Profile
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="border-amber-900/30 text-amber-900 hover:bg-amber-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {/* Dossier Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-900 mx-auto mb-4" />
                <p className="text-amber-800">Compiling dossier...</p>
              </div>
            </div>
          ) : content ? (
            <div 
              className="prose prose-amber max-w-none"
              style={{
                fontFamily: "'Playfair Display', serif"
              }}
            >
              <div 
                className="whitespace-pre-wrap text-amber-950 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatDossierContent(content) }}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-amber-800">
                No profile data available. Start chatting to build your profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDossierContent(content: string): string {
  // Format sections with proper styling
  return content
    .replace(/^(I{1,3}\.\s+.+)$/gm, '<h2 class="text-xl font-bold text-amber-900 mt-6 mb-3 border-b border-amber-900/20 pb-2">$1</h2>')
    .replace(/\[([^\]]+)\]/g, '$1'); // Remove brackets, keep text plain
}
