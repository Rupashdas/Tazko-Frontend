<script setup>
import { ref } from 'vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiPencil, BiArchive, BiTrash, BiCheck2,
	BiCircle, BiArrowRepeat, BiExclamationCircle, BiCheck2Circle,
} from 'oh-vue-icons/icons'

addIcons(
	BiPencil, BiArchive, BiTrash, BiCheck2,
	BiCircle, BiArrowRepeat, BiExclamationCircle, BiCheck2Circle,
)

const props = defineProps({
	task: { type: Object, required: true },
	members: { type: Array, default: () => [] },
	statusConfig: { type: Object, required: true },
	priorityConfig: { type: Object, required: true },
})

const emit = defineEmits(['update:task', 'edit', 'archive', 'delete'])

// ── Inline title edit ──────────────────────────────────
const editingTitle = ref(false)
const titleDraft = ref('')
const startEditTitle = () => { editingTitle.value = true; titleDraft.value = props.task.title }
const saveTitle = () => {
	if (titleDraft.value.trim()) {
		emit('update:task', { ...props.task, title: titleDraft.value.trim() })
	}
	editingTitle.value = false
}

// ── Inline description edit ───────────────────────────
const editingDesc = ref(false)
const descDraft = ref('')
const descEditorRef = ref(null)

const startEditDesc = () => {
	editingDesc.value = true
	descDraft.value = props.task.description
}

const saveDesc = () => {
	if (descEditorRef.value) {
		emit('update:task', { ...props.task, description: descEditorRef.value.getHTML() })
	}
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
				@click="emit('edit')"
				class="p-1.5 rounded-sm text-text hover:text-heading hover:bg-heading/5 transition-colors">
				<v-icon name="bi-pencil" scale="0.85" />
			</button>
			<button
				@click="emit('archive')"
				class="p-1.5 rounded-sm text-text hover:text-amber-500 hover:bg-amber-500/8 transition-colors">
				<v-icon name="bi-archive" scale="0.85" />
			</button>
			<button
				@click="emit('delete')"
				class="p-1.5 rounded-sm text-text hover:text-red-500 hover:bg-red-500/8 transition-colors">
				<v-icon name="bi-trash" scale="0.85" />
			</button>
		</div>

		<!-- Editable title -->
		<div class="mb-5">
			<div v-if="!editingTitle" class="group flex items-start gap-2 cursor-pointer"
				@click="startEditTitle">
				<h1 class="text-xl font-bold text-heading leading-snug flex-1">{{ task.title }}</h1>
				<v-icon name="bi-pencil" scale="0.8"
					class="text-text group-hover:text-accent mt-1 shrink-0 transition-colors" />
			</div>
			<div v-else class="flex items-start gap-2">
				<input v-model="titleDraft"
					class="flex-1 text-xl font-bold text-heading bg-transparent border-0 border-b-2 border-accent/50 focus:outline-none focus:border-accent pb-0.5 leading-snug"
					@keydown.enter="saveTitle" @keydown.esc="editingTitle = false" autofocus />
				<button @click="saveTitle" class="mt-1 tazko-btn">
					<v-icon name="bi-check2" scale="1" />
					Save
				</button>
			</div>
		</div>

		<!-- Editable description -->
		<div>
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-2">Description</p>

			<div v-if="!editingDesc" @click="startEditDesc"
				class="group cursor-pointer rounded-sm bg-heading/[0.025] hover:bg-heading/[0.045] border border-transparent hover:border-heading/8 px-4 py-3 transition-all">
				<div v-if="task.description && task.description !== '<p></p>'"
					class="text-base text-text leading-relaxed prose-sm" v-html="task.description" />
				<p v-else class="text-base text-text italic">
					Click to add a description…
				</p>
			</div>

			<div v-else class="space-y-2">
				<rich-text-editor ref="descEditorRef" v-model="descDraft" placeholder="Describe this task…"
					:show-toolbar="true" min-height="120px"
					:autofocus="true" :enable-mention="true" :users="members" />
				<div class="flex items-center gap-2">
					<button type="button" class="inline-flex items-center px-3 py-1.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors" @click="saveDesc">Save</button>
					<button type="button" class="inline-flex items-center px-3 py-1.5 rounded-sm border border-heading/10 text-text text-sm font-semibold hover:bg-heading/5 transition-colors" @click="editingDesc = false">Cancel</button>
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
