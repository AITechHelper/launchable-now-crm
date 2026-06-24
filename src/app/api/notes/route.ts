import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title: body.title || 'Untitled', content: body.content || '', folder: body.folder || 'General' }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
