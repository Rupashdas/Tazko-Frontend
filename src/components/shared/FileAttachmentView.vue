<script>
import { h, defineComponent, computed } from 'vue'

export default defineComponent({
	name: 'FileAttachmentView',
	props: ['editor', 'node', 'getPos', 'selected', 'deleteNode', 'extension', 'decorations', 'view', 'innerDecorations', 'HTMLAttributes', 'updateAttributes'],

	setup(props) {
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

		return { fileType, fileName, fileSrc, fileAlign, sizeLabel, deleteFile, setAlign }
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
			const paths = {
				image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
				video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
				audio: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
				pdf: '7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
				file: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
			}
			return `M${paths[type] || paths.file}`
		},
		alignSvg(align) {
			if (align === 'left') return 'M3 5h18M3 10h12M3 15h18M3 20h12'
			if (align === 'center') return 'M3 5h18M6 10h12M3 15h18M6 20h12'
			if (align === 'right') return 'M3 5h18M9 10h12M3 15h18M9 20h12'
			return ''
		},
	},

	render() {
		const { fileType, fileSrc, fileName, fileAlign, sizeLabel, deleteFile, setAlign, selected } = this

		// ── Preview element ───────────────────────────────
		let preview
		if (fileType === 'image') {
			preview = h('img', {
				src: fileSrc, alt: fileName,
				class: 'max-w-full rounded-[6px] max-h-[320px] object-contain block',
				contenteditable: 'false',
			})
		} else if (fileType === 'video') {
			preview = h('video', {
				src: fileSrc, controls: true, preload: 'metadata',
				class: 'max-w-full rounded-[6px] max-h-[320px] bg-black block',
				style: { pointerEvents: 'auto' },
			})
		} else if (fileType === 'audio') {
			preview = h('audio', {
				src: fileSrc, controls: true, preload: 'metadata',
				class: 'w-full max-w-[300px] my-1 rounded-[6px] block',
				style: { pointerEvents: 'auto' },
			})
		} else if (fileType === 'pdf') {
			preview = h('div', {
				class: 'relative w-full max-w-[320px] rounded-[6px] overflow-hidden cursor-pointer border border-black/10 bg-[#f8f8f8]',
				onClick: this.openFile,
			}, [
				h('object', {
					class: 'block',
					data: fileSrc, type: 'application/pdf', title: fileName,
				}),
				h('div', { class: 'flex flex-col items-center gap-1 p-2.5' }, [
					h('div', { class: 'flex text-accent', innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="${this.svgPath('pdf')}"/></svg>` }),
					h('span', { class: 'text-[0.78rem] font-semibold text-heading max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap' }, fileName),
					sizeLabel ? h('span', { class: 'text-[0.7rem] text-text/40' }, sizeLabel) : null,
				]),
			])
		} else {
			preview = h('div', {
				class: 'inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-[6px] bg-accent/6 cursor-pointer transition-colors duration-150 max-w-[280px] hover:bg-accent/10',
				contenteditable: 'false',
				onClick: this.downloadFile,
			}, [
				h('div', { class: 'flex text-accent', innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="${this.svgPath('file')}"/></svg>` }),
				h('div', { class: 'flex flex-col gap-0.5 min-w-0' }, [
					h('span', { class: 'text-[0.78rem] font-semibold text-heading overflow-hidden text-ellipsis whitespace-nowrap' }, fileName),
					sizeLabel ? h('span', { class: 'text-[0.68rem] text-text/40' }, sizeLabel) : null,
				]),
			])
		}

		// ── Image alignment toolbar ───────────────────────
		const alignToolbar = fileType === 'image'
			? h('div', {
				class: [
					'absolute -top-9 left-1/2 -translate-x-1/2 bg-panel border border-heading/10 rounded-[6px] shadow-[0_4px_14px_rgba(0,0,0,0.12)] p-[3px] gap-px flex-row z-10',
					selected ? 'flex' : 'hidden group-hover:flex',
				],
				contenteditable: 'false',
			}, [
				...['left', 'center', 'right'].map(align =>
					h('button', {
						type: 'button',
						class: [
							'w-[26px] h-[26px] border-0 rounded-[4px] cursor-pointer flex items-center justify-center transition-colors duration-100',
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
			class: 'fa-node-view w-full my-2',
			style: { display: 'flex', justifyContent: justifyMap[fileAlign] || 'flex-start' },
		}, [
			h('div', {
				class: [
					'group relative inline-flex flex-col items-start gap-1 p-0.5 rounded-[8px]',
					selected ? 'outline outline-2 outline-accent outline-offset-2' : 'hover:outline hover:outline-2 hover:outline-accent hover:outline-offset-2',
				],
			}, [
				preview,
				alignToolbar,
				// Delete button
				h('button', {
					type: 'button',
					class: [
						'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/65 text-white border-[1.5px] border-white/90 cursor-pointer items-center justify-center p-0 z-[2] transition-colors duration-150 hover:bg-black/85',
						selected ? 'flex' : 'hidden group-hover:flex',
					],
					contenteditable: 'false',
					onClick: (e) => { e.stopPropagation(); deleteFile() },
				}, [
					h('svg', { width: '12', height: '12', viewBox: '0 0 16 16', fill: 'currentColor' }, [
						h('path', { d: 'M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z' }),
					]),
				]),
			]),
		])
	},
})
</script>
