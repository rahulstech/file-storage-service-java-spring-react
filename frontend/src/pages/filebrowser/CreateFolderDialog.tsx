import React, { useState } from 'react'
import AlertDialog from '../../components/AlertDialog'

interface CreateFolderDialogProps {
  onDismiss: () => void
  onCreateClick: (folderName: string) => void
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  onDismiss,
  onCreateClick,
}) => {
  const [folderName, setFolderName] = useState<string>('')

  const handleCreate = () => {
    onCreateClick(folderName)
  }

  return (
    <AlertDialog
      onDismiss={onDismiss}
      titleLabel="New Folder"
      yesButtonLabel="Create"
      noButtonLabel="Cancel"
      onClickYes={handleCreate}
      onClickNo={onDismiss}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="folder-name-input" className="block text-xs font-semibold text-drive-text-subtle mb-1.5">
            Folder Name
          </label>
          <input
            id="folder-name-input"
            type="text"
            autoFocus
            placeholder="Untitled folder"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-drive-border bg-drive-bg text-drive-text text-sm focus:outline-none focus:ring-2 focus:ring-drive-primary/30 focus:border-drive-primary transition-all"
          />
        </div>
      </div>
    </AlertDialog>
  )
}

export default CreateFolderDialog
