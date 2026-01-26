"use client";

import { useState } from "react";
import { FlaskConical, Globe } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TestMenu() {
  const [open, setOpen] = useState(false);
  let closeTimer: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(closeTimer);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <FlaskConical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <DropdownMenuItem asChild>
          <Link
            href="/globe"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>Globe</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/demo/amadeus"
            className="cursor-pointer"
          >
            Amadeus + Maps Demo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/test/place-pipeline"
            className="cursor-pointer"
          >
            Test Chat
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/test/experience-builder"
            className="cursor-pointer"
          >
            Experience Builder (Old)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/test/profile-suggestions"
            className="cursor-pointer"
          >
            Suggestions Old
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/test/simple-suggestion"
            className="cursor-pointer"
          >
            Simple Test
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
