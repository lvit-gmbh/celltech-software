"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { OrderBookTable } from "@/components/trailer-orders/order-book-table"
import { OrderImportDialog } from "@/components/trailer-orders/order-import-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileUp, Plus, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUIStore } from "@/stores/ui-store"

export default function TrailerOrdersPage() {
  try {
    const { activeTabs, setActiveTab, trailerOrdersShowClosed, setTrailerOrdersShowClosed } = useUIStore()
    const activeTab = activeTabs["trailer-orders"] || "all"
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    const tabs = [
      { value: "all", label: "All" },
      { value: "brightview", label: "BrightView" },
      { value: "standard", label: "Standard" },
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab("trailer-orders", value)}>
                <TabsList className="h-10">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="min-w-[90px]">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative flex-1 max-w-lg w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                <Input 
                  placeholder="Search Orders" 
                  className="h-10 pl-10 rounded-lg border text-foreground w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
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
  } catch (error) {
    console.error("Error in TrailerOrdersPage:", error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Order Book</h1>
        <p className="text-muted-foreground">Error loading page. Check console for details.</p>
      </div>
    )
  }
}
