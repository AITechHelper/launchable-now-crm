'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password === 'launchable2024') {
      document.cookie = 'launchable_auth=authenticated; path=/; max-age=2592000'
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#00FFB2' }}>Launchable Now</h1>
          <p style={{ color: '#a0a0c0' }}>CRM Dashboard</p>
        </div>

        <div className="rounded-xl p-8" style={{ backgroundColor: '#252540', border: '1px solid #3a3a5c' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#a0a0c0' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #3a3a5c',
                  color: '#ffffff',
                }}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#00FFB2', color: '#1a1a2e' }}
            >
              {loading ? 'Entering...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
