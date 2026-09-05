import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

export function useMoveToTrashFolder() {
  return useMutation<void, Error, string>({
    mutationFn: (folderId: string) => api.moveToTrashFolder(folderId),
  })
}
