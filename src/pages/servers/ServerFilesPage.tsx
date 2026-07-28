import { useState, useRef } from 'react'
import { Input } from '../../components/ui/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { getServer } from '../../api/servers'
import { listFiles, readFile, writeFile, createFileOrFolder, deleteFileOrFolder, uploadFile } from '../../api/files'
import type { FileEntry } from '../../api/files'
import { sileo } from 'sileo'
import {
  FolderIcon,
  FolderAddIcon,
  FolderUploadIcon,
  FileIcon,
  FileCodeIcon,
  FileCogIcon,
  ImageIcon,
  MusicNoteIcon,
  VideoIcon,
  ArchiveIcon,
  RefreshIcon,
  UploadIcon,
  AddIcon,
  DeleteIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

function formatBytes(sizeBytes: number | null): string {
  if (sizeBytes === null || sizeBytes === undefined) return '—'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KiB`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MiB`
}

function getFileVisual(entry: FileEntry): { icon: typeof FileIcon; iconColor: string; label: string; bgColor: string } {
  if (entry.is_dir) return { icon: FolderIcon, iconColor: 'text-[var(--accent)]', label: 'Directory', bgColor: 'bg-[var(--accent)]/10' }

  const ext = entry.name.split('.').pop()?.toLowerCase() || ''
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'php'].includes(ext))
    return { icon: FileCodeIcon, iconColor: 'text-sky-400', label: 'Code file', bgColor: 'bg-sky-500/10' }
  if (['json'].includes(ext))
    return { icon: FileIcon, iconColor: 'text-lime-400', label: 'JSON file', bgColor: 'bg-lime-500/10' }
  if (['yml', 'yaml', 'toml', 'ini', 'conf', 'env', 'properties'].includes(ext))
    return { icon: FileCogIcon, iconColor: 'text-violet-400', label: 'Config file', bgColor: 'bg-violet-500/10' }
  if (['sh', 'bash', 'zsh'].includes(ext) || entry.name === 'Dockerfile')
    return { icon: FileCogIcon, iconColor: 'text-emerald-400', label: 'Shell file', bgColor: 'bg-emerald-500/10' }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext))
    return { icon: ImageIcon, iconColor: 'text-pink-400', label: 'Image file', bgColor: 'bg-pink-500/10' }
  if (['mp3', 'ogg', 'wav', 'flac'].includes(ext))
    return { icon: MusicNoteIcon, iconColor: 'text-cyan-400', label: 'Audio file', bgColor: 'bg-cyan-500/10' }
  if (['mp4', 'mov', 'webm', 'mkv'].includes(ext))
    return { icon: VideoIcon, iconColor: 'text-fuchsia-400', label: 'Video file', bgColor: 'bg-fuchsia-500/10' }
  if (['zip', 'tar', 'gz', 'rar'].includes(ext))
    return { icon: ArchiveIcon, iconColor: 'text-orange-400', label: 'Archive', bgColor: 'bg-orange-500/10' }
  if (['md', 'txt', 'log'].includes(ext))
    return { icon: FileIcon, iconColor: 'text-stone-400', label: 'Text file', bgColor: 'bg-stone-500/10' }

  return { icon: FileIcon, iconColor: 'text-[var(--fg-muted)]', label: 'File', bgColor: 'bg-[var(--bg-elevated)]' }
}

function BreadcrumbPath({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const segments = currentPath.split('/').filter(Boolean)

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-[var(--fg)]">
      <button
        type="button"
        onClick={() => onNavigate('')}
        className="rounded px-1.5 py-0.5 pl-2 transition-colors hover:bg-[var(--bg-elevated)]"
      >
        /home/container
      </button>
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1">
          <span className="text-[var(--fg-muted)]">/</span>
          <button
            type="button"
            onClick={() => onNavigate(segments.slice(0, index + 1).join('/'))}
            className="rounded px-1.5 py-0.5 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)]"
          >
            {segment}
          </button>
        </div>
      ))}
    </div>
  )
}

