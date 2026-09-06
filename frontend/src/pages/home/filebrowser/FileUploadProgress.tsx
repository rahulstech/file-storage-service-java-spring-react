import React from 'react'
import { FaXmark } from 'react-icons/fa6'

export interface UploadItem {
  id: string
  fileName: string
  fileSize: number // in bytes
  progress: number // percentage 0 - 100
}

interface FileUploadProgressProps {
  uploads: UploadItem[]
  onCancel?: (id: string) => void
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

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  uploads,
  onCancel,
}) => {
  if (!uploads || uploads.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-15 w-80 md:w-96 bg-drive-surface border border-drive-border rounded-2xl shadow-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between border-b border-drive-border pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-drive-text-subtle">
          Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
        </h4>
      </div>

      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
        {uploads.map((item) => (
          <div key={item.id} className="flex flex-col gap-1.5 text-drive-text">
            {/* Top Line: Name and Human Readable Size (Vertically above progress line) */}
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="truncate max-w-52.5 text-drive-text font-medium" title={item.fileName}>
                {item.fileName}
              </span>
              <span className="text-drive-text-subtle text-[11px] font-mono shrink-0 ml-2">
                {formatBytes(item.fileSize)}
              </span>
            </div>

            {/* Bottom Line: Percentage, Progress Bar, and Cancel Button (Horizontally on the same line) */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-drive-primary w-8 text-right shrink-0">
                {Math.min(100, Math.max(0, Math.round(item.progress)))}%
              </span>

              {/* Progress Bar (Semi-transparent primary track & primary progress fill with identical thickness) */}
              <div className="flex-1 h-2 rounded-full bg-drive-primary/25 overflow-hidden">
                <div
                  className="h-full bg-drive-primary transition-all duration-150 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </div>

              {/* Cancel Icon Button */}
              <button
                type="button"
                onClick={() => onCancel?.(item.id)}
                title="Cancel upload"
                className="p-1 rounded-lg text-drive-text-subtle hover:text-drive-text hover:bg-drive-surface-variant transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
              >
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileUploadProgress
