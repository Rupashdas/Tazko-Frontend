<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { addIcons } from 'oh-vue-icons'
import {
	BiPlusCircle, BiPlus, BiCheck2, BiXCircle, BiGripVertical,
} from 'oh-vue-icons/icons'

addIcons(BiPlusCircle, BiPlus, BiCheck2, BiXCircle, BiGripVertical)

const props = defineProps({
	subtasks: { type: Array, required: true },
	canManage: { type: Boolean, default: false },
	saving: { type: Boolean, default: false },
})

// Emits:
//   add     → { title }
//   toggle  → { id, done }
//   remove  → { id }
//   reorder → orderedIds (number[])  ← fires after a successful drag
const emit = defineEmits(['add', 'toggle', 'remove', 'reorder'])

const newSubtask = ref('')
const showSubtaskInput = ref(false)

// Local reactive copy so vuedraggable can use v-model without fighting Pinia.
// Re-seeded whenever the store's subtasks prop changes (after save / revert).
const localSubtasks = ref([...props.subtasks])
watch(
	() => props.subtasks,
	(next) => { localSubtasks.value = [...next] },
	{ deep: true }
)

const subtaskProgress = computed(() => {
	if (!localSubtasks.value.length) return 0
	return Math.round((localSubtasks.value.filter(s => s.done).length / localSubtasks.value.length) * 100)
})

const addSubtaskItem = () => {
	const title = newSubtask.value.trim()
	if (!title || !props.canManage) return
	emit('add', { title })
	newSubtask.value = ''
	showSubtaskInput.value = false
}

const toggleDone = (sub) => {
	if (!props.canManage) return
	emit('toggle', { id: sub.id, done: !sub.done })
}

const removeSubtask = (sub) => {
	if (!props.canManage) return
	emit('remove', { id: sub.id })
}

// vuedraggable emits `@change` with { moved: {...} } after the user drops.
// We don't do anything on plain re-renders — only when the order actually changed.
// Pending (temp-id) rows shouldn't be reorder-able server-side yet, so skip
// the emit if any item is still _pending.
const onDragChange = (event) => {
	if (!event.moved) return
	if (localSubtasks.value.some(s => s._pending)) return

	const orderedIds = localSubtasks.value.map(s => s.id)
	emit('reorder', orderedIds)
}
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 p-5">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-3">
				<h3 class="text-base font-bold text-heading">Subtasks</h3>
				<div class="flex items-center gap-1.5">
					<span class="text-sm font-semibold text-text">
						{{localSubtasks.filter(s => s.done).length}} / {{ localSubtasks.length }}
					</span>
					<span class="text-sm font-bold tabular-nums"
						:class="subtaskProgress === 100 ? 'text-emerald-500' : 'text-accent'">
						{{ subtaskProgress }}%
					</span>
				</div>
			</div>
			<button v-if="canManage" @click="showSubtaskInput = !showSubtaskInput"
				class="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent/70 px-2.5 py-1.5 rounded-sm hover:bg-accent/8 transition-colors">
				<v-icon name="bi-plus-circle" scale="0.8" />
				Add
			</button>
		</div>

		<!-- Progress bar -->
		<div class="h-1.5 bg-heading/8 rounded-full mb-4 overflow-hidden">
			<div class="h-full rounded-full transition-all duration-500"
				:class="subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-accent to-violet-500'"
				:style="`width: ${subtaskProgress}%`" />
		</div>

		<!-- Subtask rows — drag-and-drop reorderable via the grip handle -->
		<draggable
			v-model="localSubtasks"
			item-key="id"
			handle=".subtask-handle"
			:animation="150"
			:disabled="!canManage"
			ghost-class="subtask-ghost"
			drag-class="subtask-dragging"
			chosen-class="subtask-chosen"
			@change="onDragChange"
			class="space-y-0.5">
			<template #item="{ element: sub }">
				<div
					class="flex items-center gap-2 px-2 py-3 rounded-sm hover:bg-heading/[0.03] transition-colors group select-none"
					:class="sub._pending && 'opacity-60'">
					<!-- Drag handle (only if user can reorder) -->
					<button
						v-if="canManage"
						class="subtask-handle text-heading/15 group-hover:text-text transition-colors cursor-grab active:cursor-grabbing shrink-0 p-0.5"
						:title="'Drag to reorder'"
						@click.stop>
						<v-icon name="bi-grip-vertical" scale="0.85" />
					</button>

					<!-- Done checkbox -->
					<button
						@click="toggleDone(sub)"
						:disabled="!canManage || sub._pending"
						:class="['w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all',
							sub.done ? 'bg-emerald-500 border-emerald-500' : 'border-heading/20 hover:border-accent',
							(!canManage || sub._pending) && 'cursor-not-allowed opacity-70']">
						<v-icon v-if="sub.done" name="bi-check2" class="text-white" scale="0.8" />
					</button>

					<span class="text-base flex-1 transition-colors"
						:class="sub.done ? 'text-text line-through' : 'text-heading'">
						{{ sub.title }}
					</span>

					<button
						v-if="canManage && !sub._pending"
						class="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center text-text hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
						@click="removeSubtask(sub)">
						<v-icon name="bi-x-circle" scale="0.75" />
					</button>
				</div>
			</template>
		</draggable>

		<p v-if="!localSubtasks.length" class="text-sm text-text italic px-3 py-2">No subtasks yet.</p>

		<!-- Add subtask input -->
		<div v-if="showSubtaskInput && canManage" class="flex items-center gap-2 mt-3 pt-3 border-t border-heading/5">
			<input v-model="newSubtask" type="text" placeholder="New subtask…"
				class="flex-1 text-base px-3.5 py-2 rounded-sm border border-accent/30 bg-accent/5 focus:border-accent/60 focus:outline-none transition-colors placeholder-text/30"
				@keydown.enter="addSubtaskItem" @keydown.esc="showSubtaskInput = false" autofocus />
			<button @click="addSubtaskItem" :disabled="saving" class="tazko-btn disabled:opacity-60">
				<v-icon name="bi-plus" scale="1" />
				Add
			</button>
			<button @click="showSubtaskInput = false" class="tazko-btn-cancel">
				Cancel
			</button>
		</div>
	</div>
</template>

<style scoped>
/* Drag feedback — same visual language as ProjectBoardTab's list rows */
.subtask-ghost {
	background: rgba(99, 102, 241, 0.07) !important;
	border-left: 3px solid rgba(99, 102, 241, 0.40) !important;
	border-top: none !important;
	border-right: none !important;
	border-bottom: none !important;
	box-shadow: none !important;
	outline: none !important;
}
.subtask-ghost * {
	opacity: 0 !important;
}
.subtask-chosen {
	cursor: grabbing;
}
.subtask-dragging {
	background: var(--color-panel, #fff);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
