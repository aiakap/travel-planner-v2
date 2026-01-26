"use client";

import Link from "next/link";
import { Button } from "@/app/ws/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
}

export function PageHeader({ title, description, showBackButton = true }: PageHeaderProps) {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {showBackButton && (
          <Link href="/ws" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        )}
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          {description}
        </p>
      </div>
    </div>
  );
}
