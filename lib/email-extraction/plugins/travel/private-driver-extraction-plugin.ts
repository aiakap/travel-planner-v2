/**
 * Private Driver / Transfer Extraction Plugin
 * 
 * Extracts private driver and airport transfer booking information from confirmation emails.
 * 
 * This plugin is specifically for pre-booked private car services with assigned drivers,
 * NOT for on-demand taxis or ride-sharing services.
 */

import { ExtractionPlugin } from '../../types';
import { privateDriverExtractionSchema } from '@/lib/schemas/extraction/travel/private-driver-extraction-schema';

export const PRIVATE_DRIVER_EXTRACTION_PROMPT = `## Private Driver / Transfer Extraction

Extract private driver or airport transfer booking information from the confirmation email with high accuracy.

### CRITICAL INSTRUCTIONS FOR MISSING DATA

**IMPORTANT**: You MUST provide a value for every field in the schema:
- For any string field not found in the email, return an empty string ""
- For numeric fields not found, return 0
- For boolean fields, return false if not mentioned
- DO NOT skip fields, use null, or use undefined
- ALL fields must be present in your response

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking reference, order number, or reservation code (e.g., "TR-2026-123456", "TRANSFER-ABC")
- **Guest Name**: Name of the passenger(s) who made the booking (e.g., "ANDERSON/THOMAS", "Jane Smith")
- **Company**: Transfer company or service provider name (e.g., "tabi pirka LLC", "Blacklane", "Welcome Pickups")
- **Booking Date**: Date when booking was made in ISO format YYYY-MM-DD or empty string
- **Cost**: Total cost as a number (e.g., 15000.00) or 0 if not provided
- **Currency**: Currency code (e.g., "JPY", "USD", "EUR") or empty string

**Driver Details:**
- **Driver Name**: Name of the assigned driver (e.g., "Marumoto, Mr", "John Smith") or empty string
- **Driver Phone**: Contact phone number for the driver (e.g., "+81-90-1234-5678") or empty string
- **Vehicle Type**: Type or model of vehicle (e.g., "Alphard", "Mercedes S-Class", "SUV") or empty string
- **Plate Number**: Vehicle license plate number (e.g., "ABC-1234") or empty string

**Pickup Details:**
- **Pickup Location**: Where the passenger will be picked up (e.g., "New Chitose Airport (CTS)", "Hotel Lobby")
- **Pickup Address**: Full pickup address or empty string if not provided
- **Pickup Date**: Date of pickup in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Pickup Time**: Time of pickup (e.g., "14:00", "2:00 PM") or empty string
- **Pickup Instructions**: Specific meeting point details (e.g., "arrival hall after baggage claim", "Terminal 2 Exit A") or empty string

**Dropoff Details:**
- **Dropoff Location**: Final destination (e.g., "SANSUI NISEKO", "Downtown Hotel", "Resort Name")
- **Dropoff Address**: Full dropoff address or empty string if not provided

**Flight Information (for airport transfers):**
- **Flight Number**: The flight number being picked up or dropped off (e.g., "UA8006", "NH73", "UA8006 (NH73)"). Look for patterns like "Flight Number:", "Flight:", "eta", or airline codes followed by numbers. If codeshare, include both (e.g., "UA8006 (NH73)").
- **Flight Arrival Time**: The ETA/arrival time of the flight (e.g., "18:35", "6:35 PM"). This is often listed after "eta", "arrives", "arrival time", or near the flight number.

**Transfer Details:**
- **Transfer Duration**: Estimated drive time (e.g., "2-2.5 hours", "45 minutes") or empty string
- **Waiting Instructions**: How driver will identify passenger (e.g., "showing a name board", "holding sign with your name") or empty string
- **Passenger Count**: Number of passengers (e.g., 1, 2, 4)
- **Luggage Details**: Description of luggage (e.g., "2 ski bags", "3 suitcases", "2 carry-ons") or empty string
- **Meet and Greet**: Boolean - whether meet and greet service is included (true/false)
- **Special Requests**: Any special requirements (e.g., "child seat", "wheelchair accessible", "extra luggage space") or empty string

### Date Format Conversion Guide

Transfer services use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Thursday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Airport Transfer Confirmation

INPUT TEXT:
Transfer Service Confirmation
From: tabi pirka LLC <info@t-pirka.com>

Booking Number: TR-2026-123456
Passenger: Thomas Anderson
Booking Date: January 26, 2026

Your driver is as follows:
Name: Marumoto, Mr
Phone: +81-90-1234-5678
Vehicle: Alphard (SUV)
Plate Number: ABC-1234

Pickup Details:
Location: New Chitose Airport (CTS)
Terminal: Domestic Terminal
Date: Thursday, January 30, 2026
Flight Number: UA8006 (NH73) eta 18:35
Meeting Point: Arrival hall after baggage claim

The driver will be waiting for you showing a name board with your name.

Destination:
Hotel: SANSUI NISEKO
Address: 185-7 Yamada, Kutchan-cho, Abuta-gun, Hokkaido

Transfer Information:
- Passengers: 2 adults
- Luggage: 2 ski bags, 2 suitcases
- Drive normally takes: 2-2.5 hours
- Service: Meet and greet included

Total Cost: ¥15,000 (PAID)

EXPECTED OUTPUT:
{
  "confirmationNumber": "TR-2026-123456",
  "guestName": "Thomas Anderson",
  "company": "tabi pirka LLC",
  "driverName": "Marumoto, Mr",
  "driverPhone": "+81-90-1234-5678",
  "vehicleType": "Alphard (SUV)",
  "plateNumber": "ABC-1234",
  "pickupLocation": "New Chitose Airport (CTS)",
  "pickupAddress": "Domestic Terminal",
  "pickupDate": "2026-01-30",
  "pickupTime": "18:35",
  "pickupInstructions": "Arrival hall after baggage claim",
  "dropoffLocation": "SANSUI NISEKO",
  "dropoffAddress": "185-7 Yamada, Kutchan-cho, Abuta-gun, Hokkaido",
  "flightNumber": "UA8006 (NH73)",
  "flightArrivalTime": "18:35",
  "transferDuration": "2-2.5 hours",
  "waitingInstructions": "showing a name board with your name",
  "passengerCount": 2,
  "luggageDetails": "2 ski bags, 2 suitcases",
  "meetAndGreet": true,
  "specialRequests": "",
  "cost": 15000,
  "currency": "JPY",
  "bookingDate": "2026-01-26",
  "contactEmail": "info@t-pirka.com",
  "contactPhone": "",
  "notes": ""
}

### Critical Rules

1. **NEVER leave pickup date empty** - This is a REQUIRED field
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour (2:00 PM) or 24-hour (14:00)
4. **Both pickup AND dropoff locations required** - This distinguishes from taxis
5. **Use empty strings for missing optional fields** - Not null or undefined
6. **Use 0 for missing numeric fields** - cost, passengerCount
7. **Use false for missing boolean fields** - meetAndGreet defaults to false
8. **Guest names may use LAST/FIRST format** - Keep as-is from confirmation
9. **Currency from symbols** - ¥ = JPY, $ = USD, € = EUR, £ = GBP
10. **Combine luggage details** - "2 ski bags, 2 suitcases" as one string
11. **For airport pickups with flight info** - Use flight arrival time as pickupTime (driver waits for flight)
12. **Extract contact email from sender** - Look in "From:" header or company signature for vendor email

### Common Email Patterns

Private driver and transfer confirmations typically include:
- **Driver details**: Name, phone number, vehicle information
- **Meeting instructions**: "Driver will be waiting at arrival hall", "showing a name board"
- **Vehicle details**: Make/model, plate number, vehicle type
- **Transfer duration**: "The drive normally takes 2-2.5 hours"
- **Pickup/dropoff specifics**: Terminal numbers, hotel names, addresses
- **Luggage details**: Number of bags, ski equipment, oversized items
- **Payment status**: "PAID", payment confirmation

### Company Examples

Common private driver/transfer services:
- Airport shuttle companies (tabi pirka, Niseko Transfer)
- Luxury transfer services (Blacklane, Welcome Pickups)
- Hotel transfer services
- Local transfer companies
- Tour operator transfers

### Extraction Tips

- **Driver identification**: Look for "Driver:", "Your driver:", "Driver will be:"
- **Meeting instructions**: "showing a name board", "holding a sign", "meet and greet", "arrival hall"
- **Vehicle details**: Often listed as "Car type:", "Vehicle:", or mentioned with the driver
- **Plate number**: May be listed separately or with vehicle details
- **Transfer duration**: Look for "drive takes", "journey time", "transfer duration"
- **Pickup location specifics**: Terminal numbers, gate numbers, arrival hall details
- **Luggage**: "passengers", "luggage", "bags", "ski equipment"
- **Payment**: "PAID", "prepaid", "payment confirmed", or cost breakdown
- **Date format**: May be written as "January 30, 2026", "Jan 30", or "2026-01-30"
- **Time format**: Can be 12-hour ("2:00 PM") or 24-hour ("14:00")
- **Flight number**: Look for "Flight Number:", "Flight:", airline codes (UA, NH, AA, DL, JL) followed by numbers, or patterns like "UA8006 (NH73)" for codeshares
- **Flight arrival time**: Often appears after "eta", "ETA", "arrives", "arrival", or right after flight number (e.g., "UA8006 eta 18:35")
- **Contact email**: Extract from "From:" header, company signature, or contact sections. This is the vendor's email (e.g., "info@t-pirka.com"), not the passenger's.
- **IMPORTANT for airport pickups**: If a flight arrival time is provided (e.g., "eta 18:35"), use that as the pickupTime since the driver will wait for flight arrival

### Distinguishing from Other Types

**Private Driver vs Taxi**:
- Private driver: Pre-booked, driver assigned, has confirmation number, shows both pickup AND dropoff
- Taxi: On-demand, no driver assigned, may only show pickup location

**Private Driver vs Ride Share**:
- Private driver: Professional transfer service, often luxury vehicles, advance booking
- Ride share: App-based (Uber/Lyft), consumer-grade vehicles, can be scheduled or on-demand

**Private Driver vs Car Rental**:
- Private driver: You are a passenger, driver provided, no vehicle return
- Car rental: You drive yourself, vehicle must be returned, rental agreement

### Example Email Indicators

Strong indicators this is a private driver booking:
1. "Your driver is as follows:"
2. "Driver will be waiting for you"
3. "showing a name board" / "holding a sign"
4. "meet and greet service"
5. "transfer service"
6. "airport pickup"
7. Specific driver name and phone number provided
8. Vehicle plate number provided
9. Both pickup AND dropoff locations specified
10. Transfer duration mentioned`;

