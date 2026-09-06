import { useState, useMemo, useEffect } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { FolderChildrenType, type FolderData, type FolderChildren } from '../../../models'
import { useFolderContent, useCreateFolder, useMoveToTrashFile, useMoveToTrashFolder, useRenameFile, useRenameFolder } from '../../../hooks'
import AlertDialog from '../../../components/AlertDialog'
import CreateFolderDialog from './CreateFolderDialog'
import RenameDialog from './RenameDialog'
import ActionPanel, { type Action } from '../../../components/ActionPanel'
import FileUploadProgress from './FileUploadProgress'
import FileUploader, { type ProgressData } from './FileUploader'
import FileBrowserActionBar, { type PathSegment } from './FileBrowserActionBar'
import { useToast, ToastType } from '../../../components/Toast'
import { formatBytes, formatLastModified, getErrorMessage } from '../../../util/helper'
import {
  FaFolderPlus,
  FaFolder,
  FaFolderOpen,
  FaFileLines,
  FaChevronUp,
  FaChevronDown,
  FaEllipsisVertical,
  FaXmark,
  FaPenToSquare,
  FaDownload,
  FaShareNodes,
  FaTrashCan,
  FaSpinner,
} from 'react-icons/fa6'

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
  const { data: apiFolderData, isLoading, isError, error: folderError } = useFolderContent(currentFolderId)
  const createFolderMutation = useCreateFolder()
  const moveToTrashFileMutation = useMoveToTrashFile()
  const moveToTrashFolderMutation = useMoveToTrashFolder()
  const renameFileMutation = useRenameFile()
  const renameFolderMutation = useRenameFolder()

  // Show Toast notification when fetch fails
  useEffect(() => {
    if (isError) {
      showToast(
        getErrorMessage(folderError, 'Failed to fetch folder content'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }, [isError, folderError, showToast])

  // Create Folder State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)

  // File Upload Progress State
  const [uploads, setUploads] = useState<ProgressData[]>([])

  // TanStack Table Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Open item state for right detail panel and right panel actions
  const [openRightPanelItem, setOpenRightPanelItem] = useState<FolderChildren | null>(null)

  // Dialog visibility states for right panel actions
  const [isMoveToTrashDialogOpen, setIsMoveToTrashDialogOpen] = useState<boolean>(false)
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
          showToast(
            'Download link is not available.',
            ToastType.DANGER,
          )
        }
        break
      case 'share':
        const fullPath =
          folderData.abs_path === '/' ? `/${openRightPanelItem.name}` : `${folderData.abs_path}/${openRightPanelItem.name}`
        if (navigator.clipboard) {
          navigator.clipboard.writeText(openRightPanelItem.content_url || fullPath)
        }
        showToast(
          `Copied path/link for "${openRightPanelItem.name}"`,
          ToastType.SUCCESS,
        )
        break
      case 'moveToTrash':
        setIsMoveToTrashDialogOpen(true)
        break
      default:
        break
    }
  }

  // Construct actions list based on open right panel item type
  const panelActions: Action[] = useMemo(() => {
    if (!openRightPanelItem) return []

    const isPending = moveToTrashFileMutation.isPending || moveToTrashFolderMutation.isPending || renameFileMutation.isPending || renameFolderMutation.isPending
    const isFile = openRightPanelItem.type === FolderChildrenType.FILE

    const renameAction: Action = {
      id: 'rename',
      label: 'Rename',
      icon: <FaPenToSquare className="w-4 h-4" />,
    }

    const downloadAction: Action = {
      id: 'download',
      label: 'Download',
      icon: <FaDownload className="w-4 h-4" />,
    }

    const shareAction: Action = {
      id: 'share',
      label: 'Share',
      icon: <FaShareNodes className="w-4 h-4" />,
    }

    const moveToTrashAction: Action = {
      id: 'moveToTrash',
      label: 'Move to Trash',
      icon: <FaTrashCan className="w-4 h-4" />,
      color: 'danger',
      enabled: !isPending,
    }

    if (isFile) {
      return [renameAction, downloadAction, shareAction, moveToTrashAction]
    } else {
      return [renameAction, shareAction, moveToTrashAction]
    }
  }, [openRightPanelItem, moveToTrashFileMutation.isPending, moveToTrashFolderMutation.isPending, renameFileMutation.isPending, renameFolderMutation.isPending])

  // Handle Rename submit
  const handleRenameSubmit = async (newName: string) => {
    if (!openRightPanelItem) return
    const trimmedName = newName.trim()

    if (!trimmedName) {
      showToast(
        'Name is required.',
        ToastType.DANGER,
        { label: 'Ok' },
      )
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

      showToast(
        `Renamed to "${trimmedName}"`,
        ToastType.SUCCESS,
      )
    } catch (err: any) {
      showToast(
        getErrorMessage(err, `Failed to rename ${isFolder ? 'folder' : 'file'}.`),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }

  // Handle Create Folder submit
  const handleCreateFolderSubmit = async (folderName: string) => {
    if (!folderName.trim()) {
      showToast(
        'Folder name is required.',
        ToastType.DANGER,
        { label: 'Ok' },
      )
      return
    }

    try {
      await createFolderMutation.mutateAsync({
        parent_folder_id: currentFolderId,
        name: folderName.trim(),
      })
      setIsCreateFolderOpen(false)
      queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
      showToast(
        `Folder "${folderName.trim()}" created successfully`,
        ToastType.SUCCESS,
      )
    } catch (err: any) {
      showToast(
        getErrorMessage(err, 'Failed to create folder.'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }



  // Navigation handlers
  const handleNavigateToFolder = (item: FolderChildren) => {
    setCurrentFolderId(item.id)
    setFolderStack((prev) => [...prev, { id: item.id, label: item.name }])
    setOpenRightPanelItem(null)
  }

  const handleUp = () => {
    if (folderStack.length > 1) {
      const parent = folderStack[folderStack.length - 2]
      setCurrentFolderId(parent.id)
      setFolderStack((prev) => prev.slice(0, -1))
      setOpenRightPanelItem(null)
    }
  }

  const currentPathSegments: PathSegment[] = useMemo(
    () =>
      folderStack.map((crumb) => ({
        id: crumb.id,
        label: crumb.label,
      })),
    [folderStack]
  )

  const handlePathSegmentClick = (segmentId: string | null, index: number) => {
    setCurrentFolderId(segmentId)
    setFolderStack((prev) => prev.slice(0, index + 1))
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
              {isFolder ? (
                <FaFolder className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <FaFileLines className="w-5 h-5 text-blue-500 shrink-0" />
              )}
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
                <FaEllipsisVertical className="w-4 h-4" />
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
    <div className="flex-1 w-full flex flex-col md:flex-row gap-4 min-h-0 h-full overflow-hidden">
      <div className="bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col flex-1 overflow-hidden min-w-0">
        {/* ---------------------------------------------------------- */}
        {/* 2A. TOP FIXED SECTION: File Browser Action Bar & Path       */}
        {/* ---------------------------------------------------------- */}
        <FileBrowserActionBar
          currentPath={currentPathSegments}
          onUp={handleUp}
          onClickPathSegment={handlePathSegmentClick}
          isUpDisabled={folderStack.length <= 1}
        >
          <FileUploader
            folderId={currentFolderId}
            onProgressUpdate={setUploads}
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })}
          />
          <button
            type="button"
            onClick={() => setIsCreateFolderOpen(true)}
            title="Create Folder"
            aria-label="Create Folder"
            className="p-1.5 rounded-lg text-drive-text-subtle hover:text-drive-primary hover:bg-drive-surface-variant border border-drive-border transition-colors cursor-pointer flex items-center justify-center"
          >
            <FaFolderPlus className="w-5 h-5" />
          </button>
        </FileBrowserActionBar>


        {/* ---------------------------------------------------------- */}
        {/* 2B. BOTTOM SECTION: Folder Content Table (TanStack Table)   */}
        {/* ---------------------------------------------------------- */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-3">
              <FaSpinner className="w-8 h-8 text-drive-primary animate-spin" />
              <p className="text-sm font-medium">Loading folder content...</p>
            </div>
          ) : folderData.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-2">
              <FaFolderOpen className="text-5xl text-drive-text-muted mb-2" />
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
                            asc: <FaChevronUp className="w-3 h-3 text-drive-primary inline ml-1" />,
                            desc: <FaChevronDown className="w-3 h-3 text-drive-primary inline ml-1" />,
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
                <FaXmark className="w-5 h-5" />
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

      {/* Move to Trash Confirmation Modal */}
      {isMoveToTrashDialogOpen && openRightPanelItem && (
        <AlertDialog
          titleLabel="Confirm Move to Trash"
          yesButtonLabel="No"
          noButtonLabel="Yes"
          onDismiss={() => setIsMoveToTrashDialogOpen(false)}
          onClickYes={() => setIsMoveToTrashDialogOpen(false)}
          onClickNo={async () => {
            const target = openRightPanelItem
            setIsMoveToTrashDialogOpen(false)
            if (target.type === FolderChildrenType.FILE) {
              try {
                await moveToTrashFileMutation.mutateAsync(target.id)
                setOpenRightPanelItem(null)
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
                showToast(
                  `${target.name} moved to trash`,
                  ToastType.SUCCESS,
                )
              } catch (err: any) {
                showToast(
                  getErrorMessage(err, 'Failed to move file to trash.'),
                  ToastType.DANGER,
                  { label: 'Ok' },
                )
              }
            } else if (target.type === FolderChildrenType.FOLDER) {
              try {
                await moveToTrashFolderMutation.mutateAsync(target.id)
                setOpenRightPanelItem(null)
                queryClient.invalidateQueries({ queryKey: ['folderContent', currentFolderId] })
                showToast(
                  `${target.name} moved to trash`,
                  ToastType.SUCCESS,
                )
              } catch (err: any) {
                showToast(
                  getErrorMessage(err, 'Failed to move folder to trash.'),
                  ToastType.DANGER,
                  { label: 'Ok' },
                )
              }
            }
          }}
        >
          <p className="text-sm text-drive-text leading-relaxed">
            Are you sure you want to move <strong className="font-bold text-drive-text">{openRightPanelItem.name}</strong> ({folderData.abs_path === '/' ? `/${openRightPanelItem.name}` : `${folderData.abs_path}/${openRightPanelItem.name}`}) to trash?
          </p>
        </AlertDialog>
      )}

      {/* File Upload Progress Drawer */}
      <FileUploadProgress uploads={uploads} />
    </div>
  )
}

export default FileBrowser
