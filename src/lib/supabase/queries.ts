import { getSupabaseClient } from "./client"
import { mapDealer, mapShippingCompany, mapVendor, mapOrder, mapBuildSchedule, mapShipment, mapInventoryItem, mapPricingItem, mapModel, mapFrontendOption } from "./data-mappers"

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  )
}

// Generic query helper
export async function fetchTableData<T>(
  tableName: string,
  select: string = "*"
): Promise<T[]> {
  // Return empty array if Supabase is not configured (during build or missing env)
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from(tableName).select(select)

    if (error) {
      return []
    }

    return (data as T[]) || []
  } catch (error) {
    return []
  }
}

// Specific queries for each table
export async function fetchOrders(brightviewFilter?: boolean) {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    // Fetch orders without join - dealer mapping will be done in component
    let query = supabase.from("order").select("*")
    
    if (brightviewFilter !== undefined) {
      query = query.eq("brightview", brightviewFilter)
    }
    
    const { data, error } = await query

    if (error) {
      return []
    }

    // Map orders - dealer names will be resolved in component using dealers map
    return (data || []).map(mapOrder)
  } catch (error) {
    return []
  }
}

export async function fetchDealers() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const data = await fetchTableData("dealer")
    return data.map(mapDealer)
  } catch (error) {
    return []
  }
}

// Helper function to get dealers with numeric IDs for mapping
export async function fetchDealersForMapping() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    // Table name is "dealer" (singular) not "dealers" (plural)
    const tableName = "dealer"
    const { data, error } = await supabase.from(tableName).select("id, name")

    if (error) {
      return []
    }

    const mapped = (data || []).map((item: any) => {
      const id = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10)
      return {
        id: isNaN(id) ? 0 : id,
        name: item.name || ""
      }
    }).filter((dealer) => dealer.id > 0 && dealer.name) // Filter out invalid entries
    
    return mapped
  } catch (error) {
    return []
  }
}

export async function fetchShippingCompanies() {
  const data = await fetchTableData("shipper")
  return data.map(mapShippingCompany)
}

export async function fetchVendors() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("vendor")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching vendors:", error)
      return []
    }

    return (data || []).map(mapVendor)
  } catch (error) {
    console.error("Error in fetchVendors:", error)
    return []
  }
}

export async function fetchBuildSchedule() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    // Load all data from schedule table
    // Sort by sort_order if available, otherwise by id
    const { data, error } = await supabase
      .from("schedule")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching schedule:", error)
      return []
    }

    // Build dealers map
    const dealersMap: Record<number, string> = {}
    
    // Load dealers separately
    try {
      const dealers = await fetchDealersForMapping()
      dealers.forEach((dealer: any) => {
        const id = typeof dealer.id === 'number' ? dealer.id : parseInt(String(dealer.id), 10)
        if (!isNaN(id) && id > 0 && dealer.name) {
          dealersMap[id] = dealer.name
        }
      })
    } catch (e) {
      console.warn("Could not load dealers:", e)
    }

    // Load orders to get additional details
    const orderMap: Record<number, any> = {}
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("order")
        .select("id, order_num, asset_no, vin_num, build_date, height, dealer_id, model, build_notes")
      
      if (!ordersError && ordersData) {
        ordersData.forEach((order: any) => {
          orderMap[order.id] = order
        })
      }
    } catch (e) {
      console.warn("Could not load orders:", e)
    }

    // Combine schedule data with order data
    const combinedData = (data || []).map((scheduleItem: any, index: number) => {
      const orderId = scheduleItem.order_id
      const orderData = orderId ? orderMap[orderId] : null
      
      return {
        ...scheduleItem,
        ...orderData,
        // Use order dealer_id if available
        dealer_id: orderData?.dealer_id || scheduleItem.dealer_id,
        // Ensure unique ID - use index if ID is missing
        _index: index,
      }
    })

    return combinedData.map((item: any, index: number) => {
      const mapped = mapBuildSchedule(item, dealersMap)
      // Ensure ID is never empty - use index-based fallback with original schedule ID
      if (!mapped.id || mapped.id === "") {
        // Try to use the original schedule item ID, or fall back to index
        const originalId = item.id || item.ID || item.schedule_id || index
        mapped.id = `schedule-${originalId}`
      }
      return mapped
    })
  } catch (error) {
    console.error("Error in fetchBuildSchedule:", error)
    return []
  }
}

