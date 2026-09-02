import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FileResponse } from '../models'

export function useConfirmFileUpload() {
  return useMutation<FileResponse, Error, string>({
    mutationFn: (fileId: string) => api.confirmFileUpload(fileId),
  })
}
