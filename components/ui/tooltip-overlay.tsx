"use client";

import React, { useEffect, useState } from 'react';

interface TooltipOverlayProps {
  show: boolean;
  targetRef: React.RefObject<HTMLElement>;
  onBackdropClick?: () => void;
}

export function TooltipOverlay({ show, targetRef, onBackdropClick }: TooltipOverlayProps) {
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!show || !targetRef.current) return;

    const updateSpotlight = () => {
      const rect = targetRef.current!.getBoundingClientRect();
      const padding = 8;
      setSpotlight({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [show, targetRef]);

  if (!show) return null;

  return (
    <>
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300"
        onClick={onBackdropClick}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Spotlight Cutout */}
      <div
        className="fixed z-[9998] pointer-events-none transition-all duration-300"
        style={{
          top: `${spotlight.top}px`,
          left: `${spotlight.left}px`,
          width: `${spotlight.width}px`,
          height: `${spotlight.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
        }}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
