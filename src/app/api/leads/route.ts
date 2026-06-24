import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validKey = process.env.CRM_API_KEY
  // Only enforce API key for external requests (internal CRM calls have no key)
  if (validKey && apiKey && apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .insert([{ ...body, source: 'lead_finder' }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
