"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { amadeusLogger } from "@/lib/amadeus-debug-logger";

// Helper functions
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  return `${hours}h ${minutes}m`;
}

// Flight Offers Table
export function FlightOffersTable({ offers }: { offers: any[] }) {
  amadeusLogger.debug('FlightOffersTable', 'Rendering table', { offerCount: offers.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Departure</th>
              <th className="p-2 font-semibold">Arrival</th>
              <th className="p-2 font-semibold">Duration</th>
              <th className="p-2 font-semibold">Stops</th>
              <th className="p-2 font-semibold">Carrier</th>
              <th className="p-2 font-semibold">Class</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const itinerary = offer.itineraries[0];
              const firstSeg = itinerary.segments[0];
              const lastSeg = itinerary.segments[itinerary.segments.length - 1];
              const stops = itinerary.segments.length - 1;
              const pricing = offer.travelerPricings[0];

              return (
                <Tooltip key={offer.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">
                        {firstSeg.departure.iataCode} → {lastSeg.arrival.iataCode}
                      </td>
                      <td className="p-2">
                        {formatTime(firstSeg.departure.at)}
                        {firstSeg.departure.terminal && (
                          <span className="text-xs text-muted-foreground ml-1">
                            T{firstSeg.departure.terminal}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {formatTime(lastSeg.arrival.at)}
                        {lastSeg.arrival.terminal && (
                          <span className="text-xs text-muted-foreground ml-1">
                            T{lastSeg.arrival.terminal}
                          </span>
                        )}
                      </td>
                      <td className="p-2">{formatDuration(itinerary.duration)}</td>
                      <td className="p-2">{stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}</td>
                      <td className="p-2">{offer.validatingAirlineCodes.join(', ')}</td>
                      <td className="p-2 capitalize">
                        {pricing.fareDetailsBySegment[0].cabin.toLowerCase()}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${offer.price.total} {offer.price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Flight Offer Data
                      </div>
                      
                      {/* Pricing Details */}
                      <div>
                        <div className="font-semibold mb-1">Pricing:</div>
                        <div className="grid grid-cols-2 gap-2 pl-2">
                          <div>Base: ${offer.price.base}</div>
                          <div>Total: ${offer.price.total}</div>
                          <div>Grand Total: ${offer.price.grandTotal}</div>
                          <div>Currency: {offer.price.currency}</div>
                        </div>
                      </div>

                      {/* Segments */}
                      <div>
                        <div className="font-semibold mb-1">Segments:</div>
                        {itinerary.segments.map((seg: any, i: number) => (
                          <div key={i} className="pl-2 mb-2 border-l-2 border-muted">
                            <div>Flight {seg.carrierCode}{seg.number}</div>
                            <div>{seg.departure.iataCode} ({formatTime(seg.departure.at)}) → {seg.arrival.iataCode} ({formatTime(seg.arrival.at)})</div>
                            <div>Aircraft: {seg.aircraft.code} | Duration: {formatDuration(seg.duration)}</div>
                          </div>
                        ))}
                      </div>

                      {/* Fare Details */}
                      <div>
                        <div className="font-semibold mb-1">Fare Details:</div>
                        <div className="pl-2">
                          <div>Fare Basis: {pricing.fareDetailsBySegment[0].fareBasis}</div>
                          <div>Branded Fare: {pricing.fareDetailsBySegment[0].brandedFare}</div>
                          <div>Booking Class: {pricing.fareDetailsBySegment[0].class}</div>
                          <div>Checked Bags: {pricing.fareDetailsBySegment[0].includedCheckedBags.quantity}</div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div>
                        <div className="font-semibold mb-1">Additional Info:</div>
                        <div className="pl-2">
                          <div>Offer ID: {offer.id}</div>
                          <div>Source: {offer.source}</div>
                          <div>Bookable Seats: {offer.numberOfBookableSeats}</div>
                          <div>Last Ticketing Date: {offer.lastTicketingDate}</div>
                          <div>Instant Ticketing: {offer.instantTicketingRequired ? 'Yes' : 'No'}</div>
                        </div>
                      </div>

                      {/* Raw JSON */}
                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(offer, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Hotels Table
export function HotelsTable({ hotels }: { hotels: any[] }) {
  amadeusLogger.debug('HotelsTable', 'Rendering table', { hotelCount: hotels.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Chain</th>
              <th className="p-2 font-semibold">City</th>
              <th className="p-2 font-semibold">Distance</th>
              <th className="p-2 font-semibold">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <Tooltip key={hotel.hotelId} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{hotel.name}</td>
                    <td className="p-2">{hotel.chainCode}</td>
                    <td className="p-2">{hotel.address.cityName}</td>
                    <td className="p-2">{hotel.distance.value} {hotel.distance.unit}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {hotel.geoCode.latitude.toFixed(4)}, {hotel.geoCode.longitude.toFixed(4)}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Hotel Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Hotel Information:</div>
                      <div className="pl-2">
                        <div>Hotel ID: {hotel.hotelId}</div>
                        <div>Chain Code: {hotel.chainCode}</div>
                        <div>Dupe ID: {hotel.dupeId}</div>
                        <div>IATA Code: {hotel.iataCode}</div>
                        <div>Last Update: {hotel.lastUpdate}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Location:</div>
                      <div className="pl-2">
                        <div>City: {hotel.address.cityName}</div>
                        <div>State: {hotel.address.stateCode}</div>
                        <div>Country: {hotel.address.countryCode}</div>
                        <div>Latitude: {hotel.geoCode.latitude}</div>
                        <div>Longitude: {hotel.geoCode.longitude}</div>
                        <div>Distance: {hotel.distance.value} {hotel.distance.unit}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(hotel, null, 2)}
                      </pre>
                    </details>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Hotel Offers Table
export function HotelOffersTable({ offers }: { offers: any[] }) {
  amadeusLogger.debug('HotelOffersTable', 'Rendering table', { offerCount: offers.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Hotel</th>
              <th className="p-2 font-semibold">Rating</th>
              <th className="p-2 font-semibold">Check-in</th>
              <th className="p-2 font-semibold">Check-out</th>
              <th className="p-2 font-semibold">Room Type</th>
              <th className="p-2 font-semibold">Guests</th>
              <th className="p-2 font-semibold text-right">Price/Night</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offerData) => {
              const hotel = offerData.hotel;
              const offer = offerData.offers[0];
              
              return (
                <Tooltip key={offer.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{hotel.name}</td>
                      <td className="p-2">{hotel.rating}★</td>
                      <td className="p-2">{offer.checkInDate}</td>
                      <td className="p-2">{offer.checkOutDate}</td>
                      <td className="p-2 capitalize">
                        {offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')}
                      </td>
                      <td className="p-2">{offer.guests.adults} adults</td>
                      <td className="p-2 text-right">
                        ${offer.price.variations.average.base}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${offer.price.total} {offer.price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Hotel Offer Data
                      </div>
                      
                      {/* Hotel Details */}
                      <div>
                        <div className="font-semibold mb-1">Hotel:</div>
                        <div className="pl-2">
                          <div>{hotel.name} ({hotel.rating}★)</div>
                          <div>{hotel.address.lines.join(', ')}</div>
                          <div>{hotel.address.cityName}, {hotel.address.postalCode}</div>
                          <div>Phone: {hotel.contact.phone}</div>
                          <div>Email: {hotel.contact.email}</div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div>
                        <div className="font-semibold mb-1">Amenities:</div>
                        <div className="pl-2">
                          {hotel.amenities.map((amenity: string, i: number) => (
                            <span key={i} className="inline-block mr-2 mb-1">
                              {amenity.replace(/_/g, ' ')}
                              {i < hotel.amenities.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Room Details */}
                      <div>
                        <div className="font-semibold mb-1">Room:</div>
                        <div className="pl-2">
                          <div>Category: {offer.room.typeEstimated.category}</div>
                          <div>Bed Type: {offer.room.typeEstimated.bedType}</div>
                          <div>Beds: {offer.room.typeEstimated.beds}</div>
                          <div>Description: {offer.room.description.text}</div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div>
                        <div className="font-semibold mb-1">Pricing:</div>
                        <div className="pl-2">
                          <div>Base: ${offer.price.base}</div>
                          <div>Total: ${offer.price.total}</div>
                          <div>Currency: {offer.price.currency}</div>
                          <div>Average/Night: ${offer.price.variations.average.base}</div>
                        </div>
                      </div>

                      {/* Cancellation Policy */}
                      <div>
                        <div className="font-semibold mb-1">Cancellation:</div>
                        <div className="pl-2">
                          <div>Deadline: {offer.policies.cancellation.deadline}</div>
                          <div>Fee: ${offer.policies.cancellation.amount}</div>
                          <div>Type: {offer.policies.cancellation.type}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(offerData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Transfers Table
export function TransfersTable({ transfers }: { transfers: any[] }) {
  amadeusLogger.debug('TransfersTable', 'Rendering table', { transferCount: transfers.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Type</th>
              <th className="p-2 font-semibold">From</th>
              <th className="p-2 font-semibold">To</th>
              <th className="p-2 font-semibold">Vehicle</th>
              <th className="p-2 font-semibold">Duration</th>
              <th className="p-2 font-semibold">Distance</th>
              <th className="p-2 font-semibold">Provider</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => (
              <Tooltip key={transfer.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 capitalize">{transfer.transferType.toLowerCase()}</td>
                    <td className="p-2">{transfer.start.locationCode || transfer.start.address.cityName}</td>
                    <td className="p-2">{transfer.end.address.cityName}</td>
                    <td className="p-2">{transfer.vehicle.description}</td>
                    <td className="p-2">{formatDuration(transfer.duration)}</td>
                    <td className="p-2">{transfer.distance.value} {transfer.distance.unit}</td>
                    <td className="p-2">{transfer.serviceProvider.name}</td>
                    <td className="p-2 text-right font-semibold">
                      ${transfer.quotation.monetaryAmount} {transfer.quotation.currencyCode}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Transfer Data
                    </div>
                    
                    {/* Transfer Details */}
                    <div>
                      <div className="font-semibold mb-1">Transfer:</div>
                      <div className="pl-2">
                        <div>ID: {transfer.id}</div>
                        <div>Type: {transfer.transferType}</div>
                        <div>Duration: {formatDuration(transfer.duration)}</div>
                        <div>Distance: {transfer.distance.value} {transfer.distance.unit}</div>
                      </div>
                    </div>

                    {/* Pickup */}
                    <div>
                      <div className="font-semibold mb-1">Pickup:</div>
                      <div className="pl-2">
                        <div>Time: {formatDate(transfer.start.dateTime)} at {formatTime(transfer.start.dateTime)}</div>
                        <div>Location: {transfer.start.locationCode}</div>
                        <div>Address: {transfer.start.address.line}</div>
                        <div>{transfer.start.address.cityName}, {transfer.start.address.zip}</div>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div>
                      <div className="font-semibold mb-1">Dropoff:</div>
                      <div className="pl-2">
                        <div>Address: {transfer.end.address.line}</div>
                        <div>{transfer.end.address.cityName}, {transfer.end.address.zip}</div>
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <div className="font-semibold mb-1">Vehicle:</div>
                      <div className="pl-2">
                        <div>Type: {transfer.vehicle.description}</div>
                        <div>Code: {transfer.vehicle.code}</div>
                        <div>Category: {transfer.vehicle.category}</div>
                        <div>Seats: {transfer.vehicle.seats[0].count}</div>
                        <div>Baggage: {transfer.vehicle.baggages[0].count} × {transfer.vehicle.baggages[0].size}</div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <div className="font-semibold mb-1">Pricing:</div>
                      <div className="pl-2">
                        <div>Base: ${transfer.quotation.base.monetaryAmount}</div>
                        <div>Fees: ${transfer.quotation.totalFees.monetaryAmount}</div>
                        <div>Total: ${transfer.quotation.monetaryAmount}</div>
                        <div>Currency: {transfer.quotation.currencyCode}</div>
                      </div>
                    </div>

                    {/* Service Provider */}
                    <div>
                      <div className="font-semibold mb-1">Provider:</div>
                      <div className="pl-2">
                        <div>{transfer.serviceProvider.name}</div>
                        <div>Phone: {transfer.serviceProvider.contacts.phoneNumber}</div>
                        <div>Email: {transfer.serviceProvider.contacts.email}</div>
                      </div>
                    </div>

                    {/* Extra Services */}
                    {transfer.extraServices.length > 0 && (
                      <div>
                        <div className="font-semibold mb-1">Extra Services:</div>
                        <div className="pl-2">
                          {transfer.extraServices.map((service: any, i: number) => (
                            <div key={i}>
                              {service.description}: ${service.quotation.monetaryAmount}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(transfer, null, 2)}
                      </pre>
                    </details>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Activities Table
export function ActivitiesTable({ activities }: { activities: any[] }) {
  amadeusLogger.debug('ActivitiesTable', 'Rendering table', { activityCount: activities.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Categories</th>
              <th className="p-2 font-semibold">Duration</th>
              <th className="p-2 font-semibold">Rating</th>
              <th className="p-2 font-semibold">Location</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <Tooltip key={activity.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{activity.name}</td>
                    <td className="p-2 text-xs">
                      {activity.categories.slice(0, 2).join(', ')}
                    </td>
                    <td className="p-2">{formatDuration(activity.minimumDuration)}</td>
                    <td className="p-2">{activity.rating}★</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {activity.geoCode.latitude.toFixed(4)}, {activity.geoCode.longitude.toFixed(4)}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      ${activity.price.amount} {activity.price.currencyCode}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Activity Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Activity:</div>
                      <div className="pl-2">
                        <div>ID: {activity.id}</div>
                        <div>Name: {activity.name}</div>
                        <div>Rating: {activity.rating}★</div>
                        <div>Duration: {formatDuration(activity.minimumDuration)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Description:</div>
                      <div className="pl-2">
                        <div className="mb-2">{activity.shortDescription}</div>
                        <div>{activity.description}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Categories:</div>
                      <div className="pl-2">
                        {activity.categories.join(', ')}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Location:</div>
                      <div className="pl-2">
                        <div>Latitude: {activity.geoCode.latitude}</div>
                        <div>Longitude: {activity.geoCode.longitude}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Pricing:</div>
                      <div className="pl-2">
                        <div>Amount: ${activity.price.amount}</div>
                        <div>Currency: {activity.price.currencyCode}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Booking:</div>
                      <div className="pl-2">
                        <div className="break-all">{activity.bookingLink}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(activity, null, 2)}
                      </pre>
                    </details>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Cities Table
export function CitiesTable({ cities }: { cities: any[] }) {
  amadeusLogger.debug('CitiesTable', 'Rendering table', { cityCount: cities.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">City</th>
              <th className="p-2 font-semibold">IATA Code</th>
              <th className="p-2 font-semibold">Country</th>
              <th className="p-2 font-semibold">Region</th>
              <th className="p-2 font-semibold">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => (
              <Tooltip key={city.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{city.name}</td>
                    <td className="p-2">{city.iataCode}</td>
                    <td className="p-2">{city.address.countryName}</td>
                    <td className="p-2">{city.address.regionCode}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {city.geoCode.latitude.toFixed(4)}, {city.geoCode.longitude.toFixed(4)}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete City Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">City Information:</div>
                      <div className="pl-2">
                        <div>ID: {city.id}</div>
                        <div>Type: {city.type}</div>
                        <div>SubType: {city.subType}</div>
                        <div>Name: {city.name}</div>
                        <div>Detailed Name: {city.detailedName}</div>
                        <div>IATA Code: {city.iataCode}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Address:</div>
                      <div className="pl-2">
                        <div>City: {city.address.cityName}</div>
                        <div>City Code: {city.address.cityCode}</div>
                        <div>Country: {city.address.countryName}</div>
                        <div>Country Code: {city.address.countryCode}</div>
                        <div>Region: {city.address.regionCode}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Coordinates:</div>
                      <div className="pl-2">
                        <div>Latitude: {city.geoCode.latitude}</div>
                        <div>Longitude: {city.geoCode.longitude}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(city, null, 2)}
                      </pre>
                    </details>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

// Debug Logger Controls
export function DebugLoggerControls() {
  const [logCount, setLogCount] = useState(0);

  const handleClearLogs = () => {
    amadeusLogger.clear();
    setLogCount(0);
    amadeusLogger.info('DebugLoggerControls', 'Logs cleared by user');
  };

  const handleDownloadLogs = () => {
    amadeusLogger.downloadLogs();
    amadeusLogger.info('DebugLoggerControls', 'Logs downloaded by user');
  };

  const handleRefreshCount = () => {
    const count = amadeusLogger.getLogs().length;
    setLogCount(count);
    amadeusLogger.debug('DebugLoggerControls', 'Log count refreshed', { count });
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <div className="text-sm font-semibold">Debug Logger</div>
        <div className="text-xs text-muted-foreground">
          {logCount} logs stored (check browser console for colored output)
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={handleRefreshCount}>
        Refresh Count
      </Button>
      <Button size="sm" variant="outline" onClick={handleDownloadLogs}>
        Download Logs
      </Button>
      <Button size="sm" variant="outline" onClick={handleClearLogs}>
        Clear Logs
      </Button>
    </div>
  );
}
