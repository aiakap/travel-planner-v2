"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { UserContextModal } from "@/components/user-context-modal";
import { MinimalUserContext } from "@/lib/types/user-context";

interface UserContextIconProps {
  userContext: MinimalUserContext | null;
}

export function UserContextIcon({ userContext }: UserContextIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!userContext) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        title="View User Context"
        aria-label="View user context information"
      >
        <Info className="w-5 h-5" />
      </button>
      
      <UserContextModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
