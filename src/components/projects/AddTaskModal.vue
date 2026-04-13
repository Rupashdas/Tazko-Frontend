<script setup>
import { ref, watch } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiX, BiPlus } from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'

addIcons(BiX, BiPlus)

const props = defineProps({
	show: { type: Boolean, default: false },
	members: { type: Array, default: () => [] },
	columnStatuses: { type: Array, default: () => ['Todo', 'In Progress', 'Review', 'Done'] },
	defaultStatus: { type: String, default: 'Todo' },
})

const emit = defineEmits(['close', 'save'])

const title = ref('')
const priority = ref('Medium')
const assignees = ref([])
const due = ref('')
const status = ref('Todo')
const description = ref('')

const reset = () => {
	title.value = ''
	priority.value = 'Medium'
	assignees.value = []
	due.value = ''
	status.value = props.defaultStatus || 'Todo'
	description.value = ''
}

watch(() => props.show, (val) => {
	if (val) reset()
})

watch(() => props.defaultStatus, (val) => {
	if (props.show) status.value = val
})

const handleSave = () => {
	if (!title.value.trim()) return
	emit('save', {
		title: title.value.trim(),
		description: description.value || '',
		status: status.value,
		priority: priority.value,
		assignees: assignees.value.length ? assignees.value : ['AH'],
		due: due.value || '',
	})
}

const handleClose = () => emit('close')
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
				@click.self="handleClose">
				<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="handleClose"></div>
				<div class="relative bg-panel rounded-sm shadow-2xl w-full max-w-4xl z-10 overflow-hidden transition-all">

					<div class="border-b border-heading/8 px-6 pt-6 pb-5">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="section-title">Add Task</h2>
								<p class="section-desc">Create a new task for this project.</p>
							</div>
							<button @click="handleClose"
								class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.3" />
							</button>
						</div>
					</div>

					<div v-scrollbar class="max-h-[60vh] overflow-y-auto"><div class="p-6 space-y-4">
						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Task Title <span class="text-red-400">*</span></label>
							<input v-model="title" type="text" placeholder="e.g. Implement login page"
								class="input-field border-heading/15 focus:border-accent"
								@keydown.enter="handleSave" />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">Priority</label>
								<AppSelect
									v-model="priority"
									:options="['Urgent', 'High', 'Medium', 'Low']"
									placeholder="Select priority" />
							</div>
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">Due Date</label>
								<AppDatePicker v-model="due" placeholder="Pick due date" />
							</div>
						</div>
						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Assignees</label>
							<AppSelect
								v-model="assignees"
								:options="members.map(m => ({ label: m.name, value: m.initials, color: m.color, initials: m.initials }))"
								placeholder="Select assignees…"
								:multiple="true" />
						</div>
						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Status</label>
							<AppSelect
								v-model="status"
								:options="columnStatuses"
								placeholder="Select status" />
						</div>
						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Description</label>
							<RichTextEditor v-model="description" placeholder="Describe the task…" min-height="120px" :enable-mention="true" :users="members" />
						</div>
					</div></div>

					<div class="px-6 py-3 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01]">
						<button @click="handleClose" class="flex-1 tazko-btn-cancel">
							<v-icon name="bi-x" scale="1" />
							Cancel
						</button>
						<button @click="handleSave" class="flex-1 tazko-btn">
							<v-icon name="bi-plus" scale="1" />
							Add Task
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
	transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
	transform: scale(0.97);
}
</style>
