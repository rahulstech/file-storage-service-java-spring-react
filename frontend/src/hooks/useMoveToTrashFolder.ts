import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuthContext } from '../contexts/AuthContext'

export function useMoveToTrashFolder() {
  const { user } = useAuthContext()
  return useMutation<void, Error, string>({
    mutationFn: (folderId: string) => api.moveToTrashFolder(folderId, user!!.authToken),
  })
}
