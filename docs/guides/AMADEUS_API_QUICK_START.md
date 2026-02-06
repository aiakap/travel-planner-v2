# Amadeus API - Quick Start Guide

## 🚀 Get Your API Credentials in 5 Minutes

### Step 1: Sign Up
1. Go to: **https://developers.amadeus.com/**
2. Click **"Register"** (top right)
3. Fill in:
   - Email
   - Password
   - First/Last Name
   - Company (can be "Personal" or "Testing")
4. Verify your email

### Step 2: Create an App
1. Log in to Amadeus Developer Portal
2. Go to **"My Self-Service Workspace"**
3. Click **"Create New App"**
4. Fill in:
   - **App Name**: `Travel Planner Test`
   - **Description**: `Testing flight search integration`
5. Click **"Create"**

### Step 3: Get Your Credentials
After creating the app, you'll see:

```
API Key (Client ID):     abc123def456...
API Secret:              xyz789uvw012...
```

**Copy both values!**

### Step 4: Add to .env.local

Open your `.env.local` file and add:

```bash
# Amadeus API Credentials
AMADEUS_CLIENT_ID=abc123def456...
AMADEUS_CLIENT_SECRET=xyz789uvw012...
```

Replace with your actual credentials (no quotes needed).

### Step 5: Restart Dev Server

```bash
# In terminal, stop the server (Ctrl+C)
npm run dev
```

### Step 6: Test!

Navigate to: **http://localhost:3000/test/flight-search**

Click **"Search Flights"** and you should see real results! 🎉

---

## 🔍 What You Get (Free Tier)

- ✅ **1,000 API calls per month** (free forever)
- ✅ Real flight prices from 300+ airlines
- ✅ Global coverage
- ✅ No credit card required
- ✅ Instant activation

---

## 🐛 Troubleshooting

### "Failed to search flights"
- ✅ Check credentials are correct in `.env.local`
- ✅ Restart dev server after adding credentials
- ✅ Check for typos (no extra spaces)

### "401 Unauthorized"
- ✅ Verify you're using the correct API Key and Secret
- ✅ Make sure you copied the full credentials
- ✅ Check you're in the right app in Amadeus dashboard

### "No flights found"
- ✅ Try different dates (must be future dates)
- ✅ Try popular routes (JFK-LAX, SFO-NYC)
- ✅ Check IATA codes are valid (3 letters)

---

## 📚 Resources

- **Amadeus Docs**: https://developers.amadeus.com/self-service
- **API Status**: https://developers.amadeus.com/status
- **Support**: https://developers.amadeus.com/support

---

## ✅ Quick Test

Once credentials are added:

1. Go to: `http://localhost:3000/test/flight-search`
2. Default search: **JFK → LAX** (next week)
3. Click **"Search Flights"**
4. Should see ~10 flights with prices ($150-500)

**Success!** You're now searching real flights! 🛫
