<script setup>
import { ref, watch } from 'vue'
import { useTaskCommentStore } from '@/stores/useTaskCommentStore'
import TaskCommentsTab from '@/components/projects/TaskCommentsTab.vue'
import { addIcons } from 'oh-vue-icons'
import { BiChat, BiActivity } from 'oh-vue-icons/icons'

addIcons(BiChat, BiActivity)

const props = defineProps({
	activity:  { type: Array, required: true },
	members:   { type: Array, default: () => [] },
	projectId: { type: [Number, String], default: null },
	taskId:    { type: [Number, String], default: null },
	canCreate: { type: Boolean, default: false },
	canEdit:   { type: Boolean, default: false },
	canDelete: { type: Boolean, default: false },
	canReact:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:activeSection'])

const store = useTaskCommentStore()
const activeSection = ref('comments')

watch(activeSection, (val) => emit('update:activeSection', val))
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 overflow-hidden">

		<!-- Tab switcher -->
		<div class="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-heading/5">
			<button
				v-for="tab in [
					{ key: 'comments', label: 'Comments', icon: 'bi-chat', count: store.comments.length },
					{ key: 'activity', label: 'Activity', icon: 'bi-activity', count: activity.length },
				]"
				:key="tab.key"
				@click="activeSection = tab.key"
				:class="['inline-flex items-center gap-1.5 px-4 py-3 text-base font-semibold transition-all border-b-2 -mb-px',
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
		<div v-if="activeSection === 'comments'">
			<TaskCommentsTab
				:project-id="projectId"
				:task-id="taskId"
				:members="members"
				:can-create="canCreate"
				:can-edit="canEdit"
				:can-delete="canDelete"
				:can-react="canReact" />
		</div>

		<!-- Activity panel — untouched -->
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
