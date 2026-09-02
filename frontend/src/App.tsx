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
import type { FolderData, FolderChildren } from './models'
import { useFolderContent, useAddSingleFile, useConfirmFileUpload } from './hooks'
import { api } from './services/api'

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

function App() {
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

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // TanStack Table Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Folder data returned exclusively by the API
  const folderData: FolderData = useMemo(() => {
    if (apiFolderData) return apiFolderData
    return {
      folder_id: currentFolderId,
      abs_path: '/',
      children: [],
    }
  }, [apiFolderData, currentFolderId])

  // Handle single file upload submit via backend API
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadStatus('Please select a file to upload.')
      return
    }

    // 1. File Size Validation (Max 512MB)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadStatus(`File size (${formatBytes(selectedFile.size)}) exceeds the maximum allowed limit of 512MB.`)
      return
    }

    // 2. File Type Validation
    if (!isFileTypeSupported(selectedFile)) {
      setUploadStatus('Unsupported file format. Please select an image, audio, video, document, spreadsheet, or presentation.')
      return
    }

    setIsUploading(true)
    setUploadStatus(`Initiating upload for "${selectedFile.name}"...`)

    try {
      // Step 1: Initiate upload with addSingleFile hook
      const addRes = await addSingleFileMutation.mutateAsync({
        folder_id: folderData.folder_id,
        file_name: selectedFile.name,
        size_bytes: selectedFile.size,
        mime_type: selectedFile.type || 'application/octet-stream',
      })

      if (!addRes?.upload_url || !addRes?.file_id) {
        throw new Error('Invalid response received from server when starting upload.')
      }

      const fileId = addRes.file_id

      // Step 2: Upload file binary content via PUT request to upload_url
      setUploadStatus(`Uploading "${selectedFile.name}" (${formatBytes(selectedFile.size)})...`)
      await api.uploadFileToUrl(addRes.upload_url, selectedFile)

      // Step 3: Confirm file upload with server using fileId
      setUploadStatus(`Confirming upload for "${selectedFile.name}"...`)
      await confirmFileUploadMutation.mutateAsync(fileId)

      // Reset form and notify user
      setUploadStatus(`Successfully uploaded "${selectedFile.name}"`)
      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Invalidate query to refresh folder list
      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
      setTimeout(() => setUploadStatus(null), 4000)
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message || 'Error occurred during upload'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Navigation handlers
  const handleNavigateToFolder = (item: FolderChildren) => {
    setCurrentFolderId(item.id)
    setFolderStack((prev) => [...prev, { id: item.id, label: item.name }])
  }

  // TanStack Table columns definition
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const item = info.row.original
          const isFolder = item.type === 'FOLDER'

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
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    window.open('#', '_blank')
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
          return <span className="text-drive-text-subtle">{item.type === 'FILE' ? formatBytes(info.getValue()) : ''}</span>
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
                    setSelectedFile(e.target.files[0])
                    setUploadStatus(null)
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

        {/* Upload Feedback Toast / Banner */}
        {uploadStatus && (
          <div className="max-w-6xl mx-auto mt-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-drive-active text-drive-active-text transition-all flex items-center justify-between">
            <span>{uploadStatus}</span>
            {isUploading && (
              <span className="text-[10px] uppercase font-bold text-drive-primary animate-pulse">Processing</span>
            )}
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 2. FILE BROWSER SECTION (Divided Top to Bottom)               */}
      {/* ============================================================ */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col min-h-0">
        <div className="bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col flex-1 overflow-hidden">
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
              onClick={() => {
                // Placeholder action for Add Folder
              }}
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
      </div>
    </div>
  )
}

export default App
