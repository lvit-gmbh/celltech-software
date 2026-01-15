"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { OrderBookTable } from "@/components/trailer-orders/order-book-table"
import { OrderImportDialog } from "@/components/trailer-orders/order-import-dialog"
import { Button } from "@/components/ui/button"
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Input } from "@/components/ui/input"
import { FileUp, Plus, Search, Grid3x3, FileText, ClipboardList } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUIStore } from "@/stores/ui-store"

export default function TrailerOrdersPage() {
  const { activeTabs, setActiveTab, trailerOrdersShowClosed, setTrailerOrdersShowClosed } = useUIStore()
  const activeTab = activeTabs["trailer-orders"] || "all"
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const tabs = [
    { value: "all", label: "All", icon: Grid3x3 },
    { value: "brightview", label: "BrightView", icon: FileText },
    { value: "standard", label: "Standard", icon: ClipboardList },
  ]

  // Determine brightview filter based on active tab
  const brightviewFilter = activeTab === "all" ? undefined : activeTab === "brightview"

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <PageHeader
          title="Order Book"
          actions={
            <>
              <OrderImportDialog>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Import
                </Button>
              </OrderImportDialog>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.push("/trailer-orders/new?type=brightview")}
              >
                <Plus className="h-4 w-4" />
                Brightview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.push("/trailer-orders/new?type=standard")}
              >
                <Plus className="h-4 w-4" />
                Standard
              </Button>
            </>
          }
        />

        {/* Tabs + Search + Show Closed Toggle */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Tabs */}
          <div className="w-2/3 justify-self-start">
            <ExpandableTabs
              tabs={tabs.map(tab => ({ value: tab.value, title: tab.label, icon: tab.icon }))}
              value={activeTab}
              onValueChange={(value) => setActiveTab("trailer-orders", value)}
            />
          </div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input 
              placeholder="Search Orders" 
              className="h-10 pl-10 rounded-lg border text-foreground w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Spalte 3: Show Closed Toggle */}
          <div className="w-1/2 justify-self-end flex items-center justify-end gap-2">
            <Label htmlFor="show-closed" className="text-sm text-foreground cursor-pointer">
              show closed orders
            </Label>
            <Switch
              id="show-closed"
              checked={trailerOrdersShowClosed}
              onCheckedChange={setTrailerOrdersShowClosed}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <OrderBookTable 
          brightviewFilter={brightviewFilter} 
          searchQuery={searchQuery}
          showClosed={trailerOrdersShowClosed}
        />
      </div>
    </div>
  )
}
