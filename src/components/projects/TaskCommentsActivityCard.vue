<script setup>
import { ref } from 'vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'
import { sanitize } from '@/utils/sanitize'
import { addIcons } from 'oh-vue-icons'
import {
	BiChat, BiActivity, BiPencil, BiCheck2, BiX, BiHandThumbsUp,
} from 'oh-vue-icons/icons'

addIcons(BiChat, BiActivity, BiPencil, BiCheck2, BiX, BiHandThumbsUp)

const props = defineProps({
	comments: { type: Array, required: true },
	activity: { type: Array, required: true },
	members: { type: Array, default: () => [] },
	currentUser: {
		type: Object,
		default: () => ({ initials: 'YO', name: 'You', color: 'bg-accent' }),
	},
})
const emit = defineEmits(['update:comments'])

const activeSection = ref('comments')

const commentEditorRef = ref(null)
const commentEditorFocused = ref(false)

const sendComment = () => {
	const content = commentEditorRef.value?.getHTML() ?? ''
	if (!content || content === '<p></p>') return

	emit('update:comments', [
		...props.comments,
		{
			id: Date.now(),
			author: props.currentUser.name,
			initials: props.currentUser.initials,
			color: props.currentUser.color,
			text: content,
			time: 'Just now',
			likes: 0,
		},
	])
	commentEditorRef.value?.clear()
	commentEditorFocused.value = false
}

const editingCommentId = ref(null)
const editingCommentText = ref('')
const editingCommentEditorRef = ref(null)

const startEditComment = (comment) => {
	editingCommentId.value = comment.id
	editingCommentText.value = comment.text
}

const saveCommentEdit = (comment) => {
	const newText = editingCommentEditorRef.value?.getHTML() ?? editingCommentText.value
	emit('update:comments', props.comments.map(c =>
		c.id === comment.id ? { ...c, text: newText } : c
	))
	editingCommentId.value = null
	editingCommentText.value = ''
}

const cancelEditComment = () => {
	editingCommentId.value = null
	editingCommentText.value = ''
}

const setEditingCommentEditorRef = (el) => {
	editingCommentEditorRef.value = el
}

