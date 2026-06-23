'use client'

import { useState, useRef, useCallback } from 'react'
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
  created_at: string
}

type UploadedFile = { url: string; path: string; name: string }

type Extracted = Partial<{
  business_name: string
  phone: string
  email: string
  address: string
  city: string
  owner_name: string
  tagline: string
  services: string
  hours: string
  google_maps_url: string
  facebook_url: string
  instagram_url: string
  yelp_url: string
  website_url: string
  primary_color: string
  secondary_color: string
  reviews: Review[]
  research_notes: string
}>

const STATUS_LABELS: Record<string, string> = { new: 'New', called: 'Called', booked: 'Booked' }
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:    { bg: '#1e3a5f', color: '#60a5fa' },
  called: { bg: '#3a2e00', color: '#fbbf24' },
  booked: { bg: '#0d3320', color: '#00FFB2' },
}

const inputStyle = { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' }
const labelStyle = { color: '#a0a0c0' }

export default function LeadDetail({ lead }: { lead: Lead }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const [status, setStatus] = useState(lead.status || 'new')
  const [dump, setDump] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const sc = STATUS_COLORS[status] || { bg: '#252540', color: '#a0a0c0' }

  async function uploadFiles(fileList: FileList) {
    setUploading(true)
    const uploaded: UploadedFile[] = []
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('leadId', lead.id)
      fd.append('file', file)
      const res = await fetch('/api/leads/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        uploaded.push(data)
      }
    }
    setFiles((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) await uploadFiles(e.dataTransfer.files)
  }, [lead.id])

  async function removeFile(f: UploadedFile) {
    await fetch('/api/leads/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: f.path }),
    })
    setFiles((prev) => prev.filter((x) => x.path !== f.path))
  }

  async function processWithAI() {
    setProcessing(true)
    setExtracted(null)
    const res = await fetch('/api/leads/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dump,
        imageUrls: files.map((f) => f.url),
        businessName: lead.business_name,
      }),
    })
    const data = await res.json()
    setProcessing(false)
    if (data.extracted) setExtracted(data.extracted)
    else alert(data.error || 'AI processing failed')
  }

  async function saveExtracted() {
    if (!extracted) return
    setSaving(true)
    const payload: Record<string, unknown> = { status }
    const fields: (keyof Extracted)[] = [
      'business_name','phone','email','address','city','owner_name',
      'tagline','services','hours','google_maps_url','facebook_url',
      'instagram_url','yelp_url','website_url','primary_color','secondary_color',
      'reviews','research_notes',
    ]
    for (const f of fields) {
      if (extracted[f] !== null && extracted[f] !== undefined) payload[f] = extracted[f]
    }
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${lead.business_name}"? This cannot be undone.`)) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/leads')
  }

  function Field({ label, value, onChange, multiline, rows }: {
    label: string; value: string; onChange: (v: string) => void
    multiline?: boolean; rows?: number
  }) {
    if (multiline) return (
      <div>
        <label className="block text-xs mb-1" style={labelStyle}>{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 2}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y" style={inputStyle} />
      </div>
    )
    return (
      <div>
        <label className="block text-xs mb-1" style={labelStyle}>{label}</label>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/leads" className="text-sm" style={{ color: '#a0a0c0' }}>← Leads</Link>
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{lead.business_name}</h1>
          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
        <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: '#3D1B1B', color: '#FF6666' }}>
          Delete
        </button>
      </div>

      <div className="space-y-6">

        {/* Pipeline Status */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Pipeline Status</h2>
          <div className="flex gap-3">
            {['new', 'called', 'booked'].map((s) => {
              const c = STATUS_COLORS[s]
              const isActive = status === s
              return (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? c.bg : '#1a1a2e',
                    color: isActive ? c.color : '#6060a0',
                    border: `2px solid ${isActive ? c.color : '#3a3a5c'}`,
                  }}>
                  {STATUS_LABELS[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Research Dump */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <div>
            <h2 className="font-semibold" style={{ color: '#ffffff' }}>Research Dump</h2>
            <p className="text-sm mt-1" style={{ color: '#a0a0c0' }}>
              Paste anything — their website URL, Google Maps link, Instagram, copy-pasted reviews, phone number, services, hours, notes. Dump it all in here.
            </p>
          </div>

          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            rows={10}
            placeholder={`Paste everything you found. Examples:\n\nhttps://facebook.com/austinplumbing\nhttps://maps.google.com/...\n(512) 555-0123\nMon-Fri 7am-6pm, Sat 8am-2pm\nServices: leak repair, water heaters, drain cleaning\n"Best plumber in Austin!" - Sarah M.\n"Fixed our broken pipe same day" - John D. ⭐⭐⭐⭐⭐\nIn business since 2008, family owned`}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y font-mono"
            style={{ ...inputStyle, lineHeight: '1.6' }}
          />

          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 p-8"
            style={{
              border: `2px dashed ${dragging ? '#00FFB2' : '#3a3a5c'}`,
              backgroundColor: dragging ? '#0d1a14' : '#1a1a2e',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            <span className="text-2xl">📁</span>
            <p className="text-sm font-medium" style={{ color: '#a0a0c0' }}>
              {uploading ? 'Uploading…' : 'Drop images here or click to browse'}
            </p>
            <p className="text-xs" style={{ color: '#6060a0' }}>Logos, photos, screenshots, truck wraps — anything visual</p>
          </div>

          {/* Uploaded files grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {files.map((f) => (
                <div key={f.path} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: '1', backgroundColor: '#1a1a2e' }}>
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(f)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#a0a0c0' }}>
                    {f.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Process button */}
          <button
            onClick={processWithAI}
            disabled={processing || (!dump.trim() && files.length === 0)}
            className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          >
            {processing ? '✨ Claude is reading everything…' : '✨ Process with AI'}
          </button>
        </div>

        {/* Extracted Data Preview */}
        {extracted && (
          <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#0d1a0d', border: '2px solid #00FFB2' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold" style={{ color: '#00FFB2' }}>AI Extracted — Review & Save</h2>
                <p className="text-xs mt-1" style={{ color: '#a0a0c0' }}>Edit anything before saving to the lead record.</p>
              </div>
              <button
                onClick={saveExtracted}
                disabled={saving}
                className="px-6 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}
              >
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save to Lead'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Business Name" value={extracted.business_name || ''} onChange={(v) => setExtracted((e) => ({ ...e, business_name: v }))} />
              <Field label="Owner Name" value={extracted.owner_name || ''} onChange={(v) => setExtracted((e) => ({ ...e, owner_name: v }))} />
              <Field label="Phone" value={extracted.phone || ''} onChange={(v) => setExtracted((e) => ({ ...e, phone: v }))} />
              <Field label="Email" value={extracted.email || ''} onChange={(v) => setExtracted((e) => ({ ...e, email: v }))} />
              <Field label="City" value={extracted.city || ''} onChange={(v) => setExtracted((e) => ({ ...e, city: v }))} />
              <Field label="Tagline" value={extracted.tagline || ''} onChange={(v) => setExtracted((e) => ({ ...e, tagline: v }))} />
              <div className="sm:col-span-2">
                <Field label="Address" value={extracted.address || ''} onChange={(v) => setExtracted((e) => ({ ...e, address: v }))} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Services" value={extracted.services || ''} onChange={(v) => setExtracted((e) => ({ ...e, services: v }))} multiline rows={2} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Hours" value={extracted.hours || ''} onChange={(v) => setExtracted((e) => ({ ...e, hours: v }))} multiline rows={3} />
              </div>
              <Field label="Google Maps URL" value={extracted.google_maps_url || ''} onChange={(v) => setExtracted((e) => ({ ...e, google_maps_url: v }))} />
              <Field label="Facebook URL" value={extracted.facebook_url || ''} onChange={(v) => setExtracted((e) => ({ ...e, facebook_url: v }))} />
              <Field label="Instagram URL" value={extracted.instagram_url || ''} onChange={(v) => setExtracted((e) => ({ ...e, instagram_url: v }))} />
              <Field label="Yelp URL" value={extracted.yelp_url || ''} onChange={(v) => setExtracted((e) => ({ ...e, yelp_url: v }))} />
              <Field label="Existing Website" value={extracted.website_url || ''} onChange={(v) => setExtracted((e) => ({ ...e, website_url: v }))} />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-2" style={labelStyle}>Primary Color</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={extracted.primary_color || '#22c55e'}
                    onChange={(e) => setExtracted((x) => ({ ...x, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input value={extracted.primary_color || ''} onChange={(e) => setExtracted((x) => ({ ...x, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2" style={labelStyle}>Secondary Color</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={extracted.secondary_color || '#166534'}
                    onChange={(e) => setExtracted((x) => ({ ...x, secondary_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input value={extracted.secondary_color || ''} onChange={(e) => setExtracted((x) => ({ ...x, secondary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
                </div>
              </div>
            </div>
            {(extracted.primary_color || extracted.secondary_color) && (
              <div className="rounded-lg p-4 flex items-center gap-4"
                style={{ backgroundColor: extracted.primary_color || '#22c55e' }}>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: extracted.secondary_color || '#166534' }} />
                <span className="font-bold text-white text-sm">{extracted.business_name || lead.business_name}</span>
              </div>
            )}

            {/* Reviews */}
            {extracted.reviews && extracted.reviews.length > 0 && (
              <div>
                <label className="block text-xs mb-2" style={labelStyle}>Reviews ({extracted.reviews.length} found)</label>
                <div className="space-y-2">
                  {extracted.reviews.map((rev, i) => (
                    <div key={i} className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: '#fbbf24' }}>{'⭐'.repeat(rev.rating)}</span>
                        <span className="font-medium" style={{ color: '#ffffff' }}>{rev.name}</span>
                      </div>
                      <p style={{ color: '#a0a0c0' }}>{rev.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Notes */}
            <Field label="Research Notes" value={extracted.research_notes || ''} onChange={(v) => setExtracted((e) => ({ ...e, research_notes: v }))} multiline rows={4} />
          </div>
        )}

        {/* Generate Website */}
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1a0d2e', border: '2px solid #7c3aed' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: '#ffffff' }}>Generate Website</h2>
              <p className="text-sm mt-1" style={{ color: '#a0a0c0' }}>
                Process your research above and save it, then generate a custom site and deploy to Vercel.
              </p>
            </div>
            <button disabled
              className="px-6 py-3 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed"
              style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
              🚀 Generate Site
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: '#6060a0' }}>
            Coming soon — requires ANTHROPIC_API_KEY and GITHUB_TOKEN in your environment.
          </p>
        </div>

      </div>
    </div>
  )
}
