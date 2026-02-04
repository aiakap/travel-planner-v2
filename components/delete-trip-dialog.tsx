"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteTrip } from "@/lib/actions/delete-trip"

interface DeleteTripDialogProps {
  trip: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (tripId: string) => void
}

export function DeleteTripDialog({
  trip,
  open,
  onOpenChange,
  onDeleted,
}: DeleteTripDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!trip) return

    // Call onDeleted immediately for optimistic UI update
    onDeleted?.(trip.id)
    
    // Close dialog
    onOpenChange(false)

    // Delete in background
    startTransition(async () => {
      try {
        await deleteTrip(trip.id)
      } catch (error) {
        console.error("Failed to delete trip:", error)
        // Note: In a production app, you might want to restore the trip
        // or show an error toast here
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 className="h-5 w-5" />
            Delete Trip
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">&quot;{trip?.name}&quot;</strong>?
            <span className="block mt-2 text-rose-500">
              This will permanently delete all segments, reservations, and chat
              conversations associated with this trip.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600"
          >
            {isPending ? "Deleting..." : "Delete Trip"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
