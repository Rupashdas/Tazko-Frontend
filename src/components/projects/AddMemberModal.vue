<script setup>
import { ref, computed, watch } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiX, BiPersonPlus, BiSearch, BiCheck2 } from 'oh-vue-icons/icons'

addIcons(BiX, BiPersonPlus, BiSearch, BiCheck2)

const props = defineProps({
	show: { type: Boolean, default: false },
	existingMembers: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'add'])

// Mocked org-wide directory. In real app, fetch from API.
const directory = [
	{ initials: 'AH', name: 'Arif Hossain', role: 'Project Manager', color: 'bg-accent' },
	{ initials: 'SK', name: 'Sara Khan', role: 'Frontend Dev', color: 'bg-violet-500' },
	{ initials: 'NR', name: 'Noman Rahman', role: 'Backend Dev', color: 'bg-emerald-500' },
	{ initials: 'DM', name: 'Dina Malik', role: 'Designer', color: 'bg-amber-500' },
	{ initials: 'KU', name: 'Karim Uddin', role: 'QA Engineer', color: 'bg-rose-500' },
	{ initials: 'RA', name: 'Rafiq Ahmed', role: 'DevOps', color: 'bg-sky-500' },
	{ initials: 'MS', name: 'Mahi Siddique', role: 'Product Designer', color: 'bg-fuchsia-500' },
	{ initials: 'TJ', name: 'Tanvir Jahan', role: 'Data Analyst', color: 'bg-teal-500' },
	{ initials: 'FR', name: 'Farhana Rahman', role: 'UX Researcher', color: 'bg-indigo-500' },
]

const searchQuery = ref('')
const selected = ref([])

watch(() => props.show, (val) => {
	if (val) {
		searchQuery.value = ''
		selected.value = []
	}
})

const existingKeys = computed(() => new Set(props.existingMembers.map(m => m.initials)))

const availablePeople = computed(() => {
	const q = searchQuery.value.toLowerCase().trim()
	return directory
		.filter(p => !existingKeys.value.has(p.initials))
		.filter(p => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
})

const toggle = (person) => {
	const idx = selected.value.findIndex(s => s.initials === person.initials)
	if (idx === -1) selected.value.push(person)
	else selected.value.splice(idx, 1)
}

const isSelected = (person) => selected.value.some(s => s.initials === person.initials)

const handleAdd = () => {
	if (!selected.value.length) return
	emit('add', [...selected.value])
}

const handleClose = () => emit('close')
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4"
				@click.self="handleClose">
				<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="handleClose"></div>
				<div class="relative bg-panel rounded-sm shadow-2xl w-full max-w-md z-10 overflow-hidden transition-all flex flex-col max-h-[80vh]">

					<div class="border-b border-heading/8 px-6 pt-6 pb-5 shrink-0">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="section-title">Add Members</h2>
								<p class="section-desc">Invite teammates to this project.</p>
							</div>
							<button @click="handleClose"
								class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.3" />
							</button>
						</div>
					</div>

					<div class="p-5 shrink-0 border-b border-heading/5">
						<div class="relative">
							<v-icon name="bi-search"
								class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
								scale="0.85" />
							<input v-model="searchQuery" type="text" placeholder="Search people…"
								class="w-full pl-9 pr-3 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
						</div>
					</div>

					<div class="flex-1 overflow-y-auto">
						<div v-if="availablePeople.length === 0" class="p-10 text-center">
							<v-icon name="bi-person-plus" scale="2" class="text-text mx-auto mb-3" />
							<p class="text-base text-text">
								{{ searchQuery ? 'No people match your search.' : 'Everyone is already on this project.' }}
							</p>
						</div>
						<div v-else class="divide-y divide-heading/5">
							<button v-for="person in availablePeople" :key="person.initials"
								type="button"
								@click="toggle(person)"
								class="w-full flex items-center gap-3 px-5 py-3 hover:bg-heading/[0.03] transition-colors text-left">
								<div
									:class="[person.color, 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
									{{ person.initials }}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-base font-semibold text-heading truncate">{{ person.name }}</p>
									<p class="text-sm text-text truncate">{{ person.role }}</p>
								</div>
								<div :class="['w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all',
									isSelected(person) ? 'bg-accent border-accent' : 'border-heading/20']">
									<v-icon v-if="isSelected(person)" name="bi-check2" scale="0.75" class="text-white" />
								</div>
							</button>
						</div>
					</div>

					<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0">
						<button @click="handleClose" class="flex-1 tazko-btn-cancel">
							<v-icon name="bi-x" scale="1" />
							Cancel
						</button>
						<button @click="handleAdd"
							:disabled="!selected.length"
							:class="['flex-1 tazko-btn', !selected.length ? 'opacity-50 cursor-not-allowed' : '']">
							<v-icon name="bi-person-plus" scale="1" />
							Add{{ selected.length ? ` (${selected.length})` : '' }}
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
