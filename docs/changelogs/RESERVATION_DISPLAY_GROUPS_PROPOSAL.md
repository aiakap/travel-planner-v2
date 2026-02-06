# Reservation Display Groups Proposal

## Overview

Instead of creating 33 different templates (one per type), we group reservations by their **UI/data requirements** into logical display groups. This reduces complexity while allowing fine-grained control.

## Proposed Display Groups

### 1. **POINT_TO_POINT_TRANSPORT** 
*For transportation with distinct departure and arrival locations*

**Types:**
- Flight
- Train
- Bus
- Ferry
- Cruise

**Key Features:**
- ✅ Departure location + timezone
- ✅ Arrival location + timezone
- ✅ Route map visualization (line between points)
- ✅ Duration calculation
- ✅ Departure/arrival times (separate fields)
- ✅ Seat/cabin assignment
- ✅ Luggage/baggage allowance
- ✅ Carrier/operator name
- ✅ Confirmation number
- ✅ Terminal/platform/gate info

**Differences from Default:**
- Two locations instead of one
- Map shows route line (dashed for flights, solid for ground/water)
- Time is split into departure/arrival
- Additional transport-specific fields (seat, luggage)

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Route Map: A -----> B]            │
├─────────────────────────────────────┤
│ 🛫 DEPARTURE                        │
│ Location: [JFK Airport, NYC]       │
│ Time: [2:30 PM] TZ: [EST]          │
│ Terminal: [4] Gate: [B23]          │
├─────────────────────────────────────┤
│ Duration: ~6h 30m                   │
├─────────────────────────────────────┤
│ 🛬 ARRIVAL                          │
│ Location: [Heathrow, London]       │
│ Time: [6:00 AM +1] TZ: [GMT]       │
│ Terminal: [5]                       │
├─────────────────────────────────────┤
│ Carrier: [British Airways]         │
│ Confirmation: [ABC123]              │
│ Seat: [12A] Luggage: [2 checked]   │
└─────────────────────────────────────┘
```

---

### 2. **SHORT_DISTANCE_TRANSPORT**
*For point-to-point transportation within a city/region (no route map needed)*

**Types:**
- Ride Share (Uber, Lyft)
- Private Driver (single trip)
- Taxi

**Key Features:**
- ✅ Pickup location + time
- ✅ Dropoff location (required for ride share/private driver, optional for taxi)
- ✅ Estimated duration
- ✅ Vehicle type
- ✅ Driver info (name, vehicle, license plate)
- ✅ Cost estimate
- ✅ Ride tracking (for app-based services)
- ⛔ No route map visualization (just pickup/dropoff markers)
- ⛔ No seat assignment
- ⛔ No luggage tracking
- ⛔ No terminal/gate info

**Differences from Default:**
- Two locations but simpler than POINT_TO_POINT (no route line, no complex transport fields)
- Cost is often estimated (not final until trip completes)
- Driver/vehicle info prominent for safety
- Real-time tracking capability (for ride shares)

**Differences from POINT_TO_POINT_TRANSPORT:**
- No route map line (just two markers)
- Shorter distance (intra-city vs inter-city)
- No seat/luggage/terminal fields
- Driver is a person, not a company/carrier
- Cost is estimated, not fixed

**UI Layout:**
```
┌─────────────────────────────────────┐
│ 🚕 PICKUP                           │
│ Location: [123 Main St]            │
│ Time: [3:00 PM]                     │
│ Driver: [John D.]                   │
│ Vehicle: [Toyota Camry - ABC 123]  │
│ Service: [UberX]                    │
├─────────────────────────────────────┤
│ 📍 DROPOFF                          │
│ Location: [Airport Terminal 2]     │
│ Est. Duration: 25 min               │
│ Est. Distance: 12 miles             │
├─────────────────────────────────────┤
│ Cost: ~$35 USD (estimated)          │
│ Confirmation: [UBER-XYZ789]        │
│ [Track Ride] (for app-based)       │
└─────────────────────────────────────┘
```

**Future Integration:**
- In-app ride calling API integration
- Real-time driver tracking
- Fare estimation before booking
- Multiple service level options (UberX, Comfort, XL, etc.)

---

### 3. **RENTAL_SERVICE**
*For services rented over a period*

**Types:**
- Car Rental
- Private Driver (multi-day hire)
- Equipment Rental (bikes, skis, etc.)
- Parking (daily/monthly)

**Key Features:**
- ✅ Pickup location + date/time
- ✅ Return location + date/time
- ✅ Duration (days/hours)
- ✅ Item/vehicle details
- ✅ Insurance/protection info (for vehicles)
- ✅ Fuel policy (for vehicles)
- ✅ Mileage limits (for vehicles)
- ✅ Additional drivers (for vehicles)
- ✅ Total cost + deposit

**Differences from Default:**
- Two distinct events: pickup and return
- Duration-based pricing
- Rental-specific terms (insurance, fuel, mileage)
- Can span multiple days

**UI Layout:**
```
┌─────────────────────────────────────┐
│ 🚗 PICKUP                           │
│ Location: [Hertz - LAX Airport]    │
│ Date: [Jan 15] Time: [10:00 AM]    │
├─────────────────────────────────────┤
│ Vehicle: [Toyota RAV4 or similar]  │
│ Duration: 5 days                    │
├─────────────────────────────────────┤
│ 🔄 RETURN                           │
│ Location: [Hertz - Downtown LA]    │
│ Date: [Jan 20] Time: [5:00 PM]     │
├─────────────────────────────────────┤
│ Insurance: [Full Coverage]         │
│ Fuel: [Full-to-Full]               │
│ Mileage: [Unlimited]                │
│ Cost: $450 USD + $200 deposit      │
│ Confirmation: [HERTZ-456789]       │
└─────────────────────────────────────┘
```

---

### 4. **MULTI_DAY_STAY**
*For accommodations spanning multiple nights*

**Types:**
- Hotel
- Airbnb
- Hostel
- Resort
- Vacation Rental
- Ski Resort (lodging)

**Key Features:**
- ✅ Check-in date + time
- ✅ Check-out date + time
- ✅ Number of nights (auto-calculated)
- ✅ Room/unit type
- ✅ Guest count
- ✅ Address with map (single point)
- ✅ Amenities
- ✅ Cancellation policy
- ✅ Total cost (per night breakdown)
- ✅ Host/property manager contact

**Differences from Default:**
- Date range with check-in/out times
- Nights calculation
- Stay-specific fields (room type, guests, amenities)

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Property Image]                    │
│ 🏨 Marriott Downtown               │
│ 📍 123 Hotel Blvd, City            │
├─────────────────────────────────────┤
│ CHECK-IN                            │
│ Date: [Jan 15] Time: [3:00 PM]     │
├─────────────────────────────────────┤
│ CHECK-OUT                           │
│ Date: [Jan 18] Time: [11:00 AM]    │
│ Duration: 3 nights                  │
├─────────────────────────────────────┤
│ Room: [Deluxe King, City View]     │
│ Guests: [2 adults]                  │
│ Amenities: Pool, Gym, WiFi          │
├─────────────────────────────────────┤
│ Cost: $450/night × 3 = $1,350 USD  │
│ Confirmation: [MARR-789456]        │
│ Cancellation: Free until Jan 13    │
└─────────────────────────────────────┘
```

