import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

export function useRemoveFile() {
  return useMutation<void, Error, string>({
    mutationFn: (fileId: string) => api.removeFile(fileId),
  })
}
