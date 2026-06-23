'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { Client } from '@/lib/supabase'

const STATUSES = ['All', 'Prospect', 'Demo Booked', 'Closed', 'Active', 'Churned']
const NICHES = ['All', 'Plumber', 'Roofer', 'HVAC', 'Landscaper', 'Electrician', 'Painter', 'Pest Control', 'Cleaning', 'Other']

export default function ClientsTable({ initialClients }: { initialClients: Client[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [nicheFilter, setNicheFilter] = useState('All')

  const filtered = useMemo(() => {
    return initialClients.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        c.business_name.toLowerCase().includes(q) ||
        (c.owner_name || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      const matchesNiche = nicheFilter === 'All' || c.niche === nicheFilter
      return matchesSearch && matchesStatus && matchesNiche
    })
  }, [initialClients, search, statusFilter, nicheFilter])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search business, owner, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32', color: '#F0F0FF' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32', color: '#F0F0FF' }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32', color: '#F0F0FF' }}
        >
          {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1E1E32' }}>
                {['Business Name', 'Owner', 'City', 'Niche', 'Status', 'MRR', 'Date Added', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#5A5A7A' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-opacity-50 transition-colors" style={{ borderBottom: '1px solid #1E1E32' }}>
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
                  <td className="px-6 py-4 text-sm" style={{ color: '#5A5A7A' }}>
                    {new Date(client.date_added).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/clients/${client.id}`} className="text-sm px-3 py-1 rounded-lg" style={{ backgroundColor: '#1E1E32', color: '#F0F0FF' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm" style={{ color: '#5A5A7A' }}>
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm mt-3" style={{ color: '#5A5A7A' }}>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
