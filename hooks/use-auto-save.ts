import { useState, useCallback, useRef, useEffect } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions {
  delay?: number;
  onError?: (error: Error) => void;
}

/**
 * Hook for auto-saving data with debouncing and visual feedback
 * 
 * @param onSave - Async function to save data
 * @param options - Configuration options
 * @returns Object with save function and current save state
 * 
 * @example
 * const { save, saveState } = useAutoSave(async (data) => {
 *   await updateSegment(data);
 * }, { delay: 500 });
 * 
 * // In your change handler
 * const handleNameChange = (name: string) => {
 *   setName(name);
 *   save({ name });
 * };
 */
export function useAutoSave<T>(
  onSave: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const { delay = 500, onError } = options;
  
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timeoutRef = useRef<NodeJS.Timeout>();
  const savedTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const save = useCallback(
    (data: T) => {
      // Clear existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);

      // Set saving state after debounce
      timeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;
        
        setSaveState("saving");
        
        try {
          await onSave(data);
          
          if (!isMountedRef.current) return;
          
          setSaveState("saved");
          
          // Reset to idle after 2 seconds
          savedTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            setSaveState("idle");
          }, 2000);
        } catch (error) {
          if (!isMountedRef.current) return;
          
          setSaveState("error");
          
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      }, delay);
    },
    [onSave, delay, onError]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    setSaveState("idle");
  }, []);

  return { save, saveState, reset };
}
