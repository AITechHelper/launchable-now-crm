'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Review = { name: string; rating: number; text: string }

type Lead = {
  id: string
  business_name: string
  phone?: string | null
  city?: string | null
  niche?: string | null
  status: string
  owner_name?: string | null
  email?: string | null
  address?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
  google_maps_url?: string | null
  yelp_url?: string | null
  services?: string | null
  reviews?: Review[] | null
  primary_color?: string | null
  secondary_color?: string | null
  tagline?: string | null
  hours?: string | null
  research_notes?: string | null
  website_url?: string | null
  site_url?: string | null
  mrr?: number | null
  one_time_fee?: number | null
  fee_collected?: boolean | null
  client_notes?: string | null
  meeting_notes?: string | null
  meeting_done?: boolean | null
  latest_update?: string | null
  created_at: string
}

type UploadedFile = { url: string; path: string; name: string }

const STATUSES = [
  { key: 'new',    label: 'New',    bg: '#1e3a5f', color: '#60a5fa' },
  { key: 'called', label: 'Called', bg: '#3a2e00', color: '#fbbf24' },
  { key: 'booked', label: 'Booked', bg: '#0d3320', color: '#00FFB2' },
  { key: 'active', label: 'Active', bg: '#1a0d2e', color: '#a78bfa' },
  { key: 'closed', label: 'Closed', bg: '#2a1a1a', color: '#f87171' },
]

const inputStyle = { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' }
const labelStyle = { color: '#6060a0' }

function Field({ label, value, onChange, multiline, rows, type, mono }: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; rows?: number; type?: string; mono?: boolean
}) {
  const cls = `w-full px-3 py-2 rounded-lg text-sm outline-none${mono ? ' font-mono' : ''}`
  return (
    <div>
      <label className="block text-xs mb-1" style={labelStyle}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 2}
            className={`${cls} resize-y`} style={inputStyle} />
        : <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)}
            className={cls} style={inputStyle} />
      }
    </div>
  )
}

