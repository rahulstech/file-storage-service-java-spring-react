import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { CreateFolderRequest, CreateFolderResponse } from '../models'

export function useCreateFolder() {
  return useMutation<CreateFolderResponse, Error, CreateFolderRequest>({
    mutationFn: (request: CreateFolderRequest) => api.createFolder(request),
  })
}
