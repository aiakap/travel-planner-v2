import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { Footer } from "@/app/ws/components/footer-ws";
import { PageHeader } from "@/app/ws/components/page-header-ws";
import { Button } from "@/app/ws/ui/button";
import { Card, CardContent } from "@/app/ws/ui/card";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  ArrowRight,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";

const earningsExamples = [
  {
    type: "Day Trips",
    description: "City tours, food walks, local experiences",
    tripPrice: "$150",
    groupSize: "8 people",
    frequency: "4x per month",
    monthlyEarnings: "$3,200",
    image:
      "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=80",
  },
  {
    type: "Weekend Getaways",
    description: "2-3 day regional adventures",
    tripPrice: "$500",
    groupSize: "10 people",
    frequency: "2x per month",
    monthlyEarnings: "$5,500",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&q=80",
  },
  {
    type: "International Trips",
    description: "Week-long destination experiences",
    tripPrice: "$3,000",
    groupSize: "15 people",
    frequency: "1x per month",
    monthlyEarnings: "$12,750",
    image:
      "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80",
  },
];

const feeStructure = [
  {
    label: "Platform Fee",
    value: "15%",
    description: "Covers payment processing, support, insurance, and tools",
  },
  {
    label: "Your Share",
    value: "85%",
    description: "Of trip profit (revenue minus direct costs)",
  },
  {
    label: "Payout Time",
    value: "7 days",
    description: "After trip completion",
  },
];

const paymentFeatures = [
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "We handle all payment processing. Travelers pay upfront, you get paid after.",
  },
  {
    icon: Shield,
    title: "Payment Protection",
    description:
      "Funds held securely until trip completion. Protection for you and travelers.",
  },
  {
    icon: Clock,
    title: "Fast Payouts",
    description:
      "Direct deposit within 7 days of trip completion. Track everything in your dashboard.",
  },
  {
    icon: DollarSign,
    title: "Multiple Currencies",
    description:
      "Accept payments in multiple currencies. Get paid in your preferred currency.",
  },
];

export default async function EarningsPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            badge="Earnings"
            title="Transparent Pricing, Real Income"
            description="See exactly how much you can earn leading trips on Ntourage. No hidden fees, no surprises—just straightforward earning potential."
          />
        </div>
      </section>

      {/* Fee Structure */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {feeStructure.map((item) => (
              <Card
                key={item.label}
                className="bg-card border border-border text-center"
              >
                <CardContent className="p-6">
                  <p className="text-4xl font-serif text-primary mb-2">
                    {item.value}
                  </p>
                  <p className="font-semibold text-foreground mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Examples */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              What You Could Earn
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real examples based on active guides on our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {earningsExamples.map((example) => (
              <Card
                key={example.type}
                className="bg-card border border-border overflow-hidden"
              >
                <div className="aspect-[2/1] overflow-hidden">
                  <img
                    src={example.image || "/placeholder.svg"}
                    alt={example.type}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl text-foreground mb-1">
                    {example.type}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {example.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trip Price</span>
                      <span className="text-foreground">{example.tripPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Group Size</span>
                      <span className="text-foreground">{example.groupSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="text-foreground">{example.frequency}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Est. Monthly
                      </span>
                      <span className="text-2xl font-bold text-emerald-500">
                        {example.monthlyEarnings}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator Placeholder */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
                Calculate Your Earnings
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Use our earnings calculator to estimate what you could make
                based on your trip style, pricing, and frequency.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Adjust trip price, group size, and frequency
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    See monthly and annual projections
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-foreground">
                    Account for costs and platform fees automatically
                  </span>
                </li>
              </ul>
            </div>
            <Card className="bg-card border border-border">
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Earnings Calculator
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Interactive calculator coming soon
                  </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Notified
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Features */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              How Payments Work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Secure, reliable, and fast—getting paid should be the easy part
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="bg-card border border-border"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Start Earning Today
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of guides building sustainable income doing what they
            love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              asChild
            >
              <Link href="/creators/apply">Apply to Lead Trips</Link>
            </Button>
            <Button variant="outline" className="px-8 bg-transparent" asChild>
              <Link href="/ws/creators">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