export default function LeadDetail({ lead }: { lead: Lead }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genLogs, setGenLogs] = useState<string[]>([])
  const [siteUrl, setSiteUrl] = useState<string | null>(lead.site_url || null)
  const genLogRef = useRef<HTMLDivElement>(null)

  // Single profile state — always pre-filled from lead
  const [status, setStatus] = useState(lead.status || 'new')
  const [profile, setProfile] = useState({
    business_name: lead.business_name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    owner_name: lead.owner_name || '',
    city: lead.city || '',
    address: lead.address || '',
    niche: lead.niche || '',
    tagline: lead.tagline || '',
    services: lead.services || '',
    hours: lead.hours || '',
    google_maps_url: lead.google_maps_url || '',
    facebook_url: lead.facebook_url || '',
    instagram_url: lead.instagram_url || '',
    yelp_url: lead.yelp_url || '',
    website_url: lead.website_url || '',
    primary_color: lead.primary_color || '#22c55e',
    secondary_color: lead.secondary_color || '#166534',
    research_notes: lead.research_notes || '',
    reviews: lead.reviews || [] as Review[],
    mrr: String(lead.mrr || 0),
    one_time_fee: String(lead.one_time_fee || 0),
    fee_collected: lead.fee_collected || false,
    client_notes: lead.client_notes || '',
    meeting_notes: lead.meeting_notes || '',
    meeting_done: lead.meeting_done || false,
    latest_update: lead.latest_update || '',
    site_url: lead.site_url || '',
  })

  function set(key: string, value: string | boolean | Review[]) {
    setProfile((p) => ({ ...p, [key]: value }))
    setDirty(true)
  }

  useEffect(() => {
    if (genLogRef.current) genLogRef.current.scrollTop = genLogRef.current.scrollHeight
  }, [genLogs])

  const [dirty, setDirty] = useState(false)

  // Auto-save all profile fields 2s after any change
  useEffect(() => {
    if (!dirty) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          mrr: parseFloat(profile.mrr) || 0,
          one_time_fee: parseFloat(profile.one_time_fee) || 0,
          status,
        }),
      })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2000)
    }, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, dirty])

  async function updateStatus(newStatus: string) {
    setStatus(newStatus)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  async function saveProfile() {
    setSaving(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        mrr: parseFloat(profile.mrr) || 0,
        one_time_fee: parseFloat(profile.one_time_fee) || 0,
        status,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  async function uploadFiles(fileList: FileList) {
    setUploading(true)
    const uploaded: UploadedFile[] = []
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('leadId', lead.id)
      fd.append('file', file)
      const res = await fetch('/api/leads/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) uploaded.push(data)
      else alert(`Upload failed: ${data.error || 'Unknown error'}`)
    }
    setFiles((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) await uploadFiles(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  async function removeFile(f: UploadedFile) {
    await fetch('/api/leads/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: f.path }),
    })
    setFiles((prev) => prev.filter((x) => x.path !== f.path))
  }

  const [autofilling, setAutofilling] = useState(false)

  async function autofillFromProfile() {
    setAutofilling(true)
    // Build a text summary of all current profile data for Claude to work from
    const dump = [
      `Business Name: ${profile.business_name}`,
      `Owner: ${profile.owner_name}`,
      `Phone: ${profile.phone}`,
      `Email: ${profile.email}`,
      `City: ${profile.city}`,
      `Address: ${profile.address}`,
      `Niche: ${profile.niche}`,
      `Tagline: ${profile.tagline}`,
      `Services: ${profile.services}`,
      `Hours: ${profile.hours}`,
      `Google Maps: ${profile.google_maps_url}`,
      `Facebook: ${profile.facebook_url}`,
      `Instagram: ${profile.instagram_url}`,
      `Yelp: ${profile.yelp_url}`,
      `Website: ${profile.website_url}`,
      `Research Notes: ${profile.research_notes}`,
    ].filter((line) => !line.endsWith(': ')).join('\n')

    const res = await fetch('/api/leads/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dump,
        imageUrls: files.map((f) => f.url),
        businessName: profile.business_name,
      }),
    })
    const data = await res.json()
    setAutofilling(false)
    if (data.extracted) {
      const e = data.extracted
      setProfile((p) => ({
        ...p,
        business_name: e.business_name || p.business_name,
        phone: e.phone || p.phone,
        email: e.email || p.email,
        owner_name: e.owner_name || p.owner_name,
        city: e.city || p.city,
        address: e.address || p.address,
        tagline: e.tagline || p.tagline,
        services: e.services || p.services,
        hours: e.hours || p.hours,
        google_maps_url: e.google_maps_url || p.google_maps_url,
        facebook_url: e.facebook_url || p.facebook_url,
        instagram_url: e.instagram_url || p.instagram_url,
        yelp_url: e.yelp_url || p.yelp_url,
        website_url: e.website_url || p.website_url,
        primary_color: e.primary_color || p.primary_color,
        secondary_color: e.secondary_color || p.secondary_color,
        research_notes: e.research_notes || p.research_notes,
        reviews: e.reviews?.length ? e.reviews : p.reviews,
      }))
      setDirty(true)
    } else {
      alert(`AI autofill failed: ${data.error || 'Unknown error'}`)
    }
  }

  async function processWithAI() {
    // Save research first so nothing is lost
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ research_notes: profile.research_notes }),
    })
    setProcessing(true)
    const res = await fetch('/api/leads/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dump: profile.research_notes,
        imageUrls: files.map((f) => f.url),
        businessName: profile.business_name,
      }),
    })
    const data = await res.json()
    setProcessing(false)
    if (data.extracted) {
      const e = data.extracted
      setProfile((p) => ({
        ...p,
        business_name: e.business_name || p.business_name,
        phone: e.phone || p.phone,
        email: e.email || p.email,
        owner_name: e.owner_name || p.owner_name,
        city: e.city || p.city,
        address: e.address || p.address,
        tagline: e.tagline || p.tagline,
        services: e.services || p.services,
        hours: e.hours || p.hours,
        google_maps_url: e.google_maps_url || p.google_maps_url,
        facebook_url: e.facebook_url || p.facebook_url,
        instagram_url: e.instagram_url || p.instagram_url,
        yelp_url: e.yelp_url || p.yelp_url,
        website_url: e.website_url || p.website_url,
        primary_color: e.primary_color || p.primary_color,
        secondary_color: e.secondary_color || p.secondary_color,
        research_notes: e.research_notes || p.research_notes,
        reviews: e.reviews?.length ? e.reviews : p.reviews,
      }))
    } else {
      alert(`AI processing failed: ${data.error || 'Unknown error'}`)
    }
  }

  async function generateSite() {
    await saveProfile()
    setGenerating(true)
    setGenLogs([])
    const resp = await fetch(`/api/leads/${lead.id}/generate`, { method: 'POST' })
    if (!resp.body) { setGenerating(false); return }
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
          if (payload.log) setGenLogs((prev) => [...prev, payload.log])
          if (payload.done) {
            setSiteUrl(payload.siteUrl)
            set('website_url', payload.siteUrl)
          }
          if (payload.error) setGenLogs((prev) => [...prev, `❌ ${payload.error}`])
        } catch { /* ignore */ }
      }
    }
    setGenerating(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${lead.business_name}"? This cannot be undone.`)) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/leads')
  }

  const statusInfo = STATUSES.find((s) => s.key === status) || STATUSES[0]
  const isClient = status === 'active' || status === 'closed'
  const isBooked = status === 'booked' || status === 'active' || status === 'closed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/leads" className="text-xs mb-2 inline-block" style={{ color: '#6060a0' }}>← Back to Leads</Link>
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{profile.business_name || 'New Lead'}</h1>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 pt-5">
          {dirty && !saved && <span className="text-xs" style={{ color: '#6060a0' }}>Saving…</span>}
          {saved && <span className="text-sm font-medium" style={{ color: '#00FFB2' }}>Saved ✓</span>}
          <button onClick={autofillFromProfile} disabled={autofilling}
            className="px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-1.5"
            style={{ backgroundColor: '#2d1a4a', color: '#c4b5fd', border: '1px solid #7c3aed' }}>
            {autofilling ? '✨ Filling…' : '✨ AI Autofill'}
          </button>
          <button onClick={saveProfile} disabled={saving}
            className="px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: '#2a1212', color: '#f87171', border: '1px solid #3d1b1b' }}>
            Delete
          </button>
        </div>
      </div>

      {/* Live Site Link — always editable, view button appears when URL is set */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#0d1a0d', border: `1px solid ${siteUrl || profile.site_url ? '#00FFB2' : '#2a4a2a'}` }}>
        <span className="text-base flex-shrink-0">🌐</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#00FFB2' }}>Live Site URL</p>
          <input
            type="text"
            value={siteUrl || ''}
            onChange={(e) => { setSiteUrl(e.target.value); set('site_url', e.target.value) }}
            placeholder="https://their-site.vercel.app"
            className="w-full bg-transparent text-sm font-mono outline-none"
            style={{ color: '#ffffff', caretColor: '#00FFB2' }}
          />
        </div>
        {(siteUrl) && (
          <a href={siteUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}>
            View ↗
          </a>
        )}
      </div>

      {/* Latest Update — always visible at the top */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: '#1e2a1e', border: '1px solid #2a4a2a' }}>
        <span className="text-base mt-0.5 flex-shrink-0">📌</span>
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#00FFB2' }}>Latest Update</label>
          <input
            type="text"
            value={profile.latest_update}
            onChange={(e) => set('latest_update', e.target.value)}
            placeholder="e.g. Spoke with Chase — following up Friday. Interested in $150/mo plan."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: '#ffffff', caretColor: '#00FFB2' }}
          />
        </div>
      </div>

      {/* Pipeline Status */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#6060a0' }}>Pipeline Stage</p>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button key={s.key} onClick={() => updateStatus(s.key)}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: status === s.key ? s.bg : '#1a1a2e',
                color: status === s.key ? s.color : '#4a4a6a',
                border: `2px solid ${status === s.key ? s.color : '#2a2a45'}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Info */}
      <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#6060a0' }}>Business Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Business Name" value={profile.business_name} onChange={(v) => set('business_name', v)} />
          <Field label="Owner Name" value={profile.owner_name} onChange={(v) => set('owner_name', v)} />
          <Field label="Phone" value={profile.phone} onChange={(v) => set('phone', v)} />
          <Field label="Email" value={profile.email} onChange={(v) => set('email', v)} />
          <Field label="City" value={profile.city} onChange={(v) => set('city', v)} />
          <Field label="Niche / Industry" value={profile.niche} onChange={(v) => set('niche', v)} />
          <div className="sm:col-span-2">
            <Field label="Address" value={profile.address} onChange={(v) => set('address', v)} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Tagline" value={profile.tagline} onChange={(v) => set('tagline', v)} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Services" value={profile.services} onChange={(v) => set('services', v)} multiline rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Hours" value={profile.hours} onChange={(v) => set('hours', v)} multiline rows={2} />
          </div>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <h3 className="sm:col-span-2 text-xs font-medium uppercase tracking-wider" style={{ color: '#6060a0' }}>Links & Socials</h3>
          <Field label="Google Maps URL" value={profile.google_maps_url} onChange={(v) => set('google_maps_url', v)} mono />
          <Field label="Facebook URL" value={profile.facebook_url} onChange={(v) => set('facebook_url', v)} mono />
          <Field label="Instagram URL" value={profile.instagram_url} onChange={(v) => set('instagram_url', v)} mono />
          <Field label="Yelp URL" value={profile.yelp_url} onChange={(v) => set('yelp_url', v)} mono />
          <div className="sm:col-span-2">
            <Field label="Existing Website" value={profile.website_url} onChange={(v) => set('website_url', v)} mono />
          </div>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 text-xs font-medium uppercase tracking-wider" style={{ color: '#6060a0' }}>Brand Colors</h3>
          <div>
            <label className="block text-xs mb-2" style={labelStyle}>Primary Color</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={profile.primary_color}
                onChange={(e) => set('primary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <input value={profile.primary_color} onChange={(e) => set('primary_color', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-2" style={labelStyle}>Secondary Color</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={profile.secondary_color}
                onChange={(e) => set('secondary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <input value={profile.secondary_color} onChange={(e) => set('secondary_color', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Client Billing — only when Active or Closed */}
      {isClient && (
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #a78bfa' }}>
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#a78bfa' }}>Client Billing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Monthly Recurring ($)</label>
              <input type="number" value={profile.mrr} onChange={(e) => set('mrr', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>One-Time Fee ($)</label>
              <input type="number" value={profile.one_time_fee} onChange={(e) => set('one_time_fee', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input type="checkbox" id="fee_collected" checked={profile.fee_collected}
                onChange={(e) => set('fee_collected', e.target.checked)}
                className="w-4 h-4 rounded" />
              <label htmlFor="fee_collected" className="text-sm cursor-pointer" style={{ color: '#a0a0c0' }}>
                One-time fee collected
              </label>
            </div>
            {siteUrl && (
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1" style={labelStyle}>Live Site URL</label>
                <div className="flex gap-2 items-center">
                  <input value={siteUrl} readOnly className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none" style={inputStyle} />
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}>↗</a>
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label="Client Notes" value={profile.client_notes} onChange={(v) => set('client_notes', v)} multiline rows={3} />
            </div>
          </div>
        </div>
      )}

      {/* Meeting Notes — visible from Booked onward */}
      {isBooked && (
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: `1px solid ${profile.meeting_done ? '#00FFB2' : '#3a3a5c'}` }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: '#ffffff' }}>Meeting Notes</h2>
              <p className="text-xs mt-1" style={{ color: '#6060a0' }}>Log what happened in your meeting — objections, interest level, follow-up plan.</p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => set('meeting_done', !profile.meeting_done)}
                className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ backgroundColor: profile.meeting_done ? '#00FFB2' : '#3a3a5c' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                  style={{ backgroundColor: '#ffffff', left: profile.meeting_done ? '22px' : '4px', transition: 'left 0.15s' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: profile.meeting_done ? '#00FFB2' : '#6060a0' }}>
                {profile.meeting_done ? 'Meeting done ✓' : 'Mark complete'}
              </span>
            </label>
          </div>
          <textarea
            value={profile.meeting_notes}
            onChange={(e) => set('meeting_notes', e.target.value)}
            rows={5}
            placeholder="e.g. Spoke with John — very interested, just needs to check with his partner. Follow up Friday. Budget around $150/mo."
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
            style={{ ...inputStyle, lineHeight: '1.6' }}
          />
        </div>
      )}

      {/* Research Dump */}
      <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
        <div>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Research</h2>
          <p className="text-xs mt-1" style={{ color: '#6060a0' }}>Paste anything — links, copy-pasted reviews, notes, hours. AI will extract the fields above.</p>
        </div>
        <textarea
          value={profile.research_notes}
          onChange={(e) => set('research_notes', e.target.value)}
          rows={8}
          placeholder="Paste everything you found — Google Maps link, Facebook, reviews, phone, hours, services…"
          className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y font-mono"
          style={{ ...inputStyle, lineHeight: '1.6' }}
        />

        {/* File Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 p-6"
          style={{ border: `2px dashed ${dragging ? '#00FFB2' : '#3a3a5c'}`, backgroundColor: dragging ? '#0d1a14' : '#1a1a2e' }}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          <span className="text-xl">📁</span>
          <p className="text-sm" style={{ color: '#a0a0c0' }}>{uploading ? 'Uploading…' : 'Drop logos & photos here or click to browse'}</p>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {files.map((f) => (
              <div key={f.path} className="relative group rounded-lg overflow-hidden" style={{ aspectRatio: '1', backgroundColor: '#1a1a2e' }}>
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                <button onClick={() => removeFile(f)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={processWithAI} disabled={processing || !profile.research_notes.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
            {processing ? '✨ Reading everything…' : '✨ Process with AI'}
          </button>
        </div>
      </div>

      {/* Reviews */}
      {profile.reviews.length > 0 && (
        <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#6060a0' }}>Reviews ({profile.reviews.length})</h2>
          {profile.reviews.map((rev, i) => (
            <div key={i} className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: '#fbbf24' }}>{'⭐'.repeat(rev.rating)}</span>
                <span className="font-medium" style={{ color: '#ffffff' }}>{rev.name}</span>
              </div>
              <p style={{ color: '#a0a0c0' }}>{rev.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Generate Website */}
      <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#1a0d2e', border: '2px solid #7c3aed' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold" style={{ color: '#ffffff' }}>Generate Website</h2>
            <p className="text-xs mt-1" style={{ color: '#a0a0c0' }}>Saves profile first, then Claude builds and deploys a custom site.</p>
          </div>
          <button onClick={generateSite} disabled={generating}
            className="px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
            {generating ? '⚙️ Generating…' : '🚀 Generate Site'}
          </button>
        </div>
        {genLogs.length > 0 && (
          <div ref={genLogRef} className="p-4 rounded-lg font-mono text-xs overflow-y-auto"
            style={{ backgroundColor: '#0f0812', color: '#94a3b8', maxHeight: '200px', border: '1px solid #4c1d95' }}>
            {genLogs.map((l, i) => (
              <div key={i} style={{ color: l.startsWith('✅') || l.includes('✓') ? '#00FFB2' : l.startsWith('❌') ? '#ef4444' : l.startsWith('   ') ? '#c4b5fd' : '#94a3b8' }}>{l}</div>
            ))}
            {generating && <div style={{ color: '#a78bfa' }}>▋</div>}
          </div>
        )}
        {siteUrl && (
          <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#0d1a0d', border: '1px solid #00FFB2' }}>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#00FFB2' }}>Site is live!</p>
              <p className="text-sm font-mono" style={{ color: '#ffffff' }}>{siteUrl}</p>
            </div>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold ml-4 flex-shrink-0"
              style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}>View Site ↗</a>
          </div>
        )}
      </div>
    </div>
  )
}