export async function updateBuildScheduleOrder(updates: Array<{ id: string; sortOrder: number }>) {
  if (!isSupabaseConfigured()) {
    console.error("Supabase not configured")
    return false
  }

  try {
    const supabase = getSupabaseClient()
    
    // Update each item's sort_order in a transaction-like manner
    const updatePromises = updates.map((update) =>
      supabase
        .from("schedule")
        .update({ sort_order: update.sortOrder })
        .eq("id", update.id)
    )

    const results = await Promise.all(updatePromises)
    
    // Check if any update failed
    const hasError = results.some((result) => result.error)
    
    if (hasError) {
      console.error("Error updating build schedule order:", results.find((r) => r.error)?.error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateBuildScheduleOrder:", error)
    return false
  }
}

export async function fetchShipSchedule(dateRange?: { start: Date; end: Date }) {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    // Load dealers separately to avoid join issues
    const dealersData = await fetchDealersForMapping()
    const dealersMap: Record<number | string, string> = {}
    dealersData.forEach((dealer: any) => {
      const id = typeof dealer.id === 'number' ? dealer.id : parseInt(String(dealer.id), 10)
      if (!isNaN(id) && id > 0 && dealer.name) {
        dealersMap[id] = dealer.name
      }
    })
    
    // Load shipping companies separately
    let shippingCompaniesMap: Record<number | string, string> = {}
    try {
      const shippingCompanies = await fetchShippingCompanies()
      shippingCompanies.forEach((company: any) => {
        // Support both string and numeric IDs
        const id = typeof company.id === 'number' ? company.id : String(company.id)
        if (company.name) {
          shippingCompaniesMap[id] = company.name
          // Also add as string if it's a number, for lookup flexibility
          if (typeof company.id === 'number') {
            shippingCompaniesMap[String(company.id)] = company.name
          }
        }
      })
    } catch (e) {
      console.warn("Could not load shipping companies:", e)
    }
    
    // Simple query without joins - just get all shipment data
    let query = supabase
      .from("shipment")
      .select("*")
    
    if (dateRange) {
      query = query
        .gte("ship_date", dateRange.start.toISOString().split("T")[0])
        .lte("ship_date", dateRange.end.toISOString().split("T")[0])
    }
    
    const { data, error } = await query

    if (error) {
      console.error("Error fetching shipments:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      return []
    }

    // Load model labels from div_frontend_options
    let modelLabelsMap: Record<string, string> = {}
    try {
      const { data: modelOptions, error: modelError } = await supabase
        .from("div_frontend_options")
        .select("value, label")
        .eq("type", "Model")
      
      if (!modelError && modelOptions) {
        modelOptions.forEach((opt: any) => {
          modelLabelsMap[String(opt.value)] = opt.label || ""
        })
      }
    } catch (e) {
      console.warn("Could not load model labels:", e)
    }

    // Get shipment IDs
    const shipmentIds = (data || []).map((item: any) => item.id).filter(Boolean)
    
    // Load orders for these shipments
    let ordersByShipment: Record<string | number, any[]> = {}
    if (shipmentIds.length > 0) {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("order")
          .select("id, vin_num, model, asset_no, po, shipment_id, order_date, build_date, price, order_num")
          .in("shipment_id", shipmentIds)
        
        if (!ordersError && ordersData) {
          ordersData.forEach((order: any) => {
            const shipmentId = order.shipment_id
            if (shipmentId) {
              if (!ordersByShipment[shipmentId]) {
                ordersByShipment[shipmentId] = []
              }
              
              // Add model label if available
              const modelValue = String(order.model || "")
              const modelLabel = modelLabelsMap[modelValue] || null
              
              ordersByShipment[shipmentId].push({
                id: order.id,
                vin_num: order.vin_num || null,
                modelLabel: modelLabel,
                asset_no: order.asset_no || null,
                po: order.po || null,
                order_date: order.order_date || null,
                build_date: order.build_date || null,
                price: order.price || 0,
                order_num: order.order_num || null,
              })
            }
          })
        }
      } catch (e) {
        console.warn("Could not load orders:", e)
      }
    }

    // Map shipments with dealer and shipper names from our maps
    return (data || []).map((item: any) => {
      // Add dealer name to item if we have it in map
      const dealerId = item.dealer_id
      if (dealerId && dealersMap[dealerId]) {
        item.dealer_name = dealersMap[dealerId]
      } else if (dealerId) {
        // Try as string if number lookup failed
        const dealerIdStr = String(dealerId)
        if (dealersMap[dealerIdStr]) {
          item.dealer_name = dealersMap[dealerIdStr]
        }
      }
      
      // Add shipper name to item if we have it in map
      const shipperId = item.shipper_id
      if (shipperId && shippingCompaniesMap[shipperId]) {
        item.shipper_name = shippingCompaniesMap[shipperId]
      } else if (shipperId) {
        // Try as string if number lookup failed
        const shipperIdStr = String(shipperId)
        if (shippingCompaniesMap[shipperIdStr]) {
          item.shipper_name = shippingCompaniesMap[shipperIdStr]
        }
      }
      
      // Add orders to shipment
      const shipmentId = item.id
      if (shipmentId && ordersByShipment[shipmentId]) {
        item.orders = ordersByShipment[shipmentId]
      }
      
      return mapShipment(item, dealersMap)
    })
  } catch (error) {
    console.error("Error in fetchShipSchedule:", error)
    return []
  }
}

export async function fetchInventory() {
  const data = await fetchTableData("inventory")
  return data.map(mapInventoryItem)
}

// Inventory tab-specific queries
export async function fetchInventoryItems() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("part")
      .select("*")
      .eq("active", true)

    if (error) {
      console.error("Error fetching inventory items:", error)
      return []
    }

    return (data || []).map(mapInventoryItem)
  } catch (error) {
    console.error("Error in fetchInventoryItems:", error)
    return []
  }
}

