import axios from 'axios'
import type {
  FolderData,
  AddFileRequest,
  AddFileResponse,
  FileResponse,
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
  async uploadFileToUrl(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
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
}
