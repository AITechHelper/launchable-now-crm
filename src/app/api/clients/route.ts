import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validKey = process.env.CRM_API_KEY
  if (validKey && apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('clients')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
