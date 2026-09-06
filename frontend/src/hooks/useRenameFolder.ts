import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FolderResponse, RenameFolderRequest } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useRenameFolder() {
  const { user } = useAuthContext()
  return useMutation<FolderResponse, Error, RenameFolderRequest>({
    mutationFn: (body) => api.renameFolder(body, user!!.authToken),
  })
}
