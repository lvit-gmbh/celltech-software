"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { VendorTable } from "@/components/contacts/vendors/vendor-table"
import { VendorDialog } from "@/components/contacts/vendors/vendor-dialog"

export default function VendorsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <PageHeader title="Vendor Overview" />

        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Leer */}
          <div></div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input
              placeholder="Search Vendors"
              className="h-10 w-full rounded-lg border pl-10 text-foreground"
            />
          </div>

          {/* Spalte 3: Add Button */}
          <div className="w-1/2 justify-self-end flex items-center justify-end">
            <VendorDialog>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </VendorDialog>
          </div>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-hidden">
        <VendorTable />
      </div>
    </div>
  )
}
