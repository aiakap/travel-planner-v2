# Seed Trips - Quick Start Guide

## 🚀 Getting Started (2 minutes)

### Step 1: Navigate to Admin Panel
```
http://localhost:3000/admin/seed-trips
```

### Step 2: Search for a User
1. Type an email address in the search box
2. Click "Search" or press Enter
3. Click on the user from results

### Step 3: Generate a Trip
Click one of the four trip buttons:
- 🌍 **Large (21 days)** - Full European tour with everything
- 🗼 **Medium (10 days)** - Paris & Tuscany focused
- 🚲 **Small (5 days)** - Amsterdam weekend
- ⚡ **Micro (2 days)** - Quick Paris visit

### Step 4: View the Trip
The trip appears instantly in the user's trip list!

## 📊 What Gets Created

### Large Trip Example
- **6 segments** across 4 cities
- **40-50 reservations** including:
  - ✈️ Flights (SFO→AMS, FLR→SF)
  - 🚄 Train (Amsterdam→Paris)
  - 🏨 Hotels (4 luxury properties)
  - 🍽️ Restaurants (20+ Michelin-starred & casual)
  - 🎨 Activities (Museums, tours, wine tastings)
  - 🚗 Transport (Car rental, drivers, taxis)

All with:
- ✅ Real venue names and addresses
- ✅ Accurate coordinates for maps
- ✅ Proper timezones
- ✅ Realistic timing
- ✅ Variety of statuses (Confirmed, Pending, Waitlisted, Cancelled)

## 🎯 Use Cases

### Testing
```bash
# Generate test data for QA
1. Search for test user
2. Generate large trip
3. Test all features with realistic data
```

### Demos
```bash
# Show off features to stakeholders
1. Generate medium trip (10 days)
2. Display beautiful map with markers
3. Show timeline with real reservations
4. Demonstrate chat and intelligence features
```

### Development
```bash
# Work on new features with real data
1. Generate small trip (5 days)
2. Test new UI components
3. Verify data flows
4. Debug with realistic scenarios
```

## 🔧 API Usage

### Generate via API
```bash
curl -X POST http://localhost:3000/api/admin/seed-trips \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_clx123abc",
    "tripSize": "medium"
  }'
```

### Delete All Trips
```bash
curl -X POST http://localhost:3000/api/admin/seed-trips \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_clx123abc",
    "action": "delete-all"
  }'
```

### Get Available Sizes
```bash
curl http://localhost:3000/api/admin/seed-trips
```

## 💡 Pro Tips

### Tip 1: Start with Medium
The medium trip (10 days) is perfect for most testing - not too complex, not too simple.

### Tip 2: Use Different Sizes for Different Tests
- **Large**: Test performance, complex UI, all features
- **Medium**: Test typical user flows
- **Small**: Test quick interactions
- **Micro**: Test edge cases, minimal data

### Tip 3: Clean Up Between Tests
Use "Delete All Trips" button to reset user's data before generating new test trips.

### Tip 4: Check the Map
After generating, view the trip and check the map - all venues should have markers!

### Tip 5: Verify Timeline
The timeline should show all reservations in chronological order with proper spacing.

## 🗺️ Trip Routes

### Large (21 days)
```
SF → Amsterdam (6 days) → Paris (7 days) → Tuscany (6 days) → SF
```

### Medium (10 days)
```
SF → Paris (5 days) → Tuscany (4 days) → SF
```

### Small (5 days)
```
SF → Amsterdam (4 days) → SF
```

### Micro (2 days)
```
SF → Paris (1 day) → SF
```

## 📍 Real Venues Included

### Amsterdam
- Hotels: Waldorf Astoria, Conservatorium Hotel
- Restaurants: De Kas, Ciel Bleu, The Duchess
- Activities: Rijksmuseum, Van Gogh Museum, Canal cruise

### Paris
- Hotels: Le Bristol, Plaza Athénée, La Réserve
- Restaurants: Le Jules Verne, L'Astrance, Septime
- Activities: Louvre, Musée d'Orsay, Eiffel Tower, Versailles

### Tuscany
- Hotels: Castello di Casole, Rosewood Castiglion del Bosco
- Restaurants: Osteria Francescana, Enoteca Pinchiorri
- Activities: Uffizi Gallery, Chianti wine tour, Siena

## ⚠️ Troubleshooting

### "No users found"
- Check spelling of email
- Try searching by partial email
- Verify user exists in database

### "Failed to generate trip"
- Check console for errors
- Verify database is running
- Ensure seed data is loaded (`npm run seed`)

### Trip not appearing
- Refresh the trips page
- Check user ID matches
- Verify no database errors in console

### Map markers missing
- Check coordinates in venue-data.ts
- Verify latitude/longitude are numbers
- Ensure timezone data is present

## 🎓 Learning More

- **Full Documentation**: See `SEED_TRIP_GENERATOR_COMPLETE.md`
- **Data Sourcing**: See `SEED_TRIP_DATA_SOURCING.md`
- **Code**: Check `/lib/seed-data/` directory

## 🚦 Quick Health Check

After generating a trip, verify:
- [ ] Trip appears in user's trip list
- [ ] All segments show on timeline
- [ ] Map displays venue markers
- [ ] Reservations have times and locations
- [ ] Can click into reservation details
- [ ] Can edit trip/segments/reservations
- [ ] Chat works for the trip

## 🎉 Success!

You now have realistic test data with:
- Real luxury hotels in Europe
- Michelin-starred restaurants
- World-famous museums
- Accurate flight times
- Proper timezones
- Beautiful map markers

**Ready to build amazing features!** 🚀
