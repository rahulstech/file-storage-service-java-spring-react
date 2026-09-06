import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { AddFileRequest, AddFileResponse } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useAddSingleFile() {
  const { user } = useAuthContext()

  return useMutation<AddFileResponse, Error, AddFileRequest>({
    mutationFn: (request: AddFileRequest) => api.addSingleFile(request, user.authToken),
  })
}
