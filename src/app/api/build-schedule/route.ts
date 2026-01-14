import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const dateTo = searchParams.get("dateTo") || new Date().toISOString().split("T")[0]
    const hideBuilt = searchParams.get("hideBuilt") === "true"
    const brightviewParam = searchParams.get("brightview")
    const brightview = brightviewParam !== null ? brightviewParam === "true" : undefined

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key for RPC calls
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute the SQL query via RPC
    const rpcParams: any = {
      d_from: dateFrom,
      d_to: dateTo,
      hide_built: hideBuilt,
    }
    
    if (brightview !== undefined) {
      rpcParams.brightview_filter = brightview
    }

    const { data, error } = await supabase.rpc("get_build_schedule", rpcParams)

    if (error) {
      console.error("Error executing build schedule query:", error)
      
      // If RPC function doesn't exist, return empty array for now
      // The function needs to be created in Supabase first
      if (error.code === "42883" || error.message?.includes("does not exist")) {
        console.warn("Build schedule function not found. Please create it in Supabase.")
        return NextResponse.json({ data: [] })
      }
      
      return NextResponse.json(
        { error: "Failed to fetch build schedule", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("Error in build-schedule API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

