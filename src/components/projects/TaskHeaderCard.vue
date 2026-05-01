<script setup>
import { ref } from 'vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'
import { sanitize } from '@/utils/sanitize'
import { addIcons } from 'oh-vue-icons'
import {
	BiTrash, BiCheck2,
	BiCircle, BiArrowRepeat, BiExclamationCircle, BiCheck2Circle,
} from 'oh-vue-icons/icons'

addIcons(
	BiTrash, BiCheck2,
	BiCircle, BiArrowRepeat, BiExclamationCircle, BiCheck2Circle,
)

const props = defineProps({
	task: { type: Object, required: true },
	members: { type: Array, default: () => [] },
	statusConfig: { type: Object, required: true },
	priorityConfig: { type: Object, required: true },
	// Capability flags from parent — drive disable/hide of edit controls
	canUpdate: { type: Boolean, default: false },
	canDelete: { type: Boolean, default: false },
	saving:    { type: Boolean, default: false },
})

// Emits a partial patch (only the changed fields), not the whole task.
// Parent PATCHes just that payload to the API.
const emit = defineEmits(['save', 'delete'])

// ── Inline title edit ──────────────────────────────────
const editingTitle = ref(false)
const titleDraft = ref('')
const startEditTitle = () => {
	if (!props.canUpdate) return
	editingTitle.value = true
	titleDraft.value = props.task.title
}
const saveTitle = () => {
	const next = titleDraft.value.trim()
	if (next && next !== props.task.title) {
		emit('save', { title: next })
	}
	editingTitle.value = false
}

// ── Inline description edit ───────────────────────────
const editingDesc = ref(false)
const descDraft = ref('')
const descEditorRef = ref(null)

const startEditDesc = () => {
	if (!props.canUpdate) return
	editingDesc.value = true
	descDraft.value = props.task.description
}

