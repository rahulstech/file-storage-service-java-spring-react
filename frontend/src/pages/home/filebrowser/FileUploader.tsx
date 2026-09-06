import React, { useState, useEffect, useRef } from 'react'
import { FaUpload, FaSpinner } from 'react-icons/fa6'
import { useAddSingleFile, useConfirmFileUpload } from '../../../hooks'
import { api } from '../../../services/api'
import { useToast, ToastType } from '../../../components/Toast'
import { formatBytes, getErrorMessage } from '../../../util/helper'

export interface ProgressData {
  id: string
  fileName: string
  fileSize: number
  progress: number
}

export interface FileUploaderProps {
  folderId: string | null
  onProgressUpdate?: (progressList: ProgressData[]) => void
  onUploadSuccess?: () => void
}

// Maximum allowed upload file size: 512 MB
const MAX_FILE_SIZE = 512 * 1024 * 1024

// Allowed MIME type prefixes, exact types, and file extensions
const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/', 'text/']
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])
const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico',
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
  'mp4', 'webm', 'mkv', 'avi', 'mov', 'flv',
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'xls', 'xlsx', 'csv',
  'ppt', 'pptx',
  'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx',
  'zip', 'rar', '7z', 'tar', 'gz',
])

function isFileTypeSupported(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (mime && (ALLOWED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix)) || ALLOWED_MIME_TYPES.has(mime))) {
    return true
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_EXTENSIONS.has(ext)
}


export const FileUploader: React.FC<FileUploaderProps> = ({
  folderId,
  onProgressUpdate,
  onUploadSuccess,
}) => {
  const { showToast } = useToast()
  const addSingleFileMutation = useAddSingleFile()
  const confirmFileUploadMutation = useConfirmFileUpload()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploads, setUploads] = useState<ProgressData[]>([])

  // Store latest onProgressUpdate callback ref
  const onProgressUpdateRef = useRef(onProgressUpdate)
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate
  }, [onProgressUpdate])

  // Call progress callback whenever uploads list updates
  useEffect(() => {
    onProgressUpdateRef.current?.(uploads)
  }, [uploads])

  const startFileUpload = async (file: File) => {
    // 1. File Size Validation (Max 512MB)
    if (file.size > MAX_FILE_SIZE) {
      showToast(
        `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 512MB.`,
        ToastType.DANGER,
        { label: 'Ok' },
      )
      return
    }

    // 2. File Type Validation
    if (!isFileTypeSupported(file)) {
      showToast(
        'Unsupported file format. Please select an image, audio, video, document, spreadsheet, or presentation.',
        ToastType.DANGER,
        { label: 'Ok' },
      )
      return
    }

    const uploadId = String(Date.now())
    const newUploadItem: ProgressData = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
    }

    setIsUploading(true)
    setUploads((prev) => [...prev, newUploadItem])

    try {
      // Step 1: Initiate upload
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 5 } : u)))
      const addRes = await addSingleFileMutation.mutateAsync({
        folder_id: folderId,
        file_name: file.name,
        size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
      })

      if (!addRes?.upload_url || !addRes?.file_id) {
        throw new Error('Invalid response received from server when starting upload.')
      }

      const fileId = addRes.file_id

      // Step 2: Upload file binary content
      await api.uploadFileToUrl(addRes.upload_url, file, (percent) => {
        const calculatedProgress = 5 + Math.round((percent * 90) / 100)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: calculatedProgress } : u)))
      })

      // Step 3: Confirm file upload
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 98 } : u)))
      await confirmFileUploadMutation.mutateAsync(fileId)

      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u)))

      // Reset selected file input
      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Trigger success callback
      onUploadSuccess?.()

      // Remove completed upload item after 1s delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      }, 1000)
    } catch (err: any) {
      showToast(
        getErrorMessage(err, 'Upload failed: Error occurred during upload'),
        ToastType.DANGER,
        { label: 'Ok' },
      )
      setUploads((prev) => prev.filter((u) => u.id !== uploadId))
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      startFileUpload(selectedFile)
    } else {
      showToast(
        'Please select a file to upload.',
        ToastType.DANGER,
        { label: 'Ok' },
      )
    }
  }

  return (
    <form onSubmit={handleUploadSubmit} className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-80">
        <input
          id="file-upload-input"
          type="file"
          disabled={isUploading}
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0]
              setSelectedFile(file)
              startFileUpload(file)
            }
          }}
          className="w-full text-xs text-drive-text-subtle file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-drive-surface-variant file:text-drive-primary hover:file:bg-drive-hover file:cursor-pointer cursor-pointer border border-drive-border rounded-xl bg-drive-bg p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-[10px] text-drive-text-muted mt-1 px-1">Max file size: 512MB</p>
      </div>
      <button
        type="submit"
        disabled={!selectedFile || isUploading}
        className="px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer bg-drive-primary hover:bg-drive-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white active:scale-95 flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <FaUpload className="w-4 h-4" />
            <span>Upload</span>
          </>
        )}
      </button>
    </form>
  )
}

export default FileUploader
