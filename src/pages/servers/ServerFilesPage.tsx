import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys'
import { getServer } from '../../api/servers'
import { listFiles, readFile, writeFile, createFileOrFolder, deleteFileOrFolder, uploadFile } from '../../api/files'
import type { FileEntry } from '../../api/files'
import { sileo } from 'sileo'
import Button from '../../components/Button'
import Heading from '../../components/ui/Heading'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

function formatBytes(sizeBytes: number | null): string {
  if (sizeBytes === null || sizeBytes === undefined) return '—'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KiB`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MiB`
}

function BreadcrumbPath({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const segments = currentPath.split('/').filter(Boolean)
  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <button type="button" onClick={() => onNavigate('')} className="rounded px-1.5 py-0.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
        /home/container
      </button>
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1">
          <span className="text-[var(--fg-muted)]">/</span>
          <button type="button" onClick={() => onNavigate(segments.slice(0, index + 1).join('/'))} className="rounded px-1.5 py-0.5 text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
            {segment}
          </button>
        </div>
      ))}
    </div>
  )
}

export default function ServerFilesPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [currentPath, setCurrentPath] = useState('')
  const [search, setSearch] = useState('')
  const [deletingFile, setDeletingFile] = useState<FileEntry | null>(null)
  const [editorState, setEditorState] = useState<{ path: string; contents: string } | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [savingFile, setSavingFile] = useState(false)
  const [createFileOpen, setCreateFileOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const { data: server } = useQuery({ queryKey: queryKeys.servers.detail(id!), queryFn: () => getServer(id!), enabled: !!id })
  const { data: entries = [], isLoading, refetch } = useQuery({ queryKey: queryKeys.servers.files(id!, currentPath), queryFn: () => listFiles(id!, currentPath || '/'), enabled: !!id })

  const createMutation = useMutation({
    mutationFn: ({ path, type }: { path: string; type: 'file' | 'folder' }) => createFileOrFolder(id!, path, type),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) }); sileo.success({ description: 'Created', icon: false }) },
    onError: () => sileo.error({ description: 'Failed to create', icon: false }),
  })

  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteFileOrFolder(id!, path),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) }); sileo.success({ description: 'Deleted', icon: false }) },
    onError: () => sileo.error({ description: 'Failed to delete', icon: false }),
  })

  const filteredEntries = entries.filter((entry: FileEntry) => !search || entry.name.toLowerCase().includes(search.toLowerCase()))
  const navigateTo = (path: string) => { setCurrentPath(path); setSearch('') }

  const openEntry = async (entry: FileEntry) => {
    if (entry.is_dir) { navigateTo(entry.path); return }
    try { const data = await readFile(id!, entry.path); setEditorState({ path: entry.path, contents: data.content || '' }); setEditorValue(data.content || '') } catch { sileo.error({ description: 'Failed to read file', icon: false }) }
  }

  const handleSaveFile = async () => {
    if (!editorState) return
    setSavingFile(true)
    try { await writeFile(id!, editorState.path, editorValue); queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) }); sileo.success({ description: 'File saved', icon: false }); setEditorState(null) } catch { sileo.error({ description: 'Failed to save file', icon: false }) } finally { setSavingFile(false) }
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
    try { for (const file of Array.from(files)) { await uploadFile(id!, currentPath ? `${currentPath}/${file.name}` : file.name, file) }; queryClient.invalidateQueries({ queryKey: queryKeys.servers.files(id!, currentPath) }); sileo.success({ description: `${files.length} file(s) uploaded`, icon: false }) } catch { sileo.error({ description: 'Upload failed', icon: false }) } finally { setUploading(false); if (uploadInputRef.current) uploadInputRef.current.value = '' }
  }

  if (!server) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading title="Files" description="Browse, upload, edit, and manage files inside your server container." />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {currentPath && (
            <Button variant="secondary" width="auto" height={32} onClick={() => { const parts = currentPath.split('/'); parts.pop(); navigateTo(parts.join('/')) }}>
              Up
            </Button>
          )}
          <Button variant="secondary" width="auto" height={32} onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button variant="secondary" width="auto" height={32} onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
            Upload
          </Button>
          <Button width="auto" height={32} onClick={() => setCreateFolderOpen(true)}>
            New folder
          </Button>
          <Button width="auto" height={32} onClick={() => setCreateFileOpen(true)}>
            New file
          </Button>
        </div>
      </div>

      <BreadcrumbPath currentPath={currentPath} onNavigate={navigateTo} />

      <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

      <Card className="overflow-hidden [&>[data-slot=card-inner]]:py-0">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner className="size-5 mx-auto text-[var(--fg-muted)]" />
            <p className="text-sm text-[var(--fg-muted)] mt-3">Loading files...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {filteredEntries.map((entry: FileEntry) => (
              <div key={entry.path} className="group flex items-center gap-3 px-6 py-3 hover:bg-[var(--bg-elevated)]/30 transition-colors">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openEntry(entry)}
                >
                  <p className="text-sm font-medium text-[var(--fg)] truncate">
                    {entry.is_dir ? `${entry.name}/` : entry.name}
                  </p>
                </button>
                {!entry.is_dir && <span className="text-xs text-[var(--fg-muted)] w-24 text-right shrink-0">{formatBytes(entry.size)}</span>}
                <Button
                  variant="danger"
                  width="auto"
                  height={28}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => setDeletingFile(entry)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[var(--fg-muted)]">{search ? 'No files match your search.' : 'This directory is empty.'}</p>
          </div>
        )}
      </Card>

      {/* File Editor Modal */}
      {editorState && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-base font-semibold text-[var(--fg)]">Edit File</h3>
              <p className="text-xs text-[var(--fg-muted)]">/home/container{editorState.path}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" width="auto" height={32} onClick={() => { setEditorState(null); setEditorValue('') }}>Close</Button>
              <Button width="auto" height={32} onClick={handleSaveFile} loading={savingFile} disabled={savingFile}>
                Save
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-6">
            <textarea value={editorValue} onChange={(e) => setEditorValue(e.target.value)} className="w-full h-full bg-[var(--bg)] text-[var(--fg)] font-mono text-sm border border-[var(--border-strong)] rounded-lg p-4 focus:outline-none focus:border-[var(--accent)] resize-none" spellCheck={false} />
          </div>
        </div>
      )}

      {/* Create File Dialog */}
      <Dialog open={createFileOpen} onOpenChange={setCreateFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create File</DialogTitle>
            <DialogDescription>
              This file will be created as <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--fg)]">/home/container{currentPath ? `/${currentPath}` : ''}/{newName || 'new-file.txt'}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="server.properties"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate('file') }}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="secondary" width="auto" height={32} onClick={() => { setCreateFileOpen(false); setNewName('') }}>Cancel</Button>
            <Button width="auto" height={32} onClick={() => handleCreate('file')} disabled={!newName}>Create file</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deletingFile} onOpenChange={() => setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingFile?.is_dir ? 'Delete folder' : 'Delete file'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingFile?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFile) {
                  deleteMutation.mutate(deletingFile.path)
                  setDeletingFile(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              This directory will be created as <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--fg)]">/home/container{currentPath ? `/${currentPath}` : ''}/{newName || 'new-folder'}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="plugins"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate('folder') }}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="secondary" width="auto" height={32} onClick={() => { setCreateFolderOpen(false); setNewName('') }}>Cancel</Button>
            <Button width="auto" height={32} onClick={() => handleCreate('folder')} disabled={!newName}>Create folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
