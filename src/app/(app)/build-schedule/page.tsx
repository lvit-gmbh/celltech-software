"use client"

import { useState, useRef, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Eye, EyeOff, Search, Printer, ChevronsLeft, ChevronsRight, CalendarIcon, Grid3x3, FileText, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useUIStore } from "@/stores/ui-store"
import { BuildScheduleTable } from "@/components/build-schedule/build-table"
import { UnscheduledBuildsTable } from "@/components/build-schedule/unscheduled-builds-table"

export default function BuildSchedulePage() {
  const { activeTabs, setActiveTab } = useUIStore()
  const activeTab = activeTabs["build-schedule"] || "all"
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showFinished, setShowFinished] = useState(true)
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false)
  const [tabsWidth, setTabsWidth] = useState<number>(0)
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const measureWidth = () => {
      if (tabsRef.current) {
        const width = tabsRef.current.offsetWidth
        setTabsWidth(width)
      }
    }
    
    // Sofort messen
    measureWidth()
    
    // Nach kurzer Verzögerung nochmal messen (für initiales Rendering)
    const timeout = setTimeout(measureWidth, 0)
    
    // Resize observer für dynamische Anpassung
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(measureWidth)
    })
    
    if (tabsRef.current) {
      resizeObserver.observe(tabsRef.current)
    }
    
    return () => {
      clearTimeout(timeout)
      resizeObserver.disconnect()
    }
  }, [activeTab, showFilterOptions])

  const tabs = [
    { value: "all", label: "All", icon: Grid3x3 },
    { value: "brightview", label: "BrightView", icon: FileText },
    { value: "standard", label: "Standard", icon: ClipboardList },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Oberer Bereich immer sichtbar */}
      <div className="flex-shrink-0 space-y-4">
        <PageHeader
          title="Build Schedule"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={
                  isUnscheduledOpen ? "Hide unscheduled builds" : "Show unscheduled builds"
                }
                onClick={() => setIsUnscheduledOpen((prev) => !prev)}
              >
                {isUnscheduledOpen ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          }
        />

        {/* Tabs + Search + Filter + Show Finished */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Tabs */}
          <div 
            ref={tabsRef} 
            className="justify-self-start" 
            style={{ width: tabsWidth > 0 ? `${tabsWidth}px` : 'auto' }}
          >
            <ExpandableTabs
              tabs={tabs.map(tab => ({ value: tab.value, title: tab.label, icon: tab.icon }))}
              value={activeTab}
              onValueChange={(value) => setActiveTab("build-schedule", value)}
              className="w-full"
            />
          </div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-10 pl-10 rounded-lg w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Spalte 3: Filter Button */}
          <div className="w-1/2 justify-self-end flex items-center justify-end">
            <Button
              variant="outline"
              className="gap-2 h-10"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              {showFilterOptions ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Filter
            </Button>
          </div>
        </div>

        {/* Filter Options Row - Shown when filter is active */}
        {showFilterOptions && (
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
            {/* Spalte 1: Ship Period Button - aligned with tabs */}
            <div 
              className="justify-self-start"
              style={{ width: tabsWidth > 0 ? `${tabsWidth}px` : 'auto', minWidth: 'fit-content' }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 w-full h-10 justify-start rounded-lg"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Ship Period</span>
                    {dateRange?.from && (
                      <span className="text-sm">
                        {format(dateRange.from, "MM/dd/yy")}
                        {dateRange.to && ` - ${format(dateRange.to, "MM/dd/yy")}`}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    showOutsideDays={false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Spalte 2: Empty for spacing */}
            <div></div>

            {/* Spalte 3: Show Finished Toggle - Aligned to the right */}
            <div className="w-1/2 justify-self-end flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Label htmlFor="show-finished" className="text-sm text-muted-foreground">
                  show finished
                </Label>
                <Switch
                  id="show-finished"
                  checked={showFinished}
                  onCheckedChange={setShowFinished}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nur die Tabelle (inkl. Pagination) ist scrollbar – eigener Scrollbereich */}
      <div className="flex-1 min-h-0 overflow-hidden mt-4 flex flex-col">
        <BuildScheduleTable
          searchQuery={searchQuery}
          dateRange={dateRange}
          showFinished={showFinished}
          activeTab={activeTab}
        />
      </div>

      {/* Right side slider for Unscheduled Builds */}
      <Sheet open={isUnscheduledOpen} onOpenChange={setIsUnscheduledOpen}>
        <SheetContent side="right" className="sm:max-w-4xl w-full flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Unscheduled Builds</SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <UnscheduledBuildsTable />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
