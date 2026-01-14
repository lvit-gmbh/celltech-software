"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronRight } from "lucide-react"
import type { Shipment, ShipmentOrder } from "@/types"

interface ShipmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  shipments: Shipment[]
}

export function ShipmentDetailsDialog({
  open,
  onOpenChange,
  date,
  shipments,
}: ShipmentDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<"shipment" | "trailers">("shipment")
  const [shipmentSearch, setShipmentSearch] = useState("")
  const [trailerSearch, setTrailerSearch] = useState("")
  const [showScheduled, setShowScheduled] = useState(false)
  const [showAllTrailers, setShowAllTrailers] = useState(false)
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [expandedTrailerGroups, setExpandedTrailerGroups] = useState<Set<string>>(new Set())

  // Format date for display
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  // Filter shipments by date and search
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Filter by search query
      if (shipmentSearch) {
        const query = shipmentSearch.toLowerCase()
        const matchesSearch =
          shipment.shippingId?.toLowerCase().includes(query) ||
          shipment.dealer?.toLowerCase().includes(query) ||
          shipment.customer?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Filter by scheduled if toggle is on (show only non-shipped/scheduled shipments)
      if (showScheduled && shipment.shipped) {
        return false
      }

      return true
    })
  }, [shipments, shipmentSearch, showScheduled])

  // Get all trailers from shipments
  const allTrailers = useMemo(() => {
    const trailers: Array<{
      shipment: Shipment
      order: ShipmentOrder
    }> = []

    filteredShipments.forEach((shipment) => {
      if (shipment.orders && shipment.orders.length > 0) {
        shipment.orders.forEach((order) => {
          trailers.push({ shipment, order })
        })
      }
    })

    // Filter by search
    if (trailerSearch) {
      const query = trailerSearch.toLowerCase()
      return trailers.filter(({ order, shipment }) => {
        return (
          order.modelLabel?.toLowerCase().includes(query) ||
          order.vin_num?.toLowerCase().includes(query) ||
          shipment.dealer?.toLowerCase().includes(query) ||
          shipment.shipperName?.toLowerCase().includes(query) ||
          order.order_num?.toLowerCase().includes(query)
        )
      })
    }

    return trailers
  }, [filteredShipments, trailerSearch])

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

  const toggleTrailerGroupExpanded = (shipmentId: string) => {
    setExpandedTrailerGroups((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) {
        next.delete(shipmentId)
      } else {
        next.add(shipmentId)
      }
      return next
    })
  }

  // Calculate total price for a shipment
  const getShipmentTotalPrice = (shipment: Shipment): number => {
    if (!shipment.orders || shipment.orders.length === 0) return 0
    return shipment.orders.reduce((sum, order) => sum + (order.price || 0), 0)
  }

  // Format date helper
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
    } catch {
      return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-none">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Shipments - {formattedDate}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "shipment" | "trailers")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="shipment" className="w-full">Shipment</TabsTrigger>
            <TabsTrigger value="trailers" className="w-full">Trailers</TabsTrigger>
          </TabsList>

          {/* Shipment Tab */}
          <TabsContent value="shipment" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Select Shipment or Add New"
                    className="pl-10 rounded-lg"
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-scheduled"
                    checked={showScheduled}
                    onCheckedChange={setShowScheduled}
                  />
                  <Label htmlFor="show-scheduled" className="text-sm text-muted-foreground cursor-pointer">
                    show scheduled
                  </Label>
                </div>
              </div>

              {/* Shipments Table */}
              <div className="flex-1 overflow-y-auto rounded-2xl border shadow-none bg-background">
                <div className="divide-y divide-border">
                  {filteredShipments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No shipments found
                    </div>
                  ) : (
                    filteredShipments.map((shipment) => {
                      const isExpanded = expandedShipments.has(shipment.id)
                      const trailerCount = shipment.orders?.length || 0
                      const totalPrice = getShipmentTotalPrice(shipment)

                      return (
                        <div key={shipment.id} className="bg-background">
                          {/* Shipment Header Row */}
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleShipmentExpanded(shipment.id)}
                          >
                            <button className="text-muted-foreground hover:text-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                                  {shipment.shippingId}
                                </Badge>
                                <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20">
                                  {shipment.dealer || "No Dealer"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {shipment.shipperName ? (
                                  <Badge variant="outline">{shipment.shipperName}</Badge>
                                ) : (
                                  <span className="text-muted-foreground/50">Select Shipper</span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                #{trailerCount} Trailer{trailerCount !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 bg-muted/20">
                              {trailerCount === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No Trailers in this Shipment
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-6 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                                    <div>Model</div>
                                    <div>ORD#/AST#</div>
                                    <div>PO#</div>
                                    <div>Order Date</div>
                                    <div>Build Date</div>
                                    <div>Total Price</div>
                                  </div>
                                  {shipment.orders?.map((order, idx) => (
                                    <div key={order.id || idx} className="grid grid-cols-6 gap-4 text-sm">
                                      <div>
                                        {order.modelLabel && (
                                          <Badge variant="outline" className="bg-muted">
                                            {order.modelLabel}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-foreground">
                                        {order.order_num ? `ORD #${order.order_num}` : order.asset_no ? `AST #${order.asset_no}` : "-"}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {order.po || "-"}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {formatDate(order.order_date)}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {formatDate(order.build_date)}
                                      </div>
                                      <div className="font-medium text-foreground">
                                        {order.price
                                          ? new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: "USD",
                                              minimumFractionDigits: 2,
                                            }).format(order.price)
                                          : "-"}
                                      </div>
                                    </div>
                                  ))}
                                  {totalPrice > 0 && (
                                    <div className="pt-2 border-t font-semibold text-foreground">
                                      Total: {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                        minimumFractionDigits: 2,
                                      }).format(totalPrice)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Trailers Tab */}
          <TabsContent value="trailers" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Search and Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Select Trailer"
                    className="pl-10 rounded-lg"
                    value={trailerSearch}
                    onChange={(e) => setTrailerSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-all-trailers"
                    checked={showAllTrailers}
                    onCheckedChange={setShowAllTrailers}
                  />
                  <Label htmlFor="show-all-trailers" className="text-sm text-muted-foreground cursor-pointer">
                    show all trailers
                  </Label>
                </div>
              </div>

              {/* Trailers Table */}
              <div className="flex-1 overflow-y-auto rounded-2xl border shadow-none bg-background">
                <div className="divide-y divide-border">
                  {allTrailers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No trailers found
                    </div>
                  ) : (
                    (() => {
                      // Group trailers by shipment
                      const groupedTrailers = new Map<string, Array<{ shipment: Shipment; order: ShipmentOrder; idx: number }>>()
                      
                      allTrailers.forEach(({ shipment, order }, idx) => {
                        const shipmentId = shipment.id
                        if (!groupedTrailers.has(shipmentId)) {
                          groupedTrailers.set(shipmentId, [])
                        }
                        groupedTrailers.get(shipmentId)!.push({ shipment, order, idx })
                      })

                      return Array.from(groupedTrailers.entries()).map(([shipmentId, trailers]) => {
                        const shipment = trailers[0].shipment
                        const shipmentLabel = `${shipment.shippingId} (${trailers.length})`
                        const isExpanded = expandedTrailerGroups.has(shipmentId)

                        return (
                          <div key={shipmentId} className="bg-background">
                            {/* Trailer Group Header */}
                            <div
                              className="flex items-center gap-4 p-3 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleTrailerGroupExpanded(shipmentId)}
                            >
                              <button className="text-muted-foreground hover:text-foreground">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <div className="font-medium text-sm text-foreground">
                                {shipmentLabel}
                              </div>
                            </div>

                            {/* Expanded Trailer Details */}
                            {isExpanded && (
                              <div className="divide-y divide-border">
                                {trailers.map(({ order, idx }) => (
                                  <div key={`${shipment.id}-${order.id || idx}`} className="p-4 grid grid-cols-6 gap-4 items-center">
                                    <div className="flex flex-col gap-1">
                                      {order.modelLabel && (
                                        <div className="text-sm font-medium text-foreground">
                                          {order.modelLabel}
                                        </div>
                                      )}
                                      {order.order_num && (
                                        <div className="text-xs text-muted-foreground">
                                          {order.order_num}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      {shipment.shipperName ? (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                                          {shipment.shipperName}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </div>
                                    <div>
                                      {shipment.dealer ? (
                                        <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20">
                                          {shipment.dealer}
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20">
                                          No Dealer
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm">
                                      {order.order_num && (
                                        <div className="text-foreground">ORD #{order.order_num}</div>
                                      )}
                                      {order.vin_num && (
                                        <div className="text-xs text-muted-foreground">VIN #{order.vin_num}</div>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatDate(order.order_date)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatDate(order.build_date)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