export async function fetchInventoryAssemblies() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("assembly_unit")
      .select("*")
      .eq("active", true)
      .is("model_id", null)
      .is("option_id", null)

    if (error) {
      console.error("Error fetching inventory assemblies:", error)
      return []
    }

    return (data || []).map(mapInventoryItem)
  } catch (error) {
    console.error("Error in fetchInventoryAssemblies:", error)
    return []
  }
}

export async function fetchInventoryOptions() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("price")
      .select("*")
      .in("type", ["Option", "BV Option"])
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Error fetching inventory options:", error)
      return []
    }

    return (data || []).map(mapInventoryItem)
  } catch (error) {
    console.error("Error in fetchInventoryOptions:", error)
    return []
  }
}

export async function fetchInventoryModels() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("assembly_unit")
      .select("*")
      .eq("active", true)
      .not("model_id", "is", null)

    if (error) {
      console.error("Error fetching inventory models:", error)
      return []
    }

    return (data || []).map(mapInventoryItem)
  } catch (error) {
    console.error("Error in fetchInventoryModels:", error)
    return []
  }
}

export async function fetchPricing() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    // Order by pn, then full_name (as per SQL query)
    // Note: Filtering for NOT (type = 'Model' AND subtype = 'Main') is done in the component
    const { data, error } = await supabase
      .from("price")
      .select("*")
      .order("pn", { ascending: true, nullsFirst: false })
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Error fetching pricing:", error)
      return []
    }

    return (data || []).map(mapPricingItem)
  } catch (error) {
    console.error("Error in fetchPricing:", error)
    return []
  }
}

