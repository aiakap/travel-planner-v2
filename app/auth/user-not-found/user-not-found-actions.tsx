"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Mail } from "lucide-react";

interface UserNotFoundActionsProps {
  userId?: string;
  email?: string;
}

export function ClearCookiesAndRetryButton() {
  const handleClearAndRetry = () => {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name.includes("auth") || name.includes("session")) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
      }
    });
    window.location.href = "/login";
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={handleClearAndRetry}
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      Clear Cookies & Sign In
    </Button>
  );
}

export function ContactSupportButton({ userId, email }: UserNotFoundActionsProps) {
  const handleContactSupport = () => {
    const subject = encodeURIComponent("Account Not Found");
    const body = encodeURIComponent(
      `User ID: ${userId || "N/A"}\nEmail: ${email || "N/A"}\n\nDescription: My session is valid but my account is not found in the database.`
    );
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={handleContactSupport}
    >
      <Mail className="w-4 h-4 mr-2" />
      Contact Support
    </Button>
  );
}
