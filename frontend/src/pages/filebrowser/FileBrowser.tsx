import React, { useState, useMemo, useEffect } from 'react'
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
import { useFolderContent, useCreateFolder, useRemoveFile, useRemoveFolder, useRenameFile, useRenameFolder } from '../../hooks'
import AlertDialog from '../../components/AlertDialog'
import CreateFolderDialog from './CreateFolderDialog'
import RenameDialog from './RenameDialog'
import ActionPanel, { type Action } from '../../components/ActionPanel'
import FileUploadProgress from './FileUploadProgress'
import FileUploader, { type ProgressData } from './FileUploader'
import { useToast, ToastType } from '../../components/Toast'
import { formatBytes } from '../../util/helper'

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

function getErrorMessage(err: any, fallbackMessage: string): string {
  if (!err?.response || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || err?.message?.includes('Network')) {
    return 'Failed to connect to server'
  }
  return err?.response?.data?.message || err?.message || fallbackMessage
}

const columnHelper = createColumnHelper<FolderChildren>()

export function FileBrowser() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Current folder ID state (default to null for root folder)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // Navigation breadcrumbs stack
  const [folderStack, setFolderStack] = useState<{ id: string | null; label: string }[]>([
    { id: null, label: 'root' },
  ])

  // Custom TanStack Query hooks
  const { data: apiFolderData, isLoading, isError } = useFolderContent(currentFolderId)
  const createFolderMutation = useCreateFolder()
  const removeFileMutation = useRemoveFile()
  const removeFolderMutation = useRemoveFolder()
  const renameFileMutation = useRenameFile()
  const renameFolderMutation = useRenameFolder()

  // Show Toast notification when failing to connect to server
  useEffect(() => {
    if (isError) {
      showToast({
        message: 'Failed to connect to server',
        type: ToastType.DANGER,
        action: { label: 'Ok' },
      })
    }
  }, [isError, showToast])

  // Create Folder State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)

  // File Upload Progress State
  const [uploads, setUploads] = useState<ProgressData[]>([])

  // TanStack Table Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Open item state for right detail panel and right panel actions
  const [openRightPanelItem, setOpenRightPanelItem] = useState<FolderChildren | null>(null)

  // Dialog visibility states for right panel actions
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false)

  // Folder data returned exclusively by the API
  const folderData: FolderData = useMemo(() => {
    if (apiFolderData) return apiFolderData
    return {
      folder_id: currentFolderId,
      abs_path: '/',
      children: [],
    }
  }, [apiFolderData, currentFolderId])

  // Action handler for ActionPanel
  const handleAction = (actionId: string) => {
    if (!openRightPanelItem) return

    switch (actionId) {
      case 'rename':
        setIsRenameDialogOpen(true)
        break
      case 'download':
        if (openRightPanelItem.content_url) {
          const link = document.createElement('a')
          link.href = openRightPanelItem.content_url
          link.download = openRightPanelItem.name
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          showToast({
            message: 'Download link is not available.',
            type: ToastType.DANGER,
          })
        }
        break
      case 'share':
        const fullPath =
          folderData.abs_path === '/' ? `/${openRightPanelItem.name}` : `${folderData.abs_path}/${openRightPanelItem.name}`
        if (navigator.clipboard) {
          navigator.clipboard.writeText(openRightPanelItem.content_url || fullPath)
        }
        showToast({
          message: `Copied path/link for "${openRightPanelItem.name}"`,
          type: ToastType.SUCCESS,
        })
        break
      case 'delete':
        setIsDeleteDialogOpen(true)
        break
      default:
        break
    }
  }

  // Construct actions list based on open right panel item type
  const panelActions: Action[] = useMemo(() => {
    if (!openRightPanelItem) return []

    const isDeletingPending = removeFileMutation.isPending || removeFolderMutation.isPending || renameFileMutation.isPending || renameFolderMutation.isPending
    const isFile = openRightPanelItem.type === FolderChildrenType.FILE

    const renameAction: Action = {
      id: 'rename',
      label: 'Rename',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
    }

    const downloadAction: Action = {
      id: 'download',
      label: 'Download',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    }

    const shareAction: Action = {
      id: 'share',
      label: 'Share',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
    }

    const deleteAction: Action = {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
      color: 'danger',
      enabled: !isDeletingPending,
    }

    if (isFile) {
      return [renameAction, downloadAction, shareAction, deleteAction]
    } else {
      return [renameAction, shareAction, deleteAction]
    }
  }, [openRightPanelItem, removeFileMutation.isPending, removeFolderMutation.isPending, renameFileMutation.isPending, renameFolderMutation.isPending])

  // Handle Rename submit
  const handleRenameSubmit = async (newName: string) => {
    if (!openRightPanelItem) return
    const trimmedName = newName.trim()

    if (!trimmedName) {
      showToast({
        message: 'Name is required.',
        type: ToastType.DANGER,
        action: { label: 'Ok' },
      })
      return
    }

    if (trimmedName === openRightPanelItem.name) {
      setIsRenameDialogOpen(false)
      return
    }

    const isFolder = openRightPanelItem.type === FolderChildrenType.FOLDER
    const target = openRightPanelItem
    setIsRenameDialogOpen(false)

    try {
      if (isFolder) {
        await renameFolderMutation.mutateAsync({
          folderId: target.id,
          name: trimmedName,
        })
      } else {
        await renameFileMutation.mutateAsync({
          fileId: target.id,
          name: trimmedName,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })

      setOpenRightPanelItem((prev) => (prev ? { ...prev, name: trimmedName } : null))

      showToast({
        message: `Renamed to "${trimmedName}"`,
        type: ToastType.SUCCESS,
      })
    } catch (err: any) {
      showToast({
        message: getErrorMessage(err, `Failed to rename ${isFolder ? 'folder' : 'file'}.`),
        type: ToastType.DANGER,
        action: { label: 'Ok' },
      })
    }
  }

  // Handle Create Folder submit
  const handleCreateFolderSubmit = async (folderName: string) => {
    if (!folderName.trim()) {
      showToast({
        message: 'Folder name is required.',
        type: ToastType.DANGER,
        action: { label: 'Ok' },
      })
      return
    }

    try {
      await createFolderMutation.mutateAsync({
        parent_folder_id: currentFolderId,
        name: folderName.trim(),
      })
      setIsCreateFolderOpen(false)
      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
      showToast({
        message: `Folder "${folderName.trim()}" created successfully`,
        type: ToastType.SUCCESS,
      })
    } catch (err: any) {
      showToast({
        message: getErrorMessage(err, 'Failed to create folder.'),
        type: ToastType.DANGER,
        action: { label: 'Ok' },
      })
    }
  }



  // Navigation handlers
  const handleNavigateToFolder = (item: FolderChildren) => {
    setCurrentFolderId(item.id)
    setFolderStack((prev) => [...prev, { id: item.id, label: item.name }])
    setOpenRightPanelItem(null)
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
                  setOpenRightPanelItem(item)
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

          {/* File Upload Component */}
          <FileUploader
            folderId={currentFolderId}
            onProgressUpdate={setUploads}
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })}
          />
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
                    setOpenRightPanelItem(null)
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
                        setOpenRightPanelItem(null)
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
        {openRightPanelItem && (
          <ActionPanel actions={panelActions} onAction={handleAction}>
            <div className="p-4 border-b border-drive-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-drive-text-subtle">
                  Details
                </span>
                <button
                  type="button"
                  onClick={() => setOpenRightPanelItem(null)}
                  title="Close panel"
                  className="p-1 rounded-lg text-drive-text-subtle hover:text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-base text-drive-text break-all">{openRightPanelItem.name}</div>
                <div className="text-xs text-drive-text-subtle font-mono break-all">
                  {folderData.abs_path === '/' ? `/${openRightPanelItem.name}` : `${folderData.abs_path}/${openRightPanelItem.name}`}
                </div>
              </div>
            </div>
          </ActionPanel>
        )}
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <CreateFolderDialog
          onDismiss={() => setIsCreateFolderOpen(false)}
          onCreateClick={handleCreateFolderSubmit}
        />
      )}

      {/* Rename Modal */}
      {isRenameDialogOpen && openRightPanelItem && (
        <RenameDialog
          initialName={openRightPanelItem.name}
          isFolder={openRightPanelItem.type === FolderChildrenType.FOLDER}
          onDismiss={() => setIsRenameDialogOpen(false)}
          onRenameClick={handleRenameSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && openRightPanelItem && (
        <AlertDialog
          titleLabel="Confirm Delete"
          yesButtonLabel="No"
          noButtonLabel="Yes"
          onDismiss={() => setIsDeleteDialogOpen(false)}
          onClickYes={() => setIsDeleteDialogOpen(false)}
          onClickNo={async () => {
            const target = openRightPanelItem
            setIsDeleteDialogOpen(false)
            if (target.type === FolderChildrenType.FILE) {
              try {
                await removeFileMutation.mutateAsync(target.id)
                setOpenRightPanelItem(null)
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
                showToast({
                  message: `${target.name} deleted`,
                  type: ToastType.SUCCESS,
                })
              } catch (err: any) {
                showToast({
                  message: getErrorMessage(err, 'Failed to delete file.'),
                  type: ToastType.DANGER,
                  action: { label: 'Ok' },
                })
              }
            } else if (target.type === FolderChildrenType.FOLDER) {
              try {
                await removeFolderMutation.mutateAsync(target.id)
                setOpenRightPanelItem(null)
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
                showToast({
                  message: `${target.name} delete`,
                  type: ToastType.SUCCESS,
                })
              } catch (err: any) {
                showToast({
                  message: getErrorMessage(err, 'Failed to delete folder.'),
                  type: ToastType.DANGER,
                  action: { label: 'Ok' },
                })
              }
            }
          }}
        >
          <p className="text-sm text-drive-text leading-relaxed">
            Are you sure you want to delete <strong className="font-bold text-drive-text">{openRightPanelItem.name}</strong> ({folderData.abs_path === '/' ? `/${openRightPanelItem.name}` : `${folderData.abs_path}/${openRightPanelItem.name}`})?
          </p>
        </AlertDialog>
      )}

      {/* File Upload Progress Drawer */}
      <FileUploadProgress uploads={uploads} />
    </div>
  )
}

export default FileBrowser
