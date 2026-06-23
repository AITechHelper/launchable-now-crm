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
          style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c', color: '#ffffff' }}
        >
          {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3a5c' }}>
                {['Business Name', 'Owner', 'City', 'Niche', 'Status', 'MRR', 'Date Added', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: '#a0a0c0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-opacity-50 transition-colors" style={{ borderBottom: '1px solid #3a3a5c' }}>
                  <td className="px-6 py-4">
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline" style={{ color: '#ffffff' }}>
                      {client.business_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>{client.owner_name || '—'}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>{client.city || '—'}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>{client.niche || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#ffffff' }}>
                    {client.monthly_recurring ? `$${client.monthly_recurring}/mo` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#a0a0c0' }}>
                    {new Date(client.date_added).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/clients/${client.id}`} className="text-sm px-3 py-1 rounded-lg" style={{ backgroundColor: '#3a3a5c', color: '#ffffff' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm" style={{ color: '#a0a0c0' }}>
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm mt-3" style={{ color: '#a0a0c0' }}>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
