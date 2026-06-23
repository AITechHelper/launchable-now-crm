'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SavedLink = { id: string; label: string; url: string }
type ClientFile = { id: string; file_name: string; file_path: string; file_size: number | null; created_at: string }

const s = {
  surface: { backgroundColor: '#252540', border: '1px solid #3a3a5c' },
  input: { backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c', color: '#ffffff' },
  muted: { color: '#a0a0c0' },
  white: { color: '#ffffff' },
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return '🖼️'
  if (['pdf'].includes(ext || '')) return '📄'
  if (['doc', 'docx'].includes(ext || '')) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊'
  if (['zip', 'rar'].includes(ext || '')) return '🗜️'
  if (['mp4', 'mov', 'avi'].includes(ext || '')) return '🎥'
  return '📎'
}

export default function Workspace({ clientId, initialNotes, initialLinks }: {
  clientId: string
  initialNotes: string
  initialLinks: SavedLink[]
}) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [links, setLinks] = useState<SavedLink[]>(initialLinks || [])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const [files, setFiles] = useState<ClientFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    const { data } = await supabase
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value)
    setNotesSaved(false)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => saveNotes(e.target.value), 1200)
  }

  async function saveNotes(value: string) {
    setNotesSaving(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: value }),
    })
    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  async function saveLinks(updated: SavedLink[]) {
    setLinks(updated)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved_links: updated }),
    })
  }

  function addLink() {
    if (!newLinkUrl.trim()) return
    const url = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
    const link: SavedLink = {
      id: crypto.randomUUID(),
      label: newLinkLabel.trim() || url,
      url,
    }
    saveLinks([...links, link])
    setNewLinkLabel('')
    setNewLinkUrl('')
  }

  function removeLink(id: string) {
    saveLinks(links.filter((l) => l.id !== id))
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)

    for (const file of Array.from(fileList)) {
      const path = `${clientId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('client-files').upload(path, file)
      if (!error) {
        await supabase.from('client_files').insert({
          client_id: clientId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
        })
      }
    }

    setUploading(false)
    loadFiles()
  }

  async function deleteFile(file: ClientFile) {
    await supabase.storage.from('client-files').remove([file.file_path])
    await supabase.from('client_files').delete().eq('id', file.id)
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
  }

  async function getFileUrl(path: string) {
    const { data } = await supabase.storage.from('client-files').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }, [clientId])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  return (
    <div className="space-y-6">

      {/* Notes */}
      <div className="rounded-xl p-6" style={s.surface}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg" style={s.white}>Notes & Details</h2>
          <span className="text-xs" style={{ color: notesSaved ? '#00FFB2' : '#6060a0' }}>
            {notesSaving ? 'Saving...' : notesSaved ? 'Saved ✓' : 'Auto-saves as you type'}
          </span>
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          rows={12}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y leading-relaxed"
          style={s.input}
          placeholder={`Use this space for anything:\n\n• Call notes and scripts\n• Client details and preferences\n• Follow-up reminders\n• Meeting notes\n• Objections and how you handled them\n• Anything else...`}
        />
      </div>

      {/* Saved Links */}
      <div className="rounded-xl p-6" style={s.surface}>
        <h2 className="font-semibold text-lg mb-4" style={s.white}>Saved Links</h2>

        {/* Add link form */}
        <div className="flex gap-2 mb-4">
          <input
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            placeholder="Label (optional)"
            className="px-3 py-2 rounded-lg text-sm outline-none w-40 flex-shrink-0"
            style={s.input}
          />
          <input
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder="Paste a URL..."
            className="px-3 py-2 rounded-lg text-sm outline-none flex-1"
            style={s.input}
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
          />
          <button
            onClick={addLink}
            className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: '#00FFB2', color: '#1a1a2e' }}
          >
            Add
          </button>
        </div>

        {/* Links list */}
        {links.length === 0 ? (
          <p className="text-sm" style={s.muted}>No links saved yet. Paste a Zoom link, Stripe link, Google Drive, agreement, etc.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
                <span className="text-base">🔗</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm truncate hover:underline"
                  style={{ color: '#00FFB2' }}
                >
                  {link.label}
                </a>
                <button
                  onClick={() => removeLink(link.id)}
                  className="text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  style={{ color: '#FF6666' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Attachments */}
      <div className="rounded-xl p-6" style={s.surface}>
        <h2 className="font-semibold text-lg mb-4" style={s.white}>Files & Attachments</h2>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors mb-4"
          style={{
            borderColor: dragging ? '#00FFB2' : '#3a3a5c',
            backgroundColor: dragging ? 'rgba(0,255,178,0.05)' : '#1a1a2e',
          }}
        >
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
          <p className="text-2xl mb-2">📁</p>
          <p className="text-sm font-medium" style={s.white}>
            {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs mt-1" style={s.muted}>PDFs, images, contracts, screenshots — anything</p>
        </div>

        {/* File list */}
        {files.length === 0 ? (
          <p className="text-sm" style={s.muted}>No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 px-4 py-3 rounded-lg group" style={{ backgroundColor: '#1a1a2e', border: '1px solid #3a3a5c' }}>
                <span className="text-xl">{getFileIcon(file.file_name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={s.white}>{file.file_name}</p>
                  <p className="text-xs" style={s.muted}>
                    {formatBytes(file.file_size)} · {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => getFileUrl(file.file_path)}
                  className="text-xs px-3 py-1 rounded flex-shrink-0"
                  style={{ backgroundColor: '#3a3a5c', color: '#00FFB2' }}
                >
                  Open
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#FF6666' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
