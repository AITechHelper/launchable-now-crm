import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { generateSiteTask } from '@/trigger/generateSite'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createServerClient()
  const { data: lead } = await supabase.from('leads').select('id, business_name').eq('id', id).single()
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // Mark as generating immediately
  await supabase.from('leads').update({ generation_status: 'generating' }).eq('id', id)

  // Kick off background job — returns immediately, user can leave the page
  await generateSiteTask.trigger({ leadId: id })

  return NextResponse.json({ queued: true })
}
