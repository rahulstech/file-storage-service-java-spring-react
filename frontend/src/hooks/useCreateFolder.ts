import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { CreateFolderRequest, CreateFolderResponse } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useCreateFolder() {
  const { user } = useAuthContext()
  return useMutation<CreateFolderResponse, Error, CreateFolderRequest>({
    mutationFn: (request: CreateFolderRequest) => api.createFolder(request, user!!.authToken),
  })
}
