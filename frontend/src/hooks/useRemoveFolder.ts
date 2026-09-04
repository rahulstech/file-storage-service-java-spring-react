import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

export function useRemoveFolder() {
  return useMutation<void, Error, string>({
    mutationFn: (folderId: string) => api.removeFolder(folderId),
  })
}
