<script setup>
import { computed } from 'vue'

const props = defineProps({
	fileName: { type: String, default: 'attachment' },
	fileType: { type: String, default: 'file' },
	fileSrc: { type: String, default: '' },
	fileSize: { type: Number, default: 0 },
	mimeType: { type: String, default: '' },
	editable: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'download'])

const extLabel = computed(() => {
	const name = props.fileName || ''
	const dot = name.lastIndexOf('.')
	if (dot === -1 || dot === name.length - 1) {
		if (props.fileType === 'pdf') return 'PDF'
		if (props.fileType === 'video') return 'VIDEO'
		if (props.fileType === 'audio') return 'AUDIO'
		return props.fileType ? props.fileType.toUpperCase() : 'FILE'
	}
	return name.slice(dot + 1).toUpperCase().slice(0, 5)
})

const sizeLabel = computed(() => {
	const bytes = props.fileSize
	if (!bytes || bytes < 1024) return bytes ? bytes + ' B' : ''
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
})

const sizeLabelFull = computed(() => {
	const bytes = props.fileSize
	if (!bytes) return ''
	if (bytes < 1024) return bytes + ' B'
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
})

const iconKind = computed(() => {
	const t = (props.fileType || '').toLowerCase()
	if (['pdf', 'image', 'video', 'audio', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'].includes(t)) return t
	const ext = (props.fileName.split('.').pop() || '').toLowerCase()
	if (ext === 'pdf') return 'pdf'
	if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') return 'zip'
	if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) return 'image'
	if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video'
	if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return 'audio'
	return 'file'
})

const svgPath = computed(() => {
	const paths = {
		image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
		video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		audio: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
		pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
		zip: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h2m-2 4h2',
		file: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
	}
	return paths[iconKind.value] || paths.file
})

const isPdfPreviewable = computed(() => iconKind.value === 'pdf' && props.fileSrc)

function onActivate() {
	if (props.editable) return
	if (!props.fileSrc) return
	if (iconKind.value === 'pdf') {
		emit('open')
	} else {
		emit('download')
	}
}
</script>

<template>
	<div
		class="file-attachment-card"
		:data-file-kind="iconKind"
		:data-editable="editable ? 'true' : 'false'"
		role="group"
		:aria-label="`File attachment: ${fileName}`"
	>
		<div
			class="file-attachment-card__preview"
			@click="onActivate"
		>
			<object
				v-if="isPdfPreviewable"
				class="file-attachment-card__pdf-frame"
				:data="fileSrc"
				type="application/pdf"
				:title="fileName"
				tabindex="-1"
			/>
			<svg
				v-else
				class="file-attachment-card__icon"
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path :d="svgPath" />
			</svg>
			<span v-if="!isPdfPreviewable" class="file-attachment-card__ext">{{ extLabel }}</span>
		</div>

		<div class="file-attachment-card__info">
			<div class="file-attachment-card__name" :title="fileName">{{ fileName }}</div>
			<div class="file-attachment-card__meta">
				<span v-if="sizeLabel" class="file-attachment-card__size" :title="sizeLabelFull + ' (' + fileSize + ' bytes)'">{{ sizeLabel }}</span>
				<span v-if="sizeLabel" class="file-attachment-card__dot">·</span>
				<span class="file-attachment-card__type">{{ extLabel }}</span>
			</div>
		</div>
	</div>
</template>