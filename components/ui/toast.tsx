"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const Icon = icons[type];

  return (
    <div className={`fixed bottom-4 right-4 max-w-md border-2 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-up z-50 ${colors[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
