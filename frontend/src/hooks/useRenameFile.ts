import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FileResponse, RenameFileRequest } from '../models'
import { useAuthContext } from '../contexts/AuthContext'


export function useRenameFile() {
  const { user } = useAuthContext()
  return useMutation<FileResponse, Error, RenameFileRequest>({
    mutationFn: (request: RenameFileRequest) => api.renameFile(request, user.authToken),
  })
}
