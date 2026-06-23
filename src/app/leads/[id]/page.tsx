import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import LeadDetail from './LeadDetail'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function LeadPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', params.id).single()
  if (!lead) notFound()

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeadDetail lead={lead} />
      </div>
    </div>
  )
}
