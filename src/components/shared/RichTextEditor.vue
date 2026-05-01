<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Extension, Node as TipTapNode } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import { detectFileType } from './FileAttachmentPlugin'
import FileAttachmentView from './FileAttachmentView.vue'
import { MediaEmbed, urlToEmbedInfo } from './MediaEmbedPlugin'
import EditorToolbar from './EditorToolbar.vue'
import MentionView from './MentionView.vue'
import { uploadAttachment, streamUrl } from '@/services/attachmentService'
import { useToast } from '@/utils/toast'
import { useDraftPersistence } from '@/composables/useDraftPersistence'

// ── Placeholder ─────────────────────────────────────────────
function buildPlaceholderExtension(placeholderText) {
	return Extension.create({
		name: 'placeholder',
		addProseMirrorPlugins() {
			return [
				new Plugin({
					key: new PluginKey('placeholder'),
					props: {
						decorations(state) {
							const doc = state.doc
							if (doc.childCount !== 1 || !doc.firstChild?.isTextblock || doc.firstChild.content.size > 0) {
								return DecorationSet.empty
							}
							const deco = Decoration.node(0, doc.content.size, {
								'data-placeholder': placeholderText,
								class: 'is-editor-empty',
							})
							return DecorationSet.create(doc, [deco])
						},
					},
				}),
			]
		},
	})
}

// ── Indent Extension ────────────────────────────────────────
const IndentExtension = Extension.create({
	name: 'indent',

	addGlobalAttributes() {
		return [
			{
				types: ['paragraph', 'heading'],
				attributes: {
					indent: {
						default: 0,
						renderHTML(attrs) {
							if (!attrs.indent) return {}
							return { style: `margin-left: ${attrs.indent * 2}em` }
						},
						parseHTML(el) {
							const ml = el.style?.marginLeft
							if (!ml) return 0
							return Math.max(0, Math.round(parseFloat(ml) / 2))
						},
					},
				},
			},
		]
	},

	addCommands() {
		return {
			indent: () => ({ tr, state, dispatch }) => {
				const { from, to } = state.selection
				let changed = false
				state.doc.nodesBetween(from, to, (node, pos) => {
					if (node.type.name === 'paragraph' || node.type.name === 'heading') {
						const cur = node.attrs.indent || 0
						if (cur < 8) {
							tr.setNodeMarkup(pos, null, { ...node.attrs, indent: cur + 1 })
							changed = true
						}
					}
				})
				if (changed && dispatch) dispatch(tr)
				return changed
			},
			outdent: () => ({ tr, state, dispatch }) => {
				const { from, to } = state.selection
				let changed = false
				state.doc.nodesBetween(from, to, (node, pos) => {
					if (node.type.name === 'paragraph' || node.type.name === 'heading') {
						const cur = node.attrs.indent || 0
						if (cur > 0) {
							tr.setNodeMarkup(pos, null, { ...node.attrs, indent: cur - 1 })
							changed = true
						}
					}
				})
				if (changed && dispatch) dispatch(tr)
				return changed
			},
		}
	},

	addKeyboardShortcuts() {
		return {
			Tab: ({ editor }) => {
				if (editor.isActive('listItem')) {
					return editor.commands.sinkListItem('listItem')
				}
				// Don't swallow Tab inside code blocks — let default handling apply
				if (editor.isActive('codeBlock')) return false
				return editor.commands.indent()
			},
			'Shift-Tab': ({ editor }) => {
				if (editor.isActive('listItem')) {
					return editor.commands.liftListItem('listItem')
				}
				if (editor.isActive('codeBlock')) return false
				return editor.commands.outdent()
			},
		}
	},
})

