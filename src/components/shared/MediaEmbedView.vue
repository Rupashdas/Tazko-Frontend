<script>
import { h, defineComponent, computed, ref } from 'vue'

export default defineComponent({
	name: 'MediaEmbedView',
	props: ['editor', 'node', 'getPos', 'selected', 'deleteNode'],

	setup(props) {
		const platform = computed(() => props.node.attrs.platform || 'youtube')
		const embedUrl = computed(() => props.node.attrs.embedUrl || '')
		const originalUrl = computed(() => props.node.attrs.originalUrl || '')
		const loaded = ref(false)

		function load() { loaded.value = true }

		function deleteEmbed() {
			const pos = props.getPos()
			if (typeof pos === 'number') {
				props.editor.chain().deleteRange({ from: pos, to: pos + props.node.nodeSize }).run()
			}
		}

		return { platform, embedUrl, originalUrl, loaded, load, deleteEmbed }
	},

	render() {
		const { platform, embedUrl, originalUrl, loaded, load, deleteEmbed, selected } = this

		const platformLabel = platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : 'Video'

		// Thumbnail/play overlay before iframe loads
		const inner = loaded
			? h('iframe', {
				src: embedUrl,
				allowfullscreen: true,
				allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
				frameborder: '0',
				class: 'me-iframe',
				contenteditable: 'false',
			})
			: h('div', { class: 'me-thumbnail', onClick: load, contenteditable: 'false' }, [
				platform === 'youtube'
					? h('img', {
						src: `https://img.youtube.com/vi/${embedUrl.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg`,
						class: 'me-thumb-img',
						alt: 'Video thumbnail',
						onerror: (e) => { e.target.style.display = 'none' },
					})
					: null,
				h('div', { class: 'me-play-btn' }, [
					h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: '48', height: '48' }, [
						h('path', { d: 'M8 5v14l11-7z' }),
					]),
				]),
				h('div', { class: 'me-platform-badge' }, platformLabel),
			])

		return h('div', {
			'data-node-view-wrapper': '',
			class: ['me-wrapper', selected ? 'is-selected' : ''],
			contenteditable: 'false',
		}, [
			h('div', { class: 'me-aspect' }, [inner]),
			h('div', { class: 'me-caption' }, [
				h('span', { class: 'me-caption-label' }, `${platformLabel} embed`),
				h('a', {
					href: originalUrl,
					target: '_blank',
					rel: 'noopener noreferrer',
					class: 'me-caption-link',
					contenteditable: 'false',
					onClick: (e) => e.stopPropagation(),
				}, originalUrl),
			]),
			h('button', {
				type: 'button',
				class: 'me-delete',
				contenteditable: 'false',
				title: 'Remove embed',
				onClick: (e) => { e.stopPropagation(); deleteEmbed() },
			}, [
				h('svg', { width: '12', height: '12', viewBox: '0 0 16 16', fill: 'currentColor' }, [
					h('path', { d: 'M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z' }),
				]),
			]),
		])
	},
})
</script>

<style scoped>
.me-wrapper {
	position: relative;
	margin: 12px 0;
	border-radius: 8px;
	overflow: hidden;
	border: 2px solid transparent;
	transition: border-color 0.15s;
}

.me-wrapper.is-selected,
.me-wrapper:hover {
	border-color: var(--color-accent, #6366f1);
}

.me-aspect {
	position: relative;
	width: 100%;
	padding-top: 56.25%; /* 16:9 */
	background: #000;
	border-radius: 6px;
	overflow: hidden;
}

.me-iframe {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: none;
	border-radius: 6px;
}

/* Thumbnail / play overlay */
.me-thumbnail {
	position: absolute;
	inset: 0;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #111;
}

.me-thumb-img {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.75;
}

.me-play-btn {
	position: relative;
	z-index: 2;
	width: 72px;
	height: 72px;
	background: rgba(0, 0, 0, 0.65);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	transition: background 0.15s, transform 0.15s;
}

.me-thumbnail:hover .me-play-btn {
	background: var(--color-accent, #6366f1);
	transform: scale(1.08);
}

.me-platform-badge {
	position: absolute;
	top: 10px;
	left: 10px;
	z-index: 3;
	background: rgba(0, 0, 0, 0.6);
	color: #fff;
	font-size: 0.7rem;
	font-weight: 700;
	padding: 3px 8px;
	border-radius: 4px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

/* Caption bar */
.me-caption {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	background: color-mix(in srgb, var(--color-heading, #111) 4%, transparent);
	border-top: 1px solid color-mix(in srgb, var(--color-heading, #111) 8%, transparent);
}

.me-caption-label {
	font-size: 0.72rem;
	font-weight: 700;
	color: var(--color-accent, #6366f1);
	white-space: nowrap;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.me-caption-link {
	font-size: 0.72rem;
	color: color-mix(in srgb, var(--color-text, #333) 50%, transparent);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-decoration: none;
	flex: 1;
}

.me-caption-link:hover {
	color: var(--color-accent, #6366f1);
}

/* Delete button */
.me-delete {
	position: absolute;
	top: -8px;
	right: -8px;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: #ef4444;
	color: white;
	border: 2px solid white;
	cursor: pointer;
	display: none;
	align-items: center;
	justify-content: center;
	padding: 0;
	z-index: 10;
}

.me-wrapper:hover .me-delete,
.me-wrapper.is-selected .me-delete {
	display: flex;
}
</style>
