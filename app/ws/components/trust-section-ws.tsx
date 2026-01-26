"use client";

import {
  Shield,
  BadgeCheck,
  Star,
  Eye,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { Card, CardContent } from "@/app/ws/ui/card";

export function TrustSection() {
  return (
    <section className="py-20 bg-background" id="trust">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-400/10 mb-5">
            <Shield className="h-4 w-4 text-rose-500" />
            <span className="text-sm text-rose-500 font-medium">
              Trust & Safety
            </span>
          </div>

          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
            Know Who You're Traveling With
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Background checks, verified profiles, and transparent ratings—so you
            can travel with complete confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <Card className="bg-card border border-border">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-lg bg-accent w-fit mx-auto mb-5">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Verified Travelers
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                See who's joining your group trip with verified identity and
                optional background checks. Know your travel companions before
                you go.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-lg bg-emerald-500 w-fit mx-auto mb-5">
                <BadgeCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Certified Guides
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All trip leaders go through verification, background checks, and
                certification. Their credentials and reviews are always visible.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-lg bg-amber-500 w-fit mx-auto mb-5">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Transparent Ratings
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Real reviews from real travelers. See detailed ratings for
                guides, concierges, and trip experiences before you commit.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border border-border">
          <CardContent className="p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Complete Visibility Into Your Trip Team
                </h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  From the guide leading your adventure to the local concierge
                  showing you around—everyone on your trip team has a verified
                  profile you can review.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Eye className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Public Profiles
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        View experience, languages, and specialties
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Background Checks
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Optional verification for added peace of mind
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Star className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Verified Reviews
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Only travelers who completed trips can leave reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        Maria Santos
                      </h4>
                      <BadgeCheck className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Trip Leader • Barcelona, Spain
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">4.9</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">156</div>
                    <div className="text-xs text-muted-foreground">
                      Trips Led
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">5yr</div>
                    <div className="text-xs text-muted-foreground">
                      Experience
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <BadgeCheck className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="text-foreground">
                      Background Check Passed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-foreground">
                      First Aid Certified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
