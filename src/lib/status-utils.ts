import type { Order } from "@/types"

export type OrderStatus = 
  | "schedule"
  | "welded"
  | "zink"
  | "returned"
  | "assembled"
  | "trailer-build"
  | "special"
  | "ready-to-ship"
  | "shipped"

// Determine order status based on available data fields
export function getOrderStatus(order: Order): OrderStatus {
  // If order has shipment_id, it's shipped
  if (order.shipment_id) {
    return "shipped"
  }

  // Check the sequ field which likely contains status info
  // Convert to string first to handle null, undefined, or number values
  const sequ = order.sequ ? String(order.sequ).toLowerCase() : ""
  
  // Check for status strings in sequ field
  if (sequ.includes("weld") || sequ === "weld") return "welded"
  if (sequ.includes("zink") || sequ.includes("zinc") || sequ === "zink" || sequ === "zinc") return "zink"
  if (sequ.includes("return") || sequ === "return") return "returned"
  if (sequ.includes("assembl") || sequ === "assembl" || sequ === "assemble") return "assembled"
  if (sequ.includes("wire") || sequ.includes("floor") || sequ.includes("mount") || 
      sequ === "wire" || sequ === "floor" || sequ === "mount" ||
      sequ.includes("trailer") || sequ === "trailer") return "trailer-build"
  if (sequ.includes("special") || sequ.includes("need fix") || sequ === "special" || sequ === "fix") return "special"
  if (sequ.includes("ready") || sequ.includes("ship") || sequ === "ready" || sequ === "ship") return "ready-to-ship"
  
  // If fin_date exists, it might be ready to ship
  if (order.fin_date) {
    return "ready-to-ship"
  }

  // If build_date exists but no fin_date, it's in trailer build
  if (order.build_date) {
    return "trailer-build"
  }

  // Default to schedule
  return "schedule"
}

// Status color mapping for badges
export function getStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    schedule: "bg-muted text-muted-foreground",
    welded: "bg-violet-500 text-white",
    zink: "bg-amber-500 text-white",
    returned: "bg-amber-600 text-white",
    assembled: "bg-blue-500 text-white",
    "trailer-build": "bg-emerald-500 text-white",
    special: "bg-orange-500 text-white",
    "ready-to-ship": "bg-teal-500 text-white",
    shipped: "bg-emerald-600 text-white",
  }
  return colorMap[status] || colorMap.schedule
}

// Status label for display
export function getStatusLabel(status: OrderStatus): string {
  const labelMap: Record<OrderStatus, string> = {
    schedule: "SCHEDULE",
    welded: "WELDED",
    zink: "ZINK",
    returned: "RETURNED",
    assembled: "ASSEMBLED",
    "trailer-build": "TRAILER BUILD",
    special: "SPECIAL",
    "ready-to-ship": "READY TO SHIP",
    shipped: "SHIPPED",
  }
  return labelMap[status] || status.toUpperCase()
}

// Sub-status colors for trailer-build stages
export function getTrailerBuildSubStatusColor(subStatus: string): string {
  const statusLower = subStatus.toLowerCase()
  if (statusLower.includes("wire")) return "bg-blue-400 text-white"
  if (statusLower.includes("floor")) return "bg-cyan-500 text-white"
  if (statusLower.includes("mount")) return "bg-green-500 text-white"
  return "bg-emerald-500 text-white"
}

