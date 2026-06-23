import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await request.formData()
  const leadId = formData.get('leadId') as string
  const file = formData.get('file') as File

  if (!leadId || !file) {
    return NextResponse.json({ error: 'leadId and file required' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `leads/${leadId}/${filename}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const { error } = await supabase.storage
    .from('lead-assets')
    .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (error) return NextResponse.json({ error: error.message, path, bucket: 'lead-assets' }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('lead-assets')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path, name: file.name })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { path } = await request.json()
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  const { error } = await supabase.storage.from('lead-assets').remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
