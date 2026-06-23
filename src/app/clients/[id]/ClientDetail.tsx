'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { Client } from '@/lib/supabase'

const STATUSES = ['Prospect', 'Demo Booked', 'Closed', 'Active', 'Churned']
const NICHES = ['Plumber', 'Roofer', 'HVAC', 'Landscaper', 'Electrician', 'Painter', 'Pest Control', 'Cleaning', 'Other']

export default function ClientDetail({ client }: { client: Client }) {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: client.business_name || '',
    owner_name: client.owner_name || '',
    phone: client.phone || '',
    email: client.email || '',
    city: client.city || '',
    state: client.state || '',
    niche: client.niche || '',
    status: client.status || 'Prospect',
    one_time_fee_collected: client.one_time_fee_collected || false,
    one_time_fee_amount: client.one_time_fee_amount?.toString() || '',
    monthly_recurring: client.monthly_recurring?.toString() || '',
    demo_site_url: client.demo_site_url || '',
    live_site_url: client.live_site_url || '',
    domain: client.domain || '',
    vercel_project_name: client.vercel_project_name || '',
    google_drive_url: client.google_drive_url || '',
    zoom_link: (client as any).zoom_link || '',
    meeting_time: (client as any).meeting_time || '',
    stripe_payment_link: (client as any).stripe_payment_link || '',
    agreement_link: (client as any).agreement_link || '',
    onboarding_form_link: (client as any).onboarding_form_link || '',
    call_script: (client as any).call_script || '',
    notes: client.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        one_time_fee_amount: form.one_time_fee_amount ? parseFloat(form.one_time_fee_amount) : null,
        monthly_recurring: form.monthly_recurring ? parseFloat(form.monthly_recurring) : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${client.business_name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    router.push('/clients')
  }

  const inputStyle = { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' }
  const labelStyle = { color: '#a0a0c0' }

  function LinkField({ label, name, value }: { label: string; name: string; value: string }) {
    return (
      <div>
        <label className="block text-sm mb-1" style={labelStyle}>{label}</label>
        <div className="flex gap-2">
          <input name={name} value={value} onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="https://" />
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients" className="text-sm" style={{ color: '#a0a0c0' }}>← Clients</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{client.business_name}</h1>
          <StatusBadge status={form.status} />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Business Info */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Business Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Business Name *</label>
              <input name="business_name" value={form.business_name} onChange={handleChange} required
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Owner Name</label>
              <input name="owner_name" value={form.owner_name} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>City</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>State</label>
              <input name="state" value={form.state} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Niche</label>
              <select name="niche" value={form.niche} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="">Select niche...</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Financials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>One-Time Fee Amount ($)</label>
              <input name="one_time_fee_amount" type="number" step="0.01" value={form.one_time_fee_amount} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Monthly Recurring ($)</label>
              <input name="monthly_recurring" type="number" step="0.01" value={form.monthly_recurring} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="0.00" />
            </div>
            <div className="flex items-center gap-3">
              <input name="one_time_fee_collected" type="checkbox" checked={form.one_time_fee_collected}
                onChange={handleChange} id="fee_collected_edit" className="rounded w-4 h-4" />
              <label htmlFor="fee_collected_edit" className="text-sm" style={labelStyle}>One-Time Fee Collected</label>
            </div>
          </div>
        </div>

        {/* Sales Call */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Sales Call</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Meeting Date & Time</label>
              <input name="meeting_time" value={form.meeting_time} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle}
                placeholder="e.g. Tue Jun 25 @ 2:00 PM CST" />
            </div>
            <div className="sm:col-span-1">
              <LinkField label="Zoom Link" name="zoom_link" value={form.zoom_link} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1" style={labelStyle}>Call Script / Talking Points</label>
            <textarea name="call_script" value={form.call_script} onChange={handleChange} rows={6}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
              style={inputStyle} placeholder="Write your call script, objection handling, talking points..." />
          </div>
        </div>

        {/* Payment & Onboarding */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Payment & Onboarding</h2>
          <div className="space-y-4">
            <LinkField label="Stripe Payment Link" name="stripe_payment_link" value={form.stripe_payment_link} />
            <LinkField label="Agreement / Contract Link" name="agreement_link" value={form.agreement_link} />
            <LinkField label="Onboarding Form Link" name="onboarding_form_link" value={form.onboarding_form_link} />
          </div>
        </div>

        {/* Website & Links */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Website & Links</h2>
          <div className="space-y-4">
            <LinkField label="Demo Site URL" name="demo_site_url" value={form.demo_site_url} />
            <LinkField label="Live Site URL" name="live_site_url" value={form.live_site_url} />
            <LinkField label="Google Drive Folder" name="google_drive_url" value={form.google_drive_url} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Domain</label>
              <input name="domain" value={form.domain} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="example.com" />
            </div>
            <div>
              <label className="block text-sm mb-1" style={labelStyle}>Vercel Project Name</label>
              <input name="vercel_project_name" value={form.vercel_project_name} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Notes</h2>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={8}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
            style={inputStyle} placeholder="General notes, follow-ups, context about the client..." />
        </div>

        {/* Dates */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <div className="flex gap-8 text-sm">
            <div>
              <span style={{ color: '#a0a0c0' }}>Date Added</span>
              <p style={{ color: '#ffffff' }}>{new Date(client.date_added).toLocaleDateString()}</p>
            </div>
            {client.date_closed && (
              <div>
                <span style={{ color: '#a0a0c0' }}>Date Closed</span>
                <p style={{ color: '#ffffff' }}>{new Date(client.date_closed).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pb-8">
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#00FFB2', color: '#1a1a2e' }}>
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
            </button>
            <Link href="/clients" className="px-6 py-2 rounded-lg font-medium text-sm"
              style={{ backgroundColor: '#3a3a5c', color: '#ffffff' }}>
              Cancel
            </Link>
          </div>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            style={{ backgroundColor: '#3D1B1B', color: '#FF6666' }}>
            {deleting ? 'Deleting...' : 'Delete Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