export async function fetchModels(brightviewFilter?: boolean) {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from("model")
      .select("*")
    
    if (brightviewFilter !== undefined) {
      query = query.eq("brightview", brightviewFilter)
    }
    
    const { data, error } = await query

    if (error) {
      console.error("Error fetching models:", error)
      return []
    }

    // Sort by name as integer (cast name to int)
    const sortedData = (data || []).sort((a: any, b: any) => {
      const nameA = parseInt(a.name, 10) || 0
      const nameB = parseInt(b.name, 10) || 0
      return nameA - nameB
    })

    return sortedData.map(mapModel)
  } catch (error) {
    console.error("Error in fetchModels:", error)
    return []
  }
}

// Dashboard query with joins
export async function fetchDashboardData(brightviewFilter?: boolean, statusFilter?: string) {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    let query = supabase.from("order").select("*")
    
    if (brightviewFilter !== undefined) {
      query = query.eq("brightview", brightviewFilter)
    }
    
    const { data, error } = await query

    if (error) {
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        let altQuery = supabase.from("orders").select("*")
        if (brightviewFilter !== undefined) {
          altQuery = altQuery.eq("brightview", brightviewFilter)
        }
        const { data: altData, error: altError } = await altQuery
        
        if (altError) {
          return []
        }
        
        return (altData || []).map(mapOrder)
      }
      
      return []
    }

    return (data || []).map(mapOrder)
  } catch (error) {
    return []
  }
}

// Delete an order
export async function deleteOrder(orderId: number) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("order")
      .delete()
      .eq("id", orderId)

    if (error) {
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        const { error: altError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId)
        
        if (altError) {
          throw new Error(altError.message)
        }
        
        return true
      }
      
      throw new Error(error.message)
    }

    return true
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to delete order")
  }
}

// Delete a dealer
export async function deleteDealer(dealerId: string | number) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    // Convert to number if it's a string that represents a number
    const id = typeof dealerId === "string" ? parseInt(dealerId, 10) : dealerId
    
    // If conversion failed, try using the string directly
    const { error } = await supabase
      .from("dealer")
      .delete()
      .eq("id", isNaN(id) ? dealerId : id)

    if (error) {
      throw new Error(error.message)
    }

    return true
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to delete dealer")
  }
}

// Delete a shipping company
export async function deleteShippingCompany(shippingCompanyId: string | number) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    // Convert to number if it's a string that represents a number
    const id = typeof shippingCompanyId === "string" ? parseInt(shippingCompanyId, 10) : shippingCompanyId
    
    // If conversion failed, try using the string directly
    const { error } = await supabase
      .from("shipper")
      .delete()
      .eq("id", isNaN(id) ? shippingCompanyId : id)

    if (error) {
      throw new Error(error.message)
    }

    return true
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to delete shipping company")
  }
}

// Delete a vendor
export async function deleteVendor(vendorId: string | number) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    // Convert to number if it's a string that represents a number
    const id = typeof vendorId === "string" ? parseInt(vendorId, 10) : vendorId
    
    // If conversion failed, try using the string directly
    const { error } = await supabase
      .from("vendor")
      .delete()
      .eq("id", isNaN(id) ? vendorId : id)

    if (error) {
      throw new Error(error.message)
    }

    return true
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to delete vendor")
  }
}

