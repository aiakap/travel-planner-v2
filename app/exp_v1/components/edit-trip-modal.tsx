"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/exp/ui/dialog"
import EditTripForm from "@/app/exp/components/edit-trip-form"

interface Trip {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  imageUrl: string | null
  createdAt?: Date
  updatedAt?: Date
  userId?: string
  imageIsCustom?: boolean
  imagePromptId?: string | null
}

interface EditTripModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip
  onUpdate: () => void
}

export function EditTripModal({ isOpen, onClose, trip, onUpdate }: EditTripModalProps) {
  const handleSuccess = () => {
    onUpdate()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <EditTripForm trip={trip as any} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
