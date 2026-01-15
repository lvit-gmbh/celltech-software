import { Badge } from "@/components/ui/badge"
import type { Shipment } from "@/types"

interface ShipmentCardProps {
  shipment: Shipment
  compact?: boolean
  onClick?: () => void
}

// Get indicator color based on model label suffix
function getIndicatorColor(modelLabel: string | null | undefined): { bg: string; border: string } {
  if (!modelLabel) {
    return { bg: "bg-gray-500", border: "border border-gray-700" }
  }
  
  if (modelLabel.endsWith("-W")) {
    return { bg: "bg-white", border: "" }
  }
  if (modelLabel.endsWith("-G")) {
    return { bg: "bg-gray-500", border: "border border-gray-700" }
  }
  if (modelLabel.endsWith("-B")) {
    return { bg: "bg-black", border: "border border-black" }
  }
  
  return { bg: "bg-gray-500", border: "border border-gray-700" }
}

// Status color based on shipment properties
// Priority: shipped (green) > shipper (black) > no shipper (red)
function getCardStyle(shipment: Shipment, compact: boolean = false): { bg: string; borderLeft: string; border: string; accent: string; textColor: string } {
  if (shipment.shipped) {
    // Green for shipped
    return {
      bg: "bg-green-100 dark:bg-green-900/40",
      borderLeft: "border-l-4 border-l-green-500",
      border: "border-2 border-green-500",
      accent: "bg-green-500",
      textColor: "text-green-900 dark:text-green-100",
    }
  }
  
  if (shipment.hasShipper) {
    // Black for has shipper (not shipped yet)
    return {
      bg: "bg-slate-200 dark:bg-slate-900/50",
      borderLeft: "border-l-4 border-l-slate-900 dark:border-l-slate-700",
      border: "border-2 border-slate-900 dark:border-slate-700",
      accent: "bg-slate-900 dark:bg-slate-700",
      textColor: "text-slate-900 dark:text-slate-100",
    }
  }
  
  // Red for no shipper
  return {
    bg: "bg-red-100 dark:bg-red-900/40",
    borderLeft: "border-l-4 border-l-red-500",
    border: "border-2 border-red-500",
    accent: "bg-red-500",
    textColor: "text-red-900 dark:text-red-100",
  }
}

export function ShipmentCard({ shipment, compact = false, onClick }: ShipmentCardProps) {
  const style = getCardStyle(shipment, compact)
  
  if (compact) {
    // For month view: only show dealer name, modern design with left border
    const displayName = shipment.dealer || "No Dealer"
    
    return (
      <div
        className={`${style.bg} ${style.borderLeft} rounded-md py-1.5 px-2 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-border cursor-pointer overflow-hidden h-7 flex items-center group`}
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium truncate ${style.textColor} leading-tight transition-colors duration-300 group-hover:font-semibold`}>
            {displayName}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-md p-3 ${style.bg} ${style.border} transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden backdrop-blur-sm group`}
      onClick={onClick}
    >
      {/* Modern card design with accent bar */}
      <div className="flex items-start gap-2.5">
        <div className={`w-1.5 rounded-full ${style.accent} shrink-0 self-stretch`} />
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header with Shipping ID */}
          <div className="flex items-start justify-between gap-2">
            {/* Light mode */}
            <div 
              className="inline-flex items-center rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold text-white h-5 shrink-0 dark:hidden"
              style={{
                backgroundColor: '#386A9C'
              }}
            >
              {shipment.shippingId || "N/A"}
            </div>
            {/* Dark mode */}
            <div 
              className="inline-flex items-center rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold text-white h-5 shrink-0 hidden dark:block"
              style={{
                backgroundColor: '#37699B'
              }}
            >
              {shipment.shippingId || "N/A"}
            </div>
            {!shipment.hasShipper && (
              <Badge variant="destructive" className="text-xs h-5 shrink-0">
                No Shipper
              </Badge>
            )}
          </div>
          
          {/* Asset No and PO in a compact grid */}
          {(shipment.assetNo || shipment.po) && (
            <div className="flex items-center gap-2 flex-wrap">
              {shipment.assetNo && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  AST #{shipment.assetNo}
                </span>
              )}
              {shipment.po && (
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                  PO {shipment.po}
                </span>
              )}
            </div>
          )}
          
          {/* Dealer - prominent */}
          {shipment.dealer && (
            <div className="text-sm font-medium text-foreground">
              {shipment.dealer}
            </div>
          )}
          
          {/* Customer */}
          {shipment.customer && shipment.customer !== "Customer" && (
            <div className="text-xs text-muted-foreground">
              {shipment.customer}
            </div>
          )}
          
          {/* Orders - show VIN and Model from orders */}
          {shipment.orders && shipment.orders.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {shipment.orders.map((order, index) => {
                const indicatorColor = getIndicatorColor(order.modelLabel)
                return (
                  <div key={order.id || index} className="flex items-start gap-1.5">
                    {/* Container für Strich und erste 2 Werte - oben und unten bündig */}
                    <div className="flex gap-1.5">
                      {/* Vertical indicator line - genau von Label oben bis VIN unten */}
                      <div className={`w-[5px] ${indicatorColor.bg} ${indicatorColor.border} shrink-0 rounded-full self-stretch`} />
                      
                      {/* Order Model and VIN - die ersten 2 Werte */}
                      <div className="flex flex-col gap-0.5">
                        {order.modelLabel && (
                          <div className="text-xs font-medium text-foreground leading-tight">
                            {order.modelLabel}
                          </div>
                        )}
                        {order.vin_num && (
                          <div className="text-xs text-muted-foreground leading-tight">
                            <span className="font-medium">VIN:</span> #{order.vin_num}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Order Asset No and PO if available - außerhalb des Strich-Bereichs */}
                    {(order.asset_no || order.po) && (
                      <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                        {order.asset_no && (
                          <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            AST #{order.asset_no}
                          </span>
                        )}
                        {order.po && (
                          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            PO {order.po}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Fallback: Model and VIN if no orders */}
          {(!shipment.orders || shipment.orders.length === 0) && (
            <div className="flex flex-col items-start gap-0.5">
              {shipment.model && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Model:</span> {shipment.model}
                </div>
              )}
              {shipment.vin && (
                <div className="text-xs text-muted-foreground/70 leading-tight">
                  <span className="font-medium">VIN:</span> #{shipment.vin}
                </div>
              )}
            </div>
          )}
          
          {/* Shipper info */}
          {shipment.shipperName && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Shipper:</span> {shipment.shipperName}
            </div>
          )}
          
          {/* Status badge */}
          {shipment.status && (
            <Badge variant="secondary" className="text-xs h-5">
              {shipment.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
