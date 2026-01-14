"use client"

import { useState, useEffect, useMemo } from "react"
import { ShipmentCard } from "./shipment-card"
import { ShipmentDetailsDialog } from "./shipment-details-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchShipSchedule, fetchDealers } from "@/lib/supabase/queries"
import type { Shipment } from "@/types"

interface CalendarViewProps {
  view: "week" | "month"
  currentDate: Date
  searchQuery?: string
}

interface DayData {
  day: string
  date: string
  fullDate: Date
  shipments: Shipment[]
}

// No day color accents - professional look, only Today is highlighted

export function ShipScheduleCalendar({ view, currentDate, searchQuery = "" }: CalendarViewProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Calculate date range based on view
        let dateRange: { start: Date; end: Date } | undefined
        if (view === "week") {
          const weekStart = new Date(currentDate)
          const day = weekStart.getDay()
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
          weekStart.setDate(diff)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          dateRange = { start: weekStart, end: weekEnd }
        } else {
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          dateRange = { start: monthStart, end: monthEnd }
        }

        const shipmentsData = await fetchShipSchedule(dateRange)

        // Apply search filter
        let filteredShipments = shipmentsData
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filteredShipments = filteredShipments.filter((shipment) => {
            return (
              shipment.shippingId?.toLowerCase().includes(query) ||
              shipment.dealer?.toLowerCase().includes(query) ||
              shipment.customer?.toLowerCase().includes(query) ||
              shipment.vin?.toLowerCase().includes(query)
            )
          })
        }

        setShipments(filteredShipments)
      } catch (error) {
        console.error("Error loading ship schedule:", error)
        setShipments([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [view, currentDate, searchQuery])

  // Get week days (Monday to Saturday - 6 days)
  const getWeekDays = (date: Date): DayData[] => {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    
    const days: DayData[] = []
    // Only show Monday to Saturday (6 days)
    for (let i = 0; i < 6; i++) {
      const currentDay = new Date(weekStart)
      currentDay.setDate(weekStart.getDate() + i)
      
      const dayName = currentDay.toLocaleDateString("en-US", { weekday: "short" })
      const dayNumber = currentDay.getDate().toString().padStart(2, "0")
      
      // Filter shipments for this day
      const dayShipments = shipments.filter((shipment) => {
        if (!shipment.date) return false
        try {
          const shipmentDate = new Date(shipment.date)
          // Handle timezone issues by comparing date strings
          const shipmentDateStr = shipmentDate.toISOString().split("T")[0]
          const currentDateStr = currentDay.toISOString().split("T")[0]
          return shipmentDateStr === currentDateStr
        } catch (e) {
          return false
        }
      })
      
      days.push({
        day: dayName,
        date: dayNumber,
        fullDate: currentDay,
        shipments: dayShipments,
      })
    }
    return days
  }

  // Get month days
  const getMonthDays = (date: Date): DayData[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const days: DayData[] = []
    const currentDateIter = new Date(startDate)
    
    // Show 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      const dayName = currentDateIter.toLocaleDateString("en-US", { weekday: "short" })
      const dayNumber = currentDateIter.getDate().toString()
      
      // Filter shipments for this day
      const dayShipments = shipments.filter((shipment) => {
        if (!shipment.date) return false
        try {
          const shipmentDate = new Date(shipment.date)
          // Handle timezone issues by comparing date strings
          const shipmentDateStr = shipmentDate.toISOString().split("T")[0]
          const currentDateStr = currentDateIter.toISOString().split("T")[0]
          return shipmentDateStr === currentDateStr
        } catch (e) {
          return false
        }
      })
      
      days.push({
        day: dayName,
        date: dayNumber,
        fullDate: new Date(currentDateIter),
        shipments: dayShipments,
      })
      
      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }
    return days
  }

  const calendarData = useMemo(() => {
    return view === "week" ? getWeekDays(currentDate) : getMonthDays(currentDate)
  }, [view, currentDate, shipments])

  const handleShipmentClick = (date: Date) => {
    setSelectedDate(date)
    setDialogOpen(true)
  }

  // Get shipments for selected date
  const shipmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    
    return shipments.filter((shipment) => {
      if (!shipment.date) return false
      try {
        const shipmentDate = new Date(shipment.date)
        const shipmentDateStr = shipmentDate.toISOString().split("T")[0]
        const selectedDateStr = selectedDate.toISOString().split("T")[0]
        return shipmentDateStr === selectedDateStr
      } catch (e) {
        return false
      }
    })
  }, [shipments, selectedDate])

  const today = new Date()

  if (loading) {
    return (
      <div className={`grid ${view === "week" ? "grid-cols-6" : "grid-cols-7"} gap-3`}>
        {[...Array(view === "week" ? 6 : 35)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (view === "week") {
    return (
      <>
        <div className="w-full border shadow-none overflow-hidden bg-background rounded-2xl">
          <div className="grid grid-cols-6 gap-px bg-border">
            {calendarData.map((day, index) => {
              const isToday = 
                day.fullDate.getDate() === today.getDate() &&
                day.fullDate.getMonth() === today.getMonth() &&
                day.fullDate.getFullYear() === today.getFullYear()
              
              return (
                <div key={`${day.date}-${index}`} className="flex flex-col bg-background">
                  {/* Day Header */}
                  <div className={`p-4 text-center border-b ${isToday ? "bg-blue-50 dark:bg-blue-950/20 border-border" : "bg-muted/30"}`}>
                    <div className="text-2xl font-semibold text-foreground">
                      {day.date}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {day.day}
                    </div>
                  </div>
                  
                  {/* Shipments */}
                  <div className={`flex-1 p-3 space-y-2 min-h-[600px] overflow-y-auto ${isToday ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}>
                    {day.shipments.length > 0 ? (
                      day.shipments.map((shipment) => (
                        <ShipmentCard 
                          key={shipment.id} 
                          shipment={shipment} 
                          onClick={() => handleShipmentClick(day.fullDate)}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[100px]">
                        <span className="text-sm text-muted-foreground">No shipments</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shipment Details Dialog */}
        {selectedDate && (
          <ShipmentDetailsDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            date={selectedDate}
            shipments={shipmentsForSelectedDate}
          />
        )}
      </>
    )
  }

  // Month view
  return (
    <div className="rounded-2xl border shadow-none overflow-hidden bg-background flex flex-col h-[calc(100vh-280px)]">
      {/* Day headers - sticky */}
      <div className="sticky top-0 z-10 grid grid-cols-7 bg-muted/30 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px bg-border">
        {calendarData.map((day, index) => {
          const isCurrentMonth = day.fullDate.getMonth() === currentDate.getMonth()
          const isToday = 
            day.fullDate.getDate() === today.getDate() &&
            day.fullDate.getMonth() === today.getMonth() &&
            day.fullDate.getFullYear() === today.getFullYear()
          
          // Hide days not in current month completely
          if (!isCurrentMonth) {
            return (
              <div
                key={`${day.date}-${index}`}
                className="min-h-[120px] p-2 bg-background"
              >
                {/* Completely invisible - no content */}
              </div>
            )
          }
          
          return (
            <div
              key={`${day.date}-${index}`}
              className={`p-1.5 flex flex-col min-h-[110px] ${
                isToday ? "bg-blue-50 dark:bg-blue-950/20" : "bg-background"
              }`}
            >
              {/* Day number - rechts positioniert */}
              <div className="flex items-center justify-end mb-1 h-4 shrink-0">
                <span className={`text-sm font-medium ${isToday ? "text-primary font-semibold" : "text-foreground"}`}>
                  {day.date}
                </span>
              </div>
              
              {/* Shipments - ultra-kompakt, 4 pro Tag */}
              <div className={`space-y-1 flex-1 ${day.shipments.length > 4 ? 'overflow-y-auto' : ''}`}>
                {day.shipments.length > 0 && (
                  <>
                    {day.shipments.slice(0, 4).map((shipment) => (
                      <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        compact 
                        onClick={() => handleShipmentClick(day.fullDate)}
                      />
                    ))}
                    {day.shipments.length > 4 && (
                      <div className="text-[10px] text-center text-muted-foreground py-0.5 rounded bg-muted/50">
                        +{day.shipments.length - 4} more
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {/* Shipment Details Dialog */}
      {selectedDate && (
        <ShipmentDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          shipments={shipmentsForSelectedDate}
        />
      )}
    </div>
  )
}
