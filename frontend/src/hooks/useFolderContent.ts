import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FolderData } from '../models'

export function useFolderContent(folderId: string | null) {
  return useQuery<FolderData, Error>({
    queryKey: ['folderContent', folderId],
    queryFn: () => api.getFolderContent(folderId),
  })
}
