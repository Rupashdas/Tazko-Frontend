<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCommentStore } from '@/stores/useCommentStore'
import { useToast } from '@/utils/toast'
import { sanitize } from '@/utils/sanitize'
import { paletteColor } from '@/utils/paletteColor'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiPencil, BiHandThumbsUp, BiCheck2, BiX, BiChat,
	BiTrash, BiArrowRepeat,
} from 'oh-vue-icons/icons'

addIcons(BiPencil, BiHandThumbsUp, BiCheck2, BiX, BiChat, BiTrash, BiArrowRepeat)

const props = defineProps({
	projectId:   { type: [Number, String], required: true },
	members:     { type: Array, default: () => [] },
	canCreate:   { type: Boolean, default: false },
	canEdit:     { type: Boolean, default: false },
	canDelete:   { type: Boolean, default: false },
	canReact:    { type: Boolean, default: false },
})

const auth = useAuthStore()
const store = useCommentStore()
const { errorToast } = useToast()

// ── Helpers ────────────────────────────────────────────
const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatTime = (dateStr) => {
	if (!dateStr) return ''
	const d = new Date(dateStr)
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
		', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Current user info ──────────────────────────────────
const currentUser = computed(() => auth.user)
const currentUserInitials = computed(() => getInitials(currentUser.value?.name))
const currentUserColor = computed(() => paletteColor(currentUser.value?.palette))

// Is this comment owned by the current user?
const isOwnComment = (comment) => comment.user?.id === currentUser.value?.id

// ── New comment composer ───────────────────────────────
const newComment = ref('')
const commentEditorRef = ref(null)
const commentEditorFocused = ref(false)

const sendComment = async () => {
	const content = commentEditorRef.value?.getHTML() ?? ''
	if (!content || content === '<p></p>') return

	const result = await store.createComment(props.projectId, content)
	if (result.success) {
		commentEditorRef.value?.clear()
		newComment.value = ''
		commentEditorFocused.value = false
	} else {
		errorToast(result.message)
	}
}

// ── Editing ────────────────────────────────────────────
const editingCommentId = ref(null)
const editingCommentText = ref('')
const editingEditorRef = ref(null)

const startEdit = (comment) => {
	editingCommentId.value = comment.id
	editingCommentText.value = comment.body
}

const saveEdit = async (comment) => {
	const editor = Array.isArray(editingEditorRef.value)
		? editingEditorRef.value[0]
		: editingEditorRef.value
	const body = editor?.getHTML ? editor.getHTML() : editingCommentText.value

	if (!body || body === '<p></p>') return

	const result = await store.updateComment(props.projectId, comment.id, body)
	if (result.success) {
		editingCommentId.value = null
		editingCommentText.value = ''
	} else {
		errorToast(result.message)
	}
}

const cancelEdit = () => {
	editingCommentId.value = null
	editingCommentText.value = ''
}

// ── Delete ─────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletingCommentId = ref(null)
const deleting = ref(false)

const requestDeleteComment = (commentId) => {
	deletingCommentId.value = commentId
	showDeleteModal.value = true
}

const confirmDeleteComment = async () => {
	deleting.value = true
	const result = await store.deleteComment(props.projectId, deletingCommentId.value)
	deleting.value = false
	showDeleteModal.value = false
	deletingCommentId.value = null
	if (!result.success) errorToast(result.message)
}

const cancelDeleteComment = () => {
	showDeleteModal.value = false
	deletingCommentId.value = null
}

// ── Like ───────────────────────────────────────────────
const toggleLike = (commentId) => {
	store.toggleLike(props.projectId, commentId)
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
					{{ store.comments.length }}
				</span>
			</div>

			<!-- Loading skeleton -->
			<div v-if="store.loading" class="space-y-5 mb-6 animate-pulse">
				<div v-for="n in 3" :key="n" class="flex items-start gap-3">
					<div class="w-9 h-9 rounded-full bg-heading/10 shrink-0" />
					<div class="flex-1 space-y-2">
						<div class="h-3 w-32 bg-heading/10 rounded" />
						<div class="h-16 bg-heading/10 rounded-sm" />
					</div>
				</div>
			</div>

			<!-- Comments list -->
			<div v-else class="space-y-5 mb-6">
				<div
					v-for="comment in store.comments"
					:key="comment.id"
					class="flex items-start gap-3 group/comment">

					<!-- Avatar -->
					<div v-if="comment.user?.avatar"
						class="w-9 h-9 rounded-full shrink-0 shadow-sm overflow-hidden">
						<img :src="comment.user.avatar" :alt="comment.user.name" class="w-full h-full object-cover" />
					</div>
					<div v-else
						:class="[paletteColor(comment.user?.palette), 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
						{{ getInitials(comment.user?.name) }}
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1.5">
							<span class="text-base font-bold text-heading">{{ comment.user?.name ?? 'Unknown' }}</span>
							<span class="text-sm text-text">{{ formatTime(comment.created_at) }}</span>
							<span v-if="comment.is_edited" class="text-xs text-text/50 italic">(edited)</span>

							<!-- Actions (hover) -->
							<div class="ml-auto flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
								<!-- Edit — only own comment -->
								<button
									v-if="canEdit && isOwnComment(comment)"
									@click="startEdit(comment)"
									class="inline-flex items-center gap-1 text-text hover:text-accent transition-colors"
									title="Edit comment">
									<v-icon name="bi-pencil" scale="0.7" />
								</button>

								<span v-if="canEdit && canDelete && isOwnComment(comment)" class="text-text/30">|</span>

								<!-- Delete -->
								<button
									v-if="canDelete && isOwnComment(comment)"
									@click="requestDeleteComment(comment.id)"
									class="inline-flex items-center gap-1 text-text hover:text-red-500 transition-colors"
									title="Delete comment">
									<v-icon name="bi-trash" scale="0.7" />
								</button>

								<span v-if="canReact && (canDelete || (canEdit && isOwnComment(comment)))" class="text-text/30">|</span>

								<!-- Like -->
								<button
									v-if="canReact"
									@click="toggleLike(comment.id)"
									class="inline-flex items-center gap-1 text-sm transition-colors"
									:class="comment.liked_by_me ? 'text-accent' : 'text-text hover:text-accent'">
									<v-icon name="bi-hand-thumbs-up" scale="0.7" />
									{{ comment.likes_count ?? 0 }}
								</button>
								<span v-if="!canReact && comment.likes_count" class="inline-flex items-center gap-1 text-sm text-text">
									<v-icon name="bi-hand-thumbs-up" scale="0.7" />
									{{ comment.likes_count }}
								</span>
							</div>
						</div>

						<div class="bg-heading/[0.03] rounded-sm rounded-tl-none px-4 py-3 border border-heading/[0.06]">
							<!-- View mode -->
							<div
								v-if="editingCommentId !== comment.id"
								class="text-base text-text leading-relaxed rich-content"
								v-html="sanitize(comment.body)" />

							<!-- Edit mode -->
							<div v-else class="space-y-2">
								<rich-text-editor
									ref="editingEditorRef"
									v-model="editingCommentText"
									min-height="80px"
									:autofocus="true"
									:enable-mention="true"
									:users="members"
									:project-id="projectId" />
								<div class="flex items-center gap-2 justify-end">
									<button
										@click="saveEdit(comment)"
										:disabled="store.saving"
										class="tazko-btn">
										<v-icon v-if="store.saving" name="bi-arrow-repeat" scale="0.85" class="animate-spin" />
										<v-icon v-else name="bi-check2" scale="0.85" />
										Save
									</button>
									<button @click="cancelEdit" class="tazko-btn-cancel">
										<v-icon name="bi-x" scale="0.85" />
										Cancel
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty state -->
				<div v-if="store.comments.length === 0" class="text-center py-12">
					<div class="w-14 h-14 mx-auto rounded-sm bg-heading/5 flex items-center justify-center mb-3">
						<v-icon name="bi-chat" class="text-text" scale="1.5" />
					</div>
					<p class="text-base font-semibold text-text">No comments yet</p>
					<p class="text-sm text-text mt-1">Start the discussion below.</p>
				</div>
			</div>

			<!-- Composer — only shown if user can create -->
			<div v-if="canCreate" class="flex items-start gap-3 pt-4 border-t border-heading/5">
				<!-- Current user avatar -->
				<div v-if="currentUser?.avatar" class="w-9 h-9 rounded-full shrink-0 overflow-hidden shadow-sm">
					<img :src="currentUser.avatar" :alt="currentUser.name" class="w-full h-full object-cover" />
				</div>
				<div v-else
					:class="[currentUserColor, 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0']">
					{{ currentUserInitials }}
				</div>

				<div class="flex-1">
					<rich-text-editor
						ref="commentEditorRef"
						v-model="newComment"
						placeholder="Share an update, ask a question, or @mention someone…"
						:show-toolbar="commentEditorFocused"
						:enable-mention="true"
						:users="members"
						:project-id="projectId"
						min-height="120px"
						@focus="commentEditorFocused = true" />
					<div v-if="commentEditorFocused" class="flex items-center gap-2 mt-2">
						<button
							type="button"
							:disabled="store.saving"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
							@click="sendComment">
							<v-icon v-if="store.saving" name="bi-arrow-repeat" scale="0.8" class="animate-spin" />
							Post Comment
						</button>
						<button
							type="button"
							class="inline-flex items-center px-3 py-1.5 rounded-sm border border-heading/10 text-text text-sm font-semibold hover:bg-heading/5 transition-colors"
							@click="commentEditorFocused = false">
							Cancel
						</button>
					</div>
				</div>
			</div>

			<!-- No permission to comment -->
			<div v-else class="pt-4 border-t border-heading/5">
				<p class="text-sm text-text/50 text-center italic">You don't have permission to post comments.</p>
			</div>

		</div>

		<ConfirmModal
			:show="showDeleteModal"
			title="Delete Comment"
			message="Are you sure you want to delete this comment? This action cannot be undone."
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deleting"
			@close="cancelDeleteComment"
			@confirm="confirmDeleteComment" />
	</div>
</template>
