import Link from "next/link";
import { Globe2, ListChecks, MessageSquare, Plus } from "lucide-react";

export function QuickLinksGrid() {
  const links = [
    {
      href: "/globe",
      icon: Globe2,
      title: "Visualize Your Journey",
      description: "See your travels on an interactive 3D globe",
      gradient: "from-blue-500 to-purple-600",
      bgGradient: "from-blue-50 to-purple-50",
    },
    {
      href: "/manage",
      icon: ListChecks,
      title: "Full Trip Manager",
      description: "View and edit all trips, segments, and reservations",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      href: "/chat",
      icon: MessageSquare,
      title: "AI Travel Assistant",
      description: "Get personalized travel recommendations and planning help",
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
    },
    {
      href: "/trips/new",
      icon: Plus,
      title: "Create New Trip",
      description: "Start planning your next adventure",
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-50 to-rose-50",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Explore More
            </h2>
            <p className="text-slate-600 text-lg">
              Discover all the ways to manage and enjoy your travels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {links.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={index} href={link.href}>
                  <div className="group relative h-full overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    {/* Background gradient on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${link.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                        {link.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
