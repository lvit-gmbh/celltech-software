"use client"

import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Input } from "@/components/ui/input"
import { Search, Grid3x3, Package, Settings, FileText, Calendar, Clock, List, Layers, Wrench, Car, Building2, Store, Truck, Users, BarChart3, Coins, ClipboardList, Hammer } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { LucideIcon } from "lucide-react"

interface FilterBarProps {
  tabs?: { value: string; label: string; icon?: LucideIcon }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  searchPlaceholder?: string
  showClosedToggle?: boolean
  showClosed?: boolean
  onShowClosedChange?: (show: boolean) => void
  actions?: React.ReactNode
}

// Helper function to get icon based on label/value
function getIconForTab(value: string, label: string, customIcon?: LucideIcon): LucideIcon {
  if (customIcon) return customIcon
  
  const lowerValue = value.toLowerCase()
  const lowerLabel = label.toLowerCase()
  
  if (lowerValue.includes("all") || lowerLabel.includes("all")) return Grid3x3
  if (lowerValue.includes("items") || lowerLabel.includes("items")) return Package
  if (lowerValue.includes("assemblies") || lowerLabel.includes("assemblies")) return Layers
  if (lowerValue.includes("options") || lowerLabel.includes("options")) return Settings
  if (lowerValue.includes("models") || lowerLabel.includes("models")) return Car
  if (lowerValue.includes("dealers") || lowerLabel.includes("dealers")) return Building2
  if (lowerValue.includes("vendors") || lowerLabel.includes("vendors")) return Store
  if (lowerValue.includes("shipping") || lowerLabel.includes("shipping")) return Truck
  if (lowerValue.includes("brightview") || lowerLabel.includes("brightview")) return FileText
  if (lowerValue.includes("standard") || lowerLabel.includes("standard")) return ClipboardList
  if (lowerValue.includes("schedule") || lowerLabel.includes("schedule")) return Calendar
  if (lowerValue.includes("week") || lowerLabel.includes("week")) return Calendar
  if (lowerValue.includes("month") || lowerLabel.includes("month")) return Calendar
  if (lowerValue.includes("overview") || lowerLabel.includes("overview")) return BarChart3
  if (lowerValue.includes("sales") || lowerLabel.includes("sales")) return Coins
  if (lowerValue.includes("production") || lowerLabel.includes("production")) return Hammer
  
  return FileText
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
  const expandableTabs = tabs?.map(tab => ({
    value: tab.value,
    title: tab.label,
    icon: getIconForTab(tab.value, tab.label, tab.icon),
  }))

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
      {/* Spalte 1: Tabs */}
      <div className="w-2/3 justify-self-start">
        {expandableTabs && expandableTabs.length > 0 && (
          <ExpandableTabs
            tabs={expandableTabs}
            value={activeTab}
            onValueChange={onTabChange}
          />
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
