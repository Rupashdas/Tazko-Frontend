/**
 * Draft persistence for TipTap editors.
 *
 * Watches an editor instance, debounces 2s, and PUTs the HTML to the backend
 * at /api/drafts/{contextKey}. On mount, restores any existing draft into the
 * editor (only if the editor is empty — never clobber loaded content). On
 * submit, the parent calls flush() then clearDraft() to delete the row.
 *
 * Failures are silent: drafts are best-effort, never block the user.
 */

import { ref, watch, onBeforeUnmount } from 'vue'
import { fetchDraft, saveDraft, deleteDraft } from '@/services/draftService'

const DEBOUNCE_MS = 2000
const MAX_RETRIES = 3

export function useDraftPersistence(contextKey, editorRef) {
	const draftRestored = ref(false)
	const restoredAt    = ref(null)

	let debounceTimer = null
	let updateHandler = null
	let suppressDirty = false

	async function persist(content, attempt = 1) {
		const key = contextKey.value
		if (!key) return
		try {
			await saveDraft(key, content)
		} catch (err) {
			if (attempt < MAX_RETRIES) {
				const delay = 500 * 2 ** (attempt - 1)
				setTimeout(() => persist(content, attempt + 1), delay)
			}
			// After max retries, swallow.
		}
	}

	function schedulePersist() {
		if (debounceTimer) clearTimeout(debounceTimer)
		const editor = editorRef.value
		if (!editor) return
		debounceTimer = setTimeout(() => {
			debounceTimer = null
			persist(editor.getHTML())
		}, DEBOUNCE_MS)
	}

	async function flush() {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
			debounceTimer = null
			const editor = editorRef.value
			if (editor && contextKey.value) {
				await persist(editor.getHTML())
			}
		}
	}

	async function clearDraft() {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
			debounceTimer = null
		}
		if (!contextKey.value) return
		try {
			await deleteDraft(contextKey.value)
		} catch (_) { /* best-effort */ }
	}

	async function discard() {
		await clearDraft()
		const editor = editorRef.value
		if (editor) {
			suppressDirty = true
			editor.commands.setContent('', false)
			suppressDirty = false
		}
		draftRestored.value = false
	}

	async function tryRestore() {
		const editor = editorRef.value
		const key    = contextKey.value
		if (!editor || !key) return

		// Don't clobber existing content (e.g. when editing a comment whose
		// body was already populated from the server).
		if (!editor.isEmpty) return

		let saved
		try {
			saved = await fetchDraft(key)
		} catch (_) {
			return
		}
		if (!saved || !saved.content) return

		suppressDirty = true
		editor.commands.setContent(saved.content, false)
		suppressDirty = false

		draftRestored.value = true
		restoredAt.value    = saved.updated_at || null
	}

	watch(editorRef, (editor) => {
		if (!editor || updateHandler) return
		updateHandler = () => {
			if (suppressDirty) return
			// First user-initiated edit hides the "restored" banner.
			draftRestored.value = false
			schedulePersist()
		}
		editor.on('update', updateHandler)
		tryRestore()
	}, { immediate: true })

	watch(contextKey, () => tryRestore())

	onBeforeUnmount(() => {
		if (debounceTimer) clearTimeout(debounceTimer)
		const editor = editorRef.value
		if (editor && updateHandler) editor.off('update', updateHandler)
	})

	return {
		draftRestored,
		restoredAt,
		flush,
		clearDraft,
		discard,
	}
}