const saveDesc = async () => {
	await descEditorRef.value?.flushDraft?.()
	if (descEditorRef.value) {
		const next = descEditorRef.value.getHTML()
		if (next !== props.task.description) {
			emit('save', { description: next })
		}
	}
	await descEditorRef.value?.clearDraft?.()
	editingDesc.value = false
}
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 p-6">

		<!-- Status + priority row -->
		<div class="flex items-center gap-2 mb-4 flex-wrap">
			<span
				:class="[statusConfig[task.status]?.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-semibold border']">
				<span :class="[statusConfig[task.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
				{{ task.status }}
			</span>
			<span
				:class="[priorityConfig[task.priority]?.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold border']">
				{{ task.priority }} Priority
			</span>
			<div class="flex-1" />
			<button
				v-if="canDelete"
				@click="emit('delete')"
				class="p-1.5 rounded-sm text-text hover:text-red-500 hover:bg-red-500/8 transition-colors"
				title="Delete task">
				<v-icon name="bi-trash" scale="0.85" />
			</button>
		</div>

		<!-- Editable title -->
		<div class="mb-5">
			<div v-if="!editingTitle"
				:class="[canUpdate ? 'cursor-pointer' : 'cursor-default']"
				@click="startEditTitle">
				<h1 class="text-xl font-bold text-heading leading-snug">{{ task.title }}</h1>
			</div>
			<input v-else v-model="titleDraft"
				class="w-full text-xl font-bold text-heading bg-transparent border-0 border-b-2 border-accent focus:outline-none pb-0.5 leading-snug"
				@blur="saveTitle" @keydown.enter="saveTitle" @keydown.esc="editingTitle = false" autofocus />
		</div>

		<!-- Editable description -->
		<div>
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-2">Description</p>

			<!-- View mode — links/files/embeds in the rendered HTML stay
			     fully clickable. Editing is opened by the explicit pencil
			     button (revealed on hover) or by clicking the empty-state
			     placeholder. -->
			<div v-if="!editingDesc"
				class="group/desc relative rounded-sm bg-heading/[0.025] border border-transparent px-4 py-3 transition-all hover:bg-heading/[0.035] hover:border-heading/8">
				<div v-if="task.description && task.description !== '<p></p>'"
					class="text-base text-text leading-relaxed prose-sm" v-html="sanitize(task.description)" />
				<p v-else
					:class="['text-base italic m-0', canUpdate ? 'text-text cursor-text' : 'text-text']"
					@click="canUpdate && startEditDesc()">
					{{ canUpdate ? 'Click to add a description…' : 'No description.' }}
				</p>

				<button
					v-if="canUpdate && task.description && task.description !== '<p></p>'"
					type="button"
					@click="startEditDesc"
					class="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-semibold text-text bg-panel/90 border border-heading/10 opacity-0 group-hover/desc:opacity-100 hover:text-accent hover:border-accent/40 transition-all"
					title="Edit description">
					<v-icon name="bi-pencil" scale="0.7" />
					Edit
				</button>
			</div>

			<div v-else class="space-y-2">
				<rich-text-editor ref="descEditorRef" v-model="descDraft" placeholder="Describe this task…"
					:show-toolbar="true" min-height="120px"
					:autofocus="true" :enable-mention="true" :users="members"
					:project-id="task.project_id"
					:draft-context-key="`task:${task.id}:description`" />
				<div class="flex items-center justify-end gap-2 mt-2">
					<button type="button" class="tazko-btn-cancel-sm" @click="editingDesc = false">Cancel</button>
					<button type="button" :disabled="saving" class="tazko-btn-sm" @click="saveDesc">
						<v-icon v-if="saving" name="bi-arrow-repeat" scale="0.8" class="animate-spin" />
						<v-icon v-else name="bi-check2" scale="0.8" />
						{{ saving ? 'Saving…' : 'Save' }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Rich content — saved HTML from RichTextEditor (description) */
:deep(.prose-sm) {
	font-size: 0.875rem;
	line-height: 1.65;
	color: var(--color-text, #333);
}
:deep(.prose-sm p) { margin: 0 0 0.35em 0; }
:deep(.prose-sm p:last-child) { margin-bottom: 0; }
:deep(.prose-sm h1) { font-size: 1.7em; font-weight: 700; color: var(--color-heading, #111); margin: 0.6em 0 0.3em; line-height: 1.2; }
:deep(.prose-sm h2) { font-size: 1.4em; font-weight: 700; margin: 0.55em 0 0.25em; }
:deep(.prose-sm h3) { font-size: 1.2em; font-weight: 700; margin: 0.5em 0 0.2em; }
:deep(.prose-sm strong) { font-weight: 700; }
:deep(.prose-sm em) { font-style: italic; }
:deep(.prose-sm code) { font-family: 'Fira Code', monospace; font-size: 0.82em; background: rgba(99,102,241,0.1); padding: 0.15em 0.4em; border-radius: 5px; color: #6366f1; }
:deep(.prose-sm ul) { list-style-type: disc !important; list-style-position: outside; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.prose-sm ol) { list-style-type: decimal !important; list-style-position: outside; padding-left: 1.4em; margin: 0.25em 0; }
:deep(.prose-sm li) { margin: 0.1em 0; display: list-item !important; }
:deep(.prose-sm a) { color: var(--color-accent, #6366f1); text-decoration: underline; cursor: pointer; }
:deep(.prose-sm pre) { background: rgba(var(--color-heading-rgb, 17,17,17),0.06); border-radius: 6px; padding: 0.75em 1em; margin: 0.5em 0; overflow-x: auto; }
:deep(.prose-sm blockquote) { border-left: 3px solid var(--color-accent, #6366f1); padding-left: 0.85em; margin: 0.35em 0; opacity: 0.7; }
:deep(.prose-sm hr) { border: none; border-top: 2px solid rgba(var(--color-heading-rgb, 17,17,17),0.12); margin: 0.75em 0; }
</style>
