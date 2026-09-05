import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

export function useMoveToTrashFile() {
  return useMutation<void, Error, string>({
    mutationFn: (fileId: string) => api.moveToTrashFile(fileId),
  })
}
