import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrashRequest } from '../models'

export function useRestoreFromTrash() {
  return useMutation<void, Error, TrashRequest>({
    mutationFn: (request: TrashRequest) => api.restoreFromTrash(request),
  })
}
