<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiX, BiPlus, BiCheck2, MdErroroutlineRound } from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import RichTextEditor from '@/components/shared/RichTextEditor.vue'

addIcons(BiX, BiPlus, BiCheck2, MdErroroutlineRound)

const props = defineProps({
	show: { type: Boolean, default: false },
	mode: { type: String, default: 'create' }, // 'create' | 'edit'
	project: { type: Object, default: null },
	focusField: { type: String, default: null }, // 'name' | 'description' | null
})

const emit = defineEmits(['close', 'save'])

const projectColors = [
	'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500',
	'bg-fuchsia-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500',
]

const defaultProject = () => ({
	name: '',
	description: '',
	goal: '',
	color: projectColors[0],
	priority: 'High',
	status: 'Planning',
	startDate: '',
	endDate: '',
})

const form = ref(defaultProject())
const errors = ref({})
const nameInputRef = ref(null)
const descriptionEditorRef = ref(null)

const isEdit = computed(() => props.mode === 'edit')

watch(() => props.show, (val) => {
	if (val) {
		if (isEdit.value && props.project) {
			form.value = {
				name: props.project.name || '',
				description: props.project.description || '',
				goal: props.project.goal || '',
				color: props.project.color || projectColors[0],
				priority: props.project.priority || 'High',
				status: props.project.status || 'Planning',
				startDate: props.project.startDate || '',
				endDate: props.project.endDate || '',
			}
		} else {
			form.value = defaultProject()
		}
		errors.value = {}

		nextTick(() => {
			if (props.focusField === 'name' && nameInputRef.value) {
				nameInputRef.value.focus()
			}
		})
	}
})

const clearError = (field) => {
	if (errors.value[field]) {
		const copy = { ...errors.value }
		delete copy[field]
		errors.value = copy
	}
}

const validate = () => {
	const e = {}
	if (!form.value.name.trim()) e.name = 'Project name is required'
	if (!form.value.startDate) e.startDate = 'Start date is required'
	if (!form.value.endDate) e.endDate = 'End date is required'
	errors.value = e
	return !Object.keys(e).length
}

const handleSave = () => {
	if (!validate()) return
	emit('save', { ...form.value })
}

const handleClose = () => {
	emit('close')
}
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
				@click.self="handleClose">
				<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="handleClose" />
				<div class="relative bg-panel rounded-sm shadow-2xl w-full max-w-xl z-10 overflow-hidden transition-all flex flex-col max-h-[92vh]">

					<div class="border-b border-heading/8 px-6 pt-6 pb-5 shrink-0">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="section-title">{{ isEdit ? 'Edit Project' : 'New Project' }}</h2>
								<p class="section-desc">
									{{ isEdit ? 'Update project details.' : 'Set up a new workspace for your team.' }}
								</p>
							</div>
							<button @click="handleClose"
								class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.3" />
							</button>
						</div>
					</div>

					<div class="p-6 space-y-5 overflow-y-auto flex-1">
						<div>
							<label class="block text-base font-semibold text-text mb-1.5">
								Project Name <span class="text-red-400">*</span>
							</label>
							<input
								ref="nameInputRef"
								v-model="form.name"
								type="text"
								placeholder="e.g. Marketing Website"
								class="input-field border-heading/15 focus:border-accent"
								:class="{ 'border-red-400': errors.name }"
								@input="clearError('name')" />
							<p v-if="errors.name" class="text-red-500 text-base mt-1 flex items-center gap-1">
								<v-icon name="md-erroroutline-round" scale="0.85" />
								{{ errors.name }}
							</p>
						</div>

						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Description</label>
							<RichTextEditor
								ref="descriptionEditorRef"
								v-model="form.description"
								placeholder="Describe what this project is about…"
								:show-toolbar="true"
								min-height="100px" />
						</div>

						<div>
							<label class="block text-base font-semibold text-text mb-1.5">Goal</label>
							<input
								v-model="form.goal"
								type="text"
								placeholder="What does success look like?"
								class="input-field border-heading/15 focus:border-accent" />
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">Priority</label>
								<AppSelect
									v-model="form.priority"
									:options="['Urgent', 'High', 'Medium', 'Low']"
									placeholder="Select priority" />
							</div>
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">Status</label>
								<AppSelect
									v-model="form.status"
									:options="['Planning', 'In Progress', 'On Hold', 'Completed']"
									placeholder="Select status" />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">
									Start Date <span class="text-red-400">*</span>
								</label>
								<AppDatePicker
									v-model="form.startDate"
									placeholder="Pick start date"
									@update:model-value="clearError('startDate')" />
								<p v-if="errors.startDate" class="text-red-500 text-base mt-1 flex items-center gap-1">
									<v-icon name="md-erroroutline-round" scale="0.85" />
									{{ errors.startDate }}
								</p>
							</div>
							<div>
								<label class="block text-base font-semibold text-text mb-1.5">
									End Date <span class="text-red-400">*</span>
								</label>
								<AppDatePicker
									v-model="form.endDate"
									placeholder="Pick end date"
									:min="form.startDate || ''"
									@update:model-value="clearError('endDate')" />
								<p v-if="errors.endDate" class="text-red-500 text-base mt-1 flex items-center gap-1">
									<v-icon name="md-erroroutline-round" scale="0.85" />
									{{ errors.endDate }}
								</p>
							</div>
						</div>

						<div>
							<label class="block text-base font-semibold text-text mb-2">Project Color</label>
							<div class="flex flex-wrap gap-2.5">
								<button
									v-for="color in projectColors" :key="color"
									type="button"
									@click="form.color = color"
									class="w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center"
									:class="[color, form.color === color ? 'ring-2 ring-offset-2 ring-offset-panel scale-110 shadow-md' : 'opacity-60 hover:opacity-100 hover:scale-105']">
									<svg v-if="form.color === color" xmlns="http://www.w3.org/2000/svg"
										class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
										stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</button>
							</div>
							<div class="mt-3 flex items-center gap-2">
								<div :class="[form.color, 'w-6 h-6 rounded-sm shrink-0 shadow-sm']" />
								<span class="text-sm text-text capitalize">
									{{ form.color.replace('bg-', '').replace('-500', '') }} selected
								</span>
							</div>
						</div>
					</div>

					<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0">
						<button @click="handleClose" class="flex-1 tazko-btn-cancel">
							<v-icon name="bi-x" scale="1" />
							Cancel
						</button>
						<button @click="handleSave" class="flex-1 tazko-btn">
							<v-icon :name="isEdit ? 'bi-check2' : 'bi-plus'" scale="1" />
							{{ isEdit ? 'Save Changes' : 'Create Project' }}
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
	transform: scale(0.96);
}
</style>
