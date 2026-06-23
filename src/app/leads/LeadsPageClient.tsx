'use client'

import { useState, useRef, useEffect } from 'react'
import LeadsTable from './LeadsTable'

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

export default function LeadsPageClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [vertical, setVertical] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [website, setWebsite] = useState<'any' | 'none' | 'has'>('any')
  const [minReviews, setMinReviews] = useState(0)
  const [maxReviews, setMaxReviews] = useState(300)
  const [requirePhone, setRequirePhone] = useState(false)
  const [searching, setSearching] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  async function startSearch() {
    if (!city.trim() || !vertical.trim()) return
    setSearching(true)
    setLogs([])

    const resp = await fetch('/api/leads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: city.trim(),
        vertical: vertical.trim(),
        website,
        minReviews,
        maxReviews,
        requirePhone,
      }),
    })

    if (!resp.body) { setSearching(false); return }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.log) setLogs((prev) => [...prev, payload.log])
          if (payload.done) {
            fetch('/api/leads')
              .then((r) => r.json())
              .then((data) => setLeads(Array.isArray(data) ? data : []))
          }
          if (payload.error) setLogs((prev) => [...prev, `ERROR: ${payload.error}`])
        } catch { /* ignore */ }
      }
    }
    setSearching(false)
  }

  const inputStyle = { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Leads</h1>
        <p className="text-sm mt-1" style={{ color: '#a0a0c0' }}>Find businesses, call them, book a meeting, build their site.</p>
      </div>

      {/* Search Card */}
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#a0a0c0' }}>
          Find Businesses
        </h2>

        {/* Main inputs */}
        <div className="flex gap-3 flex-wrap mb-3">
          <input
            type="text"
            placeholder="City  e.g. Austin, TX"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !searching && startSearch()}
            disabled={searching}
            className="flex-1 min-w-40 px-4 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Niche  e.g. plumbers, nail salons"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !searching && startSearch()}
            disabled={searching}
            className="flex-1 min-w-48 px-4 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
            style={inputStyle}
          />
          <button
            onClick={startSearch}
            disabled={searching || !city.trim() || !vertical.trim()}
            className="px-6 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#f59e0b', color: '#000000' }}
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="text-sm flex items-center gap-1 mb-3"
          style={{ color: '#a0a0c0' }}
        >
          <span style={{ color: showFilters ? '#00FFB2' : '#a0a0c0' }}>▲</span>
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>

        {/* Filters panel */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 pb-1" style={{ borderTop: '1px solid #3a3a5c' }}>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#a0a0c0' }}>Website</label>
              <select
                value={website}
                onChange={(e) => setWebsite(e.target.value as 'any' | 'none' | 'has')}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                <option value="any">Any</option>
                <option value="none">No Website</option>
                <option value="has">Has Website</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#a0a0c0' }}>Min Reviews</label>
              <input
                type="number"
                value={minReviews}
                onChange={(e) => setMinReviews(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#a0a0c0' }}>Max Reviews</label>
              <input
                type="number"
                value={maxReviews}
                onChange={(e) => setMaxReviews(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                min={0}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#a0a0c0' }}>
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Require Phone
              </label>
            </div>
          </div>
        )}

        {/* Log box */}
        {logs.length > 0 && (
          <div
            ref={logRef}
            className="mt-4 p-4 rounded-lg font-mono text-xs overflow-y-auto"
            style={{ backgroundColor: '#0f1117', color: '#94a3b8', maxHeight: '200px', border: '1px solid #2d3148' }}
          >
            {logs.map((l, i) => (
              <div key={i} style={{
                color: l.startsWith('✅') ? '#00FFB2'
                  : l.startsWith('ERROR') ? '#ef4444'
                  : l.includes('SKIP') ? '#6060a0'
                  : l.includes('DUPE') ? '#6060a0'
                  : '#94a3b8'
              }}>
                {l}
              </div>
            ))}
            {searching && <div style={{ color: '#f59e0b' }}>▋</div>}
          </div>
        )}
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: '#a0a0c0' }}>Loading leads…</div>
      ) : (
        <LeadsTable initialLeads={leads} />
      )}
    </div>
  )
}
