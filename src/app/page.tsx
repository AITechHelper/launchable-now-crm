import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import Link from 'next/link'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const leads = allLeads || []
  const newLeads    = leads.filter((l) => l.status === 'new' || l.status === 'called')
  const bookedLeads = leads.filter((l) => l.status === 'booked')
  const activeClients = leads.filter((l) => l.status === 'active')
  const closedClients = leads.filter((l) => l.status === 'closed')

  const totalMRR  = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0)
  const totalFees = leads.filter((l) => l.fee_collected).reduce((sum, c) => sum + (c.one_time_fee || 0), 0)
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Monthly MRR',    value: fmt(totalMRR),  sub: `from ${activeClients.length} active client${activeClients.length !== 1 ? 's' : ''}`, color: '#00FFB2' },
            { label: 'Total Revenue',  value: fmt(totalMRR + totalFees), sub: `${fmt(totalFees)} fees + ${fmt(totalMRR)} MRR`, color: '#00FFB2' },
            { label: 'In Pipeline',    value: (newLeads.length + bookedLeads.length).toString(), sub: `${newLeads.length} leads · ${bookedLeads.length} booked`, color: '#9B5FFF' },
            { label: 'Total Clients',  value: (activeClients.length + closedClients.length).toString(), sub: `${activeClients.length} active · ${closedClients.length} closed`, color: '#6699FF' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-6" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
              <p className="text-sm mb-1" style={{ color: '#a0a0c0' }}>{s.label}</p>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6060a0' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Pipeline overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Leads */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #3a3a5c' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#ffffff' }}>Leads <span style={{ color: '#6060a0' }}>({newLeads.length})</span></h2>
              <Link href="/leads" className="text-xs px-2 py-1 rounded" style={{ color: '#6060a0', border: '1px solid #3a3a5c' }}>View all →</Link>
            </div>
            {newLeads.length === 0 ? (
              <p className="px-5 py-8 text-xs text-center" style={{ color: '#6060a0' }}>No active leads</p>
            ) : (
              <div>
                {newLeads.slice(0, 5).map((l) => (
                  <Link key={l.id} href={`/leads/${l.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid #2a2a45' }}>
                    <span className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{l.business_name}</span>
                    <span className="text-xs ml-2 flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: l.status === 'called' ? '#3a2e00' : '#1e3a5f', color: l.status === 'called' ? '#fbbf24' : '#60a5fa' }}>
                      {l.status === 'called' ? 'Called' : 'New'}
                    </span>
                  </Link>
                ))}
                {newLeads.length > 5 && (
                  <Link href="/leads" className="block px-5 py-2 text-xs" style={{ color: '#6060a0' }}>+{newLeads.length - 5} more</Link>
                )}
              </div>
            )}
          </div>

          {/* Booked */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #00FFB2' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1a3a2a' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#00FFB2' }}>Booked <span style={{ color: '#1a5a3a' }}>({bookedLeads.length})</span></h2>
              <Link href="/booked" className="text-xs px-2 py-1 rounded" style={{ color: '#00FFB2', border: '1px solid #1a5a3a' }}>View all →</Link>
            </div>
            {bookedLeads.length === 0 ? (
              <p className="px-5 py-8 text-xs text-center" style={{ color: '#6060a0' }}>No booked prospects</p>
            ) : (
              <div>
                {bookedLeads.slice(0, 5).map((l) => (
                  <Link key={l.id} href={`/leads/${l.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid #1a3a2a' }}>
                    <span className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{l.business_name}</span>
                    <span className="text-xs" style={{ color: '#6060a0' }}>{l.city || ''}</span>
                  </Link>
                ))}
                {bookedLeads.length > 5 && (
                  <Link href="/booked" className="block px-5 py-2 text-xs" style={{ color: '#6060a0' }}>+{bookedLeads.length - 5} more</Link>
                )}
              </div>
            )}
          </div>

          {/* Active Clients */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #3a3a5c' }}>
              <h2 className="font-semibold text-sm" style={{ color: '#ffffff' }}>Clients <span style={{ color: '#6060a0' }}>({activeClients.length})</span></h2>
              <Link href="/clients" className="text-xs px-2 py-1 rounded" style={{ color: '#6060a0', border: '1px solid #3a3a5c' }}>View all →</Link>
            </div>
            {activeClients.length === 0 ? (
              <p className="px-5 py-8 text-xs text-center" style={{ color: '#6060a0' }}>No active clients yet</p>
            ) : (
              <div>
                {activeClients.slice(0, 5).map((l) => (
                  <Link key={l.id} href={`/leads/${l.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid #2a2a45' }}>
                    <span className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>{l.business_name}</span>
                    <span className="text-sm font-medium" style={{ color: '#00FFB2' }}>{l.mrr ? `$${l.mrr}/mo` : '—'}</span>
                  </Link>
                ))}
                {activeClients.length > 5 && (
                  <Link href="/clients" className="block px-5 py-2 text-xs" style={{ color: '#6060a0' }}>+{activeClients.length - 5} more</Link>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
