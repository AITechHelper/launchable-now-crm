'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Link from 'next/link'

const STATUSES = ['Prospect', 'Demo Booked', 'Closed', 'Active', 'Churned']
const NICHES = ['Plumber', 'Roofer', 'HVAC', 'Landscaper', 'Electrician', 'Painter', 'Pest Control', 'Cleaning', 'Other']

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    niche: '',
    status: 'Prospect',
    one_time_fee_collected: false,
    one_time_fee_amount: '',
    monthly_recurring: '',
    demo_site_url: '',
    live_site_url: '',
    domain: '',
    vercel_project_name: '',
    google_drive_url: '',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        one_time_fee_amount: form.one_time_fee_amount ? parseFloat(form.one_time_fee_amount) : null,
        monthly_recurring: form.monthly_recurring ? parseFloat(form.monthly_recurring) : null,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/clients/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create client')
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#08080F',
    border: '1px solid #1E1E32',
    color: '#F0F0FF',
  }

  const labelStyle = { color: '#5A5A7A' }

  return (
    <div style={{ backgroundColor: '#08080F', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/clients" className="text-sm" style={{ color: '#5A5A7A' }}>← Clients</Link>
          <h1 className="text-2xl font-bold" style={{ color: '#F0F0FF' }}>Add New Client</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
            <h2 className="font-semibold" style={{ color: '#F0F0FF' }}>Business Info</h2>
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

          <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
            <h2 className="font-semibold" style={{ color: '#F0F0FF' }}>Financials</h2>
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
                  onChange={handleChange} id="fee_collected" className="rounded" />
                <label htmlFor="fee_collected" className="text-sm" style={labelStyle}>One-Time Fee Collected</label>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
            <h2 className="font-semibold" style={{ color: '#F0F0FF' }}>Website & Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={labelStyle}>Demo Site URL</label>
                <input name="demo_site_url" value={form.demo_site_url} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={labelStyle}>Live Site URL</label>
                <input name="live_site_url" value={form.live_site_url} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="https://" />
              </div>
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
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1" style={labelStyle}>Google Drive URL</label>
                <input name="google_drive_url" value={form.google_drive_url} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="https://drive.google.com/..." />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#10101C', border: '1px solid #1E1E32' }}>
            <h2 className="font-semibold" style={{ color: '#F0F0FF' }}>Notes</h2>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={4}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} placeholder="Any additional notes..." />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: '#00FFB2', color: '#08080F' }}>
              {loading ? 'Saving...' : 'Add Client'}
            </button>
            <Link href="/clients" className="px-6 py-2 rounded-lg font-medium text-sm"
              style={{ backgroundColor: '#1E1E32', color: '#F0F0FF' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
