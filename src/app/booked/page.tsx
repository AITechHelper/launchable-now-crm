import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import BookedClient from './BookedClient'

export const revalidate = 0

export default async function BookedPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'booked')
    .order('created_at', { ascending: false })

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookedClient initialLeads={data || []} />
      </div>
    </div>
  )
}
