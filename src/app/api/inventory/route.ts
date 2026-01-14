import { NextResponse } from "next/server"
import { 
  fetchInventoryItems, 
  fetchInventoryAssemblies, 
  fetchInventoryOptions, 
  fetchInventoryModels 
} from "@/lib/supabase/queries"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") || "items"

    let data = []
    
    switch (tab) {
      case "items":
        data = await fetchInventoryItems()
        break
      case "assemblies":
        data = await fetchInventoryAssemblies()
        break
      case "options":
        data = await fetchInventoryOptions()
        break
      case "models":
        data = await fetchInventoryModels()
        break
      default:
        data = await fetchInventoryItems()
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in inventory API route:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory data" },
      { status: 500 }
    )
  }
}

