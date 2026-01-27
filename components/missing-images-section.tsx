"use client";

import { useState } from "react";
import { queueTripImageGeneration, queueSegmentImageGeneration, 
         queueReservationImageGeneration, queueBulkImageGeneration } from "@/lib/actions/queue-image-generation";

type MissingImagesProps = {
  missingImages: {
    trips: Array<{ id: string; title: string; startDate: Date }>;
    segments: Array<{ id: string; startTitle: string; endTitle: string; trip: { title: string } }>;
    reservations: Array<{ id: string; name: string; segment: { trip: { title: string } } }>;
  };
};

export default function MissingImagesSection({ missingImages }: MissingImagesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const totalMissing = 
    missingImages.trips.length + 
    missingImages.segments.length + 
    missingImages.reservations.length;
  
  if (totalMissing === 0) return null;
  
  const handleQueue = async (type: 'trip' | 'segment' | 'reservation', id: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (type === 'trip') await queueTripImageGeneration(id);
      if (type === 'segment') await queueSegmentImageGeneration(id);
      if (type === 'reservation') await queueReservationImageGeneration(id);
      
      // Refresh page to update list
      window.location.reload();
    } catch (error) {
      console.error('Failed to queue:', error);
      alert('Failed to queue image generation');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };
  
  const handleBulkQueue = async () => {
    setBulkLoading(true);
    try {
      await queueBulkImageGeneration({
        tripIds: missingImages.trips.map(t => t.id),
        segmentIds: missingImages.segments.map(s => s.id),
        reservationIds: missingImages.reservations.map(r => r.id)
      });
      
      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Failed bulk queue:', error);
      alert('Failed to queue images');
    } finally {
      setBulkLoading(false);
    }
  };
  
  return (
    <div className="mb-6 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-700 dark:text-yellow-300 font-medium">
            {totalMissing} {totalMissing === 1 ? 'item' : 'items'} missing images
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          <button
            onClick={handleBulkQueue}
            disabled={bulkLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkLoading ? 'Queueing...' : `Generate All ${totalMissing} Images`}
          </button>
          
          {/* Trips */}
          {missingImages.trips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Trips ({missingImages.trips.length})</h4>
              <ul className="space-y-2">
                {missingImages.trips.map(trip => (
                  <li key={trip.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="text-sm">{trip.title}</span>
                    <button
                      onClick={() => handleQueue('trip', trip.id)}
                      disabled={loading[trip.id]}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading[trip.id] ? 'Queueing...' : 'Generate'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Segments */}
          {missingImages.segments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Segments ({missingImages.segments.length})</h4>
              <ul className="space-y-2">
                {missingImages.segments.map(segment => (
                  <li key={segment.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                    <div className="text-sm">
                      <div>{segment.startTitle} → {segment.endTitle}</div>
                      <div className="text-xs text-gray-500">{segment.trip.title}</div>
                    </div>
                    <button
                      onClick={() => handleQueue('segment', segment.id)}
                      disabled={loading[segment.id]}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading[segment.id] ? 'Queueing...' : 'Generate'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Reservations */}
          {missingImages.reservations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Reservations ({missingImages.reservations.length})</h4>
              <ul className="space-y-2">
                {missingImages.reservations.map(reservation => (
                  <li key={reservation.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                    <div className="text-sm">
                      <div>{reservation.name}</div>
                      <div className="text-xs text-gray-500">{reservation.segment.trip.title}</div>
                    </div>
                    <button
                      onClick={() => handleQueue('reservation', reservation.id)}
                      disabled={loading[reservation.id]}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading[reservation.id] ? 'Queueing...' : 'Generate'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
