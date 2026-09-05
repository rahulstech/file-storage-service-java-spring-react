import React from 'react'
import { FaArrowLeft } from 'react-icons/fa6'

export interface PathSegment {
  id?: string | null
  label: string
}

export interface FileBrowserActionBarProps {
  /** Current path represented as an array of path segments */
  currentPath: PathSegment[]
  /** Back handler callback to navigate to previous/parent folder */
  onUp: () => void
  /** Optional callback when a path segment is clicked, receiving segment id and index */
  onClickPathSegment?: (id: string | null, index: number) => void
  /** Optional flag to explicitly control whether back button is disabled */
  isUpDisabled?: boolean
  /** Optional right-aligned actions (e.g., action buttons) */
  children?: React.ReactNode
}

export function FileBrowserActionBar({
  currentPath,
  onUp,
  onClickPathSegment,
  isUpDisabled,
  children,
}: FileBrowserActionBarProps) {
  // Determine if up navigation is disabled
  const disabled =
    isUpDisabled !== undefined
      ? isUpDisabled
      : currentPath.length <= 1

  return (
    <div className="sticky top-0 z-10 bg-drive-surface border-b border-drive-border px-5 py-3.5 flex items-center justify-between gap-3">
      {/* Left section: Back Arrow & Document Path */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          disabled={disabled}
          onClick={onUp}
          title="Go back / Up one level"
          aria-label="Go back / Up one level"
          className="p-1.5 rounded-lg text-drive-text-subtle hover:text-drive-primary hover:bg-drive-surface-variant border border-drive-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>

        {/* Document Path Component */}
        <div className="flex items-center flex-wrap gap-2 text-sm font-medium">
          {currentPath.map((crumb, idx) => (
            <React.Fragment key={crumb.id ?? `${crumb.label}-${idx}`}>
              {idx > 0 && <span className="text-drive-text-muted font-bold select-none">&gt;</span>}
              {onClickPathSegment ? (
                <button
                  type="button"
                  onClick={() => onClickPathSegment(crumb.id ?? null, idx)}
                  className={`px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer ${
                    idx === currentPath.length - 1
                      ? 'bg-drive-active text-drive-active-text font-bold'
                      : 'text-drive-primary hover:bg-drive-surface-variant hover:underline'
                  }`}
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={`px-2 py-1 rounded-lg text-sm ${
                    idx === currentPath.length - 1
                      ? 'bg-drive-active text-drive-active-text font-bold'
                      : 'text-drive-text-subtle'
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right section: Actions */}
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}

export default FileBrowserActionBar
