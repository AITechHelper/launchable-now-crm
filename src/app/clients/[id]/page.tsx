import { createServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import ClientDetail from './ClientDetail'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) {
    notFound()
  }

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <Nav />
      <ClientDetail client={client} />
    </div>
  )
}
