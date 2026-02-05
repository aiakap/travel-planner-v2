"use client";

import { useState } from "react";
import { AvatarChangeModal } from "@/components/profile/avatar-change-modal";

interface ProfileAvatarCardProps {
  displayName: string;
  userEmail: string;
  userImage: string;
}

function getInitials(name: string, fallbackEmail: string) {
  if (name) {
    const parts = name.trim().split(" ");
    const letters = parts.slice(0, 2).map((p) => p[0]).join("");
    return letters.toUpperCase();
  }
  if (fallbackEmail) {
    return fallbackEmail[0]?.toUpperCase() || "N";
  }
  return "N";
}

export function ProfileAvatarCard({
  displayName,
  userEmail,
  userImage,
}: ProfileAvatarCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(userImage);
  
  const initials = getInitials(displayName, userEmail);

  const handleAvatarChange = (newImageUrl: string) => {
    setCurrentImage(newImageUrl);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 text-center">
        {currentImage ? (
          <img
            src={currentImage}
            alt={displayName}
            className="w-24 h-24 mx-auto rounded-full object-cover mb-4"
          />
        ) : (
          <div className="w-24 h-24 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-500 text-3xl font-serif mb-4">
            {initials}
          </div>
        )}
        <h2 className="text-xl font-serif font-medium">{displayName}</h2>
        <p className="text-gray-500 text-sm mb-6">{userEmail}</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Change Avatar
        </button>
      </div>

      <AvatarChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImage={currentImage}
        onAvatarChange={handleAvatarChange}
      />
    </>
  );
}
