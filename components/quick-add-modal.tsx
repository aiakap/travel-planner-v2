"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, Plane, Hotel, Car } from "lucide-react"
import { toast } from "sonner"

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
}

type ReservationType = "flight" | "hotel" | "car_rental"

export function QuickAddModal({ isOpen, onClose, tripId }: QuickAddModalProps) {
  const router = useRouter()
  const [type, setType] = useState<ReservationType>("flight")
  const [confirmationText, setConfirmationText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!confirmationText.trim()) {
      toast.error("Please paste confirmation text")
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch("/api/quick-add/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          confirmationText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to extract reservations")
      }

      const data = await response.json()
      setExtractedData(data)
      toast.success(`Extracted ${data.reservations?.length || 0} reservation(s)`)
    } catch (err: any) {
      console.error("Extraction error:", err)
      setError(err.message || "Failed to extract reservations")
      toast.error(err.message || "Failed to extract reservations")
    } finally {
      setIsExtracting(false)
    }
  }

  const handleCreate = async () => {
    if (!extractedData) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/quick-add/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          type,
          reservations: extractedData.reservations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create reservations")
      }

      const data = await response.json()
      toast.success(`Created ${data.reservationIds?.length || 0} reservation(s)`)

      // Navigate to first reservation after brief delay
      if (data.reservationIds?.[0]) {
        setTimeout(() => {
          router.push(`/reservation/${data.reservationIds[0]}/edit`)
        }, 800)
      }

      // Close modal and reset state
      setTimeout(() => {
        onClose()
        resetState()
      }, 1000)
    } catch (err: any) {
      console.error("Creation error:", err)
      setError(err.message || "Failed to create reservations")
      toast.error(err.message || "Failed to create reservations")
    } finally {
      setIsCreating(false)
    }
  }

  const resetState = () => {
    setConfirmationText("")
    setExtractedData(null)
    setError(null)
    setType("flight")
  }

  const handleClose = () => {
    if (!isExtracting && !isCreating) {
      onClose()
      resetState()
    }
  }

  const getIcon = () => {
    switch (type) {
      case "flight":
        return <Plane className="h-5 w-5" />
      case "hotel":
        return <Hotel className="h-5 w-5" />
      case "car_rental":
        return <Car className="h-5 w-5" />
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case "flight":
        return "Paste your flight confirmation email or text here...\n\nExample:\nFlight: AA123\nFrom: SFO (San Francisco)\nTo: JFK (New York)\nDate: May 15, 2026\nDeparture: 8:00 AM\nArrival: 4:30 PM"
      case "hotel":
        return "Paste your hotel confirmation here...\n\nExample:\nHotel: Marriott Downtown\nCheck-in: May 15, 2026 3:00 PM\nCheck-out: May 18, 2026 11:00 AM\nRoom: Deluxe King\nConfirmation: ABC123"
      case "car_rental":
        return "Paste your car rental confirmation here...\n\nExample:\nVehicle: Toyota Camry\nPick-up: May 15, 2026 10:00 AM\nDrop-off: May 18, 2026 10:00 AM\nLocation: San Francisco Airport\nConfirmation: XYZ789"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            Quick Add Reservation
          </DialogTitle>
          <DialogDescription>
            Paste your confirmation email or text, and we'll automatically extract the details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="type">Reservation Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as ReservationType)
                setExtractedData(null)
                setError(null)
              }}
              disabled={isExtracting || isCreating}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flight">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Flight
                  </div>
                </SelectItem>
                <SelectItem value="hotel">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Hotel
                  </div>
                </SelectItem>
                <SelectItem value="car_rental">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Car Rental
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation Text */}
          <div className="space-y-2">
            <Label htmlFor="confirmationText">Confirmation Text</Label>
            <Textarea
              id="confirmationText"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isExtracting || isCreating}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    Extracted {extractedData.reservations?.length || 0} reservation(s)
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Ready to create. Review the details after creation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Extraction Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExtracting || isCreating}
          >
            Cancel
          </Button>

          {!extractedData ? (
            <Button onClick={handleExtract} disabled={isExtracting || !confirmationText.trim()}>
              {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExtracting ? "Extracting..." : "Extract Data"}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Creating..." : "Create Reservations"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
