<script setup>
import { ref, computed } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiPlusCircle, BiPlus, BiCheck2, BiX, BiXCircle,
} from 'oh-vue-icons/icons'

addIcons(BiPlusCircle, BiPlus, BiCheck2, BiX, BiXCircle)

const props = defineProps({
	subtasks: { type: Array, required: true },
	canManage: { type: Boolean, default: false },
	saving: { type: Boolean, default: false },
})

// Emits intents the parent translates into API calls:
//   add    → {title}
//   toggle → {id, done}
//   remove → {id}
const emit = defineEmits(['add', 'toggle', 'remove'])

const newSubtask = ref('')
const showSubtaskInput = ref(false)

const subtaskProgress = computed(() => {
	if (!props.subtasks.length) return 0
	return Math.round((props.subtasks.filter(s => s.done).length / props.subtasks.length) * 100)
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
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 p-5">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-3">
				<h3 class="text-base font-bold text-heading">Subtasks</h3>
				<div class="flex items-center gap-1.5">
					<span class="text-sm font-semibold text-text">
						{{subtasks.filter(s => s.done).length}} / {{ subtasks.length }}
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

		<!-- Subtask rows -->
		<div class="space-y-0.5">
			<div v-for="sub in subtasks" :key="sub.id"
				class="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-heading/[0.03] transition-colors group">
				<button
					@click="toggleDone(sub)"
					:disabled="!canManage"
					:class="['w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all',
						sub.done ? 'bg-emerald-500 border-emerald-500' : 'border-heading/20 hover:border-accent',
						!canManage && 'cursor-not-allowed opacity-70']">
					<v-icon v-if="sub.done" name="bi-check2" class="text-white" scale="0.8" />
				</button>
				<span class="text-base flex-1 transition-colors"
					:class="sub.done ? 'text-text line-through' : 'text-heading'">
					{{ sub.title }}
				</span>
				<button
					v-if="canManage"
					class="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center text-text hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
					@click="removeSubtask(sub)">
					<v-icon name="bi-x-circle" scale="0.75" />
				</button>
			</div>

			<p v-if="!subtasks.length" class="text-sm text-text italic px-3 py-2">No subtasks yet.</p>
		</div>

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
				<v-icon name="bi-x" scale="1" />
				Cancel
			</button>
		</div>
	</div>
</template>
