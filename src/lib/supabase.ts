import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  business_name: string
  owner_name: string | null
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  niche: string | null
  status: string
  one_time_fee_collected: boolean
  one_time_fee_amount: number | null
  monthly_recurring: number | null
  demo_site_url: string | null
  live_site_url: string | null
  domain: string | null
  vercel_project_name: string | null
  google_drive_url: string | null
  notes: string | null
  date_added: string
  date_closed: string | null
  created_at: string
  updated_at: string
}
