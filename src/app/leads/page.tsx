import Nav from '@/components/Nav'
import LeadsPageClient from './LeadsPageClient'

export default function LeadsPage() {
  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeadsPageClient />
      </div>
    </div>
  )
}
