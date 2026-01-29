"use client"

import { 
  Cloud, 
  Sparkles, 
  DollarSign, 
  Shield, 
  Calendar, 
  UtensilsCrossed, 
  Languages, 
  FileText,
  Thermometer,
  Package,
  CreditCard,
  Phone,
  PartyPopper,
  MapPin,
  Utensils,
  MessageSquare,
  CheckCircle
} from "lucide-react"
import { IntelligencePromo } from "./intelligence-promo"

export function WeatherPromo() {
  return (
    <IntelligencePromo
      icon={Cloud}
      iconGradient="from-blue-500 to-cyan-500"
      headline="Never Pack Wrong Again"
      features={[
        { icon: Thermometer, text: "Real-time weather forecasts for all your destinations" },
        { icon: MapPin, text: "Departure and arrival conditions so you know what to expect" },
        { icon: Calendar, text: "Historical data for long-range planning" },
        { icon: CheckCircle, text: "Smart packing suggestions based on weather patterns" },
      ]}
      scenario="Know if you need that rain jacket in Barcelona or if London will finally be sunny. Get accurate forecasts for every leg of your journey."
      visual={
        <div className="grid grid-cols-3 gap-4">
          {[
            { day: "Mon", temp: "72°F", icon: "☀️" },
            { day: "Tue", temp: "68°F", icon: "⛅" },
            { day: "Wed", temp: "65°F", icon: "🌧️" },
          ].map((day, i) => (
            <div key={i} className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">{day.day}</div>
              <div className="text-3xl mb-2">{day.icon}</div>
              <div className="font-bold text-slate-900">{day.temp}</div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function PackingPromo() {
  return (
    <IntelligencePromo
      icon={Package}
      iconGradient="from-purple-500 to-indigo-500"
      headline="Your Personal Packing Assistant"
      features={[
        { icon: Cloud, text: "Weather-aware suggestions for every climate" },
        { icon: Sparkles, text: "Activity-based gear recommendations" },
        { icon: Package, text: "Smart luggage strategy and organization tips" },
        { icon: CheckCircle, text: "Explains why each item is recommended" },
      ]}
      scenario="From beach essentials to hiking gear, we analyze your trip itinerary, weather forecasts, and planned activities to recommend exactly what you need."
      visual={
        <div className="space-y-3">
          {["Clothing", "Footwear", "Gear", "Toiletries"].map((category, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                {i + 1}
              </div>
              <div className="font-medium text-slate-900">{category}</div>
              <div className="ml-auto text-sm text-slate-500">5-8 items</div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function CurrencyPromo() {
  return (
    <IntelligencePromo
      icon={DollarSign}
      iconGradient="from-emerald-500 to-teal-500"
      headline="Master Money Abroad"
      features={[
        { icon: DollarSign, text: "Live exchange rates updated in real-time" },
        { icon: MapPin, text: "ATM locations and fee guidance" },
        { icon: CreditCard, text: "Best payment methods for each destination" },
        { icon: Utensils, text: "Local tipping customs and etiquette" },
      ]}
      scenario="Stop wondering if you should tip 10% or 20%, or where to find the best exchange rates. Get personalized money advice for every destination."
      visual={
        <div className="grid grid-cols-2 gap-4">
          {[
            { currency: "EUR", rate: "1.09", flag: "🇪🇺" },
            { currency: "GBP", rate: "0.79", flag: "🇬🇧" },
          ].map((curr, i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 text-center">
              <div className="text-3xl mb-2">{curr.flag}</div>
              <div className="font-bold text-slate-900 text-lg">{curr.currency}</div>
              <div className="text-sm text-slate-500">${curr.rate} USD</div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function EmergencyPromo() {
  return (
    <IntelligencePromo
      icon={Shield}
      iconGradient="from-red-500 to-orange-500"
      headline="Travel with Confidence"
      features={[
        { icon: Phone, text: "Embassy contacts and emergency numbers" },
        { icon: MapPin, text: "Nearest hospitals with specialty information" },
        { icon: Shield, text: "Safety level and common scam warnings" },
        { icon: CheckCircle, text: "Cultural safety tips and local laws" },
      ]}
      scenario="Know exactly who to call and where to go in any situation. Get peace of mind with comprehensive emergency information for every destination."
      visual={
        <div className="space-y-3">
          {[
            { label: "Police", number: "112", icon: "🚓" },
            { label: "Medical", number: "112", icon: "🚑" },
            { label: "Embassy", number: "+1 xxx", icon: "🏛️" },
          ].map((contact, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">{contact.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{contact.label}</div>
                <div className="text-sm text-slate-500">{contact.number}</div>
              </div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function CulturalPromo() {
  return (
    <IntelligencePromo
      icon={Calendar}
      iconGradient="from-pink-500 to-rose-500"
      headline="Experience Local Life"
      features={[
        { icon: PartyPopper, text: "Festival calendar and cultural events" },
        { icon: Calendar, text: "Holiday warnings and closures" },
        { icon: MapPin, text: "Crowd predictions for major attractions" },
        { icon: Sparkles, text: "Personalized event recommendations" },
      ]}
      scenario="Discover if you're visiting during Carnival or if museums will be closed for a national holiday. Experience destinations like a local."
      visual={
        <div className="space-y-3">
          {[
            { date: "Mar 15", event: "Cherry Blossom Festival", icon: "🌸" },
            { date: "Mar 17", event: "St. Patrick's Day", icon: "🍀" },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">{event.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{event.event}</div>
                <div className="text-sm text-slate-500">{event.date}</div>
              </div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function ActivitiesPromo() {
  return (
    <IntelligencePromo
      icon={Sparkles}
      iconGradient="from-amber-500 to-yellow-500"
      headline="Fill Your Free Time Perfectly"
      features={[
        { icon: Calendar, text: "Automatically detects 3+ hour gaps in your itinerary" },
        { icon: Sparkles, text: "Activities matched to your interests and budget" },
        { icon: MapPin, text: "Booking links and ratings from trusted sources" },
        { icon: CheckCircle, text: "Explains why each activity is relevant to you" },
      ]}
      scenario="Have 4 hours free in Rome? We'll suggest activities that match your interests, budget, and available time. Never waste a moment of your trip."
      visual={
        <div className="space-y-3">
          {[
            { time: "2:00 PM", activity: "Vatican Museums Tour", duration: "3 hrs" },
            { time: "6:00 PM", activity: "Trastevere Walking Tour", duration: "2 hrs" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-amber-600 font-bold text-sm">{item.time}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{item.activity}</div>
                <div className="text-sm text-slate-500">{item.duration}</div>
              </div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function DiningPromo() {
  return (
    <IntelligencePromo
      icon={UtensilsCrossed}
      iconGradient="from-orange-500 to-red-500"
      headline="Eat Like a Local"
      features={[
        { icon: Utensils, text: "Restaurant suggestions for every meal" },
        { icon: CheckCircle, text: "Dietary accommodations clearly marked" },
        { icon: MapPin, text: "Yelp integration with ratings and reviews" },
        { icon: DollarSign, text: "Budget-aware recommendations" },
      ]}
      scenario="Find the perfect restaurant for every meal, from authentic street food to Michelin-starred fine dining. Match your taste, diet, and budget."
      visual={
        <div className="space-y-3">
          {[
            { name: "Trattoria Roma", cuisine: "Italian", price: "$$", rating: "4.5" },
            { name: "La Pergola", cuisine: "Fine Dining", price: "$$$$", rating: "4.8" },
          ].map((restaurant, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex-1">
                <div className="font-medium text-slate-900">{restaurant.name}</div>
                <div className="text-sm text-slate-500">{restaurant.cuisine} • {restaurant.price}</div>
              </div>
              <div className="text-orange-600 font-bold">⭐ {restaurant.rating}</div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function LanguagePromo() {
  return (
    <IntelligencePromo
      icon={Languages}
      iconGradient="from-purple-500 to-pink-500"
      headline="Speak with Confidence"
      features={[
        { icon: MessageSquare, text: "Essential phrases for travel scenarios" },
        { icon: Languages, text: "Proficiency-appropriate content" },
        { icon: CheckCircle, text: "Romanization for pronunciation help" },
        { icon: Sparkles, text: "Scenario-based organization (hotel, restaurant, etc.)" },
      ]}
      scenario="Order at restaurants, ask for directions, and handle emergencies in any language. Get the phrases you actually need for your trip."
      visual={
        <div className="space-y-3">
          {[
            { phrase: "Where is the bathroom?", translation: "¿Dónde está el baño?" },
            { phrase: "Check please", translation: "La cuenta, por favor" },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="font-medium text-slate-900 mb-1">{item.phrase}</div>
              <div className="text-sm text-purple-600">{item.translation}</div>
            </div>
          ))}
        </div>
      }
    />
  )
}

export function DocumentsPromo() {
  return (
    <IntelligencePromo
      icon={FileText}
      iconGradient="from-blue-500 to-cyan-500"
      headline="Never Miss a Visa Deadline"
      features={[
        { icon: FileText, text: "Visa requirements based on your citizenship" },
        { icon: Calendar, text: "Processing times and application deadlines" },
        { icon: DollarSign, text: "Cost estimates and fee information" },
        { icon: CheckCircle, text: "Document checklists and requirements" },
      ]}
      scenario="Know if you need a visa, how long it takes to process, and what documents to prepare. Avoid last-minute surprises at the border."
      visual={
        <div className="space-y-3">
          {[
            { country: "France", status: "No Visa Required", color: "emerald" },
            { country: "India", status: "eVisa Required", color: "orange" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 bg-white rounded-lg border border-${item.color}-200`}>
              <div>
                <div className="font-medium text-slate-900">{item.country}</div>
                <div className={`text-sm text-${item.color}-600`}>{item.status}</div>
              </div>
              <div className={`px-3 py-1 rounded-full bg-${item.color}-50 text-${item.color}-700 text-xs font-medium`}>
                {item.status === "No Visa Required" ? "✓" : "!"}
              </div>
            </div>
          ))}
        </div>
      }
    />
  )
}
