'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lead = {
  id: string
  business_name: string
  phone?: string | null
  city?: string | null
  niche?: string | null
  owner_name?: string | null
  status: string
  created_at: string
  site_url?: string | null
  website_url?: string | null
  meeting_done?: boolean | null
  meeting_notes?: string | null
}

export default function BookedClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function toggleMeetingDone(id: string, current: boolean) {
    const next = !current
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, meeting_done: next } : l))
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_done: next }),
    })
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    // Remove from booked list when moved to active or back to called
    setLeads((prev) => prev.filter((l) => l.id !== id))
    setUpdating(null)
  }

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    return !q || l.business_name.toLowerCase().includes(q) || (l.city || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Booked</h1>
          <p className="text-sm mt-1" style={{ color: '#6060a0' }}>Meeting confirmed — build their site and close them.</p>
        </div>
      </div>

      <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }} />

      {filtered.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <p className="text-sm mb-1" style={{ color: '#a0a0c0' }}>No booked prospects yet.</p>
          <p className="text-xs" style={{ color: '#6060a0' }}>Mark a lead as <strong style={{ color: '#00FFB2' }}>Booked</strong> on the Leads page to see them here.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
                {['Business', 'Owner', 'Phone', 'City', 'Meeting', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#6060a0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #2a2a45' }}>
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline" style={{ color: '#ffffff' }}>
                      {lead.business_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{lead.owner_name || '—'}</td>
                  <td className="px-5 py-3 text-sm font-mono" style={{ color: '#34d399' }}>{lead.phone || '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{lead.city || '—'}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleMeetingDone(lead.id, !!lead.meeting_done)}
                      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: lead.meeting_done ? '#0d3320' : '#1a1a2e',
                        color: lead.meeting_done ? '#00FFB2' : '#6060a0',
                        border: `1px solid ${lead.meeting_done ? '#00FFB2' : '#3a3a5c'}`,
                      }}>
                      {lead.meeting_done ? '✓ Done' : '○ Pending'}
                    </button>
                    {lead.meeting_notes && (
                      <p className="text-xs mt-1.5 max-w-xs truncate" style={{ color: '#6060a0' }} title={lead.meeting_notes}>
                        {lead.meeting_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/leads/${lead.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: '#4c1d95', color: '#c4b5fd', border: '1px solid #7c3aed' }}>
                        → Profile
                      </Link>
                      <button onClick={() => updateStatus(lead.id, 'active')} disabled={updating === lead.id}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#1a0d2e', color: '#a78bfa', border: '1px solid #7c3aed' }}>
                        Mark Active ✓
                      </button>
                      <button onClick={() => updateStatus(lead.id, 'called')} disabled={updating === lead.id}
                        className="text-xs px-2 py-1 rounded-lg disabled:opacity-50"
                        style={{ color: '#6060a0', border: '1px solid #3a3a5c' }}>
                        ← Back
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs mt-3" style={{ color: '#6060a0' }}>{filtered.length} booked</p>
    </div>
  )
}
