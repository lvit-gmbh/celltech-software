"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { VendorTable } from "@/components/contacts/vendors/vendor-table"
import { VendorDialog } from "@/components/contacts/vendors/vendor-dialog"

export default function VendorsPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <PageHeader title="Vendor Overview" />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input
              placeholder="Search Vendors"
              className="h-10 w-full rounded-lg border pl-10 text-foreground"
            />
          </div>
          <div className="ml-auto">
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
