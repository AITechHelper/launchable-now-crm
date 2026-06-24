import Nav from '@/components/Nav'
import NotesClient from './NotesClient'

export default function NotesPage() {
  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <NotesClient />
    </div>
  )
}