function ActionBar({
  label, icon, onClick, variant = 'secondary', disabled,
}: {
  label: string
  icon: typeof FileIcon
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}) {
  const cls = variant === 'primary'
    ? 'bg-[var(--accent)] text-white hover:opacity-90'
    : 'bg-[var(--bg-elevated)] text-[var(--fg)] border border-theme-strong hover:bg-[var(--bg-card)]'
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-40 ${cls}`}
      onClick={onClick}
      disabled={disabled}
    >
      <HugeiconsIcon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export default function ServerFilesPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [currentPath, setCurrentPath] = useState('')
  const [search, setSearch] = useState('')
  const [editorState, setEditorState] = useState<{ path: string; contents: string } | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [savingFile, setSavingFile] = useState(false)
  const [createFileOpen, setCreateFileOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const { data: server } = useQuery({
    queryKey: queryKeys.servers.detail(id!),
    queryFn: () => getServer(id!),
    enabled: !!id,
  })

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.servers.files(id!, currentPath),
    queryFn: () => listFiles(id!, currentPath || '/'),
    enabled: !!id,
  })

  const createMutation = useMutation({
    mutationFn: ({ path, type }: { path: string; type: 'file' | 'folder' }) =>
      createFileOrFolder(id!, path, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) })
      sileo.success({ description: 'Created', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to create', icon: false }),
  })

  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteFileOrFolder(id!, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) })
      sileo.success({ description: 'Deleted', icon: false })
    },
    onError: () => sileo.error({ description: 'Failed to delete', icon: false }),
  })

  const filteredEntries = entries.filter((entry: FileEntry) =>
    !search || entry.name.toLowerCase().includes(search.toLowerCase())
  )

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSearch('')
  }

  const openEntry = async (entry: FileEntry) => {
    if (entry.is_dir) {
      navigateTo(entry.path)
    } else {
      try {
        const data = await readFile(id!, entry.path)
        setEditorState({ path: entry.path, contents: data.content || '' })
        setEditorValue(data.content || '')
      } catch {
        sileo.error({ description: 'Failed to read file', icon: false })
      }
    }
  }

  const handleSaveFile = async () => {
    if (!editorState) return
    setSavingFile(true)
    try {
      await writeFile(id!, editorState.path, editorValue)
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) })
      sileo.success({ description: 'File saved', icon: false })
      setEditorState(null)
    } catch {
      sileo.error({ description: 'Failed to save file', icon: false })
    } finally {
      setSavingFile(false)
    }
  }

  const handleCreate = (type: 'file' | 'folder') => {
    if (!newName) return
    const fullPath = currentPath ? `${currentPath}/${newName}` : newName
    createMutation.mutate({ path: fullPath, type })
    setNewName('')
    type === 'file' ? setCreateFileOpen(false) : setCreateFolderOpen(false)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        await uploadFile(id!, filePath, file)
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) })
      sileo.success({ description: `${files.length} file(s) uploaded`, icon: false })
    } catch {
      sileo.error({ description: 'Upload failed', icon: false })
    } finally {
      setUploading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

  if (!server) return null

  return (
    <div className="px-1 py-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--fg)]">Files</h2>
        <p className="text-sm text-[var(--fg-muted)]">Browse, upload, edit, and manage files inside your server container.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BreadcrumbPath currentPath={currentPath} onNavigate={navigateTo} />
        <div className="flex flex-wrap items-center gap-2">
          {currentPath && (
            <ActionBar
              label="Up"
              icon={FolderUploadIcon}
              onClick={() => {
                const parts = currentPath.split('/')
                parts.pop()
                navigateTo(parts.join('/'))
              }}
            />
          )}
          <ActionBar label="Refresh" icon={RefreshIcon} onClick={() => refetch()} />
          <ActionBar label="Upload" icon={UploadIcon} onClick={() => uploadInputRef.current?.click()} disabled={uploading} />
          <ActionBar label="New folder" icon={FolderAddIcon} onClick={() => setCreateFolderOpen(true)} variant="primary" />
          <ActionBar label="New file" icon={AddIcon} onClick={() => setCreateFileOpen(true)} variant="primary" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40 text-xs h-7"
          />
        </div>
      </div>

      <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

      {/* Section wrapper */}
      <div className="rounded-md bg-[var(--bg-elevated)] p-1">
        <div className="rounded-md border border-theme-strong bg-[var(--bg-card)] p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--fg-muted)]">Loading files...</p>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredEntries.map((entry: FileEntry) => {
                const { icon, iconColor, label, bgColor } = getFileVisual(entry)
                return (
                  <div
                    key={entry.path}
                    className="group relative flex items-center gap-3 rounded-xl border border-theme-strong bg-[var(--bg-card)] px-1 py-1 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                    onClick={() => openEntry(entry)}
                  >
                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-xs ring-1 ring-theme-strong ${bgColor}`}>
                      <HugeiconsIcon icon={icon} className={`relative h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1 pl-2">
                      <p className="truncate text-sm font-medium text-[var(--fg)]">{entry.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                        <span>{label}</span>
                        {!entry.is_dir && <span>{formatBytes(entry.size)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const action = entry.is_dir ? 'Delete folder' : 'Delete file'
                        if (confirm(`${action} "${entry.name}"?`)) deleteMutation.mutate(entry.path)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--fg-muted)] hover:text-red-400 transition-all mr-2"
                    >
                      <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-theme-strong px-4 py-8 text-center">
              <p className="text-xs text-[var(--fg-muted)]">
                {search ? 'No files match your search.' : 'This directory is empty.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Editor Modal */}
      {editorState && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme-strong">
            <div>
              <h3 className="text-base font-semibold text-[var(--fg)]">Edit File</h3>
              <p className="text-xs text-[var(--fg-muted)]">/home/container{editorState.path}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditorState(null); setEditorValue('') }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong hover:bg-[var(--bg-card)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSaveFile}
                disabled={savingFile}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {savingFile ? 'Saving...' : 'Save content'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="w-full h-full p-6 bg-[var(--bg)] text-[var(--fg)] font-mono text-sm border-none focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Create File Dialog */}
      {createFileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl border border-theme-strong p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[var(--fg)]">Create File</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1 mb-4">
              This file will be created as{' '}
              <span className="font-mono text-[var(--fg)]">/home/container{currentPath ? `/${currentPath}` : ''}/{newName || 'new-file.txt'}</span>
            </p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="server.properties"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate('file') }}
            />
            <div className="flex justify-end gap-2 mt-4">                <button onClick={() => { setCreateFileOpen(false); setNewName('') }} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong">Cancel</button>
                <button onClick={() => handleCreate('file')} disabled={!newName} className="px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-40">Create file</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl border border-theme-strong p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[var(--fg)]">Create Folder</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1 mb-4">
              This directory will be created as{' '}
              <span className="font-mono text-[var(--fg)]">/home/container{currentPath ? `/${currentPath}` : ''}/{newName || 'new-folder'}</span>
            </p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="plugins"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate('folder') }}
            />
            <div className="flex justify-end gap-2 mt-4">                <button onClick={() => { setCreateFolderOpen(false); setNewName('') }} className="px-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] text-[var(--fg)] text-xs font-medium border border-theme-strong">Cancel</button>
                <button onClick={() => handleCreate('folder')} disabled={!newName} className="px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-xs font-medium disabled:opacity-40">Create folder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
