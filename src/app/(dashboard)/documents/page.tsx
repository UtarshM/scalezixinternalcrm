'use client'

import * as React from 'react'
import { getFolders, getDocuments, createFolderRecord, registerDocumentRecord, deleteDocumentRecord } from '@/actions/documents'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Folder, File, Upload, Trash2, ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { Folder as FolderType, Document as DocType } from '@/types'

export default function DocumentsPage() {
  const supabase = createClient()

  const [folders, setFolders] = React.useState<FolderType[]>([])
  const [currentFolderId, setCurrentFolderId] = React.useState<string | undefined>(undefined)
  const [documents, setDocuments] = React.useState<DocType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const [showAddFolder, setShowAddFolder] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [uploading, setUploading] = React.useState(false)

  const fetchDocsData = React.useCallback(async () => {
    setLoading(true)
    try {
      const foldersData = await getFolders()
      setFolders(foldersData)
      const docsData = await getDocuments(currentFolderId)
      setDocuments(docsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [currentFolderId])

  React.useEffect(() => {
    fetchDocsData()
  }, [fetchDocsData])

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      await createFolderRecord(newFolderName, currentFolderId)
      toast.success('Folder created')
      setShowAddFolder(false)
      setNewFolderName('')
      fetchDocsData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = currentFolderId ? `${currentFolderId}/${fileName}` : fileName

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      // Get public URL or signed URL (using public URL for simplicity first, or standard URL helper)
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // 2. Register document reference in database
      await registerDocumentRecord({
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        folder_id: currentFolderId,
      })

      toast.success('File uploaded successfully')
      fetchDocsData()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (id: string, url: string) => {
    if (!confirm('Permanently delete this document?')) return
    try {
      await deleteDocumentRecord(id, url)
      toast.success('Document deleted')
      fetchDocsData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Filter subfolders of current folder level
  const currentSubfolders = folders.filter(f => f.parent_id === (currentFolderId || null))

  // Find parent folder to step back
  const currentFolder = folders.find(f => f.id === currentFolderId)

  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {currentFolderId && (
              <button
                onClick={() => setCurrentFolderId(currentFolder?.parent_id || undefined)}
                className="p-1 rounded hover:bg-[var(--secondary)] text-[var(--muted-foreground)] mr-1"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {currentFolder ? currentFolder.name : 'Documents'}
            </h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {currentFolderId ? 'Subfolder explorer' : 'Company documents, invoices archives, templates and HR records'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddFolder(true)}
            className="flex items-center gap-1 bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus size={16} />
            New Folder
          </button>
          <label className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search files in folder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading documents...</div>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          {currentSubfolders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {currentSubfolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="p-4 bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer card-hover"
                  >
                    <Folder size={32} className="text-amber-500 fill-amber-500/20" />
                    <span className="text-xs font-semibold text-[var(--foreground)] truncate w-full">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files List Section */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">Files</h3>
            {filteredDocs.length === 0 && currentSubfolders.length === 0 ? (
              <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
                Folder is empty. Upload files or create folders.
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">No files found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between shadow-sm card-hover">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] shrink-0">
                        <File size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">{doc.name}</h4>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {(doc.file_size ? (doc.file_size / 1024).toFixed(1) : '0')} KB • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                        title="Download / Open file"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.file_url)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-all"
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddFolder(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Create Folder</h3>
            </div>
            <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Folder Name *</label>
                <input
                  required
                  placeholder="e.g. Design assets"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddFolder(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