// ── File size helper ────────────────────────────────────────
function formatFileSize(bytes) {
	if (!bytes || bytes < 1024) return bytes ? bytes + ' B' : ''
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── FileAttachment node (with alignment support) ────────────
const FileAttachment = TipTapNode.create({
	name: 'fileAttachment',
	group: 'block',
	atom: true,
	addAttributes() {
		return {
			src: { default: '' },
			fileName: { default: 'attachment' },
			fileType: { default: 'file' },
			mimeType: { default: '' },
			fileSize: { default: 0 },
			align: { default: 'left' },

			// Real backend attachment id, populated after upload completes.
			// The HTML emitted for storage includes this as `data-attachment-id`
			// — that's what App\Services\AttachmentSyncService parses to link
			// orphan rows to the saved parent.
			attachmentId: { default: null },
			// Transient, editor-only: a client-generated uuid so the async
			// upload callback can find "its" node again after the user may
			// have typed/reordered. Not persisted — stripped in renderHTML.
			tempId: { default: null },
			// Transient UI flags. Not persisted (dropped in renderHTML) so a
			// saved document never carries ambiguous upload state.
			uploading: { default: false },
			uploadError: { default: null },
		}
	},
	parseHTML() {
		return [
			{
				tag: 'div[data-file-attachment]',
				getAttrs(el) {
					return {
						src: el.getAttribute('data-file-src') || '',
						fileName: el.getAttribute('data-file-name') || 'attachment',
						fileType: el.getAttribute('data-file-type') || 'file',
						mimeType: el.getAttribute('data-file-mime') || '',
						fileSize: parseInt(el.getAttribute('data-file-size') || '0', 10),
						align: el.getAttribute('data-file-align') || 'left',
						attachmentId: (() => {
							const raw = el.getAttribute('data-attachment-id')
							return raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : null
						})(),
						// tempId + upload flags are transient — always start clean.
						tempId: null,
						uploading: false,
						uploadError: null,
					}
				},
			},
		]
	},
	renderHTML({ node }) {
		const attrs = {
			'data-file-attachment': '',
			'data-file-name': node.attrs.fileName,
			'data-file-type': node.attrs.fileType,
			'data-file-src': node.attrs.src,
			'data-file-mime': node.attrs.mimeType,
			'data-file-size': String(node.attrs.fileSize),
			'data-file-align': node.attrs.align,
		}
		// Only stamp the real attachment id — never the tempId or upload
		// state. Saved HTML stays clean and backend-parseable.
		if (node.attrs.attachmentId) {
			attrs['data-attachment-id'] = String(node.attrs.attachmentId)
		}
		const type = node.attrs.fileType || 'file'
		const src = node.attrs.src || ''
		const name = node.attrs.fileName || 'attachment'
		const size = node.attrs.fileSize ? formatFileSize(node.attrs.fileSize) : ''
		if (type === 'image') {
			return ['div', attrs, ['img', { src, alt: name, class: 'max-w-full rounded-[6px]' }]]
		}
		if (type === 'video') {
			return ['div', attrs, ['video', { src, controls: '', class: 'max-w-full rounded-[6px]' }]]
		}
		if (type === 'audio') {
			return ['div', attrs, ['audio', { src, controls: '', class: 'w-full max-w-[300px]' }]]
		}
		return ['div', attrs,
			['span', { class: 'inline-flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-semibold text-accent bg-accent/6' },
				'📎 ' + name + (size ? ' (' + size + ')' : '')
			]
		]
	},
	addNodeView() {
		return VueNodeViewRenderer(FileAttachmentView)
	},
})

// ── Mention node ────────────────────────────────────────────
const Mention = TipTapNode.create({
	name: 'mention',
	group: 'inline',
	inline: true,
	atom: true,
	addAttributes() {
		return {
			userId: { default: '' },
			name: { default: '' },
			avatar: { default: '' },
			initials: { default: '' },
			color: { default: 'bg-accent' },
		}
	},
	parseHTML() {
		return [
			{
				tag: 'span[data-mention]',
				getAttrs(el) {
					return {
						userId: el.getAttribute('data-user-id') || '',
						name: el.getAttribute('data-name') || '',
						avatar: el.getAttribute('data-avatar') || '',
						initials: el.getAttribute('data-initials') || '',
						color: el.getAttribute('data-color') || 'bg-accent',
					}
				},
			},
		]
	},
	renderHTML({ node }) {
		const { userId, name, avatar, initials, color } = node.attrs
		const initial = initials || (name ? name.slice(0, 2).toUpperCase() : '?')
		const avatarChild = avatar
			? ['img', { src: avatar, alt: name, style: 'width:100%;height:100%;border-radius:50%;object-fit:cover;' }]
			: ['span', { style: 'font-size:0.6rem;font-weight:700;color:white;' }, initial]
		return [
			'span',
			{
				'data-mention': '',
				'data-user-id': userId,
				'data-name': name,
				'data-avatar': avatar || '',
				'data-initials': initial,
				'data-color': color || '',
				style: 'display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--color-accent,#6366f1) 13%,transparent);color:var(--color-accent,#6366f1);font-weight:600;font-size:0.82em;padding:2px 8px 2px 4px;border-radius:4px;vertical-align:middle;white-space:nowrap;line-height:1.6;cursor:default;',
			},
			['span', { style: 'width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--color-accent,#6366f1);overflow:hidden;' }, avatarChild],
			`@${name}`,
		]
	},
	addNodeView() {
		return VueNodeViewRenderer(MentionView)
	},
})

// ── Props ───────────────────────────────────────────────────
const props = defineProps({
	modelValue: { type: String, default: '' },
	placeholder: { type: String, default: 'Write something…' },
	showToolbar: { type: Boolean, default: true },
	enableMention: { type: Boolean, default: false },
	users: { type: Array, default: () => [] },
	minHeight: { type: String, default: '80px' },
	autofocus: { type: Boolean, default: false },
	accept: { type: String, default: '*' },

	// Tenancy anchor for file uploads. REQUIRED when the user may attach files
	// (which is always, unless the caller has hidden the toolbar's attach
	// button). When null, picking a file shows an error toast and no-ops —
	// this covers the "create new project" flow where no id exists yet.
	projectId: { type: [Number, String], default: null },

	// Per-user draft auto-save key. When provided, the editor's content is
	// debounced-saved to /api/drafts/{key} and restored on mount. When null
	// (default), the editor behaves identically to before — no draft I/O.
	// Format: "task:{id}:comment:new", "comment:{id}:edit", "task:{id}:description",
	//         "project:{id}:task:new", "project:{id}:comment:new"
	draftContextKey: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

// ── UI state ────────────────────────────────────────────────
const isFocused = ref(false)
const pasteAsPlainText = ref(false)
const showAttachments = ref(false)

// ── Object URL tracking (for memory cleanup) ────────────────
const createdObjectUrls = new Set()
function createTrackedObjectUrl(file) {
	const url = URL.createObjectURL(file)
	createdObjectUrls.add(url)
	return url
}
function revokeTrackedObjectUrl(url) {
	if (url && createdObjectUrls.has(url)) {
		URL.revokeObjectURL(url)
		createdObjectUrls.delete(url)
	}
}

// ── File upload ─────────────────────────────────────────────
const fileInput = ref(null)
const { errorToast } = useToast()

// Every in-flight upload has an AbortController so we can cancel mid-flight
// if the component unmounts. Keyed by tempId to avoid cross-wires when the
// user picks several files in quick succession.
const pendingUploads = new Map()

function triggerFileUpload() { fileInput.value?.click() }

/**
 * Walk the editor doc and return {node, pos} for the fileAttachment whose
 * `tempId` matches, or null if it's gone (user deleted during upload).
 */
function findNodeByTempId(tempId) {
	if (!editor.value) return null
	let found = null
	editor.value.state.doc.descendants((node, pos) => {
		if (found) return false
		if (node.type.name === 'fileAttachment' && node.attrs.tempId === tempId) {
			found = { node, pos }
			return false
		}
	})
	return found
}

/**
 * Upload one file and reconcile its node with the server response.
 *
 * Flow per file:
 *   1. Insert a node immediately with a blob preview + `uploading:true` +
 *      a temp client-side id. User sees the file instantly.
 *   2. Start upload in parallel.
 *   3. On success → find node by tempId, swap src to the authed stream URL,
 *      stamp `attachmentId` (so the emitted HTML carries data-attachment-id),
 *      clear uploading flag, revoke blob URL.
 *   4. On failure → remove the node, toast the error, revoke blob.
 *
 * We rely on `node.attrs.tempId` (not position) to locate the node because
 * the user may have typed above it while the upload was in flight.
 */
async function uploadOne(file, tempId) {
	const controller = new AbortController()
	pendingUploads.set(tempId, controller)

	try {
		const attachment = await uploadAttachment(
			props.projectId,
			file,
			null, // TODO: per-node progress UI — wire onProgress later if desired
			controller.signal,
		)

		const target = findNodeByTempId(tempId)
		if (!target) return // user yanked the node mid-upload — nothing to do

		// Swap blob preview for the real stream URL so the saved content
		// survives a reload. Keep mimeType/fileType from the server in case
		// it refined what the browser reported.
		const blobSrc = target.node.attrs.src
		editor.value
			.chain()
			.command(({ tr }) => {
				tr.setNodeMarkup(target.pos, null, {
					...target.node.attrs,
					attachmentId: attachment.id,
					src: streamUrl(attachment.id),
					mimeType: attachment.mime_type ?? target.node.attrs.mimeType,
					fileType: attachment.file_type ?? target.node.attrs.fileType,
					fileSize: attachment.size ?? target.node.attrs.fileSize,
					uploading: false,
					uploadError: null,
					tempId: null,
				})
				return true
			})
			.run()
		revokeTrackedObjectUrl(blobSrc)
	} catch (err) {
		// AbortController fires a different error on cancel — we just quit
		// silently; the reaper will clean up any orphan row on the server.
		if (controller.signal.aborted) return

		const target = findNodeByTempId(tempId)
		if (target) {
			const blobSrc = target.node.attrs.src
			editor.value
				.chain()
				.command(({ tr }) => {
					tr.delete(target.pos, target.pos + target.node.nodeSize)
					return true
				})
				.run()
			revokeTrackedObjectUrl(blobSrc)
		}
		const msg = err?.response?.data?.errors?.file?.[0]
			?? err?.response?.data?.message
			?? 'Failed to upload file.'
		errorToast(`${file.name}: ${msg}`, 'Upload failed')
	} finally {
		pendingUploads.delete(tempId)
	}
}

async function handleFileSelect(event) {
	const files = event.target.files
	if (!files || files.length === 0 || !editor.value) return

	// Guard the "no project context" case up front — covers the brand-new
	// project form where the project id doesn't exist yet. Silent failure
	// here would leave blobs in the doc that can never be persisted.
	if (!props.projectId) {
		errorToast('Save the project first before adding attachments.', 'Cannot upload')
		event.target.value = ''
		return
	}

	// Insert all optimistic nodes in one transaction so caret placement is
	// predictable and `onUpdate` fires once rather than N times.
	const picked = Array.from(files).map(file => {
		// Prefer the web-standard crypto.randomUUID() when available; fall
		// back to a Math.random string for older browsers.
		const tempId = (globalThis.crypto?.randomUUID?.() ?? ('tmp-' + Math.random().toString(36).slice(2) + Date.now()))
		return {
			file,
			tempId,
			blobUrl: createTrackedObjectUrl(file),
		}
	})

	const content = picked.map(({ file, tempId, blobUrl }) => ({
		type: 'fileAttachment',
		attrs: {
			src: blobUrl,
			fileName: file.name,
			fileType: detectFileType(file.type, file.name),
			mimeType: file.type,
			fileSize: file.size,
			align: 'left',
			attachmentId: null,
			tempId,
			uploading: true,
			uploadError: null,
		},
	}))

	editor.value.chain().focus().insertContent(content).run()
	event.target.value = ''

	// Fire uploads in parallel — order of completion doesn't matter because
	// each one locates its own node via tempId.
	for (const { file, tempId } of picked) uploadOne(file, tempId)
}

// ── @mention ────────────────────────────────────────────────
let blurTimer = null

const mentionState = ref({
	active: false, query: '', x: 0, y: 0,
	selectedIndex: 0, atFrom: 0, atTo: 0,
})

const filteredUsers = computed(() => {
	if (!mentionState.value.query) return props.users.slice(0, 6)
	const q = mentionState.value.query.toLowerCase()
	return props.users.filter(u => u.name.toLowerCase().includes(q)).slice(0, 6)
})

function handleMentionTrigger(ed) {
	const { from } = ed.state.selection
	const textBefore = ed.state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\0')
	const atIndex = textBefore.lastIndexOf('@')
	if (atIndex === -1) { mentionState.value.active = false; return }
	const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : ''
	// Unicode-aware word boundary check (letters/digits in any script + underscore)
	if (/[\p{L}\p{N}_]/u.test(charBefore)) { mentionState.value.active = false; return }
	const query = textBefore.slice(atIndex + 1)
	if (/\s/.test(query)) { mentionState.value.active = false; return }
	const coords = ed.view.coordsAtPos(from)
	mentionState.value = {
		active: true, query,
		x: coords.left, y: coords.bottom + 6,
		selectedIndex: 0,
		atFrom: from - query.length - 1,
		atTo: from,
	}
}

function selectMention(user) {
	if (!editor.value) return
	if (blurTimer !== null) { clearTimeout(blurTimer); blurTimer = null }
	const { atFrom, atTo } = mentionState.value
	mentionState.value.active = false
	editor.value
		.chain()
		.focus()
		.deleteRange({ from: atFrom, to: atTo })
		.insertContent({
			type: 'mention',
			attrs: {
				userId: user.id || '',
				name: user.name,
				avatar: user.avatar || '',
				initials: user.initials || '',
				color: user.color || 'bg-accent',
			},
		})
		.insertContent(' ')
		.run()
}

function insertMention() {
	editor.value?.chain().focus().insertContent('@').run()
}

// ── Attachments list ────────────────────────────────────────
const attachedFiles = computed(() => {
	if (!editor.value) return []
	const files = []
	editor.value.state.doc.descendants((node, pos) => {
		if (node.type.name === 'fileAttachment') {
			files.push({ ...node.attrs, pos, nodeSize: node.nodeSize })
		}
	})
	return files
})

function removeAttachment(targetSrc) {
	if (!editor.value) return
	// Re-traverse the doc at call time so we always get the current position,
	// not a position that may have shifted since the panel last rendered.
	let foundPos = null
	let foundSize = null
	let tempId = null
	editor.value.state.doc.descendants((node, pos) => {
		if (foundPos !== null) return false
		if (node.type.name === 'fileAttachment' && node.attrs.src === targetSrc) {
			foundPos = pos
			foundSize = node.nodeSize
			tempId = node.attrs.tempId
			return false
		}
	})
	if (foundPos === null) return
	editor.value.chain().deleteRange({ from: foundPos, to: foundPos + foundSize }).run()
	revokeTrackedObjectUrl(targetSrc)
	if (tempId && pendingUploads.has(tempId)) {
		pendingUploads.get(tempId).abort()
		pendingUploads.delete(tempId)
	}
}

// ── Word count ──────────────────────────────────────────────
const wordCount = computed(() => {
	if (!editor.value) return { words: 0, characters: 0 }
	return {
		words: editor.value.storage.characterCount?.words() ?? 0,
		characters: editor.value.storage.characterCount?.characters() ?? 0,
	}
})

// ── Editor ──────────────────────────────────────────────────
const editor = useEditor({
	content: props.modelValue,
	autofocus: props.autofocus,
	extensions: [
		StarterKit.configure({
			code: false,
			link: {
				openOnClick: false,
				HTMLAttributes: { rel: 'noopener noreferrer' },
			},
		}),
		buildPlaceholderExtension(props.placeholder),
		IndentExtension,
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
		TextStyle,
		Color,
		Highlight.configure({ multicolor: true }),
		CharacterCount,
		FileAttachment,
		MediaEmbed,
		Mention,
	],
	editorProps: {
		attributes: { class: 'tiptap-prose', spellcheck: 'true' },

		handlePaste(view, event) {
			// ── Paste as plain text ──────────────────────
			if (pasteAsPlainText.value) {
				event.preventDefault()
				const text = event.clipboardData?.getData('text/plain') ?? ''
				if (text) view.dispatch(view.state.tr.insertText(text))
				return true
			}

			// ── YouTube / Vimeo URL auto-embed ───────────
			const text = event.clipboardData?.getData('text/plain')?.trim() ?? ''
			if (text && /^https?:\/\//i.test(text) && !text.includes(' ')) {
				const embedInfo = urlToEmbedInfo(text)
				if (embedInfo) {
					event.preventDefault()
					editor.value?.chain().focus().deleteSelection().insertMediaEmbed({
						platform: embedInfo.platform,
						embedUrl: embedInfo.embedUrl,
						originalUrl: text,
					}).run()
					return true
				}
			}

			return false
		},

		handleKeyDown(view, event) {
			if (!mentionState.value.active) return false

			if (event.key === 'ArrowDown') {
				if (!filteredUsers.value.length) return false
				event.preventDefault()
				mentionState.value.selectedIndex = Math.min(
					mentionState.value.selectedIndex + 1, filteredUsers.value.length - 1)
				return true
			}
			if (event.key === 'ArrowUp') {
				if (!filteredUsers.value.length) return false
				event.preventDefault()
				mentionState.value.selectedIndex = Math.max(mentionState.value.selectedIndex - 1, 0)
				return true
			}
			if (event.key === 'Enter' || event.key === 'Tab') {
				const user = filteredUsers.value[mentionState.value.selectedIndex]
				if (user) { event.preventDefault(); selectMention(user); return true }
				mentionState.value.active = false
				return false
			}
			if (event.key === 'Escape') { mentionState.value.active = false; return true }
			return false
		},
	},
	onUpdate({ editor }) {
		emit('update:modelValue', editor.getHTML())
		if (props.enableMention) handleMentionTrigger(editor)
	},
	onFocus() {
		// Cancel any pending blur-driven mention close so re-focusing
		// (e.g. via toolbar @ button) doesn't dismiss the just-opened dropdown.
		if (blurTimer !== null) { clearTimeout(blurTimer); blurTimer = null }
		isFocused.value = true; emit('focus')
	},
	onBlur() {
		isFocused.value = false
		emit('blur')
		blurTimer = setTimeout(() => {
			mentionState.value.active = false
			blurTimer = null
		}, 150)
	},
})

onBeforeUnmount(() => {
	if (blurTimer !== null) clearTimeout(blurTimer)
	// Cancel any still-running uploads so we don't leave orphan rows behind
	// from sessions the user walked away from mid-submit.
	for (const [, controller] of pendingUploads) controller.abort()
	pendingUploads.clear()
	// Revoke any blob URLs we created to avoid memory leaks
	for (const url of createdObjectUrls) URL.revokeObjectURL(url)
	createdObjectUrls.clear()
	// useEditor() handles editor.destroy() on unmount automatically
})

watch(() => props.modelValue, (val) => {
	if (!editor.value) return
	if (val !== editor.value.getHTML()) editor.value.commands.setContent(val || '', false)
})

// ── Draft persistence (Basecamp-style per-user auto-save) ───
// Inert when draftContextKey is null — the composable does no I/O.
const draftKeyRef = computed(() => props.draftContextKey || null)
const editorRef   = computed(() => editor.value)
const {
	draftRestored,
	restoredAt,
	flush: flushDraft,
	clearDraft,
	discard: discardDraft,
} = useDraftPersistence(draftKeyRef, editorRef)

function formatRelative(iso) {
	if (!iso) return ''
	const then = new Date(iso).getTime()
	const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
	if (diffSec < 60)    return 'just now'
	if (diffSec < 3600)  return `${Math.floor(diffSec / 60)} min ago`
	if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`
	return `${Math.floor(diffSec / 86400)} day(s) ago`
}

// ── Public API ──────────────────────────────────────────────
function getHTML() { return editor.value?.getHTML() ?? '' }
function getText() { return editor.value?.getText() ?? '' }
function clear() { editor.value?.commands.clearContent() }
function focus() { editor.value?.commands.focus() }
function isEmpty() { return editor.value?.isEmpty ?? true }

defineExpose({ getHTML, getText, clear, focus, isEmpty, flushDraft, clearDraft, discardDraft })
</script>

<template>
	<div
		class="border border-heading/15 rounded-sm overflow-hidden flex flex-col"
		:class="{
			'border-accent': isFocused,
		}"
	>
		<!-- Draft restored banner -->
		<div
			v-if="draftRestored"
			class="flex items-center justify-between gap-2.5 px-3.5 py-[5px] bg-amber-500/10 border-b border-amber-500/25 text-[0.75rem] text-amber-900"
		>
			<span>
				Draft restored<span v-if="restoredAt"> from {{ formatRelative(restoredAt) }}</span>.
			</span>
			<button
				type="button"
				class="border-0 bg-transparent cursor-pointer text-[0.72rem] font-bold text-amber-900 underline p-0"
				@click="discardDraft"
			>Discard</button>
		</div>

		<!-- Toolbar -->
		<EditorToolbar
			v-if="showToolbar && editor"
			:editor="editor"
			:enable-mention="enableMention"
			:accept="accept"
			:paste-as-plain-text="pasteAsPlainText"
			@trigger-file-upload="triggerFileUpload"
			@insert-mention="insertMention"
			@toggle-paste-plain="pasteAsPlainText = !pasteAsPlainText"
		/>

		<!-- Paste-as-plain-text indicator -->
		<div v-if="pasteAsPlainText" class="flex items-center justify-between gap-2.5 px-3.5 py-[5px] bg-amber-500/10 border-b border-amber-500/25 text-[0.75rem] text-amber-900">
			<span>Paste as plain text is ON — formatting will be stripped on paste</span>
			<button type="button" class="border-0 bg-transparent cursor-pointer text-[0.72rem] font-bold text-amber-900 underline p-0" @click="pasteAsPlainText = false">Turn off</button>
		</div>

		<!-- Editor content area -->
		<editor-content :editor="editor" class="px-4 py-3 cursor-text" />

		<!-- Attachments panel -->
		<div v-if="attachedFiles.length > 0" class="border-t border-heading/6 bg-heading/[0.015]">
			<button type="button"
				class="flex items-center gap-1.5 w-full px-3.5 py-[7px] border-0 bg-transparent cursor-pointer text-[0.75rem] font-semibold text-text/55 text-left transition-colors duration-[120ms] hover:text-heading"
				@click="showAttachments = !showAttachments">
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
				</svg>
				{{ attachedFiles.length }} attachment{{ attachedFiles.length !== 1 ? 's' : '' }}
				<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
					:class="showAttachments ? 'rotate-180' : 'rotate-0'"
					class="transition-transform duration-200">
					<polyline points="6 9 12 15 18 9"/>
				</svg>
			</button>

			<div v-if="showAttachments" class="px-2.5 pb-2 flex flex-col gap-1">
				<div v-for="file in attachedFiles" :key="file.tempId || (file.attachmentId != null ? 'att-' + file.attachmentId : file.src)"
					class="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px] bg-heading/[0.03] border border-heading/6"
					:class="{ 'opacity-60': file.uploading }">
					<div class="w-9 h-9 rounded-[4px] overflow-hidden bg-heading/6 flex items-center justify-center shrink-0 relative">
						<img v-if="file.fileType === 'image'" :src="file.src" :alt="file.fileName" class="w-full h-full object-cover" />
						<span v-else class="text-[1.2rem] leading-none">
							{{ file.fileType === 'video' ? '🎬' : file.fileType === 'audio' ? '🎵' : file.fileType === 'pdf' ? '📄' : '📎' }}
						</span>
						<!-- Spinner overlay while the file is uploading -->
						<div v-if="file.uploading" class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[4px]">
							<svg class="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
								<path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
							</svg>
						</div>
					</div>
					<div class="flex-1 min-w-0 flex flex-col gap-0.5">
						<span class="text-[0.78rem] font-semibold text-heading overflow-hidden text-ellipsis whitespace-nowrap">{{ file.fileName }}</span>
						<span class="text-[0.68rem] text-text/45 uppercase tracking-[0.04em]">
							{{ file.uploading ? 'Uploading…' : file.fileType }}{{ file.fileSize ? ' · ' + formatFileSize(file.fileSize) : '' }}
						</span>
					</div>
					<button type="button"
						class="w-[22px] h-[22px] rounded-full border-0 bg-red-500/10 text-red-500 cursor-pointer flex items-center justify-center p-0 shrink-0 transition-colors duration-[120ms] hover:bg-red-500 hover:text-white"
						title="Remove"
						@click="removeAttachment(file.src)">
						<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
							<path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Word count footer -->
		<div v-if="editor" class="px-4 py-1 text-[0.7rem] text-text/35 border-t border-heading/6 bg-heading/[0.01] text-right select-none">
			{{ wordCount.words }} word{{ wordCount.words !== 1 ? 's' : '' }}
			&nbsp;·&nbsp;
			{{ wordCount.characters }} character{{ wordCount.characters !== 1 ? 's' : '' }}
		</div>

		<!-- Hidden file input -->
		<input ref="fileInput" type="file" multiple :accept="accept" class="hidden" @change="handleFileSelect" />

		<!-- @mention dropdown -->
		<Teleport to="body">
			<Transition name="mention-fade">
				<div v-if="mentionState.active"
					class="fixed z-[9999] min-w-[220px] bg-panel border border-heading/9 rounded-[0.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.14)] p-[5px]"
					:style="{ top: mentionState.y + 'px', left: mentionState.x + 'px' }"
					@mousedown.prevent>
					<div v-if="filteredUsers.length === 0" class="px-3.5 py-2.5 text-[0.8rem] text-text/35 text-center">No users found</div>
					<button v-for="(user, i) in filteredUsers" :key="user.id ?? `${user.name}-${i}`"
						type="button"
						class="flex items-center gap-2.5 w-full px-2.5 py-[7px] border-0 bg-transparent rounded-[9px] cursor-pointer text-left transition-colors duration-200 hover:bg-accent/9"
						:class="{ 'bg-accent/9': i === mentionState.selectedIndex }"
						@click="selectMention(user)">
						<div :class="[user.color, 'w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[0.68rem] font-bold shrink-0']">{{ user.initials }}</div>
						<div class="flex flex-col gap-px">
							<span class="text-[0.82rem] font-semibold text-heading leading-[1.2]">{{ user.name }}</span>
							<span class="text-[0.72rem] text-text/40 leading-[1.2]">{{ user.role }}</span>
						</div>
					</button>
				</div>
			</Transition>
		</Teleport>

	</div>
</template>

<style scoped>
/* ── Tiptap prose ── */
:deep(.tiptap-prose) {
	font-size: 0.875rem;
	line-height: 1.65;
	color: var(--color-text, #333);
	outline: none;
	min-height: v-bind(minHeight);
	word-break: break-word;
}

:deep(.tiptap-prose p) { margin: 0 0 0.35em 0; }
:deep(.tiptap-prose p:last-child) { margin-bottom: 0; }

:deep(.tiptap-prose h1) { font-size: 1.7em; font-weight: 700; color: var(--color-heading, #111); margin: 0.6em 0 0.3em; line-height: 1.2; }
:deep(.tiptap-prose h2) { font-size: 1.4em; font-weight: 700; color: var(--color-heading, #111); margin: 0.55em 0 0.25em; }
:deep(.tiptap-prose h3) { font-size: 1.2em; font-weight: 700; color: var(--color-heading, #111); margin: 0.5em 0 0.2em; }
:deep(.tiptap-prose h4) { font-size: 1.05em; font-weight: 700; color: var(--color-heading, #111); margin: 0.45em 0 0.2em; }
:deep(.tiptap-prose h5) { font-size: 0.95em; font-weight: 700; color: var(--color-heading, #111); margin: 0.4em 0 0.15em; }
:deep(.tiptap-prose h6) { font-size: 0.875em; font-weight: 700; color: color-mix(in srgb, var(--color-heading, #111) 65%, transparent); margin: 0.35em 0 0.15em; }

:deep(.tiptap-prose strong) { font-weight: 700; color: var(--color-heading, #111); }
:deep(.tiptap-prose em) { font-style: italic; }
:deep(.tiptap-prose u) { text-decoration: underline; }
:deep(.tiptap-prose s) { text-decoration: line-through; opacity: 0.5; }

:deep(.tiptap-prose pre) {
	background: color-mix(in srgb, var(--color-heading, #111) 6%, transparent);
	border-radius: 6px;
	padding: 0.75em 1em;
	margin: 0.5em 0;
	overflow-x: auto;
}
:deep(.tiptap-prose pre code) { background: transparent; padding: 0; color: var(--color-text, #333); font-size: 0.82em; }

:deep(.tiptap-prose ul) { list-style-type: disc !important; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.tiptap-prose ol) { list-style-type: decimal !important; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.tiptap-prose ul ul) { list-style-type: circle !important; }
:deep(.tiptap-prose ul ul ul) { list-style-type: square !important; }
:deep(.tiptap-prose li) { margin: 0.1em 0; display: list-item !important; }

:deep(.tiptap-prose blockquote) {
	border-left: 3px solid var(--color-accent, #6366f1);
	padding-left: 0.85em;
	margin: 0.35em 0;
	opacity: 0.7;
}

:deep(.tiptap-prose hr) {
	border: none;
	border-top: 2px solid color-mix(in srgb, var(--color-heading, #111) 12%, transparent);
	margin: 0.75em 0;
}

:deep(.tiptap-prose a) { color: var(--color-accent, #6366f1); text-decoration: underline; cursor: pointer; }
:deep(.tiptap-prose a:hover) { opacity: 0.8; }

/* ── Placeholder ── */
:deep(.tiptap-prose .is-editor-empty::before) {
	content: attr(data-placeholder);
	float: left;
	color: color-mix(in srgb, var(--color-text, #333) 28%, transparent);
	pointer-events: none;
	height: 0;
	font-style: italic;
}

/* ── Mention chip ── */
:deep(.mention-chip) {
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
}

.mention-fade-enter-active, .mention-fade-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.mention-fade-enter-from, .mention-fade-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }

/* ── File attachment styles ── */
:deep(.file-attachment-wrapper) {
	position: relative;
	display: inline-flex;
	align-items: flex-start;
	gap: 6px;
	margin: 8px 0;
	padding: 2px;
	border-radius: 8px;
}
:deep(.file-attachment-wrapper.is-selected),
:deep(.file-attachment-wrapper:hover) { outline: 2px solid var(--color-accent, #6366f1); outline-offset: 2px; }
:deep(.file-attachment-delete) {
	position: absolute; top: -8px; right: -8px; width: 22px; height: 22px;
	border-radius: 50%; background: #ef4444; color: white; border: 2px solid #fff;
	cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0; z-index: 2;
}
:deep(.file-attachment-wrapper:hover) .file-attachment-delete,
:deep(.file-attachment-wrapper.is-selected) .file-attachment-delete { display: flex; }
:deep(.file-attachment-image) { max-width: 100%; border-radius: 6px; max-height: 260px; object-fit: contain; }
:deep(.file-attachment-video) { max-width: 100%; border-radius: 6px; max-height: 320px; background: #000; }
:deep(.file-attachment-audio) { width: 100%; max-width: 300px; margin: 4px 0; border-radius: 6px; }
:deep(.file-attachment-pdf) {
	position: relative; width: 100%; max-width: 320px; border-radius: 6px;
	overflow: hidden; cursor: pointer; border: 1px solid color-mix(in srgb, var(--color-heading, #111) 10%, transparent); background: #f8f8f8;
}
:deep(.pdf-preview-frame) { display: block; }
:deep(.pdf-preview-frame embed) { display: block; height: 200px; border: none; }
:deep(.file-icon-overlay) { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px; }
:deep(.file-overlay-name) { font-size: 0.78rem; font-weight: 600; color: var(--color-heading, #111); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.file-overlay-size) { font-size: 0.7rem; color: color-mix(in srgb, var(--color-text, #333) 40%, transparent); }
:deep(.file-attachment-generic) {
	display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px;
	border-radius: 6px; background: color-mix(in srgb, var(--color-accent, #6366f1) 6%, transparent);
	cursor: pointer; transition: background 0.15s; max-width: 280px;
}
:deep(.file-attachment-generic:hover) { background: color-mix(in srgb, var(--color-accent, #6366f1) 10%, transparent); }
:deep(.file-info) { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
:deep(.file-name) { font-size: 0.78rem; font-weight: 600; color: var(--color-heading, #111); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.file-size) { font-size: 0.68rem; color: color-mix(in srgb, var(--color-text, #333) 40%, transparent); }
</style>
