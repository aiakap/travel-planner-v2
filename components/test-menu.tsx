"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TestMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-smooth focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
          <FlaskConical className="w-4 h-4" />
          <span>Test</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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
            href="/test/exp"
            className="cursor-pointer"
          >
            EXP
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
