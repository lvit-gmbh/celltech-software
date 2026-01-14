"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { PricingTable } from "@/components/pricing/pricing-table"
import { PriceDialog } from "@/components/pricing/price-dialog"

export default function PricingPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        <PageHeader title="Pricing" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input placeholder="Search Prices" className="h-10 pl-10 rounded-lg border text-foreground" />
          </div>
          <PriceDialog>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </PriceDialog>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 min-h-0">
        <PricingTable />
      </div>
    </div>
  )
}
