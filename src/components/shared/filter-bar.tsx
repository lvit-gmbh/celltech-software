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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        {tabs && (
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
            <TabsList className="h-10">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="min-w-[90px]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="h-10 pl-10 rounded-lg border text-foreground w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
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