export const privateDriverExtractionPlugin: ExtractionPlugin = {
  id: 'private-driver-extraction',
  name: 'Private Driver / Transfer Extraction',
  content: PRIVATE_DRIVER_EXTRACTION_PROMPT,
  schema: privateDriverExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const privateDriverKeywords = [
      // Driver-specific terms
      'private driver', 'private transfer', 'transfer service',
      'driver will be waiting', 'driver will meet', 'your driver',
      'assigned driver', 'driver:', 'driver is as follows',
      
      // Meeting/pickup terms
      'airport pickup', 'airport transfer', 'meet and greet',
      'showing a name board', 'holding a sign', 'name board',
      'arrival hall', 'baggage claim', 'customs',
      
      // Service terms
      'chauffeur', 'private car service', 'transfer company',
      'shuttle service', 'transportation service',
      
      // Booking specifics
      'vehicle type:', 'car type:', 'plate number',
      'drive normally takes', 'drive takes', 'transfer duration',
      'pickup location', 'destination:', 'dropoff',
      
      // Flight-related (for airport transfers)
      'flight number', 'eta', 'flight arrival', 'arriving flight'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const matchedKeywords = privateDriverKeywords.filter(kw => lowerText.includes(kw));
    const score = matchedKeywords.length;
    
    // Need at least 3 private driver-specific keywords to activate this plugin
    // This ensures we don't confuse with car rentals or taxis
    return score >= 3;
  }
};