---

### 5. **TIMED_RESERVATION**
*For activities/dining with specific time slots*

**Types:**
- Restaurant
- Cafe
- Bar
- Tour
- Museum
- Theater
- Concert
- Event Tickets
- Spa & Wellness
- Golf

**Key Features:**
- ✅ Single date + time
- ✅ Duration (optional)
- ✅ Party size
- ✅ Location (single point with map)
- ✅ Reservation name/holder
- ✅ Special requests/notes
- ✅ Confirmation number
- ✅ Ticket/table details
- ✅ Dress code (for dining/theater)
- ✅ Dietary restrictions (for dining)

**Differences from Default:**
- Single point in time (not a range)
- Party size is prominent
- Activity/dining-specific fields

**UI Layout:**
```
┌─────────────────────────────────────┐
│ 🍽️ Le Bernardin                    │
│ 📍 155 W 51st St, New York         │
├─────────────────────────────────────┤
│ 📅 DATE & TIME                      │
│ Jan 15, 2024 at 7:30 PM            │
│ Duration: ~2 hours                  │
├─────────────────────────────────────┤
│ Party Size: 4 guests                │
│ Table: Window seat (requested)     │
│ Dress Code: Business Casual         │
├─────────────────────────────────────┤
│ Special Requests:                   │
│ • Vegetarian option for 1           │
│ • Anniversary celebration           │
├─────────────────────────────────────┤
│ Cost: $400 USD (estimated)          │
│ Confirmation: [RESY-123456]        │
└─────────────────────────────────────┘
```

---

### 6. **FLEXIBLE_ACTIVITY**
*For activities without strict time requirements*

**Types:**
- Hike
- Excursion
- Adventure
- Sport
- Food Tour
- Ski Pass (day pass)

**Key Features:**
- ✅ Date (no specific time, or flexible time)
- ✅ Location/meeting point
- ✅ Duration (approximate)
- ✅ Difficulty level
- ✅ Equipment included/required
- ✅ Guide info (if applicable)
- ✅ Group size
- ✅ Weather-dependent flag

