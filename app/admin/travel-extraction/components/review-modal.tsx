"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plane,
  Hotel,
  Car,
  Ticket,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  extractedData: ExtractedTravelData;
  onSave: (selectedItemIds: Set<string>) => void;
}

export function ReviewModal({
  open,
  onClose,
  extractedData,
  onSave,
}: ReviewModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Generate unique IDs for each item
  const flightsWithIds = extractedData.flights.map((f, i) => ({
    ...f,
    _id: `flight-${i}`,
  }));
  const hotelsWithIds = extractedData.hotels.map((h, i) => ({
    ...h,
    _id: `hotel-${i}`,
  }));
  const carsWithIds = extractedData.rentalCars.map((c, i) => ({
    ...c,
    _id: `car-${i}`,
  }));
  const activitiesWithIds = extractedData.activities.map((a, i) => ({
    ...a,
    _id: `activity-${i}`,
  }));

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const totalItems =
    extractedData.flights.length +
    extractedData.hotels.length +
    extractedData.rentalCars.length +
    extractedData.activities.length;

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Extracted Travel Data</DialogTitle>
          <DialogDescription>
            Found {totalItems} item{totalItems !== 1 ? "s" : ""}. Select which
            items to add to your trip.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="flights" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flights" className="gap-1">
              <Plane className="w-4 h-4" />
              Flights ({extractedData.flights.length})
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-1">
              <Hotel className="w-4 h-4" />
              Hotels ({extractedData.hotels.length})
            </TabsTrigger>
            <TabsTrigger value="cars" className="gap-1">
              <Car className="w-4 h-4" />
              Cars ({extractedData.rentalCars.length})
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-1">
              <Ticket className="w-4 h-4" />
              Activities ({extractedData.activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Flights */}
          <TabsContent value="flights" className="overflow-y-auto max-h-[400px]">
            {flightsWithIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No flights found
              </div>
            ) : (
              <div className="space-y-3">
                {flightsWithIds.map((flight) => (
                  <Card
                    key={flight._id}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    onClick={() => toggleItem(flight._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(flight._id)}
                        onCheckedChange={() => toggleItem(flight._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{flight.airline}</Badge>
                          <span className="text-sm font-mono">
                            {flight.flightNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              From
                            </div>
                            <div className="font-medium">
                              {flight.origin.code} - {flight.origin.city}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(flight.departure)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              To
                            </div>
                            <div className="font-medium">
                              {flight.destination.code} - {flight.destination.city}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(flight.arrival)}
                            </div>
                          </div>
                        </div>
                        {flight.confirmationNumber && (
                          <div className="mt-2 text-xs text-gray-600">
                            Confirmation: {flight.confirmationNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hotels */}
          <TabsContent value="hotels" className="overflow-y-auto max-h-[400px]">
            {hotelsWithIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hotels found
              </div>
            ) : (
              <div className="space-y-3">
                {hotelsWithIds.map((hotel) => (
                  <Card
                    key={hotel._id}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    onClick={() => toggleItem(hotel._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(hotel._id)}
                        onCheckedChange={() => toggleItem(hotel._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{hotel.name}</h4>
                        <div className="text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {hotel.city}
                          {hotel.address && ` - ${hotel.address}`}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <Calendar className="w-3 h-3" />
                              Check-in
                            </div>
                            <div className="font-medium">
                              {formatDate(hotel.checkIn)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <Calendar className="w-3 h-3" />
                              Check-out
                            </div>
                            <div className="font-medium">
                              {formatDate(hotel.checkOut)}
                            </div>
                          </div>
                        </div>
                        {hotel.nights && (
                          <div className="mt-2 text-xs text-gray-600">
                            {hotel.nights} night{hotel.nights > 1 ? "s" : ""}
                          </div>
                        )}
                        {hotel.confirmationNumber && (
                          <div className="mt-1 text-xs text-gray-600">
                            Confirmation: {hotel.confirmationNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rental Cars */}
          <TabsContent value="cars" className="overflow-y-auto max-h-[400px]">
            {carsWithIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rental cars found
              </div>
            ) : (
              <div className="space-y-3">
                {carsWithIds.map((car) => (
                  <Card
                    key={car._id}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    onClick={() => toggleItem(car._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(car._id)}
                        onCheckedChange={() => toggleItem(car._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{car.company}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              Pickup
                            </div>
                            <div className="font-medium">{car.pickupLocation}</div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(car.pickupDate)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              Return
                            </div>
                            <div className="font-medium">{car.returnLocation}</div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(car.returnDate)}
                            </div>
                          </div>
                        </div>
                        {car.confirmationNumber && (
                          <div className="mt-2 text-xs text-gray-600">
                            Confirmation: {car.confirmationNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activities */}
          <TabsContent value="activities" className="overflow-y-auto max-h-[400px]">
            {activitiesWithIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activities found
              </div>
            ) : (
              <div className="space-y-3">
                {activitiesWithIds.map((activity) => (
                  <Card
                    key={activity._id}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    onClick={() => toggleItem(activity._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(activity._id)}
                        onCheckedChange={() => toggleItem(activity._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{activity.name}</h4>
                        <div className="text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {activity.location}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(activity.date)}
                          </div>
                          {activity.time && (
                            <div>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {activity.time}
                            </div>
                          )}
                        </div>
                        {activity.confirmationNumber && (
                          <div className="mt-2 text-xs text-gray-600">
                            Confirmation: {activity.confirmationNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-gray-600">
              {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => onSave(selectedItems)}
                disabled={selectedItems.size === 0}
              >
                Add {selectedItems.size} Item{selectedItems.size !== 1 ? "s" : ""} to Trip
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
