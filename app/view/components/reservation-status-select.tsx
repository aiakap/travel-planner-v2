"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateReservationSimple } from "@/lib/actions/update-reservation-simple"
import { Loader2 } from "lucide-react"

interface ReservationStatusSelectProps {
  reservationId: string
  currentStatusId: string
  currentStatusName: string
  onStatusChange?: (newStatusId: string, newStatusName: string) => void
}

interface ReservationStatus {
  id: string
  name: string
}

export function ReservationStatusSelect({ 
  reservationId, 
  currentStatusId, 
  currentStatusName,
  onStatusChange
}: ReservationStatusSelectProps) {
  const [statuses, setStatuses] = useState<ReservationStatus[]>([])
  const [updating, setUpdating] = useState(false)
  const [selectedStatusId, setSelectedStatusId] = useState(currentStatusId)
  const [selectedStatusName, setSelectedStatusName] = useState(currentStatusName)
  
  // Fetch statuses on mount
  useEffect(() => {
    async function fetchStatuses() {
      try {
        const response = await fetch('/api/reservation-statuses')
        if (response.ok) {
          const data = await response.json()
          setStatuses(data)
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error)
      }
    }
    fetchStatuses()
  }, [])
  
  const handleStatusChange = async (newStatusId: string) => {
    setUpdating(true)
    
    // Optimistic update
    const newStatus = statuses.find(s => s.id === newStatusId)
    if (newStatus) {
      setSelectedStatusId(newStatusId)
      setSelectedStatusName(newStatus.name)
    }
    
    try {
      await updateReservationSimple(reservationId, {
        reservationStatusId: newStatusId,
      })
      
      // Call optional callback
      if (onStatusChange && newStatus) {
        onStatusChange(newStatusId, newStatus.name)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert on error
      setSelectedStatusId(currentStatusId)
      setSelectedStatusName(currentStatusName)
    } finally {
      setUpdating(false)
    }
  }
  
  // Get badge color based on status name
  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600 dark:text-green-400'
      case 'pending':
        return 'text-amber-600 dark:text-amber-400'
      case 'cancelled':
        return 'text-red-600 dark:text-red-400'
      case 'completed':
        return 'text-blue-600 dark:text-blue-400'
      case 'waitlisted':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-muted-foreground'
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      {updating && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
      <Select 
        value={selectedStatusId} 
        onValueChange={handleStatusChange}
        disabled={updating || statuses.length === 0}
      >
        <SelectTrigger className={`w-[130px] h-7 text-xs ${getStatusColor(selectedStatusName)}`}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem 
              key={status.id} 
              value={status.id}
              className="text-xs"
            >
              <span className={getStatusColor(status.name)}>
                {status.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