// Fetch shipments for a specific shipping company
export async function fetchShipmentsByShippingCompany(shippingCompanyId: string | number) {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    
    // Load dealers separately
    const dealersData = await fetchDealersForMapping()
    const dealersMap: Record<number | string, string> = {}
    dealersData.forEach((dealer: any) => {
      const id = typeof dealer.id === 'number' ? dealer.id : parseInt(String(dealer.id), 10)
      if (!isNaN(id) && id > 0 && dealer.name) {
        dealersMap[id] = dealer.name
      }
    })
    
    // Convert shipping company ID to number if needed
    const id = typeof shippingCompanyId === "string" ? parseInt(shippingCompanyId, 10) : shippingCompanyId
    
    // Fetch shipments for this shipping company
    const { data, error } = await supabase
      .from("shipment")
      .select("*")
      .eq("shipper_id", isNaN(id) ? shippingCompanyId : id)
      .order("ship_date", { ascending: false })

    if (error) {
      console.error("Error fetching shipments:", error)
      return []
    }

    // Load model labels from div_frontend_options
    let modelLabelsMap: Record<string, string> = {}
    try {
      const { data: modelOptions, error: modelError } = await supabase
        .from("div_frontend_options")
        .select("value, label")
        .eq("type", "Model")
      
      if (!modelError && modelOptions) {
        modelOptions.forEach((opt: any) => {
          modelLabelsMap[String(opt.value)] = opt.label || ""
        })
      }
    } catch (e) {
      console.warn("Could not load model labels:", e)
    }

    // Get shipment IDs
    const shipmentIds = (data || []).map((item: any) => item.id).filter(Boolean)
    
    // Load orders for these shipments
    let ordersByShipment: Record<string | number, any[]> = {}
    if (shipmentIds.length > 0) {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("order")
          .select("id, vin_num, model, asset_no, po, shipment_id, order_date, build_date, price, order_num")
          .in("shipment_id", shipmentIds)
        
        if (!ordersError && ordersData) {
          ordersData.forEach((order: any) => {
            const shipmentId = order.shipment_id
            if (shipmentId) {
              if (!ordersByShipment[shipmentId]) {
                ordersByShipment[shipmentId] = []
              }
              
              // Add model label if available
              const modelValue = String(order.model || "")
              const modelLabel = modelLabelsMap[modelValue] || null
              
              ordersByShipment[shipmentId].push({
                id: order.id,
                vin_num: order.vin_num || null,
                modelLabel: modelLabel,
                asset_no: order.asset_no || null,
                po: order.po || null,
                order_date: order.order_date || null,
                build_date: order.build_date || null,
                price: order.price || 0,
                order_num: order.order_num || null,
              })
            }
          })
        }
      } catch (e) {
        console.warn("Could not load orders:", e)
      }
    }

    // Map shipments with dealer names from our maps
    return (data || []).map((item: any) => {
      // Add dealer name to item if we have it in map
      const dealerId = item.dealer_id
      if (dealerId && dealersMap[dealerId]) {
        item.dealer_name = dealersMap[dealerId]
      } else if (dealerId) {
        // Try as string if number lookup failed
        const dealerIdStr = String(dealerId)
        if (dealersMap[dealerIdStr]) {
          item.dealer_name = dealersMap[dealerIdStr]
        }
      }
      
      // Add orders to shipment
      const shipmentId = item.id
      if (shipmentId && ordersByShipment[shipmentId]) {
        item.orders = ordersByShipment[shipmentId]
      }
      
      return mapShipment(item, dealersMap)
    })
  } catch (error) {
    console.error("Error in fetchShipmentsByShippingCompany:", error)
    return []
  }
}

// Fetch a single shipping company by ID
export async function fetchShippingCompanyById(shippingCompanyId: string | number) {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const supabase = getSupabaseClient()
    const id = typeof shippingCompanyId === "string" ? parseInt(shippingCompanyId, 10) : shippingCompanyId
    
    const { data, error } = await supabase
      .from("shipper")
      .select("*")
      .eq("id", isNaN(id) ? shippingCompanyId : id)
      .single()

    if (error) {
      console.error("Error fetching shipping company:", error)
      return null
    }

    if (!data) {
      return null
    }

    return mapShippingCompany(data)
  } catch (error) {
    console.error("Exception in fetchShippingCompanyById:", error)
    return null
  }
}

