import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import type { FileResponse } from '../models'
import { useAuthContext } from '../contexts/AuthContext'

export function useConfirmFileUpload() {
  const { user } = useAuthContext()
  return useMutation<FileResponse, Error, string>({
    mutationFn: (fileId: string) => api.confirmFileUpload(fileId, user.authToken),
  })
}
