import { Node, mergeAttributes } from '@tiptap/core'

// ── File type detection ──────────────────────────────────
export function detectFileType(mimeType, fileName) {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf') return 'pdf'
  }
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (!ext) return 'file'
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi']
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac']
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  return 'file'
}

/**
 * Create an instant object URL from a File for preview.
 * Returns synchronously — no base64 encoding, no waiting.
 * Call URL.revokeObjectURL(url) when the URL is no longer needed.
 */
export function fileToDataUrl(file) {
  return Promise.resolve(URL.createObjectURL(file))
}
