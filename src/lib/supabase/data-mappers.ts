// Data mapping utilities to convert Supabase snake_case to TypeScript camelCase/types

import type { Dealer, ShippingCompany, Vendor, Order, BuildSchedule, Shipment, InventoryItem, PricingItem, Model, FrontendOption } from "@/types"

export function mapDealer(data: any): Dealer {
  return {
    id: String(data.id || data.ID || ""),
    name: data.name || data.Name || "",
    dealerContact: data.dealer_contact || data.dealerContact || data.contact || "",
    contact: data.contact || data.Contact || "",
    phone: data.phone || data.Phone || null,
    mail: data.mail || data.email || data.Email || null,
    active: data.active !== false && data.active !== 0,
    city: data.city || data.City || "",
    zipCode: String(data.zip_code || data.zipCode || data.zip || ""),
    discount: data.discount || data.Discount || null,
  }
}

export function mapShippingCompany(data: any): ShippingCompany {
  // Handle area as array: if null or empty, use ["All"], otherwise use the array
  const areaData = data.area || data.Area
  const area = (areaData == null || (Array.isArray(areaData) && areaData.length === 0))
    ? ["All"]
    : Array.isArray(areaData)
    ? areaData
    : [areaData]
  
  return {
    id: String(data.id || data.ID || ""),
    name: data.name || data.Name || "",
    contact: data.contact || data.Contact || "",
    phone: data.phone || data.Phone || "",
    area: area,
    minDistance: Number(data.min_distance || data.minDistance || data.minDistance || 0),
    notes: data.notes || data.Notes || null,
    mail: data.mail || data.email || data.Email || null,
    state: data.state || data.State || null,
  }
}

export function mapVendor(data: any): Vendor {
  return {
    id: String(data.id || data.ID || ""),
    name: data.name || data.Name || "",
    contactData: data.contact_data || data.contactData || data.contact || "",
    address: data.address || data.Address || "",
    zipCode: String(data.zip_code || data.zipCode || data.zip || ""),
    mail: data.mail || data.email || data.Email || null,
    phone: data.phone || data.Phone || null,
  }
}

export function mapOrder(data: any): Order {
  return {
    idx: Number(data.idx || data.IDX || 0),
    id: Number(data.id || data.ID || 0),
    dealer_id: Number(data.dealer_id || data.dealerId || data.dealer || 0),
    order_date: data.order_date || data.orderDate || data.order_date || null,
    fin_date: data.fin_date || data.finDate || data.fin_date || null,
    model: data.model || data.Model || "",
    color: Number(data.color || data.Color || 0),
    price: Number(data.price || data.Price || 0),
    notes: data.notes || data.Notes || null,
    order_num: data.order_num || data.orderNum || data.order_number || null,
    spare_tire: data.spare_tire || data.spareTire || false,
    tires_and_wheel: data.tires_and_wheel || data.tiresAndWheel || data.tires || null,
    build_date: data.build_date || data.buildDate || null,
    next: data.next || data.Next || null,
    vin_num: data.vin_num || data.vinNum || data.vin || "",
    stock_num: data.stock_num || data.stockNum || data.stock || null,
    shipment_id: data.shipment_id || data.shipmentId || data.shipment || null,
    brightview: data.brightview || data.brightView || false,
    template: data.template || data.Template || null,
    vin_sticker: data.vin_sticker || data.vinSticker || null,
    build_notes: data.build_notes || data.buildNotes || null,
    po: data.po || data.PO || data.po_number || "",
    requested_by: data.requested_by || data.requestedBy || "",
    description: data.description || data.Description || "",
    gas_tank: data.gas_tank || data.gasTank || false,
    side_door: data.side_door || data.sideDoor || false,
    discount_type: data.discount_type || data.discountType || "",
    discount_percent: data.discount_percent || data.discountPercent || null,
    discount_total: Number(data.discount_total || data.discountTotal || 0),
    asset_no: Number(data.asset_no || data.assetNo || data.asset_number || 0),
    tax: Number(data.tax || data.Tax || 0),
    beavertail: data.beavertail || data.beaverTail || false,
    height: String(data.height || data.Height || ""),
    sequ: data.sequ || data.Sequ || data.status || null,
  }
}

