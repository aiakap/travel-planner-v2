"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// 1. Flight Offers Price Table
export function FlightOffersPriceTable({ offers }: { offers: any[] }) {
  amadeusLogger.debug('FlightOffersPriceTable', 'Rendering table', { count: offers.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Offer ID</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Carrier</th>
              <th className="p-2 font-semibold">Fare Type</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const flightOffer = offer.flightOffers[0];
              const segment = flightOffer.itineraries[0].segments[0];
              
              return (
                <Tooltip key={offer.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{offer.id}</td>
                      <td className="p-2">
                        {segment.departure.iataCode} → {segment.arrival.iataCode}
                      </td>
                      <td className="p-2">{flightOffer.validatingAirlineCodes.join(', ')}</td>
                      <td className="p-2 capitalize">
                        {flightOffer.pricingOptions.fareType.join(', ').toLowerCase()}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${flightOffer.price.total} {flightOffer.price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Flight Offers Price Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Pricing:</div>
                        <div className="pl-2">
                          <div>Base: ${flightOffer.price.base}</div>
                          <div>Total: ${flightOffer.price.total}</div>
                          <div>Grand Total: ${flightOffer.price.grandTotal}</div>
                          <div>Currency: {flightOffer.price.currency}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Flight Details:</div>
                        <div className="pl-2">
                          <div>Source: {flightOffer.source}</div>
                          <div>Last Ticketing: {flightOffer.lastTicketingDate}</div>
                          <div>Validating Airlines: {flightOffer.validatingAirlineCodes.join(', ')}</div>
                        </div>
                      </div>

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

// 2. Flight Create Orders Table
export function FlightCreateOrdersTable({ orders }: { orders: any[] }) {
  amadeusLogger.debug('FlightCreateOrdersTable', 'Rendering table', { count: orders.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Order ID</th>
              <th className="p-2 font-semibold">PNR</th>
              <th className="p-2 font-semibold">Passenger</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const segment = order.flightOffers[0].itineraries[0].segments[0];
              const traveler = order.travelers[0];
              
              return (
                <Tooltip key={order.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{order.id}</td>
                      <td className="p-2">{order.associatedRecords[0].reference}</td>
                      <td className="p-2">{traveler.name.firstName} {traveler.name.lastName}</td>
                      <td className="p-2">
                        {segment.departure.iataCode} → {segment.arrival.iataCode}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${order.flightOffers[0].price.total} {order.flightOffers[0].price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Flight Order Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Order Info:</div>
                        <div className="pl-2">
                          <div>Order ID: {order.id}</div>
                          <div>PNR: {order.associatedRecords[0].reference}</div>
                          <div>Created: {order.associatedRecords[0].creationDate}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Traveler:</div>
                        <div className="pl-2">
                          <div>Name: {traveler.name.firstName} {traveler.name.lastName}</div>
                          <div>DOB: {traveler.dateOfBirth}</div>
                          <div>Gender: {traveler.gender}</div>
                          <div>Email: {traveler.contact.emailAddress}</div>
                          <div>Phone: +{traveler.contact.phones[0].countryCallingCode} {traveler.contact.phones[0].number}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Document:</div>
                        <div className="pl-2">
                          <div>Type: {traveler.documents[0].documentType}</div>
                          <div>Number: {traveler.documents[0].number}</div>
                          <div>Expiry: {traveler.documents[0].expiryDate}</div>
                          <div>Nationality: {traveler.documents[0].nationality}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(order, null, 2)}
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

// 3. Flight Order Management Table
export function FlightOrderManagementTable({ orders }: { orders: any[] }) {
  amadeusLogger.debug('FlightOrderManagementTable', 'Rendering table', { count: orders.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Order ID</th>
              <th className="p-2 font-semibold">Status</th>
              <th className="p-2 font-semibold">PNR</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Passenger</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const segment = order.flightOffers[0].itineraries[0].segments[0];
              const traveler = order.travelers[0];
              
              return (
                <Tooltip key={order.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{order.id}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-2">{order.associatedRecords[0].reference}</td>
                      <td className="p-2">
                        {segment.departure.iataCode} → {segment.arrival.iataCode}
                      </td>
                      <td className="p-2">{traveler.name.firstName} {traveler.name.lastName}</td>
                      <td className="p-2 text-right font-semibold">
                        ${order.flightOffers[0].price.total} {order.flightOffers[0].price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Order Management Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Order Status:</div>
                        <div className="pl-2">
                          <div>ID: {order.id}</div>
                          <div>Status: {order.status}</div>
                          <div>PNR: {order.associatedRecords[0].reference}</div>
                          <div>Created: {order.associatedRecords[0].creationDate}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(order, null, 2)}
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

// 4. Seatmap Display Table
export function SeatmapDisplayTable({ seatmaps }: { seatmaps: any[] }) {
  amadeusLogger.debug('SeatmapDisplayTable', 'Rendering table', { count: seatmaps.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Flight</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Aircraft</th>
              <th className="p-2 font-semibold">Cabin</th>
              <th className="p-2 font-semibold">Sample Seats</th>
            </tr>
          </thead>
          <tbody>
            {seatmaps.map((seatmap, idx) => {
              const deck = seatmap.decks[0];
              const sampleSeats = deck.seats.slice(0, 3);
              
              return (
                <Tooltip key={idx} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{seatmap.carrierCode}{seatmap.number}</td>
                      <td className="p-2">
                        {seatmap.departure.iataCode} → {seatmap.arrival.iataCode}
                      </td>
                      <td className="p-2">{seatmap.aircraft.code}</td>
                      <td className="p-2">{seatmap.class}</td>
                      <td className="p-2 text-xs">
                        {sampleSeats.map((s: any) => s.number).join(', ')}...
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Seatmap Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Flight:</div>
                        <div className="pl-2">
                          <div>Flight: {seatmap.carrierCode}{seatmap.number}</div>
                          <div>Aircraft: {seatmap.aircraft.code}</div>
                          <div>Departure: {seatmap.departure.iataCode} at {formatTime(seatmap.departure.at)}</div>
                          <div>Arrival: {seatmap.arrival.iataCode} at {formatTime(seatmap.arrival.at)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Deck Configuration:</div>
                        <div className="pl-2">
                          <div>Type: {deck.deckType}</div>
                          <div>Width: {deck.deckConfiguration.width} seats</div>
                          <div>Rows: {deck.deckConfiguration.startSeatRow}-{deck.deckConfiguration.endSeatRow}</div>
                          <div>Exit Rows: {deck.deckConfiguration.exitRowsX.join(', ')}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Sample Seats:</div>
                        <div className="pl-2">
                          {deck.seats.slice(0, 5).map((seat: any, i: number) => (
                            <div key={i} className="mb-1">
                              <div>Seat {seat.number}: {seat.travelerPricing[0].seatAvailabilityStatus}</div>
                              {seat.travelerPricing[0].price && (
                                <div className="text-muted-foreground">
                                  Price: ${seat.travelerPricing[0].price.total}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(seatmap, null, 2)}
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

// 5. Flight Inspirations Table
export function FlightInspirationsTable({ inspirations }: { inspirations: any[] }) {
  amadeusLogger.debug('FlightInspirationsTable', 'Rendering table', { count: inspirations.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Origin</th>
              <th className="p-2 font-semibold">Destination</th>
              <th className="p-2 font-semibold">Departure</th>
              <th className="p-2 font-semibold">Return</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {inspirations.map((insp, idx) => (
              <Tooltip key={idx} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{insp.origin}</td>
                    <td className="p-2">{insp.destination}</td>
                    <td className="p-2">{insp.departureDate}</td>
                    <td className="p-2">{insp.returnDate}</td>
                    <td className="p-2 text-right font-semibold">
                      ${insp.price.total} {insp.price.currency}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Flight Inspiration Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Destination:</div>
                      <div className="pl-2">
                        <div>From: {insp.origin}</div>
                        <div>To: {insp.destination}</div>
                        <div>Departure: {insp.departureDate}</div>
                        <div>Return: {insp.returnDate}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Pricing:</div>
                      <div className="pl-2">
                        <div>Total: ${insp.price.total}</div>
                        <div>Currency: {insp.price.currency}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(insp, null, 2)}
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

// 6. Flight Choice Prediction Table
export function FlightChoicePredictionTable({ predictions }: { predictions: any[] }) {
  amadeusLogger.debug('FlightChoicePredictionTable', 'Rendering table', { count: predictions.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Flight</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Prediction Score</th>
              <th className="p-2 font-semibold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred) => {
              const segment = pred.itineraries[0].segments[0];
              const score = parseFloat(pred.choiceProbability) * 100;
              
              return (
                <Tooltip key={pred.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{segment.carrierCode}{segment.number}</td>
                      <td className="p-2">
                        {segment.departure.iataCode} → {segment.arrival.iataCode}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span>{score.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${pred.price.total} {pred.price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Flight Choice Prediction Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Prediction:</div>
                        <div className="pl-2">
                          <div>Choice Probability: {pred.choiceProbability} ({score.toFixed(1)}%)</div>
                          <div>Flight ID: {pred.id}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Flight:</div>
                        <div className="pl-2">
                          <div>Carrier: {segment.carrierCode}</div>
                          <div>Flight: {segment.number}</div>
                          <div>Route: {segment.departure.iataCode} → {segment.arrival.iataCode}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(pred, null, 2)}
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

// 7. Flight Price Analysis Table
export function FlightPriceAnalysisTable({ analysis }: { analysis: any[] }) {
  amadeusLogger.debug('FlightPriceAnalysisTable', 'Rendering table', { count: analysis.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Date</th>
              <th className="p-2 font-semibold">Current Price</th>
              <th className="p-2 font-semibold">Average</th>
              <th className="p-2 font-semibold">Ranking</th>
            </tr>
          </thead>
          <tbody>
            {analysis.map((item, idx) => (
              <Tooltip key={idx} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">
                      {item.origin.iataCode} → {item.destination.iataCode}
                    </td>
                    <td className="p-2">{item.departureDate}</td>
                    <td className="p-2">${item.priceMetrics[0].amount}</td>
                    <td className="p-2">${item.priceHistory.average}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.priceMetrics[0].quartileRanking === 'MEDIUM' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.priceMetrics[0].quartileRanking}
                      </span>
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Price Analysis Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Route:</div>
                      <div className="pl-2">
                        <div>From: {item.origin.iataCode}</div>
                        <div>To: {item.destination.iataCode}</div>
                        <div>Date: {item.departureDate}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Price Analysis:</div>
                      <div className="pl-2">
                        <div>Current: ${item.priceMetrics[0].amount} {item.currency}</div>
                        <div>Average: ${item.priceHistory.average}</div>
                        <div>Minimum: ${item.priceHistory.minimum}</div>
                        <div>Maximum: ${item.priceHistory.maximum}</div>
                        <div>Ranking: {item.priceMetrics[0].quartileRanking}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(item, null, 2)}
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

// 8. Hotel Booking Table
export function HotelBookingTable({ bookings }: { bookings: any[] }) {
  amadeusLogger.debug('HotelBookingTable', 'Rendering table', { count: bookings.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Booking ID</th>
              <th className="p-2 font-semibold">Hotel</th>
              <th className="p-2 font-semibold">Guest</th>
              <th className="p-2 font-semibold">Check-in</th>
              <th className="p-2 font-semibold">Check-out</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const guest = booking.guests[0];
              
              return (
                <Tooltip key={booking.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{booking.id}</td>
                      <td className="p-2">{booking.hotel.name}</td>
                      <td className="p-2">{guest.firstName} {guest.lastName}</td>
                      <td className="p-2">{booking.checkInDate}</td>
                      <td className="p-2">{booking.checkOutDate}</td>
                      <td className="p-2 text-right font-semibold">
                        ${booking.price.total} {booking.price.currency}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Hotel Booking Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Booking:</div>
                        <div className="pl-2">
                          <div>ID: {booking.id}</div>
                          <div>Confirmation: {booking.providerConfirmationId}</div>
                          <div>Reference: {booking.associatedRecords[0].reference}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Hotel:</div>
                        <div className="pl-2">
                          <div>Name: {booking.hotel.name}</div>
                          <div>Hotel ID: {booking.hotel.hotelId}</div>
                          <div>City: {booking.hotel.cityCode}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Guest:</div>
                        <div className="pl-2">
                          <div>Name: {guest.title} {guest.firstName} {guest.lastName}</div>
                          <div>Phone: {guest.phone}</div>
                          <div>Email: {guest.email}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Stay:</div>
                        <div className="pl-2">
                          <div>Check-in: {booking.checkInDate}</div>
                          <div>Check-out: {booking.checkOutDate}</div>
                          <div>Rooms: {booking.roomQuantity}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Pricing:</div>
                        <div className="pl-2">
                          <div>Base: ${booking.price.base}</div>
                          <div>Total: ${booking.price.total}</div>
                          <div>Currency: {booking.price.currency}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(booking, null, 2)}
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

// 9. Hotel Ratings Table
export function HotelRatingsTable({ ratings }: { ratings: any[] }) {
  amadeusLogger.debug('HotelRatingsTable', 'Rendering table', { count: ratings.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Hotel ID</th>
              <th className="p-2 font-semibold">Overall Rating</th>
              <th className="p-2 font-semibold">Reviews</th>
              <th className="p-2 font-semibold">Top Categories</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((rating) => {
              const topCategories = Object.entries(rating.sentiments)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 3)
                .map(([key]) => key);
              
              return (
                <Tooltip key={rating.hotelId} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{rating.hotelId}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${rating.overallRating}%` }}
                            />
                          </div>
                          <span className="font-semibold">{rating.overallRating}/100</span>
                        </div>
                      </td>
                      <td className="p-2">{rating.numberOfReviews.toLocaleString()}</td>
                      <td className="p-2 text-xs">
                        {topCategories.map(c => c.replace(/([A-Z])/g, ' $1').trim()).join(', ')}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Hotel Ratings Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Overall:</div>
                        <div className="pl-2">
                          <div>Hotel ID: {rating.hotelId}</div>
                          <div>Overall Rating: {rating.overallRating}/100</div>
                          <div>Reviews: {rating.numberOfReviews.toLocaleString()}</div>
                          <div>Ratings: {rating.numberOfRatings.toLocaleString()}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Category Scores:</div>
                        <div className="pl-2 grid grid-cols-2 gap-2">
                          {Object.entries(rating.sentiments).map(([key, value]: any) => (
                            <div key={key}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}: {value}/100
                            </div>
                          ))}
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(rating, null, 2)}
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

// 10. Hotel Name Autocomplete Table
export function HotelNameAutocompleteTable({ hotels }: { hotels: any[] }) {
  amadeusLogger.debug('HotelNameAutocompleteTable', 'Rendering table', { count: hotels.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Hotel Name</th>
              <th className="p-2 font-semibold">City</th>
              <th className="p-2 font-semibold">Hotel ID</th>
              <th className="p-2 font-semibold">Relevance</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <Tooltip key={hotel.hotelId} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{hotel.name}</td>
                    <td className="p-2">{hotel.address.cityName}</td>
                    <td className="p-2">{hotel.hotelId}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${hotel.relevance}%` }}
                          />
                        </div>
                        <span>{hotel.relevance}%</span>
                      </div>
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Hotel Autocomplete Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Hotel:</div>
                      <div className="pl-2">
                        <div>Name: {hotel.name}</div>
                        <div>Hotel ID: {hotel.hotelId}</div>
                        <div>Type: {hotel.subType}</div>
                        <div>IATA: {hotel.iataCode}</div>
                        <div>Relevance: {hotel.relevance}%</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Location:</div>
                      <div className="pl-2">
                        <div>City: {hotel.address.cityName}</div>
                        <div>Country: {hotel.address.countryCode}</div>
                        <div>Coordinates: {hotel.geoCode.latitude}, {hotel.geoCode.longitude}</div>
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

// 11. Transfer Booking Table
export function TransferBookingTable({ bookings }: { bookings: any[] }) {
  amadeusLogger.debug('TransferBookingTable', 'Rendering table', { count: bookings.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Booking ID</th>
              <th className="p-2 font-semibold">Reference</th>
              <th className="p-2 font-semibold">Type</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Status</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const transfer = booking.transfers[0];
              const traveler = booking.travelers[0];
              
              return (
                <Tooltip key={booking.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{booking.id}</td>
                      <td className="p-2">{booking.reference}</td>
                      <td className="p-2 capitalize">{transfer.transferType.toLowerCase()}</td>
                      <td className="p-2">
                        {transfer.start.locationCode} → {transfer.end.address.cityName}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${transfer.quotation.monetaryAmount} {transfer.quotation.currencyCode}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Transfer Booking Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Booking:</div>
                        <div className="pl-2">
                          <div>ID: {booking.id}</div>
                          <div>Reference: {booking.reference}</div>
                          <div>Status: {booking.status}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Transfer:</div>
                        <div className="pl-2">
                          <div>Type: {transfer.transferType}</div>
                          <div>Vehicle: {transfer.vehicle.description}</div>
                          <div>From: {transfer.start.locationCode} - {transfer.start.address.line}</div>
                          <div>To: {transfer.end.address.line}, {transfer.end.address.cityName}</div>
                          <div>Date/Time: {formatDate(transfer.start.dateTime)} at {formatTime(transfer.start.dateTime)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Traveler:</div>
                        <div className="pl-2">
                          <div>Name: {traveler.firstName} {traveler.lastName}</div>
                          <div>Phone: {traveler.contacts.phoneNumber}</div>
                          <div>Email: {traveler.contacts.email}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(booking, null, 2)}
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

// 12. Transfer Management Table
export function TransferManagementTable({ orders }: { orders: any[] }) {
  amadeusLogger.debug('TransferManagementTable', 'Rendering table', { count: orders.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Order ID</th>
              <th className="p-2 font-semibold">Reference</th>
              <th className="p-2 font-semibold">Status</th>
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const transfer = order.transfers[0];
              
              return (
                <Tooltip key={order.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">{order.id}</td>
                      <td className="p-2">{order.reference}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-2">
                        {transfer.start.locationCode} → {transfer.end.address.cityName}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ${transfer.quotation.monetaryAmount} {transfer.quotation.currencyCode}
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Transfer Management Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Order:</div>
                        <div className="pl-2">
                          <div>ID: {order.id}</div>
                          <div>Reference: {order.reference}</div>
                          <div>Status: {order.status}</div>
                          <div>Confirmation: {order.confirmNbr}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Transfer:</div>
                        <div className="pl-2">
                          <div>Type: {transfer.transferType}</div>
                          <div>From: {transfer.start.locationCode}</div>
                          <div>To: {transfer.end.address.line}, {transfer.end.address.cityName}</div>
                          <div>Date/Time: {formatDate(transfer.start.dateTime)} at {formatTime(transfer.start.dateTime)}</div>
                          <div>Price: ${transfer.quotation.monetaryAmount} {transfer.quotation.currencyCode}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(order, null, 2)}
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

// 13. Trip Purpose Prediction Table
export function TripPurposePredictionTable({ predictions }: { predictions: any[] }) {
  amadeusLogger.debug('TripPurposePredictionTable', 'Rendering table', { count: predictions.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Route</th>
              <th className="p-2 font-semibold">Dates</th>
              <th className="p-2 font-semibold">Prediction</th>
              <th className="p-2 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred) => {
              const confidence = parseFloat(pred.probability) * 100;
              
              return (
                <Tooltip key={pred.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                      <td className="p-2 font-medium">
                        {pred.origin.iataCode} → {pred.destination.iataCode}
                      </td>
                      <td className="p-2 text-xs">
                        {pred.departureDate} to {pred.returnDate}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          pred.result === 'BUSINESS' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {pred.result}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span>{confidence.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-2xl p-4">
                    <div className="space-y-3 text-xs">
                      <div className="font-semibold text-sm border-b pb-2">
                        Complete Trip Purpose Prediction Data
                      </div>
                      
                      <div>
                        <div className="font-semibold mb-1">Prediction:</div>
                        <div className="pl-2">
                          <div>ID: {pred.id}</div>
                          <div>Result: {pred.result}</div>
                          <div>Probability: {pred.probability} ({confidence.toFixed(1)}%)</div>
                          <div>Type: {pred.subType}</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Trip:</div>
                        <div className="pl-2">
                          <div>From: {pred.origin.iataCode}</div>
                          <div>To: {pred.destination.iataCode}</div>
                          <div>Departure: {pred.departureDate}</div>
                          <div>Return: {pred.returnDate}</div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                          {JSON.stringify(pred, null, 2)}
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

// 14. Points of Interest Table
export function PointsOfInterestTable({ pois }: { pois: any[] }) {
  amadeusLogger.debug('PointsOfInterestTable', 'Rendering table', { count: pois.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Category</th>
              <th className="p-2 font-semibold">Rank</th>
              <th className="p-2 font-semibold">Tags</th>
              <th className="p-2 font-semibold">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {pois.map((poi) => (
              <Tooltip key={poi.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{poi.name}</td>
                    <td className="p-2">{poi.category}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${poi.rank}%` }}
                          />
                        </div>
                        <span>{poi.rank}</span>
                      </div>
                    </td>
                    <td className="p-2 text-xs">
                      {poi.tags.slice(0, 3).join(', ')}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {poi.geoCode.latitude.toFixed(4)}, {poi.geoCode.longitude.toFixed(4)}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Point of Interest Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">POI:</div>
                      <div className="pl-2">
                        <div>Name: {poi.name}</div>
                        <div>ID: {poi.id}</div>
                        <div>Type: {poi.subType}</div>
                        <div>Category: {poi.category}</div>
                        <div>Rank: {poi.rank}/100</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Tags:</div>
                      <div className="pl-2">
                        {poi.tags.join(', ')}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Location:</div>
                      <div className="pl-2">
                        <div>Latitude: {poi.geoCode.latitude}</div>
                        <div>Longitude: {poi.geoCode.longitude}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(poi, null, 2)}
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

// 15. Safe Place Table
export function SafePlaceTable({ places }: { places: any[] }) {
  amadeusLogger.debug('SafePlaceTable', 'Rendering table', { count: places.length });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-2 font-semibold">Location</th>
              <th className="p-2 font-semibold">Overall Score</th>
              <th className="p-2 font-semibold">Medical</th>
              <th className="p-2 font-semibold">Safety</th>
              <th className="p-2 font-semibold">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <Tooltip key={place.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <tr className="border-b hover:bg-muted/50 cursor-help transition-colors">
                    <td className="p-2 font-medium">{place.name}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${place.safetyScores.overall}%` }}
                          />
                        </div>
                        <span className="font-semibold">{place.safetyScores.overall}/100</span>
                      </div>
                    </td>
                    <td className="p-2">{place.safetyScores.medical}/100</td>
                    <td className="p-2">{place.safetyScores.physicalHarm}/100</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {place.geoCode.latitude.toFixed(4)}, {place.geoCode.longitude.toFixed(4)}
                    </td>
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-2xl p-4">
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-sm border-b pb-2">
                      Complete Safe Place Data
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1">Location:</div>
                      <div className="pl-2">
                        <div>Name: {place.name}</div>
                        <div>ID: {place.id}</div>
                        <div>Type: {place.subType}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Safety Scores:</div>
                      <div className="pl-2 grid grid-cols-2 gap-2">
                        {Object.entries(place.safetyScores).map(([key, value]: any) => (
                          <div key={key}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}: {value}/100
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold mb-1">Coordinates:</div>
                      <div className="pl-2">
                        <div>Latitude: {place.geoCode.latitude}</div>
                        <div>Longitude: {place.geoCode.longitude}</div>
                      </div>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-64">
                        {JSON.stringify(place, null, 2)}
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
