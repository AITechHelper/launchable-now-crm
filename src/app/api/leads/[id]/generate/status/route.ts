import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('leads')
    .select('generation_status, site_url')
    .eq('id', id)
    .single()

  return NextResponse.json({
    status: data?.generation_status || null,
    siteUrl: data?.site_url || null,
  })
}
