<script setup>
import { ref } from 'vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'
import { addIcons } from 'oh-vue-icons'
import { BiPencil, BiHandThumbsUp, BiCheck2, BiX, BiChat } from 'oh-vue-icons/icons'

addIcons(BiPencil, BiHandThumbsUp, BiCheck2, BiX, BiChat)

const props = defineProps({
	members: { type: Array, default: () => [] },
})

// ── Comments state ─────────────────────────────────────
const newComment = ref('')
const commentEditorRef = ref(null)
const commentEditorFocused = ref(false)

const comments = ref([
	{
		id: 1, author: 'Arif Hossain', initials: 'AH', color: 'bg-accent',
		text: '<p>Team — let\'s keep the project-level decisions and blockers here. Task-specific discussions should stay in the task cards.</p>',
		time: 'Mar 1, 9:15 AM', likes: 3,
	},
	{
		id: 2, author: 'Sara Khan', initials: 'SK', color: 'bg-violet-500',
		text: '<p>Sounds good. One thing we should decide at the project level: are we sticking with Tailwind for v1 or exploring a design-token system?</p>',
		time: 'Mar 1, 10:40 AM', likes: 1,
	},
	{
		id: 3, author: 'Noman Rahman', initials: 'NR', color: 'bg-emerald-500',
		text: '<p>Tailwind is fine for v1. We can revisit when the team grows. I\'ll draft the API contract doc by EOW so frontend can unblock.</p>',
		time: 'Mar 1, 2:05 PM', likes: 2,
	},
])

const sendComment = () => {
	const content = commentEditorRef.value?.getHTML() ?? ''
	if (!content || content === '<p></p>') return

	comments.value.push({
		id: Date.now(), author: 'You', initials: 'YO', color: 'bg-accent',
		text: content, time: 'Just now', likes: 0,
	})
	commentEditorRef.value?.clear()
	commentEditorFocused.value = false
}

// ── Comment editing ────────────────────────────────────
const editingCommentId = ref(null)
const editingCommentText = ref('')
const editingCommentEditorRef = ref(null)

const startEditComment = (comment) => {
	editingCommentId.value = comment.id
	editingCommentText.value = comment.text
}

const saveCommentEdit = (comment) => {
	if (!editingCommentEditorRef.value) {
		comment.text = editingCommentText.value
	} else {
		comment.text = editingCommentEditorRef.value.getHTML()
	}
	editingCommentId.value = null
	editingCommentText.value = ''
}

const cancelEditComment = () => {
	editingCommentId.value = null
	editingCommentText.value = ''
}

const toggleLike = (comment) => {
	if ((comment.likes || 0) > 0) {
		comment.likes = 0
	} else {
		comment.likes = 1
	}
}
</script>

<template>
	<div class="p-5">
		<div class="max-w-3xl mx-auto">

			<!-- Header -->
			<div class="flex items-center gap-2 mb-5">
				<v-icon name="bi-chat" scale="0.95" class="text-accent" />
				<h3 class="text-base font-bold text-heading">Project Discussion</h3>
				<span class="text-sm font-bold px-2 py-0.5 rounded-full tabular-nums bg-heading/5 text-text">
					{{ comments.length }}
				</span>
			</div>

			<!-- Comments list -->
			<div class="space-y-5 mb-6">
				<div v-for="comment in comments" :key="comment.id" class="flex items-start gap-3 group/comment">
					<div
						:class="[comment.color, 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
						{{ comment.initials }}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1.5">
							<span class="text-base font-bold text-heading">{{ comment.author }}</span>
							<span class="text-sm text-text">{{ comment.time }}</span>
							<div
								class="ml-auto flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
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
							<!-- View mode -->
							<div v-if="editingCommentId !== comment.id"
								class="text-base text-text leading-relaxed rich-content" v-html="comment.text" />
							<!-- Edit mode -->
							<div v-else class="space-y-2">
								<rich-text-editor ref="editingCommentEditorRef" v-model="editingCommentText"
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

				<div v-if="comments.length === 0" class="text-center py-12">
					<div class="w-14 h-14 mx-auto rounded-2xl bg-heading/5 flex items-center justify-center mb-3">
						<v-icon name="bi-chat" class="text-text" scale="1.5" />
					</div>
					<p class="text-base font-semibold text-text">No comments yet</p>
					<p class="text-sm text-text mt-1">Start the discussion below.</p>
				</div>
			</div>

			<!-- Comment composer -->
			<div class="flex items-start gap-3 pt-4 border-t border-heading/5">
				<div
					class="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
					YO
				</div>
				<div class="flex-1">
					<rich-text-editor ref="commentEditorRef" v-model="newComment"
						placeholder="Share an update, ask a question, or @mention someone…"
						:show-toolbar="commentEditorFocused" :enable-mention="true" :users="members"
						min-height="120px" @focus="commentEditorFocused = true" />
					<div v-if="commentEditorFocused" class="flex items-center gap-2 mt-2">
						<button type="button"
							class="inline-flex items-center px-3 py-1.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
							@click="sendComment">Post Comment</button>
						<button type="button"
							class="inline-flex items-center px-3 py-1.5 rounded-sm border border-heading/10 text-text text-sm font-semibold hover:bg-heading/5 transition-colors"
							@click="commentEditorFocused = false">Cancel</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
