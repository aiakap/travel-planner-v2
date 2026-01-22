"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const demoPages = [
  {
    category: "Overview",
    items: [
      { name: "Main Demo", path: "/demo/amadeus" },
      { name: "Maps Overview", path: "/demo/amadeus/maps" },
    ]
  },
  {
    category: "Flight APIs",
    items: [
      { name: "Flight Offers Price", path: "/demo/amadeus/flight-offers-price" },
      { name: "Flight Create Orders", path: "/demo/amadeus/flight-create-orders" },
      { name: "Flight Order Management", path: "/demo/amadeus/flight-order-management" },
      { name: "Seatmap Display", path: "/demo/amadeus/seatmap-display" },
      { name: "Flight Inspirations", path: "/demo/amadeus/flight-inspirations" },
      { name: "Flight Choice Prediction", path: "/demo/amadeus/flight-choice-prediction" },
      { name: "Flight Price Analysis", path: "/demo/amadeus/flight-price-analysis" },
    ]
  },
  {
    category: "Hotel APIs",
    items: [
      { name: "Hotel Booking", path: "/demo/amadeus/hotel-booking" },
      { name: "Hotel Ratings", path: "/demo/amadeus/hotel-ratings" },
      { name: "Hotel Name Autocomplete", path: "/demo/amadeus/hotel-name-autocomplete" },
    ]
  },
  {
    category: "Transfer APIs",
    items: [
      { name: "Transfer Booking", path: "/demo/amadeus/transfer-booking" },
      { name: "Transfer Management", path: "/demo/amadeus/transfer-management" },
    ]
  },
  {
    category: "Destination Content",
    items: [
      { name: "Trip Purpose Prediction", path: "/demo/amadeus/trip-purpose-prediction" },
      { name: "Points of Interest", path: "/demo/amadeus/points-of-interest" },
      { name: "Safe Place", path: "/demo/amadeus/safe-place" },
    ]
  }
];

export function AmadeusNav() {
  const pathname = usePathname();
  
  return (
    <nav className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Amadeus API Demos</h2>
        <p className="text-xs text-muted-foreground">
          Explore all available APIs
        </p>
      </div>
      
      {demoPages.map((category) => (
        <div key={category.category} className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            {category.category}
          </h3>
          <div className="space-y-1">
            {category.items.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
