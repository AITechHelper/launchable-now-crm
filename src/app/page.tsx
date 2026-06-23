import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const allClients = clients || []

  const totalMRR = allClients
    .filter((c) => c.status === 'Active')
    .reduce((sum: number, c: { monthly_recurring?: number | null }) => sum + (c.monthly_recurring || 0), 0)

  const activeCount = allClients.filter((c: { status: string }) => c.status === 'Active').length
  const pipelineCount = allClients.filter((c: { status: string }) => c.status === 'Prospect' || c.status === 'Demo Booked').length
  const closedCount = allClients.filter((c: { status: string }) => c.status === 'Closed' || c.status === 'Active').length

  const recentClients = allClients.slice(0, 10)

  const stats = [
    { label: 'Total MRR', value: `$${totalMRR.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: '#00FFB2' },
    { label: 'Active Clients', value: activeCount.toString(), color: '#00FFB2' },
    { label: 'Pipeline', value: pipelineCount.toString(), color: '#7B2FFF' },
    { label: 'Total Closed', value: closedCount.toString(), color: '#6699FF' },
  ]

  return (
    <div style={{ backgroundColor: '#08080F', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#F0F0FF' }}>Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl p-6" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
              <p className="text-sm mb-1" style={{ color: '#5A5A7A' }}>{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1E1E32' }}>
            <h2 className="font-semibold" style={{ color: '#F0F0FF' }}>Recent Clients</h2>
            <Link href="/clients/new" className="text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: '#00FFB2', color: '#08080F' }}>
              + Add Client
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E32' }}>
                  {['Business', 'Owner', 'City', 'Niche', 'Status', 'MRR'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#5A5A7A' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client: {
                  id: string
                  business_name: string
                  owner_name?: string | null
                  city?: string | null
                  niche?: string | null
                  status: string
                  monthly_recurring?: number | null
                  date_added: string
                }) => (
                  <tr key={client.id} style={{ borderBottom: '1px solid #1E1E32' }}>
                    <td className="px-6 py-4">
                      <Link href={`/clients/${client.id}`} className="font-medium hover:underline" style={{ color: '#F0F0FF' }}>
                        {client.business_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5A5A7A' }}>{client.owner_name || '—'}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5A5A7A' }}>{client.city || '—'}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#5A5A7A' }}>{client.niche || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#F0F0FF' }}>
                      {client.monthly_recurring ? `$${client.monthly_recurring}/mo` : '—'}
                    </td>
                  </tr>
                ))}
                {recentClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: '#5A5A7A' }}>
                      No clients yet. <Link href="/clients/new" style={{ color: '#00FFB2' }}>Add your first client</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
