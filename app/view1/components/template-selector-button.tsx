"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { TemplateSelectionModal } from "@/components/template-selection-modal";

interface TemplateSelectorButtonProps {
  tripId: string;
  currentStyleId?: string | null;
  currentStyleName?: string | null;
  currentStyleSlug?: string | null;
}

export function TemplateSelectorButton({
  tripId,
  currentStyleId,
  currentStyleName,
  currentStyleSlug,
}: TemplateSelectorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Glassmorphic button overlay */}
      <div className="absolute top-4 right-4 md:right-8 z-20 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-200 shadow-lg"
          title="Change image style"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Style</span>
        </button>

        {/* Status indicator */}
        {currentStyleName && (
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-medium shadow-lg">
            {currentStyleName}
          </div>
        )}
      </div>

      {/* Modal */}
      <TemplateSelectionModal
        tripId={tripId}
        currentStyleId={currentStyleId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
