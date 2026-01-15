"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ShippingCompaniesTable } from "@/components/contacts/shipping-companies/shipping-table"

export default function ShippingCompaniesPage() {
  const router = useRouter()

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <PageHeader title="Shipping Companies" />
        
        {/* Search + Button on same line */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Leer */}
          <div></div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input placeholder="Search Shipping Companies" className="h-10 pl-10 rounded-lg border text-foreground w-full" />
          </div>

          {/* Spalte 3: Add Button */}
          <div className="w-1/2 justify-self-end flex items-center justify-end">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push("/contacts/shipping-companies/new")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-hidden">
        <ShippingCompaniesTable />
      </div>
    </div>
  )
}
