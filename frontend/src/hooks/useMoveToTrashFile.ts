import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuthContext } from '../contexts/AuthContext'

export function useMoveToTrashFile() {
  const { user } = useAuthContext()
  return useMutation<void, Error, string>({
    mutationFn: (fileId: string) => api.moveToTrashFile(fileId, user!!.authToken),
  })
}
