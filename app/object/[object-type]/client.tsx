"use client";

/**
 * Object client component
 * Renders the chat layout with the provided config
 */

import { ChatLayout } from "../_core/chat-layout";
import { ObjectConfig } from "../_configs/types";

interface ObjectClientProps {
  config: ObjectConfig;
  userId: string;
  initialData: any;
  params: Record<string, string>;
}

export function ObjectClient({
  config,
  userId,
  initialData,
  params,
}: ObjectClientProps) {
  return (
    <ChatLayout
      config={config}
      userId={userId}
      initialData={initialData}
      params={params}
    />
  );
}
