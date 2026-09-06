import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrashResponse } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useTrashContent() {
  const { user } = useAuthContext()
  return useQuery<TrashResponse[], Error>({
    queryKey: ['trashContent'],
    queryFn: () => api.getTrashContent(user!!.authToken),
  })
}
