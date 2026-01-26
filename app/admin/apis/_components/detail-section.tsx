"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

export function DetailSection({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
}: DetailSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="font-semibold text-sm">{title}</h3>
          {badge !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}
