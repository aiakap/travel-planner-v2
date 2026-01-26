"use client"

import { Button } from "@/app/exp/ui/button"
import { Badge } from "@/app/exp/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/exp/ui/dialog"
import { ResolvedData } from "@/lib/actions/smart-resolve"
import { DBReservation } from "@/app/exp/types/database-types"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react"

interface ResolutionConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentReservation: DBReservation
  resolvedData: ResolvedData
  onAccept: () => void
  onKeepOriginal: () => void
}

export function ResolutionConfirmationDialog({
  open,
  onOpenChange,
  currentReservation,
  resolvedData,
  onAccept,
  onKeepOriginal,
}: ResolutionConfirmationDialogProps) {
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  const hasChanges = 
    resolvedData.name !== currentReservation.name ||
    resolvedData.location !== currentReservation.location ||
    resolvedData.latitude !== currentReservation.latitude ||
    resolvedData.longitude !== currentReservation.longitude

  const getConfidenceBadge = () => {
    switch (resolvedData.confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />High Confidence</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Medium Confidence</Badge>
      case 'low':
        return <Badge className="bg-red-100 text-red-700 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Low Confidence</Badge>
    }
  }

  const getSourceBadge = () => {
    switch (resolvedData.source) {
      case 'places':
        return <Badge variant="outline" className="text-xs">Google Places</Badge>
      case 'address':
        return <Badge variant="outline" className="text-xs">Address Validation</Badge>
      case 'none':
        return <Badge variant="outline" className="text-xs">Not Resolved</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Resolved Details</DialogTitle>
          <DialogDescription>
            We found additional information for this reservation. Review the changes below.
          </DialogDescription>
          <div className="flex gap-2 mt-2">
            {getConfidenceBadge()}
            {getSourceBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Current</h3>
              
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <p className="text-sm mt-1">{currentReservation.vendor || currentReservation.name || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <p className="text-sm mt-1">{currentReservation.location || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>

              {/* Coordinates */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Coordinates</label>
                <p className="text-sm mt-1">
                  {currentReservation.latitude && currentReservation.longitude ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {currentReservation.latitude.toFixed(6)}, {currentReservation.longitude.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                <p className="text-sm mt-1">
                  {currentReservation.timeZoneName ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentReservation.timeZoneName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
              </div>

              {/* Contact */}
              {currentReservation.contactPhone && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {currentReservation.contactPhone}
                  </p>
                </div>
              )}

              {/* Website */}
              {currentReservation.url && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Website</label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {currentReservation.url}
                  </p>
                </div>
              )}

              {/* Image */}
              {currentReservation.imageUrl && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Image</label>
                  <img 
                    src={currentReservation.imageUrl} 
                    alt="Current" 
                    className="w-full h-32 object-cover rounded mt-1"
                  />
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-muted-foreground" />
            </div>

            {/* Resolved */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary uppercase">Resolved</h3>
              
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <p className={`text-sm mt-1 ${resolvedData.name !== currentReservation.name ? 'font-semibold text-primary' : ''}`}>
                  {resolvedData.name || resolvedData.vendor || <span className="text-muted-foreground italic">Not changed</span>}
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address</label>
                <p className={`text-sm mt-1 ${resolvedData.location !== currentReservation.location ? 'font-semibold text-primary' : ''}`}>
                  {resolvedData.location || <span className="text-muted-foreground italic">Not changed</span>}
                </p>
              </div>

              {/* Coordinates */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Coordinates</label>
                <p className={`text-sm mt-1 ${resolvedData.latitude !== currentReservation.latitude ? 'font-semibold text-primary' : ''}`}>
                  {resolvedData.latitude && resolvedData.longitude ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {resolvedData.latitude.toFixed(6)}, {resolvedData.longitude.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not changed</span>
                  )}
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                <p className={`text-sm mt-1 ${resolvedData.timeZoneName !== currentReservation.timeZoneName ? 'font-semibold text-primary' : ''}`}>
                  {resolvedData.timeZoneName ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resolvedData.timeZoneName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not changed</span>
                  )}
                </p>
              </div>

              {/* Contact */}
              {resolvedData.contactPhone && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm mt-1 flex items-center gap-1 font-semibold text-primary">
                    <Phone className="h-3 w-3" />
                    {resolvedData.contactPhone}
                  </p>
                </div>
              )}

              {/* Website */}
              {resolvedData.website && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Website</label>
                  <p className="text-sm mt-1 flex items-center gap-1 font-semibold text-primary">
                    <Globe className="h-3 w-3" />
                    {resolvedData.website}
                  </p>
                </div>
              )}

              {/* Image */}
              {resolvedData.imageUrl && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Image</label>
                  <img 
                    src={resolvedData.imageUrl} 
                    alt="Resolved" 
                    className="w-full h-32 object-cover rounded mt-1 ring-2 ring-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Map Preview */}
          {resolvedData.latitude && resolvedData.longitude && isMapsLoaded && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-3 py-2">
                <p className="text-xs font-medium">Location Preview</p>
              </div>
              <div className="h-[200px]">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{ 
                    lat: resolvedData.latitude, 
                    lng: resolvedData.longitude 
                  }}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  <Marker 
                    position={{ 
                      lat: resolvedData.latitude, 
                      lng: resolvedData.longitude 
                    }}
                  />
                </GoogleMap>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onKeepOriginal}
            className="w-full sm:w-auto"
          >
            Keep Original
          </Button>
          <Button 
            onClick={onAccept}
            className="w-full sm:w-auto"
          >
            Review & Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