// Fetch a single order by ID
export async function fetchOrderById(orderId: number) {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured")
    return null
  }

  try {
    const supabase = getSupabaseClient()
    console.log("Fetching order with ID:", orderId)
    
    const { data, error } = await supabase
      .from("order")
      .select("*")
      .eq("id", orderId)
      .single()

    if (error) {
      console.error("Error fetching order from 'order' table:", error)
      
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        console.log("Trying alternative table name 'orders'")
        const { data: altData, error: altError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single()
        
        if (altError) {
          console.error("Error fetching order from 'orders' table:", altError)
          return null
        }
        
        return mapOrder(altData)
      }
      
      // Check if it's a "not found" error (PGRST116 is for table not found, but single() returns PGRST116 for no rows)
      if (error.code === "PGRST116" && error.message?.includes("No rows")) {
        console.warn(`Order with ID ${orderId} not found`)
        return null
      }
      
      return null
    }

    if (!data) {
      console.warn(`No data returned for order ID ${orderId}`)
      return null
    }

    console.log("Order data retrieved:", data)
    return mapOrder(data)
  } catch (error) {
    console.error("Exception in fetchOrderById:", error)
    return null
  }
}

// Create a new order (draft)
export async function createOrder(initialValues: Record<string, any>) {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured")
    return null
  }

  try {
    const supabase = getSupabaseClient()
    const baseValues = {
      brightview: false,
      price: 0,
      tax: 0,
      ...initialValues,
    }

    const { data, error } = await supabase
      .from("order")
      .insert(baseValues)
      .select("*")
      .single()

    if (error) {
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        const { data: altData, error: altError } = await supabase
          .from("orders")
          .insert(baseValues)
          .select("*")
          .single()

        if (altError) {
          console.error("Error creating order in 'orders' table:", altError)
          return null
        }

        return mapOrder(altData)
      }

      console.error("Error creating order in 'order' table:", error)
      return null
    }

    if (!data) {
      console.warn("No data returned when creating order")
      return null
    }

    return mapOrder(data)
  } catch (error) {
    console.error("Exception in createOrder:", error)
    return null
  }
}

// Update an existing order with generic fields
export async function updateOrder(orderId: number, updates: Record<string, any>) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("order")
      .update(updates)
      .eq("id", orderId)
      .select("*")
      .single()

    if (error) {
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        const { data: altData, error: altError } = await supabase
          .from("orders")
          .update(updates)
          .eq("id", orderId)
          .select("*")
          .single()

        if (altError) {
          throw new Error(altError.message)
        }

        return mapOrder(altData)
      }

      throw new Error(error.message)
    }

    return mapOrder(data)
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to update order")
  }
}

// Update VIN for an order
export async function updateOrderVIN(orderId: number, vin: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("order")
      .update({ vin_num: vin })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      // Try alternative table name "orders" if "order" fails
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        const { data: altData, error: altError } = await supabase
          .from("orders")
          .update({ vin_num: vin })
          .eq("id", orderId)
          .select()
          .single()
        
        if (altError) {
          throw new Error(altError.message)
        }
        
        return mapOrder(altData)
      }
      
      throw new Error(error.message)
    }

    return mapOrder(data)
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to update VIN")
  }
}

// Fetch all shipments for dropdown selection
export async function fetchAllShipments() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("shipment")
      .select("id, shipping_id, ship_date")
      .order("ship_date", { ascending: false })

    if (error) {
      console.error("Error fetching shipments:", error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      shippingId: item.shipping_id || `Shipment ${item.id}`,
      date: item.ship_date,
    }))
  } catch (error) {
    console.error("Error in fetchAllShipments:", error)
    return []
  }
}

// Fetch frontend options
export async function fetchFrontendOptions() {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("div_frontend_options")
      .select("*")
      .order("type", { ascending: true })
      .order("label", { ascending: true })

    if (error) {
      console.error("Error fetching frontend options:", error)
      return []
    }

    return (data || []).map(mapFrontendOption)
  } catch (error) {
    console.error("Error in fetchFrontendOptions:", error)
    return []
  }
}

