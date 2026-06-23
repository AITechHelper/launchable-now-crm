'use client'

import { useState } from 'react'
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
  created_at: string
}

const STATUS_LABELS: Record<string, string> = { new: 'New', called: 'Called', booked: 'Booked' }
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:    { bg: '#1e3a5f', color: '#60a5fa' },
  called: { bg: '#3a2e00', color: '#fbbf24' },
  booked: { bg: '#0d3320', color: '#00FFB2' },
}

export default function LeadDetail({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: lead.business_name || '',
    phone: lead.phone || '',
    city: lead.city || '',
    niche: lead.niche || '',
    status: lead.status || 'new',
    owner_name: lead.owner_name || '',
    email: lead.email || '',
    address: lead.address || '',
    facebook_url: lead.facebook_url || '',
    instagram_url: lead.instagram_url || '',
    google_maps_url: lead.google_maps_url || '',
    yelp_url: lead.yelp_url || '',
    services: lead.services || '',
    primary_color: lead.primary_color || '#22c55e',
    secondary_color: lead.secondary_color || '#166534',
    tagline: lead.tagline || '',
    hours: lead.hours || '',
    research_notes: lead.research_notes || '',
  })
  const [reviews, setReviews] = useState<Review[]>(lead.reviews || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const inputStyle = { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' }
  const labelStyle = { color: '#a0a0c0' }
  const sc = STATUS_COLORS[form.status] || { bg: '#252540', color: '#a0a0c0' }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function addReview() {
    setReviews((r) => [...r, { name: '', rating: 5, text: '' }])
  }

  function updateReview(i: number, field: keyof Review, value: string | number) {
    setReviews((r) => r.map((rev, idx) => idx === i ? { ...rev, [field]: value } : rev))
  }

  function removeReview(i: number) {
    setReviews((r) => r.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reviews }),
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

  function LinkField({ label, name, value, placeholder }: { label: string; name: string; value: string; placeholder?: string }) {
    return (
      <div>
        <label className="block text-sm mb-1" style={labelStyle}>{label}</label>
        <div className="flex gap-2">
          <input name={name} value={value} onChange={handleChange} placeholder={placeholder || 'https://'}
            className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          {value && (
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0"
              style={{ backgroundColor: '#3a3a5c', color: '#00FFB2' }}>
              Open ↗
            </a>
          )}
        </div>
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
            {STATUS_LABELS[form.status] || form.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            style={{ backgroundColor: '#00FFB2', color: '#1a1a2e' }}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
          </button>
          <button onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: '#3D1B1B', color: '#FF6666' }}>
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* Status + Pipeline */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Pipeline Status</h2>
          <div className="flex gap-3">
            {['new', 'called', 'booked'].map((s) => {
              const c = STATUS_COLORS[s]
              const isActive = form.status === s
              return (
                <button key={s} onClick={() => setForm((f) => ({ ...f, status: s }))}
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
          {form.status === 'booked' && (
            <div className="mt-2 p-3 rounded-lg text-sm" style={{ backgroundColor: '#0d3320', color: '#00FFB2', border: '1px solid #00FFB2' }}>
              🎉 Meeting booked! Fill in the research below, then generate their website.
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Business Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Business Name', name: 'business_name' },
              { label: 'Owner Name', name: 'owner_name' },
              { label: 'Phone', name: 'phone' },
              { label: 'Email', name: 'email' },
              { label: 'City', name: 'city' },
              { label: 'Niche', name: 'niche' },
              { label: 'Address', name: 'address' },
            ].map(({ label, name }) => (
              <div key={name} className={name === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm mb-1" style={labelStyle}>{label}</label>
                <input name={name} value={(form as any)[name]} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* Online Presence */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Online Presence</h2>
          <div className="space-y-3">
            <LinkField label="Google Maps / Google Business" name="google_maps_url" value={form.google_maps_url} />
            <LinkField label="Facebook" name="facebook_url" value={form.facebook_url} />
            <LinkField label="Instagram" name="instagram_url" value={form.instagram_url} />
            <LinkField label="Yelp" name="yelp_url" value={form.yelp_url} />
          </div>
        </div>

        {/* Services */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Services & Hours</h2>
          <div>
            <label className="block text-sm mb-1" style={labelStyle}>Services Offered</label>
            <textarea name="services" value={form.services} onChange={handleChange} rows={4}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y" style={inputStyle}
              placeholder="List their services, one per line or comma-separated…" />
          </div>
          <div>
            <label className="block text-sm mb-1" style={labelStyle}>Business Hours</label>
            <textarea name="hours" value={form.hours} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y" style={inputStyle}
              placeholder="Mon–Fri: 8am–6pm&#10;Sat: 9am–4pm&#10;Sun: Closed" />
          </div>
          <div>
            <label className="block text-sm mb-1" style={labelStyle}>Tagline / Slogan</label>
            <input name="tagline" value={form.tagline} onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle}
              placeholder="e.g. Austin's Most Trusted Plumber" />
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: '#ffffff' }}>Customer Reviews</h2>
            <button onClick={addReview}
              className="text-sm px-3 py-1 rounded-lg font-medium"
              style={{ backgroundColor: '#1a1a2e', color: '#00FFB2', border: '1px solid #3a3a5c' }}>
              + Add Review
            </button>
          </div>
          {reviews.length === 0 && (
            <p className="text-sm" style={{ color: '#6060a0' }}>No reviews yet. Add some from their Google or Yelp page.</p>
          )}
          {reviews.map((rev, i) => (
            <div key={i} className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
              <div className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Reviewer Name</label>
                    <input value={rev.name} onChange={(e) => updateReview(i, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}
                      placeholder="John D." />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Rating</label>
                    <select value={rev.rating} onChange={(e) => updateReview(i, 'rating', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                      {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeReview(i)} className="mt-5 text-sm px-2 py-1 rounded" style={{ color: '#ef4444' }}>✕</button>
              </div>
              <div>
                <label className="block text-xs mb-1" style={labelStyle}>Review Text</label>
                <textarea value={rev.text} onChange={(e) => updateReview(i, 'text', e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y" style={inputStyle}
                  placeholder="Paste the review here…" />
              </div>
            </div>
          ))}
        </div>

        {/* Branding */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Website Branding</h2>
          <p className="text-sm" style={{ color: '#a0a0c0' }}>Pick colors for their website. Check their Facebook or truck wrap for brand colors.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={labelStyle}>Primary Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" name="primary_color" value={form.primary_color} onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                <input name="primary_color" value={form.primary_color} onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2" style={labelStyle}>Secondary Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" name="secondary_color" value={form.secondary_color} onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                <input name="secondary_color" value={form.secondary_color} onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
              </div>
            </div>
          </div>
          {/* Color preview */}
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: form.primary_color }}>
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: form.secondary_color }} />
            <span className="font-bold text-white text-sm">{form.business_name || 'Business Name'}</span>
          </div>
        </div>

        {/* Research Notes */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold" style={{ color: '#ffffff' }}>Research Notes</h2>
          <textarea name="research_notes" value={form.research_notes} onChange={handleChange} rows={5}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y" style={inputStyle}
            placeholder="Anything else you found — awards, years in business, certifications, area they serve, anything Claude should know when writing the website copy…" />
        </div>

        {/* Generate Website */}
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1a0d2e', border: '2px solid #7c3aed' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: '#ffffff' }}>Generate Website</h2>
              <p className="text-sm mt-1" style={{ color: '#a0a0c0' }}>
                Save your research above, then click to let Claude build a custom website and deploy it to Vercel.
              </p>
            </div>
            <button
              disabled
              className="px-6 py-3 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed"
              style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
            >
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
