'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'

type Lead = {
  id: string
  business_name: string
  phone?: string | null
  city?: string | null
  niche?: string | null
  status: string
  source?: string | null
  website_url?: string | null
  created_at: string
}

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  // Only show new + called on leads page
  const [leads, setLeads] = useState(initialLeads.filter((l) => l.status === 'new' || l.status === 'called'))
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    setLeads(initialLeads.filter((l) => l.status === 'new' || l.status === 'called'))
  }, [initialLeads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        l.business_name.toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.niche || '').toLowerCase().includes(q)
      const matchTab = tab === 'all' || l.status === tab
      return matchSearch && matchTab
    })
  }, [leads, tab, search])

  const counts = useMemo(() => ({
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    called: leads.filter((l) => l.status === 'called').length,
  }), [leads])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (status === 'booked') {
      // Remove from leads list — they move to Booked page
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } else {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    }
    setUpdating(null)
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'called', label: 'Called', count: counts.called },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: tab === t.key ? '#3a3a5c' : 'transparent', color: tab === t.key ? '#ffffff' : '#a0a0c0' }}>
            {t.label} <span style={{ color: '#6060a0' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input type="text" placeholder="Search business, city, niche…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }} />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
              {['Business', 'Phone', 'City', 'Niche', 'Website', 'Status', 'Added', 'Actions'].map((h) => (
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
                <td className="px-5 py-3 text-sm font-mono" style={{ color: '#34d399' }}>{lead.phone || '—'}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{lead.city || '—'}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{lead.niche || '—'}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: lead.website_url ? '#1e3a5f' : '#2a1a1a', color: lead.website_url ? '#60a5fa' : '#6060a0' }}>
                    {lead.website_url ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: lead.status === 'called' ? '#3a2e00' : '#1e3a5f', color: lead.status === 'called' ? '#fbbf24' : '#60a5fa' }}>
                    {lead.status === 'called' ? 'Called' : 'New'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: '#a0a0c0' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {lead.status === 'called' && (
                      <button onClick={() => updateStatus(lead.id, 'new')} disabled={updating === lead.id}
                        className="text-xs px-2 py-1 rounded-lg disabled:opacity-50"
                        style={{ color: '#6060a0', border: '1px solid #3a3a5c' }}>
                        ← Back
                      </button>
                    )}
                    {lead.status === 'new' && (
                      <button onClick={() => updateStatus(lead.id, 'called')} disabled={updating === lead.id}
                        className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#3a2e00', color: '#fbbf24', border: '1px solid #78500a' }}>
                        Mark Called
                      </button>
                    )}
                    {lead.status === 'called' && (
                      <button onClick={() => updateStatus(lead.id, 'booked')} disabled={updating === lead.id}
                        className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#0d3320', color: '#00FFB2', border: '1px solid #00FFB2' }}>
                        Mark Booked →
                      </button>
                    )}
                    <button onClick={() => deleteLead(lead.id, lead.business_name)}
                      className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', border: '1px solid #3D1B1B' }}>
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-sm" style={{ color: '#6060a0' }}>
                  {leads.length === 0
                    ? <span>No leads yet. <Link href="/leads" style={{ color: '#00FFB2' }}>Use lead finder or add manually.</Link></span>
                    : 'No leads match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-3" style={{ color: '#6060a0' }}>{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
