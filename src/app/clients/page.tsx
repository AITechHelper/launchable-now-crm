import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0

export default async function ClientsPage() {
  const supabase = createServerClient()
  const { data: clients } = await supabase
    .from('leads')
    .select('*')
    .in('status', ['active', 'closed'])
    .order('created_at', { ascending: false })

  const allClients = clients || []
  const totalMRR = allClients.reduce((sum, c) => sum + (c.mrr || 0), 0)
  const totalFees = allClients.filter((c) => c.fee_collected).reduce((sum, c) => sum + (c.one_time_fee || 0), 0)

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Clients</h1>
            <p className="text-sm mt-1" style={{ color: '#6060a0' }}>Leads marked Active or Closed</p>
          </div>
          <Link href="/leads" className="px-4 py-2 rounded-lg font-medium text-sm" style={{ backgroundColor: '#252540', color: '#a0a0c0', border: '1px solid #3a3a5c' }}>
            ← All Leads
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active Clients', value: allClients.filter(c => c.status === 'active').length, color: '#a78bfa' },
            { label: 'Monthly MRR', value: `$${totalMRR.toLocaleString()}`, color: '#00FFB2' },
            { label: 'Fees Collected', value: `$${totalFees.toLocaleString()}`, color: '#60a5fa' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
              <p className="text-xs mb-1" style={{ color: '#6060a0' }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {allClients.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
            <p className="text-sm mb-2" style={{ color: '#a0a0c0' }}>No active clients yet.</p>
            <p className="text-xs" style={{ color: '#6060a0' }}>Mark a lead as <strong style={{ color: '#a78bfa' }}>Active</strong> on their profile to see them here.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
                  {['Business', 'Owner', 'City', 'Status', 'MRR', 'Fee', 'Site'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6060a0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allClients.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #2a2a45' }}>
                    <td className="px-5 py-3">
                      <Link href={`/leads/${c.id}`} className="font-medium hover:underline" style={{ color: '#ffffff' }}>
                        {c.business_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{c.owner_name || '—'}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{c.city || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: c.status === 'active' ? '#1a0d2e' : '#2a1a1a', color: c.status === 'active' ? '#a78bfa' : '#f87171' }}>
                        {c.status === 'active' ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: c.mrr ? '#00FFB2' : '#4a4a6a' }}>
                      {c.mrr ? `$${c.mrr}/mo` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>
                      {c.one_time_fee ? `$${c.one_time_fee}${c.fee_collected ? ' ✓' : ' (pending)'}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {c.site_url || c.website_url ? (
                        <a href={c.site_url || c.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ backgroundColor: '#0d1a0d', color: '#00FFB2', border: '1px solid #00FFB2' }}>
                          View ↗
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
