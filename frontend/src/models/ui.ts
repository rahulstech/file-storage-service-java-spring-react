export const FolderChildrenType = {
  FILE: 'FILE',
  FOLDER: 'FOLDER',
} as const

export type FolderChildrenType = (typeof FolderChildrenType)[keyof typeof FolderChildrenType]

export interface FolderChildren {
  id: string
  type: FolderChildrenType
  name: string
  size_bytes: number | null
  content_url: string | null
  updated_at: string
}

export interface FolderData {
  folder_id: string | null
  abs_path: string
  children: FolderChildren[]
}

export interface FieldState {
    value: any;
    error?: string;
}