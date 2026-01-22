"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export function DebugHeaderActions() {
  return (
    <div className="flex gap-2">
      <Link href="/login">
        <Button variant="outline">Go to Login</Button>
      </Link>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}

export function ClearAuthCookiesButton() {
  const handleClearCookies = () => {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name.includes("auth") || name.includes("session")) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
      }
    });
    window.location.reload();
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      className="w-full"
      onClick={handleClearCookies}
    >
      Clear All Auth Cookies
    </Button>
  );
}
