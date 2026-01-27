import { useState, useEffect, useRef, useCallback } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  value,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const previousValueRef = useRef<T>(value);
  const isSavingRef = useRef(false);

  // Clear the saved status after 2 seconds
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Don't trigger on initial mount or if already saving
    if (previousValueRef.current === value || isSavingRef.current) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(async () => {
      await performSave();
    }, delay);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [value, enabled, delay]);

  const performSave = async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus("saving");
    setError(null);

    try {
      await onSave(value);
      previousValueRef.current = value;
      setSaveStatus("saved");
    } catch (err: any) {
      console.error("Auto-save error:", err);
      setError(err.message || "Failed to save");
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  };

  // Manual save trigger (for blur events)
  const saveImmediately = useCallback(async () => {
    // Clear any pending timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Only save if value has changed
    if (previousValueRef.current !== value && !isSavingRef.current) {
      await performSave();
    }
  }, [value]);

  // Reset function to mark as saved without saving
  const markAsSaved = useCallback(() => {
    previousValueRef.current = value;
    setSaveStatus("idle");
  }, [value]);

  return {
    saveStatus,
    error,
    saveImmediately,
    markAsSaved,
  };
}
