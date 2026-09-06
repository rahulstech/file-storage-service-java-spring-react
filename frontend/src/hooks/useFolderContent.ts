import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FolderData } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useFolderContent(folderId: string | null) {
  const { user } = useAuthContext()
  return useQuery<FolderData, Error>({
    queryKey: ['folderContent', folderId],
    queryFn: () => api.getFolderContent(folderId, user.authToken),
  })
}
