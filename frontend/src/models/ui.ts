export interface FolderChildren {
  id: string
  type: 'FILE' | 'FOLDER'
  name: string
  size_bytes: number | null
  updated_at: string
}

export interface FolderData {
  folder_id: string | null
  abs_path: string
  children: FolderChildren[]
}
