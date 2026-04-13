<script setup>
import { ref, computed, watch } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiX, BiPersonPlus, BiSearch, BiCheck2, BiArrowLeft, BiArrowRight, BiArrowRepeat } from 'oh-vue-icons/icons'
import axios from '@/axios'

addIcons(BiX, BiPersonPlus, BiSearch, BiCheck2, BiArrowLeft, BiArrowRight, BiArrowRepeat)

const props = defineProps({
	show: { type: Boolean, default: false },
	existingMembers: { type: Array, default: () => [] },
	saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add'])

// ── Helpers ──────────────────────────────────────────────
const memberColors = ['bg-accent', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500']

const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const colorFor = (index) => memberColors[index % memberColors.length]

// ── State ─────────────────────────────────────────────────
const step = ref(1)
const users = ref([])
const loading = ref(false)
const fetchError = ref(false)
const selected = ref([])
const roles = ref({})
const searchQuery = ref('')

// ── Reset + fetch on open ─────────────────────────────────
const fetchUsers = async () => {
	loading.value = true
	fetchError.value = false
	try {
		const { data } = await axios.get('/api/users')
		users.value = data.data ?? []
	} catch {
		fetchError.value = true
	} finally {
		loading.value = false
	}
}

watch(() => props.show, (val) => {
	if (val) {
		step.value = 1
		selected.value = []
		roles.value = {}
		searchQuery.value = ''
		fetchUsers()
	}
})

// ── Step 1 computed ───────────────────────────────────────
const existingKeys = computed(() => new Set(props.existingMembers.map(m => m.id)))

const availablePeople = computed(() => {
	const q = searchQuery.value.toLowerCase().trim()
	return users.value
		.filter(u => !existingKeys.value.has(u.id))
		.filter(u => !q || u.name.toLowerCase().includes(q))
})

const toggle = (user) => {
	const idx = selected.value.findIndex(s => s.id === user.id)
	if (idx === -1) {
		selected.value.push(user)
	} else {
		selected.value.splice(idx, 1)
		delete roles.value[user.id]
	}
}

const isSelected = (user) => selected.value.some(s => s.id === user.id)

// ── Navigation ────────────────────────────────────────────
const goNext = () => { if (selected.value.length) step.value = 2 }
const goBack = () => { step.value = 1 }

// ── Emit ──────────────────────────────────────────────────
const handleAdd = () => {
	if (!selected.value.length) return
	emit('add', selected.value.map((u, i) => ({
		id:       u.id,
		name:     u.name,
		role:     roles.value[u.id] ?? '',
		initials: getInitials(u.name),
		color:    colorFor(i),
	})))
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

					<!-- Header -->
					<div class="border-b border-heading/8 px-6 pt-6 pb-5 shrink-0">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="section-title">
									{{ step === 1 ? 'Add Members' : 'Assign Roles' }}
								</h2>
								<p class="section-desc">
									{{ step === 1 ? 'Select teammates to add to this project.' : 'Optionally set a project role for each member.' }}
								</p>
							</div>
							<button @click="handleClose"
								class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.3" />
							</button>
						</div>
						<!-- Step indicator -->
						<div class="flex items-center gap-2 mt-4">
							<div :class="['h-1 flex-1 rounded-full transition-colors', step >= 1 ? 'bg-accent' : 'bg-heading/10']"></div>
							<div :class="['h-1 flex-1 rounded-full transition-colors', step >= 2 ? 'bg-accent' : 'bg-heading/10']"></div>
						</div>
					</div>

					<!-- Step 1: Search + Select -->
					<template v-if="step === 1">
						<div class="p-5 shrink-0 border-b border-heading/5">
							<div class="relative">
								<v-icon name="bi-search"
									class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
									scale="0.85" />
								<input v-model="searchQuery" type="text" placeholder="Search people…"
									class="w-full pl-9 pr-3 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
							</div>
						</div>

						<div v-scrollbar class="flex-1 overflow-y-auto">
							<div>
								<!-- Loading -->
								<div v-if="loading" class="p-10 text-center">
									<p class="text-base text-text">Loading members…</p>
								</div>

								<!-- Fetch error -->
								<div v-else-if="fetchError" class="p-10 text-center">
									<p class="text-base text-text mb-3">Failed to load users.</p>
									<button @click="fetchUsers" class="tazko-btn-cancel text-sm px-4 py-1.5">
										Retry
									</button>
								</div>

								<!-- Empty state -->
								<div v-else-if="availablePeople.length === 0" class="p-10 text-center">
									<v-icon name="bi-person-plus" scale="2" class="text-text mx-auto mb-3" />
									<p class="text-base text-text">
										{{ searchQuery ? 'No people match your search.' : 'Everyone is already on this project.' }}
									</p>
								</div>

								<!-- People list -->
								<div v-else class="divide-y divide-heading/5">
									<button v-for="(person, i) in availablePeople" :key="person.id"
										type="button"
										@click="toggle(person)"
										class="w-full flex items-center gap-3 px-5 py-3 hover:bg-heading/[0.03] transition-colors text-left">
										<div :class="[!person.avatar && colorFor(i), 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden']">
											<img v-if="person.avatar" :src="person.avatar" class="w-full h-full object-cover" :alt="person.name" />
											<span v-else>{{ getInitials(person.name) }}</span>
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-base font-semibold text-heading truncate">{{ person.name }}</p>
											<p class="text-sm text-text truncate">{{ person.email }}</p>
										</div>
										<div :class="['w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all',
											isSelected(person) ? 'bg-accent border-accent' : 'border-heading/20']">
											<v-icon v-if="isSelected(person)" name="bi-check2" scale="0.75" class="text-white" />
										</div>
									</button>
								</div>
							</div>
						</div>

						<!-- Step 1 Footer -->
						<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0">
							<button @click="handleClose" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="goNext"
								:disabled="!selected.length"
								:class="['flex-1 tazko-btn', !selected.length ? 'opacity-50 cursor-not-allowed' : '']">
								Next
								<v-icon name="bi-arrow-right" scale="1" />
							</button>
						</div>
					</template>

					<!-- Step 2: Assign Roles -->
					<template v-else>
						<div v-scrollbar class="flex-1 overflow-y-auto">
							<div class="divide-y divide-heading/5">
								<div v-for="(person, i) in selected" :key="person.id"
									class="flex items-center gap-3 px-5 py-3">
									<div :class="[!person.avatar && colorFor(i), 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden']">
										<img v-if="person.avatar" :src="person.avatar" class="w-full h-full object-cover" :alt="person.name" />
										<span v-else>{{ getInitials(person.name) }}</span>
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-base font-semibold text-heading truncate mb-1">{{ person.name }}</p>
										<input
											v-model="roles[person.id]"
											type="text"
											placeholder="e.g. Tech Lead"
											class="w-full px-2.5 py-1.5 rounded-sm border border-heading/8 bg-heading/3 text-sm text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
									</div>
								</div>
							</div>
						</div>

						<!-- Step 2 Footer -->
						<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0">
							<button @click="goBack" :disabled="saving" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-arrow-left" scale="1" />
								Back
							</button>
							<button @click="handleAdd"
								:disabled="!selected.length || saving"
								:class="['flex-1 tazko-btn', (!selected.length || saving) ? 'opacity-50 cursor-not-allowed' : '']">
								<v-icon v-if="saving" name="bi-arrow-repeat" scale="1" class="animate-spin" />
								<v-icon v-else name="bi-person-plus" scale="1" />
								{{ saving ? 'Adding…' : `Add${selected.length ? ` (${selected.length})` : ''}` }}
							</button>
						</div>
					</template>

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
