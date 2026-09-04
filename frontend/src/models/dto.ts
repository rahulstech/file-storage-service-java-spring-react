export interface AddFileRequest {
  folder_id: string | null
  file_name: string
  size_bytes: number
  mime_type: string
}

export interface AddFileResponse {
  upload_url: string
  file_id: string
}

export interface ConfirmFileUploadRequest {
  file_id: string
}

export interface FileResponse {
  file_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  cdn_uri: string
  updated_at: string
}

export interface CreateFolderRequest {
  parent_folder_id: string | null
  name: string
}

export interface CreateFolderResponse {
  folder_id: string
  name: string
  abs_path: string
}

export interface FolderResponse {
  folder_id: string
  name: string
  abs_path: string
}

export interface RenameFileRequest {
  name: string
}

export interface RenameFolderRequest {
  name: string
}

