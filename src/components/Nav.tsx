'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/clients', label: 'Clients' },
  ]

  return (
    <nav className="border-b" style={{ backgroundColor: '#252540', borderColor: '#3a3a5c' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold" style={{ color: '#00FFB2' }}>Launchable Now</span>
            <div className="flex gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? '#3a3a5c' : 'transparent',
                      color: isActive ? '#ffffff' : '#a0a0c0',
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#a0a0c0' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
