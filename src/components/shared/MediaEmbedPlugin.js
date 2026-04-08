import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import MediaEmbedView from './MediaEmbedView.vue'

// ── URL detection helpers ─────────────────────────────────

export function detectYouTubeId(url) {
	try {
		const u = new URL(url)
		if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
		if (u.hostname.includes('youtube.com')) {
			if (u.searchParams.get('v')) return u.searchParams.get('v')
			const m = u.pathname.match(/\/(?:embed|shorts|v)\/([^/?&]+)/)
			if (m) return m[1]
		}
	} catch {}
	return null
}

export function detectVimeoId(url) {
	try {
		const u = new URL(url)
		if (u.hostname.includes('vimeo.com')) {
			const m = u.pathname.match(/\/(?:video\/)?(\d+)/)
			if (m) return m[1]
		}
	} catch {}
	return null
}

export function urlToEmbedInfo(url) {
	const ytId = detectYouTubeId(url)
	if (ytId) {
		return {
			platform: 'youtube',
			embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0`,
			thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
		}
	}
	const vId = detectVimeoId(url)
	if (vId) {
		return {
			platform: 'vimeo',
			embedUrl: `https://player.vimeo.com/video/${vId}`,
			thumbnailUrl: '',
		}
	}
	return null
}

// ── Tiptap Node ───────────────────────────────────────────

export const MediaEmbed = Node.create({
	name: 'mediaEmbed',
	group: 'block',
	atom: true,
	draggable: true,

	addAttributes() {
		return {
			platform: { default: 'youtube' },
			embedUrl: { default: '' },
			originalUrl: { default: '' },
		}
	},

	parseHTML() {
		return [{ tag: 'div[data-media-embed]' }]
	},

	renderHTML({ node }) {
		return ['div', {
			'data-media-embed': '',
			'data-platform': node.attrs.platform,
			'data-embed-url': node.attrs.embedUrl,
			'data-original-url': node.attrs.originalUrl,
		}]
	},

	addNodeView() {
		return VueNodeViewRenderer(MediaEmbedView)
	},

	addCommands() {
		return {
			insertMediaEmbed: (options) => ({ commands }) => {
				return commands.insertContent({
					type: this.name,
					attrs: {
						platform: options.platform,
						embedUrl: options.embedUrl,
						originalUrl: options.originalUrl,
					},
				})
			},
		}
	},
})
