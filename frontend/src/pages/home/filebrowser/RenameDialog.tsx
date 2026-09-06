import React, { useState } from 'react'
import AlertDialog from '../../../components/AlertDialog'

interface RenameDialogProps {
  initialName: string
  isFolder: boolean
  onDismiss: () => void
  onRenameClick: (newName: string) => void
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  initialName,
  isFolder,
  onDismiss,
  onRenameClick,
}) => {
  const [name, setName] = useState<string>(initialName)

  const handleRename = () => {
    onRenameClick(name)
  }

  return (
    <AlertDialog
      onDismiss={onDismiss}
      titleLabel={isFolder ? 'Rename Folder' : 'Rename File'}
      yesButtonLabel="Save"
      noButtonLabel="Cancel"
      onClickYes={handleRename}
      onClickNo={onDismiss}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="rename-input" className="block text-xs font-semibold text-drive-text-subtle mb-1.5">
            {isFolder ? 'Folder Name' : 'File Name'}
          </label>
          <input
            id="rename-input"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleRename()
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-drive-border bg-drive-bg text-drive-text text-sm focus:outline-none focus:ring-2 focus:ring-drive-primary/30 focus:border-drive-primary transition-all"
          />
        </div>
      </div>
    </AlertDialog>
  )
}

export default RenameDialog
