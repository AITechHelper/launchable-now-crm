'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Lead = {
  id: string
  business_name: string
  phone?: string | null
  city?: string | null
  niche?: string | null
  status: string
  source?: string | null
  created_at: string
}

const STATUS_TABS = ['All', 'new', 'called', 'booked']
const STATUS_LABELS: Record<string, string> = { new: 'New', called: 'Called', booked: 'Booked' }
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:    { bg: '#1e3a5f', color: '#60a5fa' },
  called: { bg: '#3a2e00', color: '#fbbf24' },
  booked: { bg: '#0d3320', color: '#00FFB2' },
}

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        l.business_name.toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.niche || '').toLowerCase().includes(q)
      const matchTab = tab === 'All' || l.status === tab
      return matchSearch && matchTab
    })
  }, [leads, tab, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: leads.length }
    STATUS_TABS.slice(1).forEach((s) => { c[s] = leads.filter((l) => l.status === s).length })
    return c
  }, [leads])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    setUpdating(null)
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === s ? '#3a3a5c' : 'transparent',
              color: tab === s ? '#ffffff' : '#a0a0c0',
            }}
          >
            {s === 'All' ? 'All' : STATUS_LABELS[s]} <span style={{ color: '#6060a0' }}>({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search business, city, niche..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }}
      />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
                {['Business', 'Phone', 'City', 'Niche', 'Status', 'Added', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#a0a0c0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const sc = STATUS_COLORS[lead.status] || { bg: '#252540', color: '#a0a0c0' }
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #3a3a5c' }}>
                    <td className="px-6 py-4">
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline" style={{ color: '#ffffff' }}>
                        {lead.business_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: '#34d399' }}>{lead.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>{lead.city || '—'}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>{lead.niche || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead.status !== 'new' && (
                          <button
                            onClick={() => updateStatus(lead.id, lead.status === 'booked' ? 'called' : 'new')}
                            disabled={updating === lead.id}
                            className="text-xs px-2 py-1 rounded-lg disabled:opacity-50"
                            style={{ color: '#6060a0', border: '1px solid #3a3a5c' }}
                          >
                            ← Back
                          </button>
                        )}
                        {lead.status === 'new' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'called')}
                            disabled={updating === lead.id}
                            className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                            style={{ backgroundColor: '#3a2e00', color: '#fbbf24', border: '1px solid #78500a' }}
                          >
                            Mark Called
                          </button>
                        )}
                        {lead.status === 'called' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'booked')}
                            disabled={updating === lead.id}
                            className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                            style={{ backgroundColor: '#0d3320', color: '#00FFB2', border: '1px solid #00FFB2' }}
                          >
                            Mark Booked
                          </button>
                        )}
                        {lead.status === 'booked' && (
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ backgroundColor: '#4c1d95', color: '#c4b5fd', border: '1px solid #7c3aed' }}
                          >
                            → Research
                          </Link>
                        )}
                        <button
                          onClick={() => deleteLead(lead.id, lead.business_name)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: '#ef4444', border: '1px solid #3D1B1B' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm" style={{ color: '#a0a0c0' }}>
                    {leads.length === 0
                      ? 'No leads yet. Use Lead Finder to find businesses and send them here.'
                      : 'No leads match your filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm mt-3" style={{ color: '#a0a0c0' }}>{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
