import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import ClientsTable from './ClientsTable'
import Link from 'next/link'

export const revalidate = 0

export default async function ClientsPage() {
  const supabase = createServerClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ backgroundColor: '#08080F', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#F0F0FF' }}>Clients</h1>
          <Link href="/clients/new" className="px-4 py-2 rounded-lg font-medium text-sm" style={{ backgroundColor: '#00FFB2', color: '#08080F' }}>
            + Add Client
          </Link>
        </div>
        <ClientsTable initialClients={clients || []} />
      </div>
    </div>
  )
}
