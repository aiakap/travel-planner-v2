/**
 * Car Rental Extraction Plugin
 * 
 * Extracts car rental booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { carRentalExtractionSchema } from '@/lib/schemas/car-rental-extraction-schema';

export const CAR_RENTAL_EXTRACTION_PROMPT = `## Car Rental Booking Extraction

Extract car rental booking information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Reservation or confirmation number (e.g., "00125899341", "RES-2026-ABC")
- **Guest Name**: Full name from reservation (e.g., "ANDERSON/THOMAS", "Jane Smith")
- **Company**: Car rental company name (e.g., "Toyota Rent a Car", "Hertz", "Enterprise")
- **Booking Date**: Date when booking was made in ISO format YYYY-MM-DD (e.g., "2026-01-26") or empty string
- **Total Cost**: Total estimated cost as a number (e.g., 98450.00) or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "JPY") or empty string
- **One-way Charge**: Additional charge for one-way rentals as a number or 0 if round-trip

**Vehicle Details:**
- **Vehicle Class**: Vehicle class or category (e.g., "W3 Class (SUV / 4WD)", "Economy", "Compact") or empty string
- **Vehicle Model**: Specific vehicle model or similar options (e.g., "Harrier, RAV4, or similar") or empty string
- **Options**: Array of options/accessories included (e.g., ["GPS", "Winter Tires", "Ski Rack"]) or empty array

**Pickup Details:**
- **Pickup Location**: Name of pickup location (e.g., "New Chitose Airport Poplar Shop")
- **Pickup Address**: Full address of pickup location or empty string if not provided
- **Pickup Date**: Date of pickup in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Pickup Time**: Time of pickup in 12-hour format with AM/PM (e.g., "2:00 PM", "14:00") or empty string
- **Pickup Flight Number**: Arrival flight number if pickup is at airport (e.g., "NH215", "UA875") or empty string

**Return Details:**
- **Return Location**: Name of return/drop-off location (e.g., "New Chitose Airport Poplar Shop")
- **Return Address**: Full address of return location or empty string if not provided
- **Return Date**: Date of return in ISO format YYYY-MM-DD (e.g., "2026-02-06") - REQUIRED
- **Return Time**: Time of return in 12-hour format with AM/PM (e.g., "11:00 AM", "11:00") or empty string

### Date Format Conversion Guide

Car rental companies use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Thursday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Toyota Rent a Car Confirmation

INPUT TEXT:
[TOYOTA Rent a Car] Reservation Confirmation (No. 00125899341)

Dear Thomas Anderson,

Thank you for your reservation with TOYOTA Rent a Car.

Reservation Number: 00125899341
Guest Name: Thomas Anderson
Booking Date: January 26, 2026

Vehicle Details:
- Class: W3 Class (SUV / 4WD)
- Model: Harrier, RAV4, or similar
- Features: 4WD, Winter Tires, GPS Navigation, ETC Card, Ski Rack

Pickup Information:
- Location: New Chitose Airport Poplar Shop
- Address: New Chitose Airport Terminal Building, Chitose, Hokkaido
- Date: January 30, 2026
- Time: 14:00 (2:00 PM)
- Arrival Flight: NH215

Return Information:
- Location: New Chitose Airport Poplar Shop
- Address: New Chitose Airport Terminal Building, Chitose, Hokkaido
- Date: February 6, 2026
- Time: 11:00 (11:00 AM)

Total Cost: ¥98,450 (including taxes and fees)

EXPECTED OUTPUT:
{
  "confirmationNumber": "00125899341",
  "guestName": "Thomas Anderson",
  "company": "Toyota Rent a Car",
  "vehicleClass": "W3 Class (SUV / 4WD)",
  "vehicleModel": "Harrier, RAV4, or similar",
  "pickupLocation": "New Chitose Airport Poplar Shop",
  "pickupAddress": "New Chitose Airport Terminal Building, Chitose, Hokkaido",
  "pickupDate": "2026-01-30",
  "pickupTime": "2:00 PM",
  "pickupFlightNumber": "NH215",
  "returnLocation": "New Chitose Airport Poplar Shop",
  "returnAddress": "New Chitose Airport Terminal Building, Chitose, Hokkaido",
  "returnDate": "2026-02-06",
  "returnTime": "11:00 AM",
  "totalCost": 98450,
  "currency": "JPY",
  "options": ["4WD", "Winter Tires", "GPS Navigation", "ETC Card", "Ski Rack"],
  "oneWayCharge": 0,
  "bookingDate": "2026-01-26"
}

### Critical Rules

1. **NEVER leave pickup or return dates empty** - These are REQUIRED fields
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in 12-hour format with AM/PM when available** - Or use 24-hour format (e.g., "14:00")
4. **Extract each option/accessory separately** - GPS, Winter Tires, Child Seat, etc.
5. **Determine if one-way rental** - Different pickup and return locations = one-way
6. **Use empty strings for missing optional fields** - Not null or undefined
7. **Use 0 for missing numeric fields** - totalCost, oneWayCharge default to 0
8. **Use empty arrays for missing options** - Not null or undefined
9. **Guest names may use LAST/FIRST format** - Keep as-is from the confirmation
10. **Look for currency symbols** - ¥ = JPY, $ = USD, € = EUR, £ = GBP

### Common Email Patterns

- **Major Rental Companies:** Hertz, Enterprise, Avis, Budget, National, Alamo, Sixt, Thrifty, Dollar, Europcar, Toyota Rent a Car
- **Look for phrases:** "Reservation Confirmation", "Booking Number", "Pick-up", "Drop-off", "Return"
- **Vehicle information** often in separate section with class and model details
- **Options/accessories** listed as add-ons or included features (GPS/Navigation, Winter Tires, Child Seat, Ski Rack, Snow Chains, ETC Card, Additional Driver, Insurance packages)
- **Airport rentals** often include terminal and flight information
- **One-way rentals** have different pickup and return locations with additional charges
- **Round-trip rentals** have same pickup and return location (one-way charge = 0)
- **Total cost** may include breakdown of base rate, taxes, fees, and options
- **Pickup/return times** may be in 12-hour (2:00 PM) or 24-hour (14:00) format`;

export const carRentalExtractionPlugin: ExtractionPlugin = {
  id: 'car-rental-extraction',
  name: 'Car Rental Booking Extraction',
  content: CAR_RENTAL_EXTRACTION_PROMPT,
  schema: carRentalExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const carRentalKeywords = [
      // Traditional car rental
      'car rental', 'rent a car', 'rental car', 'vehicle rental',
      'pick-up', 'pickup', 'drop-off', 'return location',
      'hertz', 'enterprise', 'avis', 'budget', 'toyota rent',
      'sixt', 'alamo', 'national', 'thrifty', 'europcar', 'dollar',
      'reservation number', 'rental agreement', 'vehicle class',
      'rental confirmation', 'car hire',
      
      // Private driver / transfer keywords
      'driver', 'transfer', 'shuttle', 'chauffeur', 'airport pickup',
      'name board', 'arrival hall', 'private car', 'meet and greet',
      'driver will be waiting', 'showing a name board', 'drive normally takes',
      'transfer service', 'airport transfer', 'private transfer',
      
      // Ride share keywords
      'uber', 'lyft', 'ride share', 'rideshare',
      
      // Taxi keywords
      'taxi', 'cab', 'taxi booking'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const carRentalScore = carRentalKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 keywords are present (covers all ground transportation)
    return carRentalScore >= 3;
  }
};
