import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { TrashResponse } from '../models'

export function useTrashContent() {
  return useQuery<TrashResponse[], Error>({
    queryKey: ['trashContent'],
    queryFn: () => api.getTrashContent(),
  })
}
