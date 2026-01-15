"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface FilterBarProps {
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  searchPlaceholder?: string
  showClosedToggle?: boolean
  showClosed?: boolean
  onShowClosedChange?: (show: boolean) => void
  actions?: React.ReactNode
}

export function FilterBar({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = "Search...",
  showClosedToggle,
  showClosed,
  onShowClosedChange,
  actions,
}: FilterBarProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
      {/* Spalte 1: Tabs */}
      <div className="w-2/3 justify-self-start">
        {tabs && (
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
            <TabsList className="h-8">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="min-w-[70px]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
      
      {/* Spalte 2: Searchbar */}
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="h-8 pl-9 rounded-lg border text-foreground w-full"
        />
      </div>
      
      {/* Spalte 3: Rechte Elemente */}
      <div className="w-1/2 justify-self-end flex items-center justify-end gap-3">
        {showClosedToggle && (
          <div className="flex items-center gap-2">
            <Label htmlFor="show-closed" className="text-sm text-muted-foreground cursor-pointer">
              show closed orders
            </Label>
            <Switch
              id="show-closed"
              checked={showClosed}
              onCheckedChange={onShowClosedChange}
            />
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