export function mapBuildSchedule(data: any, dealersMap?: Record<number, string>): BuildSchedule {
  // Map order/asset - prefer order_num, then asset_no, then order_id
  const orderAsset = data.order_num || (data.asset_no ? `#${data.asset_no}` : "") || (data.order_id ? `Order #${data.order_id}` : "") || ""
  
  // Map frame from model
  const frame = data.model || data.frame || ""
  
  // Map door - might be in options or separate field
  const door = data.door || ""
  
  // Map dealer
  const dealerId = data.dealer_id
  const dealer = data.dealer || data.dealer_name || (dealerId && dealersMap ? dealersMap[dealerId] : "") || ""
  
  return {
    id: String(data.id || data.ID || ""),
    startDate: data.build_date || data.start_date || data.startDate || data.created_at || "",
    orderAsset: orderAsset,
    frame: frame,
    door: door,
    height: String(data.height || data.Height || '90"'),
    dealer: dealer,
    vin: data.vin_num || data.vin || data.vinNum || "",
    status: data.status || data.Status || "SCHEDULED",
    buildNotes: data.build_notes || data.buildNotes || data.notes || "",
  }
}

export function mapShipment(data: any, dealersMap?: Record<string | number, string>): Shipment {
  const dealerId = data.dealer_id || data.dealerId
  const dealerName = data.dealer_name || (dealerId && dealersMap ? dealersMap[dealerId] : "") || ""
  
  // Get shipper info
  const shipperId = data.shipper_id || data.shipperId
  const shipperName = data.shipper_name || data.shipperName || data.shipping_company_name || null
  
  return {
    id: String(data.id || data.ID || ""),
    shippingId: data.label || data.shipping_id || data.shippingId || String(data.id || ""),
    dealer: dealerName,
    customer: data.customer || data.Customer || "",
    vin: data.vin || data.vin_num || data.vinNum || null,
    hasShipper: shipperId != null && shipperId !== "" && shipperId !== null,
    date: data.ship_date || data.date || data.shipDate || "",
    model: data.model || data.Model || null,
    assetNo: data.asset_no || data.assetNo || data.asset_number || null,
    po: data.po || data.PO || data.po_number || null,
    shipperName: shipperName,
    status: data.status || data.Status || null,
    notes: data.notes || data.Notes || null,
    orders: data.orders || [],
    shipped: data.shipped !== null && data.shipped !== undefined ? Boolean(data.shipped) : null,
  }
}

export function mapInventoryItem(data: any): InventoryItem {
  return {
    id: String(data.id || data.ID || ""),
    partType: data.part_type || data.partType || data.type || "",
    label: data.label || data.Label || "",
    pn: data.pn || data.PN || data.part_number || "",
    unit: data.unit || data.Unit || "",
    min: Number(data.min || data.Min || 0),
    available: Number(data.available || data.Available || 0),
    onHand: Number(data.on_hand || data.onHand || data.onhand || 0),
    reserved: Number(data.reserved || data.Reserved || 0),
  }
}

export function mapPricingItem(data: any): PricingItem {
  return {
    id: String(data.id || data.ID || ""),
    type: data.type || data.Type || "",
    name: data.name || data.Name || data.full_name || "",
    pn: data.pn || data.PN || data.part_number || "",
    subtype: data.subtype || data.subType || data.sub_type || null,
    maxAmount: data.max_amount || data.maxAmount || data.max || null,
    unit: data.unit || data.Unit || "",
    status: data.status || data.Status || "",
    pricePerUnit: Number(data.price_per_unit || data.pricePerUnit || data.price || 0),
    pricePerUnitBV: data.price_per_unit_bv || data.pricePerUnitBV || data.price_bv || null,
    modelId: data.model_id || data.modelId || null,
    optionId: data.option_id || data.optionId || null,
    modelName: data.model_name || data.modelName || null,
    optionName: data.option_name || data.optionName || null,
    fullName: data.full_name || data.fullName || data.name || null,
  }
}

export function mapModel(data: any): Model {
  return {
    id: String(data.id || data.ID || ""),
    size: data.size || data.Size || "",
    model: data.name || data.model || data.Model || "",
    rearDoor: data.rear_door || data.rearDoor || "",
    axleRating: data.axle_rating || data.axleRating || "",
    axleType: data.axle_type || data.axleType || "",
    tiresWheels: data.tires_wheels || data.tiresWheels || data.tires || "",
    brightView: data.brightview || data.bright_view || data.brightView || false,
  }
}

export function mapFrontendOption(data: any): FrontendOption {
  return {
    id: String(data.id || data.ID || ""),
    type: data.type || data.Type || "",
    label: data.label || data.Label || "",
    value: String(data.value || data.Value || ""),
    abbreviation: data.abbreviation || data.abbreviation || data.abbr || null,
  }
}

