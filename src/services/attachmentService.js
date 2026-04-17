/**
 * Attachment service.
 *
 * Thin, stateless wrapper around the backend attachment + share endpoints.
 * Used by:
 *   - RichTextEditor     → upload() on file pick, deleteAttachment() on node remove
 *   - ProjectFilesTab    → listProjectAttachments(), streamUrl()
 *   - ShareLinkPanel     → listShares(), createShare(), updateShare(), revokeShare()
 *
 * Why a service instead of a Pinia store:
 *   Attachment state is inherently local — an uploading file is tied to one
 *   editor instance, a shares modal is tied to one file. Nobody else needs
 *   to reactively observe "the list of uploading files app-wide". Functions
 *   keep the API thin; callers decide how/whether to cache results.
 *
 * All calls return the unwrapped data payload (most endpoints wrap in
 * { data: ... } via Laravel Resources — we strip that here so callers don't
 * repeat the check).
 */

import axios from '@/axios'

/*---------------------------------------------------------------------------
| Internal helpers
---------------------------------------------------------------------------*/

// Laravel JsonResource responses are `{ data: {...} }` for single resources,
// `{ data: [...] , meta: {...} }` for collections. Plain 204 / 200 responses
// we return as-is. This helper just picks the conventional payload so
// callers get the meat without extra unwrapping.
function unwrap(response) {
	return response?.data?.data ?? response?.data
}

function errorMessage(err, fallback) {
	return err?.response?.data?.message ?? err?.message ?? fallback
}

/*---------------------------------------------------------------------------
| Attachment endpoints
---------------------------------------------------------------------------*/

/**
 * Upload a single file as an orphan attachment under a project.
 * The returned row has attachable_* = null and committed_at = null — it will
 * be linked to a parent the next time the containing task / comment / project
 * is saved. Abandoned orphans are cleaned up by the hourly reaper.
 *
 * @param {number|string} projectId
 * @param {File} file
 * @param {(progress: {loaded:number,total:number,percent:number}) => void} [onProgress]
 * @param {AbortSignal} [signal]  Pass editor-level AbortController.signal to
 *                                cancel if the user yanks the file or closes
 *                                the editor before upload finishes.
 * @returns {Promise<object>} attachment row
 */
export async function uploadAttachment(projectId, file, onProgress, signal) {
	const form = new FormData()
	form.append('file', file)

	const res = await axios.post(`/api/projects/${projectId}/attachments`, form, {
		signal,
		// Let axios/the browser set the multipart boundary — passing an explicit
		// 'Content-Type' header breaks the boundary string.
		onUploadProgress: onProgress
			? (evt) => {
				const total = evt.total || file.size || 0
				onProgress({
					loaded:  evt.loaded,
					total,
					percent: total > 0 ? Math.round((evt.loaded / total) * 100) : 0,
				})
			}
			: undefined,
	})
	return unwrap(res)
}

/**
 * List committed attachments under a project for the Files tab.
 * Backend already filters to committed rows (scopeCommitted).
 *
 * @param {number|string} projectId
 * @param {object} [params]                 Filter params forwarded as query string.
 * @param {string} [params.file_type]       'image' | 'video' | 'audio' | 'file'
 * @param {string} [params.attachable_type] e.g. 'App\\Models\\Task' — filter by owning parent type
 * @param {number} [params.uploaded_by]     user id
 * @param {string} [params.q]               name LIKE filter
 * @param {number} [params.per_page]        page size (default 30 server-side)
 */
export async function listProjectAttachments(projectId, params = {}) {
	const res = await axios.get(`/api/projects/${projectId}/attachments`, { params })
	// Preserve paginator metadata (last_page, total, current_page, …) so the
	// Files tab can render pagination controls. Laravel's paginator returns
	// `{ data: [...], meta: {...}, links: {...} }` at the top level — we want
	// the whole thing, not just the inner data array.
	return res?.data ?? { data: [] }
}

/**
 * URL for streaming an attachment through the internal (authed) endpoint.
 *
 * Use this as the `src` on <img>/<video>/<audio>, or as an <a href> target.
 * Because axios is configured with `withCredentials: true` app-wide, the
 * browser sends the session cookie automatically on these GET fetches.
 *
 * Returns a string, not a promise — this is just URL construction.
 */
export function streamUrl(attachmentId, { download = false } = {}) {
	const base  = axios.defaults.baseURL ?? ''
	const query = download ? '?download=1' : ''
	return `${base}/api/attachments/${attachmentId}/stream${query}`
}

/**
 * Hard-delete an attachment (row + file).
 * Usually NOT called directly: removing the node from RTE content and saving
 * the parent is enough, because AttachmentSyncService deletes unreferenced
 * rows. This endpoint exists for the Files tab's "delete" action and for
 * explicit cleanup in tests.
 */
export async function deleteAttachment(attachmentId) {
	try {
		await axios.delete(`/api/attachments/${attachmentId}`)
		return { success: true }
	} catch (err) {
		return { success: false, message: errorMessage(err, 'Failed to delete attachment.') }
	}
}

/*---------------------------------------------------------------------------
| Share endpoints
---------------------------------------------------------------------------*/

/**
 * List share links for an attachment.
 */
export async function listShares(attachmentId) {
	const res = await axios.get(`/api/attachments/${attachmentId}/shares`)
	return unwrap(res)
}

/**
 * Create a new share link for an attachment.
 *
 * @param {number|string} attachmentId
 * @param {object} [options]
 * @param {boolean} [options.allow_download]  default true
 * @param {string}  [options.expires_at]      ISO timestamp; null = no expiry
 */
export async function createShare(attachmentId, options = {}) {
	try {
		const res = await axios.post(`/api/attachments/${attachmentId}/shares`, options)
		return { success: true, share: unwrap(res) }
	} catch (err) {
		return { success: false, message: errorMessage(err, 'Failed to create share link.') }
	}
}

/**
 * Enable/disable, change expiry, or toggle download permission on an
 * existing share link. Backend centralises isActive() so disabling just
 * flips `enabled` — no need to revoke-and-recreate.
 *
 * @param {number|string} shareId
 * @param {object} patch  Any subset of { enabled, allow_download, expires_at }
 */
export async function updateShare(shareId, patch) {
	try {
		const res = await axios.patch(`/api/attachment-shares/${shareId}`, patch)
		return { success: true, share: unwrap(res) }
	} catch (err) {
		return { success: false, message: errorMessage(err, 'Failed to update share link.') }
	}
}

/**
 * Permanently revoke a share link. Existing copies of the public URL will
 * 410 Gone thereafter. Prefer updateShare({ enabled: false }) if you want
 * to be able to turn it back on later.
 */
export async function revokeShare(shareId) {
	try {
		await axios.delete(`/api/attachment-shares/${shareId}`)
		return { success: true }
	} catch (err) {
		return { success: false, message: errorMessage(err, 'Failed to revoke share link.') }
	}
}

/**
 * Build the externally-shareable URL for a share token. What gets pasted
 * into chat / email. The token alone is authoritative on the backend —
 * no auth cookies are sent or required.
 */
export function publicShareUrl(token) {
	const base = axios.defaults.baseURL ?? ''
	return `${base}/api/share/${token}`
}
