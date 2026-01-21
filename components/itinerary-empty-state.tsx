"use client"

export function ItineraryEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-light text-slate-900 mb-4">Your itinerary will appear here</h2>
        <p className="text-slate-600 text-lg font-light">
          Start chatting to plan your trip and watch your itinerary come to life with flights, hotels, activities, and more
        </p>
      </div>
    </div>
  )
}
