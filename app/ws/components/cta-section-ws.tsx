"use client";

import { Button } from "@/app/ws/ui/button";
import { ArrowRight, Plus } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
          Ready to Start Your Adventure?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of travelers who plan, share, and experience
          unforgettable journeys with Social Experiences.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border text-foreground hover:bg-secondary px-8 bg-transparent"
          >
            Talk to Our Team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          No credit card required • Free AI companion included
        </p>
      </div>
    </section>
  );
}