const toggleLike = (comment) => {
	const nextLikes = (comment.likes || 0) > 0 ? 0 : 1
	emit('update:comments', props.comments.map(c =>
		c.id === comment.id ? { ...c, likes: nextLikes } : c
	))
}
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 overflow-hidden">

		<!-- Tab switcher -->
		<div class="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-heading/5">
			<button
				v-for="tab in [{ key: 'comments', label: 'Comments', icon: 'bi-chat', count: comments.length }, { key: 'activity', label: 'Activity', icon: 'bi-activity', count: activity.length }]"
				:key="tab.key" @click="activeSection = tab.key" :class="['inline-flex items-center gap-1.5 px-4 py-3 text-base font-semibold transition-all border-b-2 -mb-px',
					activeSection === tab.key
						? 'text-accent border-accent'
						: 'text-text border-transparent hover:text-text hover:border-heading/15']">
				<v-icon :name="tab.icon" scale="0.85" />
				{{ tab.label }}
				<span :class="['text-sm font-bold px-1.5 py-0.5 rounded-full tabular-nums',
					activeSection === tab.key ? 'bg-accent/15 text-accent' : 'bg-heading/5 text-text']">
					{{ tab.count }}
				</span>
			</button>
		</div>

		<!-- Comments panel -->
		<div v-if="activeSection === 'comments'" class="p-5 space-y-5">
			<div v-for="comment in comments" :key="comment.id" class="flex items-start gap-3 group/comment">
				<div
					:class="[comment.color, 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
					{{ comment.initials }}
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 mb-1.5">
						<span class="text-base font-bold text-heading">{{ comment.author }}</span>
						<span class="text-sm text-text">{{ comment.time }}</span>
						<div class="ml-auto flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
							<button @click="startEditComment(comment)"
								class="inline-flex items-center gap-1 text-text hover:text-accent transition-colors">
								<v-icon name="bi-pencil" scale="0.7" />
							</button>
							<span class="text-text/30">|</span>
							<button @click="toggleLike(comment)"
								class="inline-flex items-center gap-1 text-sm"
								:class="comment.likes ? 'text-accent' : 'text-text hover:text-accent'">
								<v-icon name="bi-hand-thumbs-up" scale="0.7" />
								{{ comment.likes }}
							</button>
						</div>
					</div>
					<div
						class="bg-heading/[0.03] rounded-sm rounded-tl-none px-4 py-3 border border-heading/[0.06]">
						<div v-if="editingCommentId !== comment.id" class="text-base text-text leading-relaxed rich-content"
							v-html="sanitize(comment.text)" />
						<div v-else class="space-y-2">
							<rich-text-editor :ref="setEditingCommentEditorRef" v-model="editingCommentText"
								min-height="80px" :autofocus="true" :enable-mention="true" :users="members" />
							<div class="flex items-center gap-2 justify-end">
								<button @click="saveCommentEdit(comment)" class="tazko-btn">
									<v-icon name="bi-check2" scale="0.85" />
									Save
								</button>
								<button @click="cancelEditComment" class="tazko-btn-cancel">
									<v-icon name="bi-x" scale="0.85" />
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-start gap-3 pt-2 border-t border-heading/5">
				<div
					:class="[currentUser.color, 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0']">
					{{ currentUser.initials }}
				</div>
				<div class="flex-1">
					<rich-text-editor ref="commentEditorRef"
						placeholder="Write a comment… (use @ to mention someone)"
						:show-toolbar="commentEditorFocused" :enable-mention="true" :users="members"
						min-height="120px" @focus="commentEditorFocused = true" />
					<div v-if="commentEditorFocused" class="flex items-center gap-2 mt-2">
						<button type="button" class="inline-flex items-center px-3 py-1.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors" @click="sendComment">Add Comment</button>
						<button type="button" class="inline-flex items-center px-3 py-1.5 rounded-sm border border-heading/10 text-text text-sm font-semibold hover:bg-heading/5 transition-colors" @click="commentEditorFocused = false">Cancel</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Activity panel -->
		<div v-else class="p-5">
			<div class="relative">
				<div class="absolute left-3.5 top-4 bottom-4 w-px bg-heading/8" />
				<div class="space-y-5">
					<div v-for="(item, i) in activity" :key="i" class="flex items-start gap-4 relative">
						<div
							:class="[item.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 z-10 shadow-sm ring-2 ring-offset-1 ring-offset-panel ring-heading/20']">
							{{ item.initials }}
						</div>
						<div class="flex-1 pt-0.5">
							<p class="text-base text-text">{{ item.text }}</p>
							<p class="text-sm text-text mt-0.5">{{ item.time }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Rich content — saved HTML from RichTextEditor (comments) */
:deep(.rich-content) {
	font-size: 0.875rem;
	line-height: 1.65;
	color: var(--color-text, #333);
}
:deep(.rich-content p) { margin: 0 0 0.35em 0; }
:deep(.rich-content p:last-child) { margin-bottom: 0; }
:deep(.rich-content h1) { font-size: 1.7em; font-weight: 700; color: var(--color-heading, #111); margin: 0.6em 0 0.3em; line-height: 1.2; }
:deep(.rich-content h2) { font-size: 1.4em; font-weight: 700; margin: 0.55em 0 0.25em; }
:deep(.rich-content h3) { font-size: 1.2em; font-weight: 700; margin: 0.5em 0 0.2em; }
:deep(.rich-content strong) { font-weight: 700; }
:deep(.rich-content em) { font-style: italic; }
:deep(.rich-content code) { font-family: 'Fira Code', monospace; font-size: 0.82em; background: rgba(99,102,241,0.1); padding: 0.15em 0.4em; border-radius: 5px; color: #6366f1; }
:deep(.rich-content ul) { list-style-type: disc !important; list-style-position: outside; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.rich-content ol) { list-style-type: decimal !important; list-style-position: outside; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.rich-content li) { margin: 0.1em 0; display: list-item !important; }
:deep(.rich-content a) { color: var(--color-accent, #6366f1); text-decoration: underline; cursor: pointer; }
:deep(.rich-content pre) { background: rgba(var(--color-heading-rgb, 17,17,17),0.06); border-radius: 6px; padding: 0.75em 1em; margin: 0.5em 0; overflow-x: auto; }
:deep(.rich-content blockquote) { border-left: 3px solid var(--color-accent, #6366f1); padding-left: 0.85em; margin: 0.35em 0; opacity: 0.7; }
:deep(.rich-content hr) { border: none; border-top: 2px solid rgba(var(--color-heading-rgb, 17,17,17),0.12); margin: 0.75em 0; }
</style>
