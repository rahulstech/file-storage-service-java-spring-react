import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrashRequest } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useRestoreFromTrash() {
  const { user } = useAuthContext()
  return useMutation<void, Error, TrashRequest>({
    mutationFn: (request: TrashRequest) => api.restoreFromTrash(request, user.authToken),
  })
}
