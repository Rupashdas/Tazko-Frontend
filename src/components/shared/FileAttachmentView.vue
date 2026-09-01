<script>
import { h, defineComponent, computed, inject, ref, watch } from 'vue'
import FileAttachmentCard from './FileAttachmentCard.vue'

export default defineComponent({
	name: 'FileAttachmentView',
	props: ['editor', 'node', 'getPos', 'selected', 'deleteNode', 'extension', 'decorations', 'view', 'innerDecorations', 'HTMLAttributes', 'updateAttributes'],

	setup(props) {
		// Provided by RichTextEditor.vue. Null when this view renders outside
		// our editor (saved HTML rehydration in a read-only context, etc.).
		const progressMap = inject('rteUploadProgress', null)
		const uploading = computed(() => !!props.node.attrs.uploading)
		const progress = computed(() => {
			const id = props.node.attrs.tempId
			if (!id || !progressMap) return 0
			return progressMap.get(id) ?? 0
		})

		const fileType = computed(() => props.node.attrs.fileType || 'file')
		const fileName = computed(() => props.node.attrs.fileName || 'attachment')
		const fileSrc = computed(() => props.node.attrs.src || '')
		const fileAlign = computed(() => props.node.attrs.align || 'left')
		const sizeLabel = computed(() => {
			const bytes = props.node.attrs.fileSize
			if (!bytes || bytes < 1024) return bytes ? bytes + ' B' : ''
			if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
			return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
		})

		function deleteFile() {
			// Use the NodeView-provided deleteNode() callback rather than
			// computing range ourselves. ProseMirror resolves it against the
			// LIVE doc at dispatch time, so deleting the 2nd of N sibling
			// atoms removes exactly that node — not whatever happens to be at
			// a stale cached position.
			if (typeof props.deleteNode === 'function') {
				props.deleteNode()
				return
			}
			// Fallback for older TipTap versions
			const pos = props.getPos()
			if (typeof pos === 'number') {
				props.editor.chain().deleteRange({ from: pos, to: pos + props.node.nodeSize }).run()
			}
		}

		function setAlign(align) {
			if (props.updateAttributes) {
				props.updateAttributes({ align })
			}
		}

		function selectThisNode(e) {
			// Touch devices never fire :hover, so the alignment toolbar would
			// be unreachable without an explicit selection. Tap on the preview
			// promotes this node to a NodeSelection — the `selected` flag
			// flips true, the toolbar becomes visible, and the user can align
			// or delete. Mouse users get this for free; the cost is that
			// click-to-open semantics for non-image previews now require a
			// second tap (acceptable trade — matches Notion / Linear).
			if (typeof props.getPos !== 'function') return
			const pos = props.getPos()
			if (typeof pos !== 'number') return
			e.stopPropagation()
			props.editor.chain().setNodeSelection(pos).run()
		}

		// ── Image resize ───────────────────────────────────
		// Width persists as a node attribute. During an active drag we keep
		// the in-progress value in `dragWidth` and only commit on mouseup,
		// so we don't fire a transaction per mousemove (which would thrash
		// onUpdate / draft-save).
		const imgEl = ref(null)
		const dragWidth = ref(null)
		const setImgEl = (el) => { imgEl.value = el }
		const displayWidth = computed(() => {
			if (dragWidth.value != null) return dragWidth.value
			return props.node.attrs.width || null
		})

		let dragStartX = 0
		let dragStartW = 0
		function onResizeStart(e) {
			e.preventDefault()
			e.stopPropagation()
			if (!imgEl.value) return
			dragStartX = e.clientX
			dragStartW = imgEl.value.getBoundingClientRect().width
			dragWidth.value = dragStartW
			window.addEventListener('mousemove', onResizeMove)
			window.addEventListener('mouseup', onResizeEnd, { once: true })
		}
		function onResizeMove(e) {
			const dx = e.clientX - dragStartX
			const next = Math.max(80, dragStartW + dx)
			const editorEl = props.editor?.view?.dom
			const max = editorEl ? editorEl.getBoundingClientRect().width - 8 : 1200
			dragWidth.value = Math.min(next, max)
		}
		function onResizeEnd() {
			window.removeEventListener('mousemove', onResizeMove)
			if (dragWidth.value != null && props.updateAttributes) {
				props.updateAttributes({ width: Math.round(dragWidth.value) })
			}
			dragWidth.value = null
		}

		// ── Alt-text editor ────────────────────────────────
		const altDraft = ref(props.node.attrs.alt || '')
		watch(() => props.node.attrs.alt, (v) => { altDraft.value = v || '' })
		watch(() => props.selected, (sel) => { if (sel) altDraft.value = props.node.attrs.alt || '' })
		function commitAlt() {
			if ((props.node.attrs.alt || '') !== altDraft.value && props.updateAttributes) {
				props.updateAttributes({ alt: altDraft.value })
			}
		}
		function onAltKeydown(e) {
			if (e.key === 'Enter') { e.preventDefault(); commitAlt(); e.target.blur() }
			if (e.key === 'Escape') { altDraft.value = props.node.attrs.alt || ''; e.target.blur() }
		}
		function onAltInput(e) { altDraft.value = e.target.value }

		return {
			fileType, fileName, fileSrc, fileAlign, sizeLabel, deleteFile, setAlign,
			uploading, progress, selectThisNode,
			setImgEl, displayWidth, onResizeStart,
			altDraft, commitAlt, onAltKeydown, onAltInput,
		}
	},

	methods: {
		openFile() {
			const a = document.createElement('a')
			a.href = this.fileSrc; a.target = '_blank'; a.rel = 'noopener noreferrer'
			document.body.appendChild(a); a.click(); document.body.removeChild(a)
		},
		downloadFile() {
			const a = document.createElement('a')
			a.href = this.fileSrc; a.download = this.fileName; a.click()
		},
		svgPath(type) {
			// Each path is a complete `d` value starting with its own moveto.
			// Don't prepend another `M` here — that produces an empty moveto
			// (MM…) which renders the generic file/image/video/audio icons as
			// garbled paths in some engines.
			const paths = {
				image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
				video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
				audio: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
				pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
				file: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
			}
			return paths[type] || paths.file
		},
		alignSvg(align) {
			if (align === 'left') return 'M3 5h18M3 10h12M3 15h18M3 20h12'
			if (align === 'center') return 'M3 5h18M6 10h12M3 15h18M6 20h12'
			if (align === 'right') return 'M3 5h18M9 10h12M3 15h18M9 20h12'
			return ''
		},
	},

	render() {
		const { fileType, fileSrc, fileName, fileAlign, sizeLabel, deleteFile, setAlign, selected, uploading, progress, selectThisNode, setImgEl, displayWidth, onResizeStart, altDraft, commitAlt, onAltKeydown, onAltInput } = this

		// ── Preview element ───────────────────────────────
		let preview
		if (fileType === 'image') {
			preview = h('img', {
				ref: setImgEl,
				src: fileSrc,
				alt: this.node.attrs.alt || fileName,
				class: 'file-attachment-image rounded-lg object-contain block',
				style: {
					maxWidth: '100%',
					maxHeight: displayWidth ? '640px' : '320px',
					...(displayWidth ? { width: displayWidth + 'px' } : {}),
				},
				contenteditable: 'false',
			})
		} else if (fileType === 'video') {
			preview = h('video', {
				src: fileSrc, controls: true, preload: 'auto', playsinline: true,
				class: 'file-attachment-video rounded-lg bg-black block',
				style: { width: '100%', maxWidth: '100%', maxHeight: '300px', pointerEvents: 'auto' },
				contenteditable: 'false',
			})
		} else if (fileType === 'audio') {
			preview = h('audio', {
				src: fileSrc, controls: true, preload: 'metadata',
				class: 'file-attachment-audio w-full max-w-[300px] rounded-lg block',
				style: { pointerEvents: 'auto' },
				contenteditable: 'false',
			})
		} else if (fileType === 'pdf') {
			preview = h(FileAttachmentCard, {
				fileName,
				fileType,
				fileSrc,
				fileSize: this.node.attrs.fileSize,
				mimeType: this.node.attrs.mimeType,
				editable: true,
				onOpen: this.openFile,
				onDownload: this.downloadFile,
				contenteditable: 'false',
			})
		} else if (fileType === 'file') {
			preview = h(FileAttachmentCard, {
				fileName,
				fileType,
				fileSrc,
				fileSize: this.node.attrs.fileSize,
				mimeType: this.node.attrs.mimeType,
				editable: true,
				onOpen: this.openFile,
				onDownload: this.downloadFile,
				contenteditable: 'false',
			})
		} else {
			preview = h('div', {
				class: 'file-attachment-generic-icon flex items-center justify-center text-accent rounded-lg bg-accent/6 cursor-pointer',
				contenteditable: 'false',
				onClick: this.downloadFile,
			}, [
				h('svg', {
					xmlns: 'http://www.w3.org/2000/svg', width: '40', height: '40',
					fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5',
				}, [
					h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: this.svgPath('file') }),
				]),
			])
		}

		// ── File details (name + size) — shown for non-card previews only ──
		const showDetails = fileType !== 'pdf' && fileType !== 'file'
		const detailsDiv = showDetails
			? h('div', { class: 'file-attachment-details' }, [
				h('span', { class: 'file-overlay-name' }, fileName),
				sizeLabel ? h('span', { class: 'file-overlay-size' }, sizeLabel) : null,
			])
			: null

		// ── Image alignment toolbar ───────────────────────
		const alignToolbar = fileType === 'image'
			? h('div', {
				class: [
					'absolute -top-9 left-1/2 -translate-x-1/2 bg-panel border border-heading/8 rounded-lg shadow-lg p-1 gap-0.5 flex-row z-10',
					selected ? 'flex' : 'hidden group-hover:flex',
				],
				contenteditable: 'false',
			}, [
				...['left', 'center', 'right'].map(align =>
					h('button', {
						type: 'button',
						class: [
							'w-7 h-7 border-0 rounded-md cursor-pointer flex items-center justify-center transition-colors duration-100',
							fileAlign === align
								? 'bg-accent/14 text-accent'
								: 'bg-transparent text-text/55 hover:bg-heading/7 hover:text-heading',
						],
						title: `Align ${align}`,
						onClick: (e) => { e.stopPropagation(); setAlign(align) },
					}, [
						h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }, [
							h('path', { d: this.alignSvg(align) }),
						]),
					])
				),
			])
			: null

		// ── Alignment justify map ─────────────────────────
		const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }

		return h('div', {
			'data-node-view-wrapper': '',
			class: 'w-full my-2',
			style: { display: 'flex', justifyContent: justifyMap[fileAlign] || 'flex-start' },
		}, [
			h('div', {
				class: [
					'group relative inline-flex flex-col items-start gap-1 p-0.5 rounded-lg',
					selected ? 'outline outline-2 outline-accent outline-offset-2' : 'hover:outline hover:outline-2 hover:outline-accent hover:outline-offset-2',
				],
				onMousedown: selectThisNode,
			}, [
				preview,
				detailsDiv,
				// Progress bar overlay during upload — sits along the bottom of
				// the preview while we still have the local blob URL as src.
				uploading ? h('div', {
					class: 'absolute left-0 right-0 bottom-0 h-1 bg-black/30 rounded-b-lg overflow-hidden pointer-events-none',
					contenteditable: 'false',
				}, [
					h('div', {
						class: 'h-full bg-accent transition-[width] duration-150 ease-linear',
						style: { width: progress + '%' },
					}),
				]) : null,
				// Tiny percent label, top-right of the preview.
				uploading ? h('div', {
					class: 'absolute top-1 right-1 px-1.5 py-px rounded bg-black/55 text-white text-xs font-semibold leading-none pointer-events-none',
					contenteditable: 'false',
				}, progress + '%') : null,
				alignToolbar,
				// Resize handle (image only, when selected and not uploading).
				(fileType === 'image' && selected && !uploading) ? h('span', {
					class: 'absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-accent border-2 border-white rounded-md cursor-nwse-resize z-[3]',
					style: { boxShadow: '0 1px 3px rgba(0,0,0,0.25)' },
					contenteditable: 'false',
					title: 'Drag to resize',
					onMousedown: onResizeStart,
				}) : null,
				// Delete button
				h('button', {
					type: 'button',
					class: [
						'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 text-white border-[1.5px] border-white/90 cursor-pointer items-center justify-center p-0 z-[2] transition-colors duration-150 hover:bg-red-500',
						selected ? 'flex' : 'hidden group-hover:flex',
					],
					title: 'Remove attachment',
					contenteditable: 'false',
					onClick: (e) => { e.stopPropagation(); deleteFile() },
				}, [
					h('svg', { width: '12', height: '12', viewBox: '0 0 16 16', fill: 'currentColor' }, [
						h('path', { d: 'M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z' }),
					]),
				]),
				// Alt-text editor (image only, when selected). Persists on Enter
				// or blur. Stops mousedown so editing the input doesn't bounce
				// the NodeSelection back to the parent wrapper.
				(fileType === 'image' && selected) ? h('span', {
					class: 'inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded bg-heading/[0.05] border border-heading/8 text-xs max-w-full',
					contenteditable: 'false',
					onMousedown: (e) => e.stopPropagation(),
				}, [
					h('span', { class: 'font-bold uppercase text-[0.65rem] tracking-wider text-text/50' }, 'Alt'),
					h('input', {
						type: 'text',
						value: altDraft,
						placeholder: 'Describe the image (for screen readers)',
						class: 'border-0 bg-transparent outline-none text-sm text-text min-w-[220px]',
						onInput: onAltInput,
						onBlur: commitAlt,
						onKeydown: onAltKeydown,
					}),
				]) : null,
			]),
		])
	},
})
</script>
