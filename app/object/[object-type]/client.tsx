"use client";

/**
 * Object client component
 * Renders the chat layout with the provided config
 */

import { ChatLayout } from "../_core/chat-layout";
import { loadConfig } from "../_configs/loader";
import "../_configs/registry"; // Import to register configs

interface ObjectClientProps {
  objectType: string;
  userId: string;
  initialData: any;
  params: Record<string, string>;
  configMetadata: {
    id: string;
    name: string;
    description: string;
    welcomeMessage?: string;
    placeholder?: string;
  };
}

export function ObjectClient({
  objectType,
  userId,
  initialData,
  params,
  configMetadata,
}: ObjectClientProps) {
  // Load config on client side to get components
  const config = loadConfig(objectType);
  
  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Configuration not found</p>
      </div>
    );
  }

  return (
    <ChatLayout
      config={config}
      userId={userId}
      initialData={initialData}
      params={params}
    />
  );
}
