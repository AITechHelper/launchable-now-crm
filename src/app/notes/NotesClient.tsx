'use client'

import { useState, useEffect, useCallback } from 'react'

type Note = {
  id: string
  title: string
  content: string
  folder: string
  updated_at: string
}

export default function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['General']))
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameFolderValue, setRenameFolderValue] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotes(data)
          if (data.length > 0) openNote(data[0])
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openNote(note: Note) {
    setActiveNote(note)
    setTitle(note.title)
    setContent(note.content)
    setSaved(false)
  }

  async function createNote(folder = 'General') {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '', folder }),
    })
    const note = await res.json()
    setNotes((prev) => [note, ...prev])
    openNote(note)
    setOpenFolders((prev) => new Set([...prev, folder]))
  }

  const save = useCallback(async () => {
    if (!activeNote) return
    setSaving(true)
    const res = await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    const updated = await res.json()
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setActiveNote(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [activeNote, title, content])

  // Ctrl/Cmd+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    if (activeNote?.id === id) {
      if (next.length > 0) openNote(next[0])
      else { setActiveNote(null); setTitle(''); setContent('') }
    }
  }

  async function renameNote(id: string, newTitle: string) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const updated = await res.json()
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    if (activeNote?.id === id) { setActiveNote(updated); setTitle(updated.title) }
    setRenaming(null)
  }

  async function moveNoteToFolder(id: string, folder: string) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    })
    const updated = await res.json()
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setOpenFolders((prev) => new Set([...prev, folder]))
  }

  async function renameFolder(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) { setRenamingFolder(null); return }
    // Update all notes in this folder
    const inFolder = notes.filter((n) => n.folder === oldName)
    await Promise.all(inFolder.map((n) =>
      fetch(`/api/notes/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: newName }),
      })
    ))
    setNotes((prev) => prev.map((n) => n.folder === oldName ? { ...n, folder: newName } : n))
    setOpenFolders((prev) => {
      const next = new Set(prev)
      next.delete(oldName)
      next.add(newName)
      return next
    })
    setRenamingFolder(null)
  }

  // Group notes by folder
  const folders = Array.from(new Set(notes.map((n) => n.folder))).sort()

  const fmtDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const inputStyle = { backgroundColor: 'transparent', outline: 'none', color: '#ffffff' }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div className="flex flex-col flex-shrink-0 overflow-y-auto" style={{ width: 260, backgroundColor: '#1e1e38', borderRight: '1px solid #3a3a5c' }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #3a3a5c' }}>
          <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>Notes</span>
          <button
            onClick={() => createNote()}
            title="New note"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-lg font-light hover:opacity-80"
            style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}
          >
            +
          </button>
        </div>

        {/* Folders */}
        <div className="flex-1 py-2 overflow-y-auto">
          {folders.map((folder) => {
            const folderNotes = notes.filter((n) => n.folder === folder)
            const isOpen = openFolders.has(folder)
            return (
              <div key={folder}>
                {/* Folder row */}
                <div
                  className="group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:opacity-80 select-none"
                  onClick={() => setOpenFolders((prev) => {
                    const next = new Set(prev)
                    isOpen ? next.delete(folder) : next.add(folder)
                    return next
                  })}
                >
                  <span className="text-xs" style={{ color: '#6060a0' }}>{isOpen ? '▼' : '▶'}</span>
                  {renamingFolder === folder ? (
                    <input
                      autoFocus
                      value={renameFolderValue}
                      onChange={(e) => setRenameFolderValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameFolder(folder, renameFolderValue)
                        if (e.key === 'Escape') setRenamingFolder(null)
                      }}
                      onBlur={() => renameFolder(folder, renameFolderValue)}
                      className="flex-1 text-sm px-1 rounded"
                      style={{ backgroundColor: '#2a2a50', color: '#ffffff', outline: 'none', border: '1px solid #9B5FFF' }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm font-medium"
                      style={{ color: '#c0c0e0' }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setRenamingFolder(folder)
                        setRenameFolderValue(folder)
                      }}
                    >
                      {folder}
                    </span>
                  )}
                  <span className="text-xs opacity-50" style={{ color: '#6060a0' }}>{folderNotes.length}</span>
                  <button
                    title="New note in folder"
                    onClick={(e) => { e.stopPropagation(); createNote(folder) }}
                    className="opacity-0 group-hover:opacity-100 text-xs w-5 h-5 rounded flex items-center justify-center"
                    style={{ color: '#00FFB2' }}
                  >
                    +
                  </button>
                </div>

                {/* Notes in folder */}
                {isOpen && folderNotes.map((note) => (
                  <div
                    key={note.id}
                    className="group relative flex items-center gap-2 pl-7 pr-2 py-1.5 cursor-pointer"
                    style={{
                      backgroundColor: activeNote?.id === note.id ? '#2a2a50' : 'transparent',
                    }}
                    onClick={() => openNote(note)}
                  >
                    <span className="text-xs flex-shrink-0" style={{ color: '#3a3a5c' }}>📄</span>
                    {renaming === note.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameNote(note.id, renameValue)
                          if (e.key === 'Escape') setRenaming(null)
                        }}
                        onBlur={() => renameNote(note.id, renameValue)}
                        className="flex-1 text-xs px-1 rounded"
                        style={{ backgroundColor: '#2a2a50', color: '#ffffff', outline: 'none', border: '1px solid #9B5FFF' }}
                      />
                    ) : (
                      <span
                        className="flex-1 text-xs truncate"
                        style={{ color: activeNote?.id === note.id ? '#ffffff' : '#a0a0c0' }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setRenaming(note.id)
                          setRenameValue(note.title)
                        }}
                      >
                        {note.title}
                      </span>
                    )}
                    <span className="text-xs opacity-50 flex-shrink-0" style={{ color: '#6060a0' }}>{fmtDate(note.updated_at)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                      className="opacity-0 group-hover:opacity-100 text-xs flex-shrink-0"
                      style={{ color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* New folder */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid #3a3a5c' }}>
          {showNewFolder ? (
            <div className="flex gap-2">
              <input
                autoFocus
                placeholder="Folder name…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createNote(newFolderName.trim())
                    setNewFolderName('')
                    setShowNewFolder(false)
                  }
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
                className="flex-1 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: '#2a2a50', color: '#ffffff', outline: 'none', border: '1px solid #3a3a5c' }}
              />
              <button onClick={() => setShowNewFolder(false)} className="text-xs" style={{ color: '#6060a0' }}>✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="text-xs w-full text-left hover:opacity-80"
              style={{ color: '#6060a0' }}
            >
              + New Folder
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-8 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #3a3a5c' }}>
              <div className="flex items-center gap-3">
                {/* Folder picker */}
                <select
                  value={activeNote.folder}
                  onChange={(e) => moveNoteToFolder(activeNote.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: '#252540', color: '#a0a0c0', border: '1px solid #3a3a5c', outline: 'none' }}
                >
                  {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <span className="text-xs" style={{ color: '#3a3a5c' }}>·</span>
                <span className="text-xs" style={{ color: '#6060a0' }}>
                  {fmtDate(activeNote.updated_at)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {saved && <span className="text-xs" style={{ color: '#00FFB2' }}>Saved</span>}
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-8 pt-6 pb-2 flex-shrink-0">
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
                placeholder="Note title…"
                className="w-full text-2xl font-bold"
                style={{ ...inputStyle, caretColor: '#00FFB2' }}
              />
            </div>

            {/* Body */}
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setSaved(false) }}
              placeholder="Start writing…"
              className="flex-1 px-8 py-4 resize-none text-sm leading-relaxed"
              style={{ ...inputStyle, backgroundColor: 'transparent', caretColor: '#00FFB2', color: '#d0d0e8' }}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-sm" style={{ color: '#6060a0' }}>No note selected</p>
            <button
              onClick={() => createNote()}
              className="px-5 py-2 rounded-lg font-medium text-sm"
              style={{ backgroundColor: '#00FFB2', color: '#0d1a0d' }}
            >
              + New Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
