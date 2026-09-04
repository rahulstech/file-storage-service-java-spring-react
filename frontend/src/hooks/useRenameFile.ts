import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FileResponse } from '../models'

export interface RenameFileParams {
  fileId: string
  name: string
}

export function useRenameFile() {
  return useMutation<FileResponse, Error, RenameFileParams>({
    mutationFn: ({ fileId, name }: RenameFileParams) => api.renameFile(fileId, name),
  })
}
