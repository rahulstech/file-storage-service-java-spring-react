import React, { useState, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { FolderChildrenType, type FolderData, type FolderChildren } from '../../models'
import { useFolderContent, useAddSingleFile, useConfirmFileUpload, useCreateFolder, useRemoveFile, useRemoveFolder } from '../../hooks'
import { api } from '../../services/api'
import AlertDialog from '../../components/AlertDialog'
import CreateFolderDialog from './CreateFolderDialog'
import ActionPanel from './ActionPanel'
import FileUploadProgress, { type UploadItem } from './FileUploadProgress'

// Maximum allowed upload file size: 512 MB
const MAX_FILE_SIZE = 512 * 1024 * 1024

// Allowed MIME type prefixes, exact types, and file extensions
const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/', 'text/']
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])
const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico',
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
  'mp4', 'webm', 'mkv', 'avi', 'mov', 'flv',
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'xls', 'xlsx', 'csv',
  'ppt', 'pptx',
  'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx',
  'zip', 'rar', '7z', 'tar', 'gz',
])

function isFileTypeSupported(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (mime && (ALLOWED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix)) || ALLOWED_MIME_TYPES.has(mime))) {
    return true
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_EXTENSIONS.has(ext)
}

// Utility to format bytes into readable strings
function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Utility to format Last Modified date/time according to rules:
// - Today: Only time in 12-hour format (e.g. "08:15 AM")
// - Current Year: Day-Month Time (e.g. "29-Aug 12:00 PM")
// - Other Years: Day-Month-Year Time (e.g. "15-Nov-2025 06:30 PM")
function formatLastModified(updatedAtStr: string): string {
  if (!updatedAtStr) return ''

  // Ensure UTC string is parsed explicitly as UTC so Date object methods return local timezone
  let isoStr = updatedAtStr.trim()
  if (!isoStr.includes('T')) {
    isoStr = isoStr.replace(' ', 'T')
  }
  if (!isoStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(isoStr)) {
    isoStr += 'Z'
  }

  const dateObj = new Date(isoStr)
  if (isNaN(dateObj.getTime())) return updatedAtStr

  const now = new Date()

  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate()

  const isCurrentYear = dateObj.getFullYear() === now.getFullYear()

  // Format 12-hour time (e.g. "02:30 PM")
  let hours = dateObj.getHours()
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const hoursStr = hours.toString().padStart(2, '0')
  const timeStr = `${hoursStr}:${minutes} ${ampm}`

  if (isToday) {
    return timeStr
  }

  const dayStr = dateObj.getDate().toString().padStart(2, '0')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthStr = monthNames[dateObj.getMonth()]

  if (isCurrentYear) {
    return `${dayStr}-${monthStr} ${timeStr}`
  }

  const yearStr = dateObj.getFullYear()
  return `${dayStr}-${monthStr}-${yearStr} ${timeStr}`
}

const columnHelper = createColumnHelper<FolderChildren>()

