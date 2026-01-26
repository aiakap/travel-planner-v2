/**
 * Dynamic object page (Server Component)
 * Handles auth and initial data fetching
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadConfig } from "../_configs/loader";
import "../_configs/registry"; // Import to register configs
import { ObjectClient } from "./client";

interface PageProps {
  params: Promise<{
    "object-type": string;
  }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function ObjectPage({ params, searchParams }: PageProps) {
  // Get session
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  // Resolve params
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const objectType = resolvedParams["object-type"];

  // Load config
  const config = loadConfig(objectType);
  if (!config) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
          Object type not found
        </h1>
        <p style={{ color: "#6b7280" }}>
          The object type "{objectType}" is not configured.
        </p>
      </div>
    );
  }

  // Fetch initial data
  let initialData = null;
  try {
    initialData = await config.dataSource.fetch(
      session.user.id,
      resolvedSearchParams
    );
  } catch (error) {
    console.error("Error fetching initial data:", error);
  }

  // Pass only serializable data to client
  return (
    <ObjectClient
      objectType={objectType}
      userId={session.user.id}
      initialData={initialData}
      params={resolvedSearchParams}
      configMetadata={{
        id: config.id,
        name: config.name,
        description: config.description,
        welcomeMessage: config.leftPanel.welcomeMessage,
        placeholder: config.leftPanel.placeholder,
      }}
    />
  );
}
