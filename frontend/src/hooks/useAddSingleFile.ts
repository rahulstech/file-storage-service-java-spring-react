import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { AddFileRequest, AddFileResponse } from '../models'

export function useAddSingleFile() {
  return useMutation<AddFileResponse, Error, AddFileRequest>({
    mutationFn: (request: AddFileRequest) => api.addSingleFile(request),
  })
}
