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
import type { TrashResponse } from '../../../models'
import {
  useTrashContent,
  useRestoreFromTrash,
  useRemoveFromTrash,
} from '../../../hooks'
import AlertDialog from '../../../components/AlertDialog'
import ActionPanel, { type Action } from '../../../components/ActionPanel'
import FileBrowserActionBar, { type PathSegment } from '../../home/filebrowser/FileBrowserActionBar'
import { useToast, ToastType } from '../../../components/Toast'
import { getErrorMessage } from '../../../util/helper'
import {
  FaFolder,
  FaFileLines,
  FaChevronUp,
  FaChevronDown,
  FaEllipsisVertical,
  FaXmark,
  FaTrashCan,
  FaRotateLeft,
  FaSpinner,
  FaTrash,
} from 'react-icons/fa6'

const columnHelper = createColumnHelper<TrashResponse>()

export function TrashBrowser() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Fetch trash items from backend
  const { data: trashItems = [], isLoading, isError, error: trashError } = useTrashContent()

  // Mutations
  const restoreMutation = useRestoreFromTrash()
  const removePermanentlyMutation = useRemoveFromTrash()

  // Show toast on fetch error
  useEffect(() => {
    if (isError) {
      showToast(
        getErrorMessage(trashError, 'Failed to load trash content'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }, [isError, trashError, showToast])

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Open right detail panel state
  const [openRightPanelItem, setOpenRightPanelItem] = useState<TrashResponse | null>(null)

  // Dialog visibility state for permanent deletion
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState<boolean>(false)

  // Current path segments for action bar
  const pathSegments: PathSegment[] = useMemo(() => [{ id: 'trash', label: 'Trash' }], [])

  // Handle panel action clicks
  const handleAction = async (actionId: string) => {
    if (!openRightPanelItem) return

    switch (actionId) {
      case 'restore':
        await handleRestore(openRightPanelItem)
        break
      case 'removePermanently':
        setIsRemoveDialogOpen(true)
        break
      default:
        break
    }
  }

  // Restore item handler
  const handleRestore = async (item: TrashResponse) => {
    try {
      await restoreMutation.mutateAsync({
        id: item.id,
        type: item.type,
      })
      setOpenRightPanelItem(null)
      queryClient.invalidateQueries({ queryKey: ['trashContent'] })
      queryClient.invalidateQueries({ queryKey: ['folderContent'] })
      showToast(
        `"${item.name}" restored successfully`,
        ToastType.SUCCESS,
      )
    } catch (err: any) {
      showToast(
        getErrorMessage(err, 'Failed to restore item.'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }

  // Permanent remove item handler
  const handleRemovePermanently = async () => {
    if (!openRightPanelItem) return
    const item = openRightPanelItem
    setIsRemoveDialogOpen(false)

    try {
      await removePermanentlyMutation.mutateAsync({
        id: item.id,
        type: item.type,
      })
      setOpenRightPanelItem(null)
      queryClient.invalidateQueries({ queryKey: ['trashContent'] })
      showToast(
        `"${item.name}" permanently deleted`,
        ToastType.SUCCESS,
      )
    } catch (err: any) {
      showToast(
        getErrorMessage(err, 'Failed to permanently delete item.'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }

  // Action items for right detail panel
  const panelActions: Action[] = useMemo(() => {
    if (!openRightPanelItem) return []

    const isPending = restoreMutation.isPending || removePermanentlyMutation.isPending

    const restoreAction: Action = {
      id: 'restore',
      label: 'Restore',
      icon: <FaRotateLeft className="w-4 h-4" />,
      enabled: !isPending,
    }

    const removePermanentlyAction: Action = {
      id: 'removePermanently',
      label: 'Remove Permanently',
      icon: <FaTrashCan className="w-4 h-4" />,
      color: 'danger',
      enabled: !isPending,
    }

    return [restoreAction, removePermanentlyAction]
  }, [openRightPanelItem, restoreMutation.isPending, removePermanentlyMutation.isPending])

  // Table columns definition
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const item = info.row.original
          const isFolder = item.type?.toUpperCase() === 'FOLDER'

          return (
            <div className="flex items-center gap-3">
              {isFolder ? (
                <FaFolder className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <FaFileLines className="w-5 h-5 text-blue-500 shrink-0" />
              )}
              <span className="font-medium text-drive-text">{item.name}</span>
            </div>
          )
        },
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
    data: trashItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row gap-4 min-h-0 h-full overflow-hidden">
      <div className="bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Action Bar / Path */}
        <FileBrowserActionBar
          currentPath={pathSegments}
          onUp={() => { }}
          isUpDisabled={true}
        />

        {/* Table / Content */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-3">
              <FaSpinner className="w-8 h-8 text-drive-primary animate-spin" />
              <p className="text-sm font-medium">Loading trash content...</p>
            </div>
          ) : trashItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-drive-text-muted space-y-2">
              <FaTrash className="text-5xl text-drive-text-muted mb-2" />
              <p className="text-sm font-medium">Trash is empty.</p>
              <p className="text-xs text-drive-text-subtle">Items moved to trash will appear here</p>
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

      {/* Right Detail / Action Panel */}
      {openRightPanelItem && (
        <ActionPanel actions={panelActions} onAction={handleAction}>
          <div className="p-4 border-b border-drive-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-drive-text-subtle">
                Trash Item Details
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
            </div>
          </div>
        </ActionPanel>
      )}

      {/* Remove Permanently Confirmation Modal */}
      {isRemoveDialogOpen && openRightPanelItem && (
        <AlertDialog
          titleLabel="Confirm Permanent Deletion"
          yesButtonLabel="No"
          noButtonLabel="Yes"
          onDismiss={() => setIsRemoveDialogOpen(false)}
          onClickYes={() => setIsRemoveDialogOpen(false)}
          onClickNo={handleRemovePermanently}
        >
          <p className="text-sm text-drive-text leading-relaxed">
            Are you sure you want to permanently delete <strong className="font-bold text-drive-text">{openRightPanelItem.name}</strong>? This action cannot be undone.
          </p>
        </AlertDialog>
      )}
    </div>
  )
}

export default TrashBrowser
