import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FolderResponse } from '../models'

export interface RenameFolderParams {
  folderId: string
  name: string
}

export function useRenameFolder() {
  return useMutation<FolderResponse, Error, RenameFolderParams>({
    mutationFn: ({ folderId, name }: RenameFolderParams) => api.renameFolder(folderId, name),
  })
}
