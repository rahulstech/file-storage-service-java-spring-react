import axios from 'axios'
import type {
  FolderData,
  AddFileRequest,
  AddFileResponse,
  FileResponse,
  CreateFolderRequest,
  CreateFolderResponse,
  FolderResponse,
  TrashRequest,
  TrashResponse,
} from '../models'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = {
  /**
   * Fetches folder content.
   * If folderId is null or empty, calls root endpoint /api/folders/root/listContent.
   * Otherwise, calls /api/folders/{folderId}/listContent.
   */
  async getFolderContent(folderId: string | null): Promise<FolderData> {
    const url = folderId
      ? `/api/folders/${folderId}/listContent`
      : '/api/folders/root/listContent'
    const response = await apiClient.get<FolderData>(url)
    return response.data
  },

  /**
   * Creates a new folder.
   * Calls POST /api/folders/createFolder
   */
  async createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse> {
    const response = await apiClient.post<CreateFolderResponse>('/api/folders/createFolder', request)
    return response.data
  },

  /**
   * Initiates adding a single file.
   * Calls POST /api/files/addSingle
   */
  async addSingleFile(request: AddFileRequest): Promise<AddFileResponse> {
    const response = await apiClient.post<AddFileResponse>('/api/files/addSingle', request)
    return response.data
  },

  /**
   * Uploads raw binary file content to the target upload URL.
   */
  async uploadFileToUrl(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress?.(percent)
        }
      },
    })
  },

  /**
   * Confirms file upload completion.
   * Calls PUT /api/files/{fileId}/confirmUpload
   */
  async confirmFileUpload(fileId: string): Promise<FileResponse> {
    const response = await apiClient.put<FileResponse>(`/api/files/${fileId}/confirmUpload`)
    return response.data
  },

  /**
   * Moves a file to trash.
   * Calls DELETE /api/files/{fileId}/moveToTrash
   */
  async moveToTrashFile(fileId: string): Promise<void> {
    await apiClient.delete(`/api/files/${fileId}/moveToTrash`)
  },

  /**
   * Moves a folder to trash.
   * Calls DELETE /api/folders/{folderId}/moveToTrash
   */
  async moveToTrashFolder(folderId: string): Promise<void> {
    await apiClient.delete(`/api/folders/${folderId}/moveToTrash`)
  },

  /**
   * Renames a file.
   * Calls PATCH /api/files/{fileId}/renameFile
   */
  async renameFile(fileId: string, name: string): Promise<FileResponse> {
    const response = await apiClient.patch<FileResponse>(`/api/files/${fileId}/renameFile`, { name })
    return response.data
  },

  /**
   * Renames a folder.
   * Calls PATCH /api/folders/{folderId}/renameFolder
   */
  async renameFolder(folderId: string, name: string): Promise<FolderResponse> {
    const response = await apiClient.patch<FolderResponse>(`/api/folders/${folderId}/renameFolder`, { name })
    return response.data
  },

  /**
   * Fetches trash content.
   * Calls GET /api/trash/listContent
   */
  async getTrashContent(): Promise<TrashResponse[]> {
    const response = await apiClient.get<TrashResponse[]>('/api/trash/listContent')
    return response.data
  },

  /**
   * Restores a file or folder from trash.
   * Calls POST /api/trash/restore
   */
  async restoreFromTrash(request: TrashRequest): Promise<void> {
    await apiClient.post('/api/trash/restore', request)
  },

  /**
   * Permanently removes a file or folder from trash.
   * Calls DELETE /api/trash/remove
   */
  async removeFromTrash(request: TrashRequest): Promise<void> {
    await apiClient.delete('/api/trash/remove', { data: request })
  },
}
