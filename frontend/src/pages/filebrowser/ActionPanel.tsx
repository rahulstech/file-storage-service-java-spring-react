import React from 'react'
import { FolderChildrenType, type FolderChildren } from '../../models'

interface ActionPanelProps {
  selectedItem: FolderChildren | null
  onClose: () => void
  absPath: string
  isDeletingPending?: boolean
  onDeleteClick: (item: FolderChildren) => void
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedItem,
  onClose,
  absPath,
  isDeletingPending,
  onDeleteClick,
}) => {
  if (!selectedItem) return null

  const fullPath = absPath === '/' ? `/${selectedItem.name}` : `${absPath}/${selectedItem.name}`

  return (
    <aside className="w-full md:w-80 bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col overflow-hidden shrink-0 transition-all duration-200">
      {/* Top Section */}
      <div className="p-4 border-b border-drive-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-drive-text-subtle">Details</span>
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            className="p-1 rounded-lg text-drive-text-subtle hover:text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-base text-drive-text break-all">
            {selectedItem.name}
          </div>
          <div className="text-xs text-drive-text-subtle font-mono break-all">
            {fullPath}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-drive-text-subtle mb-1">Actions</span>
        
        {/* Delete (for file and folder) */}
        <button
          type="button"
          disabled={isDeletingPending}
          onClick={() => onDeleteClick(selectedItem)}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors cursor-pointer border-0 text-left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Delete
        </button>

        {/* Download (for file only) */}
        {selectedItem.type === FolderChildrenType.FILE && (
          <a
            href={selectedItem.content_url || '#'}
            download={selectedItem.name}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!selectedItem.content_url) {
                e.preventDefault()
              }
            }}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4 text-drive-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </a>
        )}

        {/* Share (for file and folder) */}
        <button
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(selectedItem.content_url || fullPath)
            }
            alert(`Copied path/link for "${selectedItem.name}"`)
          }}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer border-0 text-left"
        >
          <svg className="w-4 h-4 text-drive-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </button>
      </div>
    </aside>
  )
}

export default ActionPanel
