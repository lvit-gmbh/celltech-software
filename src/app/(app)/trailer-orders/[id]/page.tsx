"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronUp,
  ChevronDown,
  DollarSign,
  Upload,
  Plus,
  FileText,
  Settings,
  MessageSquare,
  File,
  CalendarIcon,
  X,
  Save,
} from "lucide-react"
import { fetchOrderById, fetchDealersForMapping, fetchAllShipments, createOrder, updateOrder } from "@/lib/supabase/queries"
import { CircularProgress } from "@/components/shared/circular-progress"
import type { Order } from "@/types"

// Size options based on image
const SIZE_OPTIONS = [
  "7×14", "7×16", "8.5×16", "8.5×18", "8.5×20", "8.5×22", "8.5×24",
  "CM20", "CM22", "CM24", "ST14", "ST16"
]

// Rear door options
const REAR_DOOR_OPTIONS = ["DD", "RP", "RU", "SA"]

// Axle rating options
const AXLE_RATING_OPTIONS = ["3.500", "5.200", "7.000", "8.000", "10.000"]

// Axle type options
const AXLE_TYPE_OPTIONS = ["Spring", "Torsion"]

// Color options
const COLOR_OPTIONS = ["White", "Grey", "Black"]

// Discount types
const DISCOUNT_TYPES = ["no discount", "discount", "discount (%)"]

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "standard"
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [dealerName, setDealerName] = useState<string>("")
  const [generalOpen, setGeneralOpen] = useState(true)
  const [customizationOpen, setCustomizationOpen] = useState(true)
  const [progressOpen, setProgressOpen] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [buildDatePickerOpen, setBuildDatePickerOpen] = useState(false)
  const [finishDatePickerOpen, setFinishDatePickerOpen] = useState(false)
  const [showStandardOptions, setShowStandardOptions] = useState(true)
  const [showCustomOptions, setShowCustomOptions] = useState(true)
  const [showOrderNotes, setShowOrderNotes] = useState(true)
  const [showFiles, setShowFiles] = useState(true)
  const [shipments, setShipments] = useState<Array<{ id: number; shippingId: string; date: string | null }>>([])
  const [tasks, setTasks] = useState<string[]>([
    "SCHEDULE",
    "WELDED",
    "ZINK",
    "RETURNED",
    "ASSEMBLED",
    "WIRE",
    "FLOOR",
    "MOUNTING",
    "ROOF",
    "TRIM",
    "BV OPTIONS",
    "FINAL / QC",
  ])

  // Form state
  const [formData, setFormData] = useState({
    po: "",
    asset_no: "",
    order_date: "",
    dealer_id: "",
    requested_by: "",
    discount_type: "no discount",
    discount_percent: 0,
    tax: 0,
    description: "",
    vin_num: "",
    model: "",
    size: "",
    rear_door: "",
    axle_rating: "",
    axle_type: "",
    color: "",
    template_name: "",
    build_date: "",
    finish_date: "",
    shipment_id: "",
  })

  // Pricing calculations (example values)
  const [pricing, setPricing] = useState({
    trailer: 0,
    options: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
  })

  // Standard options
  const [standardOptions, setStandardOptions] = useState<Array<{
    id: string
    name: string
    amount: number
    max: number
    pricePerUnit: number
    notes: string
  }>>([])

  // Resolve params
  useEffect(() => {
    let isMounted = true
    
    async function resolveParams() {
      try {
        const resolved = await params
        console.log("Resolved params:", resolved)
        if (isMounted && resolved?.id) {
          setOrderId(resolved.id)
        } else if (isMounted) {
          setError("Invalid order ID in URL")
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

  const isNew = orderId === "new"

  useEffect(() => {
    if (!orderId) return

    if (orderId === "new") {
      setLoading(false)
      setError(null)
      setOrder(null)
      return
    }

    async function loadOrder() {
      setLoading(true)
      setError(null)
      try {
        const id = parseInt(orderId, 10)
        console.log("Loading order with ID:", id, "from orderId:", orderId)
        
        if (isNaN(id)) {
          throw new Error(`Invalid order ID: ${orderId}`)
        }

        const [orderData, dealers, shipmentsData] = await Promise.all([
          fetchOrderById(id),
          fetchDealersForMapping(),
          fetchAllShipments(),
        ])

        console.log("Order data:", orderData)
        console.log("Dealers:", dealers)
        console.log("Shipments:", shipmentsData)

        if (orderData) {
          setOrder(orderData)
          
          // Find dealer name
          const dealer = dealers.find((d) => d.id === orderData.dealer_id)
          setDealerName(dealer?.name || "")

          // Set shipments
          setShipments(shipmentsData)

          // Initialize form data
          setFormData({
            po: orderData.po || "",
            asset_no: orderData.asset_no?.toString() || "",
            order_date: orderData.order_date || "",
            dealer_id: orderData.dealer_id?.toString() || "",
            requested_by: orderData.requested_by || "",
            discount_type: orderData.discount_type || "no discount",
            discount_percent: orderData.discount_percent || 0,
            tax: orderData.tax || 0,
            description: orderData.description || "",
            vin_num: orderData.vin_num || "",
            model: orderData.model || "",
            size: "",
            rear_door: "",
            axle_rating: "",
            axle_type: "",
            color: orderData.color?.toString() || "",
            template_name: orderData.template || "",
            build_date: orderData.build_date || "",
            finish_date: orderData.fin_date || "",
            shipment_id: orderData.shipment_id?.toString() || "",
          })

          // Set pricing
          const optionsPrice = calculateOptionsPrice(orderData)
          setPricing({
            trailer: orderData.price - optionsPrice,
            options: optionsPrice,
            subtotal: orderData.price,
            vat: orderData.price * (orderData.tax / 100),
            total: orderData.price * (1 + orderData.tax / 100),
          })

          // Set standard options based on order
          const options: typeof standardOptions = []
          if (orderData.gas_tank) {
            options.push({
              id: "gas_tank",
              name: "Gas Tank",
              amount: 1,
              max: 1,
              pricePerUnit: 1850,
              notes: "",
            })
          }
          if (orderData.side_door === false) {
            options.push({
              id: "no_side_door",
              name: "No Side Door",
              amount: 1,
              max: 1,
              pricePerUnit: 0,
              notes: "",
            })
          }
          if (orderData.spare_tire) {
            options.push({
              id: "spare_tire",
              name: "Spare Tire",
              amount: 1,
              max: 1,
              pricePerUnit: 250,
              notes: "",
            })
          }
          if (orderData.beavertail) {
            options.push({
              id: "beavertail",
              name: "Beavertail",
              amount: 1,
              max: 1,
              pricePerUnit: 500,
              notes: "",
            })
          }
          setStandardOptions(options)
        } else {
          console.warn("Order not found for ID:", id)
          setError(`Order with ID ${id} not found`)
        }
      } catch (err) {
        console.error("Failed to load order:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load order"
        console.error("Error details:", {
          orderId,
          parsedId: parseInt(orderId, 10),
          error: err
        })
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  function calculateOptionsPrice(order: Order): number {
    let total = 0
    if (order.gas_tank) total += 1850
    if (order.spare_tire) total += 250
    if (order.beavertail) total += 500
    return total
  }


  const handleSave = async () => {
    try {
      if (isNew) {
        const baseValues: Record<string, any> = {
          brightview: type === "brightview",
          po: formData.po || null,
          asset_no: formData.asset_no ? Number(formData.asset_no) : null,
          order_date: formData.order_date || null,
          dealer_id: formData.dealer_id ? Number(formData.dealer_id) : null,
          requested_by: formData.requested_by || null,
          discount_type: formData.discount_type || null,
          discount_percent: formData.discount_percent ?? null,
          tax: formData.tax ?? 0,
          description: formData.description || null,
          vin_num: formData.vin_num || null,
          model: formData.model || null,
          color: formData.color ? Number(formData.color) || formData.color : null,
          template: formData.template_name || null,
          build_date: formData.build_date || null,
          fin_date: formData.finish_date || null,
          shipment_id: formData.shipment_id ? Number(formData.shipment_id) : null,
        }

        await createOrder(baseValues)
      } else {
        if (!order) return

        const updates: Record<string, any> = {
          po: formData.po || null,
          asset_no: formData.asset_no ? Number(formData.asset_no) : null,
          order_date: formData.order_date || null,
          dealer_id: formData.dealer_id ? Number(formData.dealer_id) : null,
          requested_by: formData.requested_by || null,
          discount_type: formData.discount_type || null,
          discount_percent: formData.discount_percent ?? null,
          tax: formData.tax ?? 0,
          description: formData.description || null,
          vin_num: formData.vin_num || null,
          model: formData.model || null,
          color: formData.color ? Number(formData.color) || formData.color : null,
          template: formData.template_name || null,
          build_date: formData.build_date || null,
          fin_date: formData.finish_date || null,
          shipment_id: formData.shipment_id ? Number(formData.shipment_id) : null,
        }

        await updateOrder(order.id, updates)
      }

      router.push("/trailer-orders")
    } catch (error) {
      console.error("Failed to save order:", error)
    }
  }

  const handleCancel = () => {
    router.push("/trailer-orders")
  }

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
        <h1 className="text-2xl font-semibold text-foreground mb-2">Error Loading Order</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/trailer-orders")}>
            Back to Orders
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!order && !isNew) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
        <Button variant="outline" onClick={() => router.push("/trailer-orders")}>
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Order Details{" "}
          <span className="text-muted-foreground font-normal italic">
            (
              {isNew
                ? type === "brightview"
                  ? "New BrightView Order"
                  : "New Standard Order"
                : dealerName || (order ? `Order #${order.id}` : "Order")}
            )
          </span>
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-6 pb-24 space-y-4">
        {/* General Section */}
        <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
          <Card className="rounded-2xl shadow-none border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">General</CardTitle>
                  {generalOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 flex flex-col min-h-[600px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* PO Number */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">PO Number</Label>
                      <Input
                        value={formData.po}
                        onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                        className="h-10"
                      />
                    </div>

                    {/* Asset Number */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Asset Number</Label>
                      <div>
                        <Input
                          value={formData.asset_no}
                          onChange={(e) => setFormData({ ...formData, asset_no: e.target.value })}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          ⓘ The order number will be padded to length 6 with preceding 0's
                        </p>
                      </div>
                    </div>

                    {/* Order Date */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Order Date</Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10 w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.order_date ? (
                              new Date(formData.order_date).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.order_date ? new Date(formData.order_date + "T00:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Use local date to avoid timezone issues
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                const dateString = `${year}-${month}-${day}`
                                setFormData({ ...formData, order_date: dateString })
                                setDatePickerOpen(false)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* BrightView Location */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Brightview Location <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.dealer_id}
                        onValueChange={(value) => setFormData({ ...formData, dealer_id: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.dealer_id && (
                            <SelectItem value={formData.dealer_id}>#{formData.dealer_id}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Requested By */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Requested By</Label>
                      <Input
                        value={formData.requested_by}
                        onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                        className="h-10"
                      />
                    </div>

                    {/* Discount Type */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Discount</Label>
                      <div className="space-y-3">
                        <div className="flex rounded-lg border overflow-hidden">
                          {DISCOUNT_TYPES.map((type) => (
                            <button
                              key={type}
                              onClick={() => setFormData({ ...formData, discount_type: type })}
                              className={`flex-1 px-4 py-2 text-sm transition-colors ${
                                formData.discount_type === type
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted text-foreground"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        {(formData.discount_type === "discount" || formData.discount_type === "discount (%)") && (
                          <div className="relative w-full">
                            <Input
                              type="number"
                              value={formData.discount_percent || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  discount_percent: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-10 pr-8"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                              {formData.discount_type === "discount" ? "$" : "%"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Tax</Label>
                      <div className="relative w-full">
                        <Input
                          value={formData.tax}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tax: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-10 pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                      <Label className="text-sm font-medium text-foreground pt-2">Description</Label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Enter description..."
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* VIN */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">VIN</Label>
                      <Input
                        value={formData.vin_num}
                        onChange={(e) => setFormData({ ...formData, vin_num: e.target.value })}
                        className="h-10"
                        placeholder="Enter value"
                      />
                    </div>

                    {/* Model */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Model <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="h-10"
                      />
                    </div>

                    {/* Size */}
                    <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                      <Label className="text-sm font-medium text-foreground pt-2">
                        Size <span className="text-destructive">*</span>
                      </Label>
                      <div className="space-y-3">
                        <div className="inline-flex flex-wrap gap-2.5">
                          {SIZE_OPTIONS.map((size) => (
                            <button
                              key={size}
                              onClick={() => setFormData({ ...formData, size })}
                              className={`
                                px-4 py-2.5 text-sm font-medium rounded-lg border
                                transition-all duration-200 ease-in-out
                                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                                ${
                                  formData.size === size
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background hover:bg-muted/50 text-foreground border-border hover:border-primary/30"
                                }
                              `}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rear Door */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Rear Door <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-1">
                        {REAR_DOOR_OPTIONS.map((door) => (
                          <button
                            key={door}
                            onClick={() => setFormData({ ...formData, rear_door: door })}
                            className={`flex-1 px-4 py-2 text-sm rounded-md border transition-colors ${
                              formData.rear_door === door
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted text-foreground border-input"
                            }`}
                          >
                            {door}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Axle Rating */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Axle Rating <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-1">
                        {AXLE_RATING_OPTIONS.map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFormData({ ...formData, axle_rating: rating })}
                            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                              formData.axle_rating === rating
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted text-foreground border-input"
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Axle Type */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Axle Type <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-1">
                        {AXLE_TYPE_OPTIONS.map((type) => (
                          <button
                            key={type}
                            onClick={() => setFormData({ ...formData, axle_type: type })}
                            className={`flex-1 px-4 py-2 text-sm rounded-md border transition-colors ${
                              formData.axle_type === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted text-foreground border-input"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color */}
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        Color <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-1">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setFormData({ ...formData, color })}
                            className={`flex-1 px-4 py-2 text-sm rounded-md border transition-colors ${
                              formData.color === color
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted text-foreground border-input"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Buttons and Pricing Summary */}
                <div className="mt-auto pt-4 border-t flex items-end justify-between gap-8">
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[240px]">
                    <Button variant="outline" className="w-full justify-center gap-2 h-10">
                      <DollarSign className="h-4 w-4" />
                      Recalculate Price
                    </Button>
                    <Button variant="outline" className="w-full justify-center gap-2 h-10">
                      <Upload className="h-4 w-4" />
                      Load from Template
                    </Button>
                  </div>

                  {/* Pricing Summary */}
                  <div className="min-w-[200px] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trailer</span>
                      <span className="font-medium">${pricing.trailer.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Options</span>
                      <span className="font-medium">${pricing.options.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${pricing.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT ({formData.tax}%)</span>
                      <span className="font-medium">${pricing.vat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>${pricing.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Customization Section */}
        <Collapsible open={customizationOpen} onOpenChange={setCustomizationOpen}>
          <Card className="rounded-2xl shadow-none border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Customization</CardTitle>
                  {customizationOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {/* Toggle Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={showStandardOptions ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowStandardOptions(!showStandardOptions)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Standard Options
                  </Button>
                  <Button
                    variant={showCustomOptions ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCustomOptions(!showCustomOptions)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Custom Options
                  </Button>
                  <Button
                    variant={showOrderNotes ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOrderNotes(!showOrderNotes)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Order Notes
                  </Button>
                  <Button
                    variant={showFiles ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFiles(!showFiles)}
                    className="gap-2"
                  >
                    <File className="h-4 w-4" />
                    Files
                  </Button>
                </div>

                {/* Standard Options */}
                {showStandardOptions && (
                  <div className="mb-4">
                    <Card className="rounded-xl border shadow-none">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Standard Options</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[200px]">Option</TableHead>
                              <TableHead className="w-[80px] text-center">Amount</TableHead>
                              <TableHead className="w-[80px] text-center">(Max.)</TableHead>
                              <TableHead className="w-[100px] text-right">Price/Unit</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[120px] text-right">Price (total)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {standardOptions.length > 0 ? (
                              <>
                                {standardOptions.map((option) => (
                                  <TableRow key={option.id} className="bg-blue-50/50 dark:bg-blue-950/20">
                                    <TableCell className="font-medium">{option.name}</TableCell>
                                    <TableCell className="text-center">{option.amount}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{option.max}</TableCell>
                                    <TableCell className="text-right">
                                      {option.pricePerUnit.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        placeholder="Enter notes"
                                        className="h-8 border-0 bg-transparent focus-visible:ring-0 px-0 text-muted-foreground"
                                        value={option.notes}
                                        onChange={(e) => {
                                          setStandardOptions((prev) =>
                                            prev.map((o) =>
                                              o.id === option.id ? { ...o, notes: e.target.value } : o
                                            )
                                          )
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {(option.amount * option.pricePerUnit).toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="hover:bg-transparent border-t-2">
                                  <TableCell colSpan={5} className="text-right font-medium">
                                    SUM
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {standardOptions
                                      .reduce((sum, o) => sum + o.amount * o.pricePerUnit, 0)
                                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                                    $
                                  </TableCell>
                                </TableRow>
                              </>
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No standard options configured
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Custom Options */}
                {showCustomOptions && (
                  <div className="mb-4">
                    <Card className="rounded-xl border shadow-none">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Custom Options</CardTitle>
                      </CardHeader>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">No custom options configured</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Order Notes */}
                {showOrderNotes && (
                  <div className="mb-4">
                    <Card className="rounded-xl border shadow-none">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Order Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <textarea
                          className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Enter order notes..."
                          defaultValue={order?.notes || order?.build_notes || ""}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Files */}
                {showFiles && (
                  <div className="mb-4">
                    <Card className="rounded-xl border shadow-none">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Files</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Filename</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Create date</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No files uploaded
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Create Order Acknowledgement */}
                    <div className="flex justify-end mt-4">
                      <Select>
                        <SelectTrigger className="w-[250px]">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <SelectValue placeholder="Create Order Acknowledgement" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">Create PDF</SelectItem>
                          <SelectItem value="email">Send via Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Progress Section */}
        <Collapsible 
          open={progressOpen} 
          onOpenChange={(open) => {
            setProgressOpen(open)
            if (open && !hasAnimated) {
              setHasAnimated(true)
            }
          }}
        >
          <Card className="rounded-2xl shadow-none border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Progress</CardTitle>
                  {progressOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-2 pb-6 px-8">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  {/* Left: Progress Circle */}
                  <div className="flex-shrink-0">
                    <CircularProgress 
                      value={isNew ? 0 : 92} 
                      size={140} 
                      strokeWidth={12} 
                      shouldAnimate={progressOpen && !hasAnimated}
                      key={progressOpen ? "animate" : "static"}
                    />
                  </div>

                  {/* Middle: Date Fields - Inline Layout */}
                  <div className="flex flex-col justify-between flex-shrink-0 h-[160px]">
                    {/* Build Date */}
                    <div className="grid grid-cols-[110px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Build Date</Label>
                      <Popover open={buildDatePickerOpen} onOpenChange={setBuildDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10 w-[260px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                            {formData.build_date ? (
                              new Date(formData.build_date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })
                            ) : (
                              <span className="text-muted-foreground">MM/DD/YYYY</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.build_date ? new Date(formData.build_date + "T00:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Use local date to avoid timezone issues
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                const dateString = `${year}-${month}-${day}`
                                setFormData({ ...formData, build_date: dateString })
                                setBuildDatePickerOpen(false)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Finish Date */}
                    <div className="grid grid-cols-[110px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Finish Date</Label>
                      <Popover open={finishDatePickerOpen} onOpenChange={setFinishDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10 w-[260px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                            {formData.finish_date ? (
                              new Date(formData.finish_date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })
                            ) : (
                              <span className="text-muted-foreground">MM/DD/YYYY</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.finish_date ? new Date(formData.finish_date + "T00:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Use local date to avoid timezone issues
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                const dateString = `${year}-${month}-${day}`
                                setFormData({ ...formData, finish_date: dateString })
                                setFinishDatePickerOpen(false)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Shipment */}
                    <div className="grid grid-cols-[110px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Shipment</Label>
                      <Select
                        value={formData.shipment_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, shipment_id: value === "none" ? "" : value })}
                      >
                        <SelectTrigger className="h-10 w-[260px]">
                          <SelectValue placeholder="No Shipment assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Shipment assigned</SelectItem>
                          {shipments.map((shipment) => (
                            <SelectItem key={shipment.id} value={shipment.id.toString()}>
                              {shipment.shippingId}
                              {shipment.date && ` - ${new Date(shipment.date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right: Task List */}
                  <div className="flex-1 min-w-[300px] max-w-md lg:ml-auto h-[160px]">
                    <div className="border rounded-xl h-full overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border-b border-border/20 last:border-b-0 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors duration-150 cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-foreground uppercase tracking-widest text-center">
                            {task}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Template Name Section */}
        <Card className="rounded-2xl shadow-none border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-foreground">Template name</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-64 h-10"
                  placeholder="Enter value"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

