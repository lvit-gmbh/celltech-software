"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { ShipScheduleCalendar } from "@/components/ship-schedule/calendar-view"

export default function ShipSchedulePage() {
  const { shipScheduleView, setShipScheduleView } = useUIStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")

  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  // Format date range for display
  const formatDateRange = () => {
    if (shipScheduleView === "week") {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 5) // Monday to Saturday (6 days)
      
      const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" })
      const startDay = weekStart.getDate()
      const endDay = weekEnd.getDate()
      const year = weekStart.getFullYear()
      
      return `${startMonth} ${startDay} - ${endDay}, ${year}`
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (shipScheduleView === "week") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
      }
      return newDate
    })
  }

  return (
    <div className={`space-y-4 ${shipScheduleView === "month" ? "flex flex-col h-[calc(100vh-80px)]" : ""}`}>
      <div className={shipScheduleView === "month" ? "sticky top-0 z-20 bg-background pb-4 space-y-4" : "space-y-4"}>
        <PageHeader title="Shipping Schedule" />

        {/* Tabs + Search */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Tabs */}
          <div className="w-2/3 justify-self-start">
            <Tabs value={shipScheduleView} onValueChange={(v) => setShipScheduleView(v as "week" | "month")}>
              <TabsList className="h-10">
                <TabsTrigger value="week" className="min-w-[120px]">Week</TabsTrigger>
                <TabsTrigger value="month" className="min-w-[120px]">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input 
              placeholder="Search shipments..." 
              className="h-10 pl-10 rounded-lg border text-foreground w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Spalte 3: Leer */}
          <div></div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between rounded-2xl border shadow-none p-4 bg-background">
          <div className="text-lg font-medium text-foreground">{formatDateRange()}</div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToToday}
              className="transition-all duration-200 hover:bg-accent"
            >
              Today
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateDate("prev")}
              className="transition-all duration-200 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateDate("next")}
              className="transition-all duration-200 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className={shipScheduleView === "month" ? "flex-1 min-h-0" : ""}>
        <ShipScheduleCalendar 
          view={shipScheduleView}
          currentDate={currentDate}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}
