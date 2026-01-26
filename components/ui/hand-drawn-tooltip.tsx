"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HandDrawnTooltipProps {
  content: string;
  targetRef: React.RefObject<HTMLElement>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onClose: () => void;
  show: boolean;
  showSkip?: boolean;
  onSkipAll?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNext?: boolean;
  showPrevious?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export function HandDrawnTooltip({
  content,
  targetRef,
  position = 'top',
  onClose,
  show,
  showSkip = false,
  onSkipAll,
  onNext,
  onPrevious,
  showNext = false,
  showPrevious = false,
  currentStep,
  totalSteps,
}: HandDrawnTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, arrowTop: 0, arrowLeft: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show || !targetRef.current || !tooltipRef.current) {
      setIsVisible(false);
      return;
    }

    const calculatePosition = () => {
      const targetRect = targetRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const padding = 20;
      const arrowSize = 12;

      let top = 0;
      let left = 0;
      let arrowTop = 0;
      let arrowLeft = 0;

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowTop = tooltipRect.height - 2;
          arrowLeft = tooltipRect.width / 2 - arrowSize;
          break;
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowTop = -arrowSize - 8;
          arrowLeft = tooltipRect.width / 2 - arrowSize;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left - tooltipRect.width - padding;
          arrowTop = tooltipRect.height / 2 - arrowSize;
          arrowLeft = tooltipRect.width - 2;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + padding;
          arrowTop = tooltipRect.height / 2 - arrowSize;
          arrowLeft = -arrowSize - 8;
          break;
      }

      // Keep tooltip within viewport
      const viewportPadding = 10;
      if (left < viewportPadding) left = viewportPadding;
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipRect.width - viewportPadding;
      }
      if (top < viewportPadding) top = viewportPadding;
      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = window.innerHeight - tooltipRect.height - viewportPadding;
      }

      setCoords({ top, left, arrowTop, arrowLeft });
      setIsVisible(true);
    };

    // Initial calculation
    setTimeout(calculatePosition, 50);

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [show, targetRef, position]);

  if (!show) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] transition-opacity duration-300"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Tooltip Box */}
      <div
        className="relative bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-sm"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Close tooltip"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* Step Counter */}
        {currentStep !== undefined && totalSteps !== undefined && (
          <div className="text-xs text-gray-500 mb-2 font-medium">
            Step {currentStep} of {totalSteps}
          </div>
        )}

        {/* Content */}
        <div className="text-gray-800 text-sm leading-relaxed mb-3">
          {content}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div>
            {showSkip && onSkipAll && (
              <button
                onClick={onSkipAll}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip guide
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showPrevious && onPrevious && (
              <button
                onClick={onPrevious}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
            )}
            {showNext && onNext && (
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Hand-drawn Arrow */}
        <svg
          className="absolute pointer-events-none"
          style={{
            top: `${coords.arrowTop}px`,
            left: `${coords.arrowLeft}px`,
          }}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          {position === 'top' && (
            <path
              d="M12 2 L8 10 L12 8 L16 10 Z"
              fill="#fffef9"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {position === 'bottom' && (
            <path
              d="M12 22 L8 14 L12 16 L16 14 Z"
              fill="#fffef9"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {position === 'left' && (
            <path
              d="M2 12 L10 8 L8 12 L10 16 Z"
              fill="#fffef9"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {position === 'right' && (
            <path
              d="M22 12 L14 8 L16 12 L14 16 Z"
              fill="#fffef9"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
