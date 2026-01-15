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
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

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

  const toggleDayExpanded = (date: Date) => {
    const key = date.toISOString().split("T")[0]
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className={`grid ${view === "week" ? "grid-cols-6" : "grid-cols-7"} gap-3`}>
        {[...Array(view === "week" ? 6 : 35)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (view === "week") {
    return (
      <>
        <div className="w-full border shadow-none overflow-hidden bg-background rounded-md flex flex-col h-[calc(100vh-280px)]">
          {/* Day Headers - sticky row */}
          <div className="sticky top-0 z-10 grid grid-cols-6 bg-border">
            {calendarData.map((day, index) => {
              const isToday =
                day.fullDate.getDate() === today.getDate() &&
                day.fullDate.getMonth() === today.getMonth() &&
                day.fullDate.getFullYear() === today.getFullYear()
              const dayOfWeek = day.fullDate.getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sonntag, 6 = Samstag

              return (
                <div
                  key={`header-${day.date}-${index}`}
                  className={`p-3 text-center ${
                    isToday
                      ? "bg-blue-50 dark:bg-blue-950/20 border-b-2 border-border"
                      : isWeekend
                        ? "bg-muted/40 border-b border-border"
                        : "bg-muted/30 border-b border-border"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xl font-semibold ${
                      isToday ? "text-foreground/40" : "text-foreground"
                    }`}>
                      {day.date}
                    </span>
                    <span className={`text-sm font-medium ${
                      isWeekend ? "text-muted-foreground/70" : "text-muted-foreground"
                    }`}>
                      {day.day}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scrollable content with full-height columns */}
          <div className="flex-1 overflow-y-auto scrollbar-stable">
            <div className="grid grid-cols-6 bg-border min-h-[calc(100vh-380px)]">
              {calendarData.map((day, index) => {
                const isToday =
                  day.fullDate.getDate() === today.getDate() &&
                  day.fullDate.getMonth() === today.getMonth() &&
                  day.fullDate.getFullYear() === today.getFullYear()
                const dayOfWeek = day.fullDate.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sonntag, 6 = Samstag

                return (
                  <div
                    key={`content-${day.date}-${index}`}
                    className={`flex flex-col min-h-[calc(100vh-380px)] ${
                      isToday 
                        ? "bg-blue-50 dark:bg-blue-950/20" 
                        : isWeekend 
                          ? "bg-muted/40" 
                          : "bg-background"
                    }`}
                  >
                    <div className={`flex-1 p-3 space-y-2 flex flex-col ${
                      day.shipments.length > 0 ? "bg-muted/10" : ""
                    }`}>
                      {day.shipments.length > 0 ? (
                        day.shipments.map((shipment) => (
                          <ShipmentCard
                            key={shipment.id}
                            shipment={shipment}
                            onClick={() => handleShipmentClick(day.fullDate)}
                          />
                        ))
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            No shipments
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
    <div className="rounded-md border shadow-none overflow-hidden bg-background flex flex-col h-[calc(100vh-280px)]">
      {/* Day headers - sticky */}
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => {
          const isWeekend = index === 0 || index === 6 // Sonntag oder Samstag
          return (
            <div 
              key={day} 
              className={`p-3 text-center text-sm font-semibold border-r border-border ${
                isWeekend 
                  ? "bg-muted/40 text-muted-foreground/70" 
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
      
      {/* Calendar grid - scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-stable">
        <div className="grid grid-cols-7">
        {calendarData.map((day, index) => {
          const isCurrentMonth = day.fullDate.getMonth() === currentDate.getMonth()
          const isToday = 
            day.fullDate.getDate() === today.getDate() &&
            day.fullDate.getMonth() === today.getMonth() &&
            day.fullDate.getFullYear() === today.getFullYear()
          const dayOfWeek = day.fullDate.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sonntag, 6 = Samstag
          
          // Days not in current month - grau wenn Wochenende
          if (!isCurrentMonth) {
            return (
              <div
                key={`${day.date}-${index}`}
                className={`min-h-[110px] border-r border-b border-border ${
                  isWeekend ? "bg-muted/40" : "bg-background"
                }`}
                style={{ padding: '0.375rem' }}
              >
                {/* Completely invisible - no content */}
              </div>
            )
          }
          
          return (
            <div
              key={`${day.date}-${index}`}
              className={`flex flex-col min-h-[110px] border-r border-b border-border ${
                isToday 
                  ? "bg-blue-50 dark:bg-blue-950/20" 
                  : isWeekend 
                    ? "bg-muted/40" 
                    : "bg-background"
              }`}
              style={{ padding: '0.375rem' }}
            >
              {/* Day number - rechts positioniert, feste Höhe für konsistente Ausrichtung */}
              <div className="flex items-start justify-end mb-1 shrink-0" style={{ height: '1.25rem', minHeight: '1.25rem', paddingTop: '0', marginTop: '0' }}>
                <span className={`text-sm font-medium leading-none ${isToday ? "text-primary font-semibold" : "text-foreground"}`}>
                  {day.date}
                </span>
              </div>
              
              {/* Shipments - ultra-kompakt, 4 pro Tag (expandable) */}
              {(() => {
                const dayKey = day.fullDate.toISOString().split("T")[0]
                const isExpanded = expandedDays.has(dayKey)
                const visibleShipments = isExpanded ? day.shipments : day.shipments.slice(0, 4)

                return (
                  <div className={`space-y-1 flex-1 overflow-x-hidden ${day.shipments.length > 4 ? "overflow-y-auto" : ""}`}>
                {day.shipments.length > 0 && (
                  <>
                    {visibleShipments.map((shipment) => (
                      <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        compact 
                        onClick={() => handleShipmentClick(day.fullDate)}
                      />
                    ))}
                    {!isExpanded && day.shipments.length > 4 && (
                      <button
                        type="button"
                        className="w-full text-[10px] text-center text-muted-foreground py-0.5 rounded bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                        onClick={() => toggleDayExpanded(day.fullDate)}
                      >
                        +{day.shipments.length - 4} more
                      </button>
                    )}
                  </>
                )}
                  </div>
                )
              })()}
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
