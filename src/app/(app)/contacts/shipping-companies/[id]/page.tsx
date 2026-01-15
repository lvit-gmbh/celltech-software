"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronRight, Check, Pencil } from "lucide-react"
import {
  fetchShippingCompanyById,
  fetchShipmentsByShippingCompany,
} from "@/lib/supabase/queries"
import { usePagination } from "@/hooks/use-pagination"
import type { ShippingCompany, Shipment } from "@/types"

interface ShippingCompanyDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ShippingCompanyDetailPage({
  params,
}: ShippingCompanyDetailPageProps) {
  const router = useRouter()
  const [company, setCompany] = useState<ShippingCompany | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [hideShipped, setHideShipped] = useState(false)
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    mail: "",
    state: "",
    minDistance: 0,
    notes: "",
    area: [] as string[],
  })

  // Resolve params
  useEffect(() => {
    let isMounted = true

    async function resolveParams() {
      try {
        const resolved = await params
        if (isMounted && resolved?.id) {
          setCompanyId(resolved.id)
        } else if (isMounted) {
          setError("Invalid shipping company ID in URL")
          setLoading(false)
        }
      } catch (err) {
        console.error("Failed to resolve params:", err)
        if (isMounted) {
          setError("Failed to load page parameters")
          setLoading(false)
        }
      }
    }

    resolveParams()

    return () => {
      isMounted = false
    }
  }, [params])

  useEffect(() => {
    if (!companyId) return

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const id: string = companyId as string // TypeScript guard - we know it's not null due to check above
        const [companyData, shipmentsData] = await Promise.all([
          fetchShippingCompanyById(id),
          fetchShipmentsByShippingCompany(id),
        ])

        if (companyData) {
          setCompany(companyData)
          setFormData({
            name: companyData.name || "",
            contact: companyData.contact || "",
            phone: companyData.phone || "",
            mail: companyData.mail || "",
            state: companyData.state || "",
            minDistance: companyData.minDistance || 0,
            notes: companyData.notes || "",
            area: Array.isArray(companyData.area)
              ? companyData.area
              : companyData.area
              ? [companyData.area]
              : [],
          })
        } else {
          setError(`Shipping company with ID ${companyId} not found`)
        }

        setShipments(shipmentsData || [])
      } catch (err) {
        console.error("Failed to load shipping company:", err)
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load shipping company"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [companyId])

  const toggleShipmentExpanded = (shipmentId: string) => {
    setExpandedShipments((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) {
        next.delete(shipmentId)
      } else {
        next.add(shipmentId)
      }
      return next
    })
  }

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          shipment.shippingId?.toLowerCase().includes(query) ||
          shipment.dealer?.toLowerCase().includes(query) ||
          shipment.customer?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Filter by hide shipped toggle
      if (hideShipped && shipment.shipped) {
        return false
      }

      return true
    })
  }, [shipments, searchQuery, hideShipped])

  // Create table columns
  const columns = useMemo<ColumnDef<Shipment>[]>(() => [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => {
        const shipment = row.original
        const isExpanded = expandedShipments.has(shipment.id)
        return (
          <div
            onClick={(e) => {
              e.stopPropagation()
              toggleShipmentExpanded(shipment.id)
            }}
            className="cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "shippingId",
      header: "Shippment",
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {shipment.shippingId || `Shipment ${shipment.id}`}
          </span>
        )
      },
    },
    {
      accessorKey: "dealer",
      header: "Dealer",
      cell: ({ row }) => {
        const shipment = row.original
        const dealerName = shipment.dealer || "No Dealer"
        return (
          <Badge
            variant="secondary"
            className={
              dealerName.includes("300")
                ? "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/30"
                : "bg-red-100 text-red-700 border-0 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/30"
            }
          >
            {dealerName}
          </Badge>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Ship date",
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <span className="text-sm">
            {shipment.date
              ? new Date(shipment.date).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                })
              : "-"}
          </span>
        )
      },
    },
    {
      id: "trailerCount",
      header: "#Trailers",
      cell: ({ row }) => {
        const shipment = row.original
        const trailerCount = shipment.orders?.length || 0
        return <span className="text-sm">{trailerCount}</span>
      },
    },
  ], [expandedShipments])

  const table = useReactTable({
    data: filteredShipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  })

  const totalCount = filteredShipments.length
  const startRow = pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  )

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Error Loading Shipping Company
        </h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/contacts/shipping-companies")}>
          Back to Shipping Companies
        </Button>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Shipping Company Not Found
        </h1>
        <p className="text-muted-foreground mb-4">
          The requested shipping company could not be found.
        </p>
        <Button variant="outline" onClick={() => router.push("/contacts/shipping-companies")}>
          Back to Shipping Companies
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Area - No Scroll */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6 gap-4">
        {/* Shipping Company Details Section */}
        <Card className="rounded-2xl shadow-none border flex-shrink-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Contact <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="h-10"
                    placeholder="-"
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-10"
                    placeholder="Enter value"
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">E-Mail</Label>
                  <Input
                    value={formData.mail}
                    onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                    className="h-10"
                    placeholder="Enter value"
                    type="email"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">States</Label>
                  <Select value="all" onValueChange={() => {}}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Default (All)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Default (All)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Min. Miles</Label>
                  <Input
                    type="number"
                    value={formData.minDistance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minDistance: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <Label className="text-sm font-medium text-foreground pt-2">Notes</Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter notes..."
                  />
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => router.push("/contacts/shipping-companies")} className="gap-2">
                <Check className="h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Section */}
        <Card className="rounded-2xl shadow-none border flex-[2] flex flex-col overflow-hidden min-h-[500px]">
          <CardContent className="p-6 flex flex-col h-full overflow-hidden">
            {/* Header and Controls - Fixed */}
            <div className="flex-shrink-0 mb-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Shipments</h2>

              {/* Search and Toggle */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Shipments"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-10 rounded-lg border"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Switch
                    id="hide-shipped"
                    checked={hideShipped}
                    onCheckedChange={setHideShipped}
                  />
                  <Label htmlFor="hide-shipped" className="text-sm cursor-pointer">
                    hide shipped
                  </Label>
                </div>
              </div>
            </div>

            {/* Table Container with scrollable body */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-lg border">
              {/* Fixed Header */}
              <div className="flex-shrink-0 bg-background border-b">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="h-12 w-12 px-4 text-left align-middle font-medium text-muted-foreground"></th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Shippment</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dealer</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ship date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#Trailers</th>
                    </tr>
                  </thead>
                </table>
              </div>
              
              {/* Scrollable Body */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => {
                        const shipment = row.original
                        const isExpanded = expandedShipments.has(shipment.id)

                        return (
                          <React.Fragment key={row.id}>
                            <tr
                              className="cursor-pointer hover:bg-muted/50 border-b transition-colors"
                              onClick={() => toggleShipmentExpanded(shipment.id)}
                            >
                              <td className="py-3 px-4 align-middle w-12">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {shipment.shippingId || `Shipment ${shipment.id}`}
                                </span>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <Badge
                                  variant="secondary"
                                  className={
                                    (shipment.dealer || "No Dealer").includes("300")
                                      ? "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                      : "bg-red-100 text-red-700 border-0 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/30"
                                  }
                                >
                                  {shipment.dealer || "No Dealer"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <span className="text-sm">
                                  {shipment.date
                                    ? new Date(shipment.date).toLocaleDateString("en-US", {
                                        month: "2-digit",
                                        day: "2-digit",
                                        year: "2-digit",
                                      })
                                    : "-"}
                                </span>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                <span className="text-sm">{shipment.orders?.length || 0}</span>
                              </td>
                            </tr>
                            {isExpanded && shipment.orders && shipment.orders.length > 0 && (
                              <tr className="bg-muted/30 border-b">
                                <td colSpan={5} className="p-0">
                                  <div className="p-4 space-y-3">
                                    {shipment.orders.map((order, index) => (
                                      <div
                                        key={order.id || index}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                                      >
                                        <div>
                                          <span className="text-muted-foreground">Model:</span>{" "}
                                          <span className="font-medium">
                                            {order.modelLabel || "-"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">VIN#:</span>{" "}
                                          <span className="font-medium">{order.vin_num || "-"}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">STOCK#:</span>{" "}
                                          <span className="font-medium">
                                            {order.asset_no || order.order_num || "-"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Order Date:</span>{" "}
                                          <span className="font-medium">
                                            {order.order_date
                                              ? new Date(order.order_date).toLocaleDateString()
                                              : "·"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Build Date:</span>{" "}
                                          <span className="font-medium">
                                            {order.build_date
                                              ? new Date(order.build_date).toLocaleDateString()
                                              : "-"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Total Price:</span>{" "}
                                          <span className="font-medium">
                                            ${(order.price || 0).toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                          No shipments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - Fixed at bottom */}
            {totalCount > 0 && (
              <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground min-w-[200px]">
                  Showing {startRow}-{endRow} of {totalCount}
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        />
                      </PaginationItem>

                      {showLeftEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {pages.map((page) => {
                        const isActive = page === table.getState().pagination.pageIndex + 1
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={isActive}
                              onClick={() => table.setPageIndex(page - 1)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {showRightEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                <div className="min-w-[200px]"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