**Differences from Default:**
- Time is optional or flexible
- Activity-specific fields (difficulty, equipment)
- Often all-day or half-day

**UI Layout:**
```
┌─────────────────────────────────────┐
│ 🥾 Grand Canyon Rim Trail Hike     │
│ 📍 South Rim Visitor Center        │
├─────────────────────────────────────┤
│ 📅 DATE                             │
│ Jan 15, 2024 (Flexible timing)     │
│ Duration: 4-6 hours                 │
├─────────────────────────────────────┤
│ Difficulty: Moderate                │
│ Distance: 8 miles                   │
│ Equipment: Hiking boots, water      │
│ Guide: Self-guided                  │
├─────────────────────────────────────┤
│ ⚠️ Weather-dependent                │
│ Check conditions before departure   │
├─────────────────────────────────────┤
│ Cost: Free (park entry: $35)       │
└─────────────────────────────────────┘
```

---

### 7. **DEFAULT**
*Fallback for any type not fitting above groups*

**Types:**
- Any new types added in the future
- Generic reservations

**Key Features:**
- ✅ Name/title
- ✅ Date + time (optional)
- ✅ Location (optional)
- ✅ Notes
- ✅ Confirmation number
- ✅ Cost
- ✅ Contact info
- ✅ Image

**Differences:**
- Minimal, flexible structure
- All fields optional except name
- No specialized UI

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Generic Reservation]               │
│ 📍 Location (if provided)           │
├─────────────────────────────────────┤
│ 📅 Date & Time (if provided)        │
│ Jan 15, 2024 at 2:00 PM            │
├─────────────────────────────────────┤
│ Notes: [User-provided details]     │
├─────────────────────────────────────┤
│ Cost: [Amount] [Currency]           │
│ Confirmation: [Number]              │
│ Contact: [Phone/Email]              │
└─────────────────────────────────────┘
```

---

## Type-to-Display-Group Mapping

| Type | Category | Display Group | Rationale |
|------|----------|---------------|-----------|
| Flight | Travel | POINT_TO_POINT_TRANSPORT | Departure → Arrival with route |
| Train | Travel | POINT_TO_POINT_TRANSPORT | Similar to flight (stations, route) |
| Bus | Travel | POINT_TO_POINT_TRANSPORT | Similar to train |
| Ferry | Travel | POINT_TO_POINT_TRANSPORT | Water route between ports |
| Cruise | Travel | POINT_TO_POINT_TRANSPORT | Multi-day but still port-to-port |
| Car Rental | Travel | RENTAL_SERVICE | Pickup/return with duration |
| Private Driver | Travel | SHORT_DISTANCE_TRANSPORT* | Single trip: pickup + dropoff |
| Private Driver | Travel | RENTAL_SERVICE* | Multi-day hire with driver |
| Ride Share | Travel | SHORT_DISTANCE_TRANSPORT | Uber/Lyft: pickup + dropoff |
| Taxi | Travel | SHORT_DISTANCE_TRANSPORT | On-demand: pickup + optional dropoff |
| Parking | Travel | RENTAL_SERVICE | Time-based rental of space |
| Hotel | Stay | MULTI_DAY_STAY | Check-in/out with nights |
| Airbnb | Stay | MULTI_DAY_STAY | Same as hotel |
| Hostel | Stay | MULTI_DAY_STAY | Same as hotel |
| Resort | Stay | MULTI_DAY_STAY | Same as hotel |
| Vacation Rental | Stay | MULTI_DAY_STAY | Same as hotel |
| Ski Resort | Stay | MULTI_DAY_STAY | Lodging component |
| Tour | Activity | TIMED_RESERVATION | Specific start time |
| Event Tickets | Activity | TIMED_RESERVATION | Specific event time |
| Museum | Activity | TIMED_RESERVATION | Entry time slot |
| Hike | Activity | FLEXIBLE_ACTIVITY | All-day, no strict time |
| Excursion | Activity | FLEXIBLE_ACTIVITY | Half/full day |
| Adventure | Activity | FLEXIBLE_ACTIVITY | Flexible timing |
| Sport | Activity | FLEXIBLE_ACTIVITY | Flexible or all-day |
| Concert | Activity | TIMED_RESERVATION | Specific show time |
| Theater | Activity | TIMED_RESERVATION | Specific show time |
| Ski Pass | Activity | FLEXIBLE_ACTIVITY | Day pass, flexible use |
| Equipment Rental | Activity | RENTAL_SERVICE | Pickup/return (skis, bikes) |
| Spa & Wellness | Activity | TIMED_RESERVATION | Appointment time |
| Golf | Activity | TIMED_RESERVATION | Tee time |
| Restaurant | Dining | TIMED_RESERVATION | Reservation time |
| Cafe | Dining | TIMED_RESERVATION | Reservation time (if any) |
| Bar | Dining | TIMED_RESERVATION | Reservation time (if any) |
| Food Tour | Dining | TIMED_RESERVATION | Tour start time |

**Notes:**
- *Private Driver can be SHORT_DISTANCE_TRANSPORT for single trips or RENTAL_SERVICE for multi-day hires (determined by duration or user selection)
- *Parking is RENTAL_SERVICE for all durations (hourly to monthly)

---

## Database Schema Proposal

### New Table: `ReservationDisplayGroup`

```prisma
model ReservationDisplayGroup {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "POINT_TO_POINT_TRANSPORT"
  displayName String   // e.g., "Point-to-Point Transport"
  description String?
  createdAt   DateTime @default(now())
  
  types       ReservationType[]
}
```

### Update `ReservationType` Table

```prisma
model ReservationType {
  id                        String                      @id @default(cuid())
  name                      String
  categoryId                String
  displayGroupId            String                      // NEW FIELD
  createdAt                 DateTime                    @default(now())
  
  category                  ReservationCategory         @relation(fields: [categoryId], references: [id])
  displayGroup              ReservationDisplayGroup     @relation(fields: [displayGroupId], references: [id])
  reservations              Reservation[]
  
  @@unique([categoryId, name])
}
```

---

## Display Group Features Matrix

| Feature | Point-to-Point | Short-Distance | Rental | Multi-Day Stay | Timed Res | Flexible | Default |
|---------|---------------|----------------|--------|----------------|-----------|----------|---------|
| **Locations** |
| Departure/pickup location | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Arrival/dropoff location | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Single location | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **Timing** |
| Departure time | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Arrival time | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Check-in date/time | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Check-out date/time | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Single date/time | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ |
| Duration | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **Visualization** |
| Route map (line) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Two-point map (markers only) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Single point map | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **Special Fields** |
| Seat assignment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Luggage allowance | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Terminal/gate | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Driver info (person) | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Vehicle details | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Room type | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Guest count | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| Party size | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Equipment | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Difficulty level | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Insurance/protection | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fuel policy | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Amenities | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Universal** |
| Name/title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confirmation # | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Cost | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contact info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Image | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

**Legend:**
- ✅ = Always shown/required
- ⚠️ = Optional/conditional
- ❌ = Not applicable/hidden

---

## Implementation Benefits

### 1. **Maintainability**
- 7 templates instead of 33
- Add new types by assigning to existing group
- Update group template affects all types in that group

### 2. **Consistency**
- Similar types have identical UX
- Users learn patterns, not individual types
- Predictable behavior

### 3. **Flexibility**
- Can override group behavior per type if needed
- Easy to add new groups for future needs
- Types can migrate between groups

### 4. **Performance**
- Single query to get display group
- Conditional rendering based on group
- Shared components per group

### 5. **Data Integrity**
- Required fields enforced per group
- Validation rules per group
- Auto-fill logic per group

---

## Migration Strategy

1. **Create display groups table** with 7 groups
2. **Seed display groups** with names and descriptions
3. **Add displayGroupId** to ReservationType table
4. **Migrate existing types** to appropriate groups
5. **Update forms** to use display group logic
6. **Update display components** to render by group
7. **Add admin UI** to reassign types to different groups

---

## Future Enhancements

### Dynamic Display Groups
- Allow users to create custom display groups
- Per-user or per-workspace customization
- Template marketplace

### Group Inheritance
- Base group + type-specific overrides
- Composition of features
- Mix-and-match capabilities

### Smart Group Assignment
- AI-powered group suggestion for new types
- Learn from user behavior
- Auto-categorize imported reservations

---

## Questions for Consideration

1. ✅ **RESOLVED**: Ride Share (Uber/Lyft) has both pickup AND dropoff (required for future in-app ride calling)
2. ✅ **RESOLVED**: Private Driver uses SHORT_DISTANCE_TRANSPORT for single trips, RENTAL_SERVICE for multi-day
3. Should **Cruise** be POINT_TO_POINT_TRANSPORT or MULTI_DAY_STAY (or both)?
4. Do we need a separate group for **MULTI_DAY_TRANSPORT** (cruises, sleeper trains)?
5. Should **Food Tour** be TIMED_RESERVATION or FLEXIBLE_ACTIVITY?
6. Should **Taxi** dropoff be optional or required? (Currently optional, as taxis are often one-way)

---

## Recommended Next Steps

1. ✅ Review and approve display groups
2. ✅ Finalize type-to-group mappings
3. ✅ Create database migration
4. ✅ Implement display group components
5. ✅ Update edit reservation page to use groups
6. ✅ Test with all 33 types
7. ✅ Document group usage for future types
