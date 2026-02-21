// What? Creates a browser client for Supabase using the SSR package.
// Why? Required for fetching data and interacting with Supabase from Next.js Client Components (e.g., hooks, event handlers).
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database.types'

export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
