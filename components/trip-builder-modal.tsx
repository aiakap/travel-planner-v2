"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { TripBuilderClient } from '@/app/trip/new/components/trip-builder-client';
import { initializeSegmentTypes } from '@/app/trip/new/lib/segment-types';

interface TripBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (tripId: string) => void;
  segmentTypeMap?: Record<string, string>;
}

export function TripBuilderModal({ 
  isOpen, 
  onClose, 
  onComplete,
  segmentTypeMap: providedSegmentTypeMap 
}: TripBuilderModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [segmentTypeMap, setSegmentTypeMap] = useState<Record<string, string> | null>(
    providedSegmentTypeMap || null
  );
  const [isLoading, setIsLoading] = useState(!providedSegmentTypeMap);
  const [error, setError] = useState<string | null>(null);

  // Fetch segment types if not provided
  useEffect(() => {
    if (providedSegmentTypeMap) {
      setSegmentTypeMap(providedSegmentTypeMap);
      setIsLoading(false);
      return;
    }

    if (isOpen && !segmentTypeMap) {
      fetchSegmentTypes();
    }
  }, [isOpen, providedSegmentTypeMap]);

  const fetchSegmentTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/segment-types');
      if (!response.ok) {
        throw new Error('Failed to fetch segment types');
      }
      const data = await response.json();
      setSegmentTypeMap(data.segmentTypeMap);
    } catch (err) {
      console.error('Error fetching segment types:', err);
      setError('Failed to load trip builder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auth redirect
  useEffect(() => {
    if (status === 'unauthenticated' && isOpen) {
      router.push('/api/auth/signin');
    }
  }, [status, isOpen, router]);

  // Handle completion
  const handleComplete = (tripId: string) => {
    if (onComplete) {
      onComplete(tripId);
    } else {
      router.push(`/exp?tripId=${tripId}`);
    }
  };

  // Don't render if not authenticated
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl w-[95vw] max-h-[95vh] p-0 overflow-hidden"
        showCloseButton={true}
      >
        <div className="h-full flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trip builder...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchSegmentTypes}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : segmentTypeMap ? (
            <div className="h-full overflow-auto">
              <TripBuilderClient 
                segmentTypeMap={segmentTypeMap}
                onComplete={handleComplete}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
