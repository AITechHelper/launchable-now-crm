import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const leads = allLeads || []
  const bookedLeads = leads.filter((l) => l.status === 'booked')
  const activeClients = leads.filter((l) => l.status === 'active')

  const totalMRR = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0)
  const totalFees = leads.filter((l) => l.fee_collected).reduce((sum, c) => sum + (c.one_time_fee || 0), 0)
  const totalRevenue = totalMRR + totalFees

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const stats = [
    { label: 'Total Revenue', value: fmt(totalRevenue), sub: `${fmt(totalFees)} fees + ${fmt(totalMRR)} MRR`, color: '#00FFB2' },
    { label: 'Monthly MRR', value: fmt(totalMRR), sub: `from ${activeClients.length} active client${activeClients.length !== 1 ? 's' : ''}`, color: '#00FFB2' },
    { label: 'Booked Leads', value: bookedLeads.length.toString(), sub: 'Ready to build', color: '#9B5FFF' },
    { label: 'Active Clients', value: activeClients.length.toString(), sub: 'Paying clients', color: '#6699FF' },
  ]

  const allBookedLeads = bookedLeads
  const allClients = activeClients

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl p-6" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
              <p className="text-sm mb-1" style={{ color: '#a0a0c0' }}>{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6060a0' }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Booked Leads */}
        {allBookedLeads.length > 0 && (
          <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #3a3a5c' }}>
              <div>
                <h2 className="font-semibold" style={{ color: '#ffffff' }}>Booked Leads</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6060a0' }}>Meeting confirmed — ready to build their site</p>
              </div>
              <Link href="/leads" className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#a0a0c0', border: '1px solid #3a3a5c' }}>
                All Leads →
              </Link>
            </div>
            <div>
              {allBookedLeads.map((lead: { id: string; business_name: string; phone?: string | null; city?: string | null; niche?: string | null }) => (
                <div key={lead.id} className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a45' }}>
                  <div className="flex items-center gap-6 min-w-0">
                    <span className="font-medium truncate" style={{ color: '#ffffff' }}>{lead.business_name}</span>
                    {lead.city && <span className="text-sm hidden sm:block" style={{ color: '#6060a0' }}>{lead.city}</span>}
                    {lead.niche && <span className="text-sm hidden md:block" style={{ color: '#6060a0' }}>{lead.niche}</span>}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {lead.phone && <span className="text-sm font-mono hidden sm:block" style={{ color: '#34d399' }}>{lead.phone}</span>}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
                      style={{ backgroundColor: '#4c1d95', color: '#c4b5fd', border: '1px solid #7c3aed' }}
                    >
                      → Research
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clients */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #3a3a5c' }}>
            <div>
              <h2 className="font-semibold" style={{ color: '#ffffff' }}>Clients</h2>
              <p className="text-xs mt-0.5" style={{ color: '#6060a0' }}>Active and closed accounts</p>
            </div>
            <Link href="/clients/new" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}>
              + Add Client
            </Link>
          </div>
          {allClients.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#a0a0c0' }}>
              No clients yet. <Link href="/clients/new" style={{ color: '#00FFB2' }}>Add your first →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
                    {['Business', 'Owner', 'City', 'Status', 'MRR'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6060a0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allClients.map((client) => (
                    <tr key={client.id} style={{ borderBottom: '1px solid #2a2a45' }}>
                      <td className="px-6 py-3">
                        <Link href={`/leads/${client.id}`} className="font-medium hover:underline" style={{ color: '#ffffff' }}>
                          {client.business_name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-sm" style={{ color: '#a0a0c0' }}>{client.owner_name || '—'}</td>
                      <td className="px-6 py-3 text-sm" style={{ color: '#a0a0c0' }}>{client.city || '—'}</td>
                      <td className="px-6 py-3"><StatusBadge status={client.status} /></td>
                      <td className="px-6 py-3 text-sm" style={{ color: '#00FFB2' }}>
                        {client.mrr ? `$${client.mrr}/mo` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
