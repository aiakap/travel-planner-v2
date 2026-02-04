"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/app/exp/ui/badge";
import { 
  DollarSign, 
  Plane,
  Hotel,
  UtensilsCrossed,
  Ticket,
  Car,
  ShoppingBag,
  Loader2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { convertToUSD, formatAsUSD } from "@/lib/utils/currency-converter";

interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  icon: any;
  color: string;
  status: {
    confirmed: number;
    planned: number;
    suggested: number;
  };
}

interface BudgetBreakdownCardProps {
  tripId: string;
}

export function BudgetBreakdownCard({ tripId }: BudgetBreakdownCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    loadBudgetData();
  }, [tripId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trip with all reservations
      const response = await fetch(`/api/trips/${tripId}`);
      if (!response.ok) throw new Error("Failed to load trip data");
      
      const trip = await response.json();
      
      // Process reservations by category
      const categoryMap = new Map<string, CategoryTotal>();
      
      // Initialize categories
      const categories = [
        { name: "Transport", icon: Plane, color: "bg-sky-100 text-sky-700" },
        { name: "Stay", icon: Hotel, color: "bg-purple-100 text-purple-700" },
        { name: "Eat", icon: UtensilsCrossed, color: "bg-orange-100 text-orange-700" },
        { name: "Do", icon: Ticket, color: "bg-green-100 text-green-700" },
        { name: "Other", icon: ShoppingBag, color: "bg-slate-100 text-slate-700" },
      ];

      categories.forEach(cat => {
        categoryMap.set(cat.name, {
          category: cat.name,
          total: 0,
          count: 0,
          icon: cat.icon,
          color: cat.color,
          status: {
            confirmed: 0,
            planned: 0,
            suggested: 0,
          },
        });
      });

      // Process all reservations from all segments
      // Convert all costs to USD for accurate aggregation
      let total = 0;

      // Collect all reservation processing promises for parallel conversion
      const reservationPromises: Promise<void>[] = [];

      trip.segments?.forEach((segment: any) => {
        segment.reservations?.forEach((reservation: any) => {
          const processReservation = async () => {
            const category = reservation.reservationType?.category?.name || "Other";
            const cost = reservation.cost || 0;
            const currency = reservation.currency || "USD";
            const status = reservation.reservationStatus?.name?.toLowerCase() || "suggested";

            // Convert cost to USD
            const costUSD = cost > 0 ? await convertToUSD(cost, currency) : 0;

            const categoryData = categoryMap.get(category) || categoryMap.get("Other")!;
            categoryData.total += costUSD;
            categoryData.count += 1;
            total += costUSD;

            // Track by status (also converted to USD)
            if (status.includes("confirm")) {
              categoryData.status.confirmed += costUSD;
            } else if (status.includes("plan")) {
              categoryData.status.planned += costUSD;
            } else {
              categoryData.status.suggested += costUSD;
            }
          };
          
          reservationPromises.push(processReservation());
        });
      });

      // Wait for all currency conversions to complete
      await Promise.all(reservationPromises);

      setGrandTotal(total);
      setCategoryTotals(Array.from(categoryMap.values()).filter(c => c.count > 0));
    } catch (err: any) {
      console.error("Error loading budget data:", err);
      setError(err.message || "Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (amount: number): number => {
    if (grandTotal === 0) return 0;
    return (amount / grandTotal) * 100;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Calculating budget...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-900">Budget Breakdown</h3>
        </div>
        <div className="mt-2">
          <div className="text-3xl font-bold text-slate-900">
            {formatAsUSD(grandTotal)}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Total estimated cost (USD)
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-4 space-y-3">
        {categoryTotals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No expenses added yet
          </div>
        ) : (
          categoryTotals.map((category) => {
            const Icon = category.icon;
            const percentage = getPercentage(category.total);

            return (
              <div key={category.category} className="space-y-2">
                {/* Category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {category.category}
                      </div>
                      <div className="text-xs text-slate-500">
                        {category.count} item{category.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {formatAsUSD(category.total)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Status breakdown */}
                <div className="flex gap-3 text-xs">
                  {category.status.confirmed > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Confirmed: {formatAsUSD(category.status.confirmed)}</span>
                    </div>
                  )}
                  {category.status.planned > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Planned: {formatAsUSD(category.status.planned)}</span>
                    </div>
                  )}
                  {category.status.suggested > 0 && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Suggested: {formatAsUSD(category.status.suggested)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      {categoryTotals.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-slate-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-slate-600">Planned</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-600">Suggested</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
