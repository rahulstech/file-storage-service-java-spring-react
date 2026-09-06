import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrashRequest } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useRemoveFromTrash() {
  const { user } = useAuthContext()
  return useMutation<void, Error, TrashRequest>({
    mutationFn: (request: TrashRequest) => api.removeFromTrash(request, user!!.authToken),
  })
}
