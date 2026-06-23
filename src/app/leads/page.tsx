import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import LeadsTable from './LeadsTable'

export const revalidate = 0

export default async function LeadsPage() {
  const supabase = createServerClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Leads</h1>
            <p className="text-sm mt-1" style={{ color: '#a0a0c0' }}>Businesses found with Lead Finder. Call them, book a meeting, build their site.</p>
          </div>
        </div>
        <LeadsTable initialLeads={leads || []} />
      </div>
    </div>
  )
}