export function FileBrowser() {
  const queryClient = useQueryClient()

  // Current folder ID state (default to null for root folder)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // Navigation breadcrumbs stack
  const [folderStack, setFolderStack] = useState<{ id: string | null; label: string }[]>([
    { id: null, label: 'root' },
  ])

  // Custom TanStack Query hooks
  const { data: apiFolderData, isLoading, isError, error } = useFolderContent(currentFolderId)
  const addSingleFileMutation = useAddSingleFile()
  const confirmFileUploadMutation = useConfirmFileUpload()
  const createFolderMutation = useCreateFolder()
  const removeFileMutation = useRemoveFile()
  const removeFolderMutation = useRemoveFolder()

  // Create Folder State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])

  // TanStack Table Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Selected item state for right detail panel
  const [selectedItem, setSelectedItem] = useState<FolderChildren | null>(null)

  // Item to delete state for confirmation modal
  const [itemToDelete, setItemToDelete] = useState<FolderChildren | null>(null)

  // Folder data returned exclusively by the API
  const folderData: FolderData = useMemo(() => {
    if (apiFolderData) return apiFolderData
    return {
      folder_id: currentFolderId,
      abs_path: '/',
      children: [],
    }
  }, [apiFolderData, currentFolderId])

  // Handle Create Folder submit
  const handleCreateFolderSubmit = async (folderName: string) => {
    if (!folderName.trim()) {
      alert('Folder name is required.')
      return
    }

    try {
      await createFolderMutation.mutateAsync({
        parent_folder_id: currentFolderId,
        name: folderName.trim(),
      })
      setIsCreateFolderOpen(false)
      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to create folder.')
    }
  }

  // Helper to start file upload and trigger FileUploadProgress
  const startFileUpload = async (file: File) => {
    // 1. File Size Validation (Max 512MB)
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 512MB.`)
      return
    }

    // 2. File Type Validation
    if (!isFileTypeSupported(file)) {
      alert('Unsupported file format. Please select an image, audio, video, document, spreadsheet, or presentation.')
      return
    }

    const uploadId = String(Date.now())
    const newUploadItem: UploadItem = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
    }

    setIsUploading(true)
    setUploads((prev) => [...prev, newUploadItem])

    try {
      // Step 1: Initiate upload with addSingleFile hook
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 5 } : u)))
      const addRes = await addSingleFileMutation.mutateAsync({
        folder_id: folderData.folder_id,
        file_name: file.name,
        size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
      })

      if (!addRes?.upload_url || !addRes?.file_id) {
        throw new Error('Invalid response received from server when starting upload.')
      }

      const fileId = addRes.file_id

      // Step 2: Upload file binary content via PUT request with progress tracking
      await api.uploadFileToUrl(addRes.upload_url, file, (percent) => {
        const calculatedProgress = 5 + Math.round((percent * 90) / 100)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: calculatedProgress } : u)))
      })

      // Step 3: Confirm file upload with server
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 98 } : u)))
      await confirmFileUploadMutation.mutateAsync(fileId)

      // Set to 100% on completion
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u)))

      // Reset selected file
      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Invalidate query to refresh folder list
      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })

      // Remove completed upload item after 1s delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      }, 1000)
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Error occurred during upload'}`)
      setUploads((prev) => prev.filter((u) => u.id !== uploadId))
    } finally {
      setIsUploading(false)
    }
  }

  // Handle single file upload submit via form button
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      startFileUpload(selectedFile)
    } else {
      alert('Please select a file to upload.')
    }
  }

  // Navigation handlers
  const handleNavigateToFolder = (item: FolderChildren) => {
    setCurrentFolderId(item.id)
    setFolderStack((prev) => [...prev, { id: item.id, label: item.name }])
    setSelectedItem(null)
  }

  // TanStack Table columns definition
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const item = info.row.original
          const isFolder = item.type === FolderChildrenType.FOLDER

          return (
            <div className="flex items-center gap-3">
              <span className="text-lg select-none">{isFolder ? '📁' : '📄'}</span>
              {isFolder ? (
                <button
                  type="button"
                  onClick={() => handleNavigateToFolder(item)}
                  className="font-medium text-drive-text hover:text-drive-primary hover:underline transition-colors text-left cursor-pointer"
                >
                  {item.name}
                </button>
              ) : (
                <a
                  href={item.content_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!item.content_url) {
                      e.preventDefault()
                    }
                  }}
                  className="font-medium text-drive-text hover:text-drive-primary hover:underline transition-colors cursor-pointer"
                >
                  {item.name}
                </a>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('size_bytes', {
        header: 'Size',
        cell: (info) => {
          const item = info.row.original
          return <span className="text-drive-text-subtle">{item.type === FolderChildrenType.FILE ? formatBytes(info.getValue()) : ''}</span>
        },
      }),
      columnHelper.accessor('updated_at', {
        header: 'Last Modified',
        cell: (info) => (
          <span className="text-drive-text-subtle font-mono text-xs">
            {formatLastModified(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const item = info.row.original
          return (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedItem(item)
                }}
                title="More options"
                className="p-1 rounded-lg text-drive-text-subtle hover:text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
          )
        },
      }),
    ],
    []
  )

  // Initialize TanStack Table instance
  const table = useReactTable({
    data: folderData.children,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col h-screen bg-drive-bg text-drive-text font-sans overflow-hidden">
      {/* ============================================================ */}
      {/* 1. TOP FIXED SECTION: File Upload Input & Submit Button       */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-20 bg-drive-surface border-b border-drive-border px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-drive-text leading-tight">File Storage Service</h1>
          </div>

          {/* File Upload Form */}
          <form onSubmit={handleUploadSubmit} className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                id="file-upload-input"
                type="file"
                disabled={isUploading}
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    setSelectedFile(file)
                    startFileUpload(file)
                  }
                }}
                className="w-full text-xs text-drive-text-subtle file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-drive-surface-variant file:text-drive-primary hover:file:bg-drive-hover file:cursor-pointer cursor-pointer border border-drive-border rounded-xl bg-drive-bg p-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-drive-text-muted mt-1 px-1">Max file size: 512MB</p>
            </div>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer bg-drive-primary hover:bg-drive-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white active:scale-95 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                'Upload'
              )}
            </button>
          </form>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. FILE BROWSER SECTION (Divided Top to Bottom)               */}
      {/* ============================================================ */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-4 min-h-0">
        <div className="bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col flex-1 overflow-hidden min-w-0">
          {/* ---------------------------------------------------------- */}
          {/* 2A. TOP FIXED SECTION: Current Folder Breadcrumb & Back Arrow */}
          {/* ---------------------------------------------------------- */}
          <div className="sticky top-0 z-10 bg-drive-surface border-b border-drive-border px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Arrow Left Icon Button */}
              <button
                type="button"
                disabled={folderStack.length <= 1}
                onClick={() => {
                  if (folderStack.length > 1) {
                    const parent = folderStack[folderStack.length - 2]
                    setCurrentFolderId(parent.id)
                    setFolderStack((prev) => prev.slice(0, -1))
                    setSelectedItem(null)
                  }
                }}
                title="Go back / Up one level"
                className="p-1.5 rounded-lg text-drive-text-subtle hover:text-drive-primary hover:bg-drive-surface-variant border border-drive-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>

              {/* Interactive Breadcrumb Path */}
              <div className="flex items-center flex-wrap gap-2 text-sm font-medium">
                {folderStack.map((crumb, idx) => (
                  <React.Fragment key={crumb.id ?? 'root'}>
                    {idx > 0 && <span className="text-drive-text-muted font-bold select-none">&gt;</span>}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentFolderId(crumb.id)
                        setFolderStack((prev) => prev.slice(0, idx + 1))
                        setSelectedItem(null)
                      }}
                      className={`px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer ${
                        idx === folderStack.length - 1
                          ? 'bg-drive-active text-drive-active-text font-bold'
                          : 'text-drive-primary hover:bg-drive-surface-variant hover:underline'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Add Folder Icon Button on Right Hand Side */}
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              title="Add Folder"
              className="p-1.5 rounded-lg text-drive-text-subtle hover:text-drive-primary hover:bg-drive-surface-variant border border-drive-border transition-colors cursor-pointer flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </button>
          </div>

          {/* Error Banner */}
          {isError && (
            <div className="p-3 m-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              Unable to connect to backend server at http://localhost:8080 ({error?.message}). Please verify the server is running.
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* 2B. BOTTOM SECTION: Folder Content Table (TanStack Table)   */}
          {/* ---------------------------------------------------------- */}
          <div className="flex-1 overflow-auto p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-3">
                <div className="w-8 h-8 border-3 border-drive-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Loading folder content...</p>
              </div>
            ) : folderData.children.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-2">
                <span className="text-4xl">📂</span>
                <p className="text-sm font-medium">This folder is empty.</p>
                <p className="text-xs text-drive-text-subtle">Use the upload bar above to add files</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-drive-text border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-drive-border text-xs text-drive-text-subtle font-semibold select-none">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="pb-3 pt-2 px-4 cursor-pointer hover:text-drive-primary transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-drive-border-subtle">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-drive-hover transition-colors duration-150 group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <ActionPanel
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          absPath={folderData.abs_path}
          isDeletingPending={removeFileMutation.isPending || removeFolderMutation.isPending}
          onDeleteClick={(item) => setItemToDelete(item)}
        />
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <CreateFolderDialog
          onDismiss={() => setIsCreateFolderOpen(false)}
          onCreateClick={handleCreateFolderSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <AlertDialog
          titleLabel="Confirm Delete"
          yesButtonLabel="No"
          noButtonLabel="Yes"
          onDismiss={() => setItemToDelete(null)}
          onClickYes={() => setItemToDelete(null)}
          onClickNo={async () => {
            const target = itemToDelete
            setItemToDelete(null)
            if (target.type === FolderChildrenType.FILE) {
              try {
                await removeFileMutation.mutateAsync(target.id)
                if (selectedItem?.id === target.id) {
                  setSelectedItem(null)
                }
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
              } catch (err: any) {
                alert(err?.response?.data?.message || err.message || 'Failed to delete file.')
              }
            } else if (target.type === FolderChildrenType.FOLDER) {
              try {
                await removeFolderMutation.mutateAsync(target.id)
                if (selectedItem?.id === target.id) {
                  setSelectedItem(null)
                }
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
              } catch (err: any) {
                alert(err?.response?.data?.message || err.message || 'Failed to delete folder.')
              }
            }
          }}
        >
          <p className="text-sm text-drive-text leading-relaxed">
            Are you sure you want to delete <strong className="font-bold text-drive-text">{itemToDelete.name}</strong> ({folderData.abs_path === '/' ? `/${itemToDelete.name}` : `${folderData.abs_path}/${itemToDelete.name}`})?
          </p>
        </AlertDialog>
      )}

      {/* File Upload Progress Drawer */}
      <FileUploadProgress uploads={uploads} />
    </div>
  )
}

export default FileBrowser
