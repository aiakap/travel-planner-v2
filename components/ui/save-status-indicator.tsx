import { Loader2, Check, AlertCircle } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  error,
  className = "",
}: SaveStatusIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
        status === "saved" ? "animate-in fade-in" : ""
      } ${className}`}
    >
      {status === "saving" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">Saved</span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-600 font-medium">
            {error || "Error saving"}
          </span>
        </>
      )}
    </div>
  );
}
