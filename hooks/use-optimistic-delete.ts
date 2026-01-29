"use client"

import { useState, useTransition, useCallback, useRef } from "react"
import { toast } from "sonner"

export interface UseOptimisticDeleteOptions {
  successMessage?: string
  errorMessage?: string
  itemName?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * A reusable hook for optimistic delete operations with automatic rollback on error.
 * Uses toast-based confirmation with undo functionality for a modern UX.
 * 
 * @param items - Array of items to manage
 * @param deleteAction - Server action to delete an item by ID
 * @param options - Optional configuration for messages and callbacks
 * @returns Object containing filtered items, delete handler, and pending state
 * 
 * @example
 * ```tsx
 * const { items: filteredReservations, handleDelete, isPending } = useOptimisticDelete(
 *   reservations,
 *   deleteReservation,
 *   {
 *     itemName: "reservation",
 *     successMessage: "Reservation deleted",
 *   }
 * );
 * ```
 */
export function useOptimisticDelete<T extends { id: string }>(
  items: T[],
  deleteAction: (id: string) => Promise<void | { success: boolean }>,
  options?: UseOptimisticDeleteOptions
) {
  const [optimisticItems, setOptimisticItems] = useState<T[]>(items)
  const [isPending, startTransition] = useTransition()
  const [deletedItemsCache] = useState<Map<string, T>>(new Map())
  const deleteTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Update optimistic items when props change (after server revalidation)
  if (items !== optimisticItems && !isPending) {
    setOptimisticItems(items)
  }

  const handleDelete = useCallback(
    async (id: string) => {
      // Find the item to delete (for potential rollback)
      const itemToDelete = optimisticItems.find((item) => item.id === id)
      if (!itemToDelete) return

      // Store in cache for rollback
      deletedItemsCache.set(id, itemToDelete)

      // Optimistically remove from UI immediately
      setOptimisticItems((prev) => prev.filter((item) => item.id !== id))

      const itemName = options?.itemName || "item"
      
      // Show toast with undo option
      const toastId = toast.success(
        `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted`,
        {
          description: "This will be permanently deleted in a moment",
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              // Cancel the delete operation
              const timeout = deleteTimeoutRef.current.get(id)
              if (timeout) {
                clearTimeout(timeout)
                deleteTimeoutRef.current.delete(id)
              }

              // Restore the item
              setOptimisticItems((prev) => {
                const cached = deletedItemsCache.get(id)
                if (!cached) return prev
                
                // Find the original index to restore item in correct position
                const originalIndex = items.findIndex((item) => item.id === id)
                if (originalIndex === -1) {
                  return [...prev, cached]
                }
                
                // Insert at original position
                const newItems = [...prev]
                newItems.splice(originalIndex, 0, cached)
                return newItems
              })

              // Clean up cache
              deletedItemsCache.delete(id)

              // Show undo confirmation
              toast.success("Deletion cancelled", {
                duration: 2000,
              })
            },
          },
        }
      )

      // Wait 5 seconds before actually deleting (gives time to undo)
      const deleteTimeout = setTimeout(() => {
        // Perform the delete operation
        startTransition(async () => {
          try {
            await deleteAction(id)
            
            // Success - show subtle confirmation
            toast.success(
              options?.successMessage || `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} permanently deleted`,
              {
                id: toastId,
                duration: 2000,
              }
            )

            // Call success callback if provided
            options?.onSuccess?.()

            // Clean up cache
            deletedItemsCache.delete(id)
            deleteTimeoutRef.current.delete(id)
          } catch (error) {
            console.error("Delete failed:", error)
            
            // Rollback - restore the item
            setOptimisticItems((prev) => {
              const cached = deletedItemsCache.get(id)
              if (!cached) return prev
              
              // Find the original index to restore item in correct position
              const originalIndex = items.findIndex((item) => item.id === id)
              if (originalIndex === -1) {
                return [...prev, cached]
              }
              
              // Insert at original position
              const newItems = [...prev]
              newItems.splice(originalIndex, 0, cached)
              return newItems
            })

            // Show error toast
            toast.error(
              options?.errorMessage || `Failed to delete ${itemName}. Please try again.`,
              {
                id: toastId,
                duration: 4000,
              }
            )

            // Call error callback if provided
            options?.onError?.(error as Error)

            // Clean up cache
            deletedItemsCache.delete(id)
            deleteTimeoutRef.current.delete(id)
          }
        })
      }, 5000)

      // Store timeout reference
      deleteTimeoutRef.current.set(id, deleteTimeout)
    },
    [optimisticItems, items, deleteAction, options, deletedItemsCache, isPending]
  )

  return {
    items: optimisticItems,
    handleDelete,
    isPending,
  }
}
