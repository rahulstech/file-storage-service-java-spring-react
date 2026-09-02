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
