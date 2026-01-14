import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null
let serverSupabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Server-side: create a new client instance for each request
  if (typeof window === "undefined") {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://placeholder.supabase.co") {
      if (!serverSupabaseClient) {
        serverSupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
      }
      return serverSupabaseClient
    }
    return createClient("https://placeholder.supabase.co", "placeholder-key")
  }

  // Client-side: use singleton pattern
  if (!supabaseClient) {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://placeholder.supabase.co") {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    } else {
      supabaseClient = createClient("https://placeholder.supabase.co", "placeholder-key")
    }
  }

  return supabaseClient
}

