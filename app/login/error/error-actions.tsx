"use client";

import { Button } from "@/components/ui/button";
import { Cookie, Copy } from "lucide-react";

interface ErrorActionsProps {
  error: string;
  details?: string;
}

export function ClearCookiesButton() {
  const handleClearCookies = () => {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    });
    alert("Cookies cleared! Now restart your server and try again.");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleClearCookies}
    >
      <Cookie className="w-4 h-4 mr-2" />
      Clear All Cookies
    </Button>
  );
}

export function CopyErrorButton({ error, details }: ErrorActionsProps) {
  const handleCopy = () => {
    const errorDetails = JSON.stringify(
      {
        error,
        details,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(errorDetails);
    alert("Error details copied to clipboard!");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full"
      onClick={handleCopy}
    >
      <Copy className="w-4 h-4 mr-2" />
      Copy Error Details
    </Button>
  );
}
