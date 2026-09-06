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
  RegisterUserRequest,
  UserLogInResponse,
  UserLogInRequest,
  RenameFileRequest,
  RenameFolderRequest,
} from '../models'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

function getApiClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getApiAuthClient(authToken: string) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  })
}

export const api = {

  /**
   * Fetches folder content.
   * Calls GET /folders/{folderId}/listContent
   * or GET /folders/root/listContent
   */
  async getFolderContent(
    folderId: string | null,
    authToken: string
  ): Promise<FolderData> {

    const client = getApiAuthClient(authToken)

    const url = folderId
      ? `/folders/${folderId}/listContent`
      : '/folders/root/listContent'

    const response = await client.get<FolderData>(url)

    return response.data
  },

  /**
   * Creates a new folder.
   * Calls POST /folders/createFolder
   */
  async createFolder(
    request: CreateFolderRequest,
    authToken: string
  ): Promise<CreateFolderResponse> {

    const client = getApiAuthClient(authToken)

    const response = await client.post<CreateFolderResponse>(
      '/folders/createFolder',
      request
    )

    return response.data
  },

  /**
   * Initiates adding a single file.
   * Calls POST /files/addSingle
   */
  async addSingleFile(
    request: AddFileRequest,
    authToken: string
  ): Promise<AddFileResponse> {

    const client = getApiAuthClient(authToken)

    const response = await client.post<AddFileResponse>(
      '/files/addSingle',
      request
    )

    return response.data
  },

  /**
   * Uploads raw binary file content to a presigned upload URL.
   *
   * This request intentionally uses plain axios because the URL is
   * a presigned URL and should not receive the application's Bearer token.
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
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )

          onProgress?.(percent)
        }
      },
    })
  },

  /**
   * Confirms file upload completion.
   * Calls PUT /files/{fileId}/confirmUpload
   */
  async confirmFileUpload(
    fileId: string,
    authToken: string
  ): Promise<FileResponse> {

    const client = getApiAuthClient(authToken)

    const response = await client.put<FileResponse>(
      `/files/${fileId}/confirmUpload`
    )

    return response.data
  },

  /**
   * Moves a file to trash.
   * Calls DELETE /files/{fileId}/moveToTrash
   */
  async moveToTrashFile(
    fileId: string,
    authToken: string
  ): Promise<void> {

    const client = getApiAuthClient(authToken)

    await client.delete(`/files/${fileId}/moveToTrash`)
  },

  /**
   * Moves a folder to trash.
   * Calls DELETE /folders/{folderId}/moveToTrash
   */
  async moveToTrashFolder(
    folderId: string,
    authToken: string
  ): Promise<void> {

    const client = getApiAuthClient(authToken)

    await client.delete(`/folders/${folderId}/moveToTrash`)
  },

  /**
   * Renames a file.
   * Calls PATCH /files/{fileId}/renameFile
   */
  async renameFile(
    request: RenameFileRequest,
    authToken: string,
  ): Promise<FileResponse> {

    const client = getApiAuthClient(authToken)

    const response = await client.patch<FileResponse>(
      `/files/${request.fileId}/renameFile`,
      { name: request.name }
    )

    return response.data
  },

  /**
   * Renames a folder.
   * Calls PATCH /folders/{folderId}/renameFolder
   */
  async renameFolder(
    request: RenameFolderRequest,
    authToken: string,
  ): Promise<FolderResponse> {

    const client = getApiAuthClient(authToken)

    const response = await client.patch<FolderResponse>(
      `/folders/${request.folderId}/renameFolder`,
      { name: request.name }
    )

    return response.data
  },

  /**
   * Fetches trash content.
   * Calls GET /trash/listContent
   */
  async getTrashContent(
    authToken: string
  ): Promise<TrashResponse[]> {

    const client = getApiAuthClient(authToken)

    const response = await client.get<TrashResponse[]>(
      '/trash/listContent'
    )

    return response.data
  },

  /**
   * Restores a file or folder from trash.
   * Calls POST /trash/restore
   */
  async restoreFromTrash(
    request: TrashRequest,
    authToken: string
  ): Promise<void> {

    const client = getApiAuthClient(authToken)

    await client.post('/trash/restore', request)
  },

  /**
   * Permanently removes a file or folder from trash.
   * Calls DELETE /trash/remove
   */
  async removeFromTrash(
    request: TrashRequest,
    authToken: string
  ): Promise<void> {

    const client = getApiAuthClient(authToken)

    await client.delete('/trash/remove', {
      data: request,
    })
  },

  /**
   * Registers a new user.
   * Calls POST /auth/registerUser
   */
  async registerUser(
    request: RegisterUserRequest
  ): Promise<UserLogInResponse> {

    const client = getApiClient()

    const response = await client.post<UserLogInResponse>(
      '/auth/registerUser',
      request
    )

    return response.data
  },

  /**
   * Logs in a user.
   * Calls POST /auth/userLogIn
   */
  async userLogIn(
    request: UserLogInRequest
  ): Promise<UserLogInResponse> {

    const client = getApiClient()

    const response = await client.post<UserLogInResponse>(
      '/auth/userLogIn',
      request
    )

    return response.data
  },
}