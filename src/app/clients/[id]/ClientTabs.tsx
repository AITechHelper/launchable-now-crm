'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ClientDetail from './ClientDetail'
import Workspace from './Workspace'
import type { Client } from '@/lib/supabase'

const TABS = ['Details', 'Workspace']

export default function ClientTabs({ client }: { client: Client }) {
  const [tab, setTab] = useState('Details')

  const savedLinks = (client as any).saved_links || []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients" className="text-sm" style={{ color: '#a0a0c0' }}>← Clients</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{client.business_name}</h1>
          <StatusBadge status={client.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-md text-sm font-medium transition-colors"
            style={tab === t
              ? { backgroundColor: '#252540', color: '#ffffff' }
              : { color: '#a0a0c0' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Details' && <ClientDetail client={client} hideHeader />}
      {tab === 'Workspace' && (
        <Workspace
          clientId={client.id}
          initialNotes={client.notes || ''}
          initialLinks={savedLinks}
        />
      )}
    </div>
  )
}
