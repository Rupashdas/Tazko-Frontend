<script setup>
import { ref, computed, watch } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiX, BiPersonPlus, BiArrowRight, BiArrowRepeat } from 'oh-vue-icons/icons'
import axios from '@/axios'
import AppSelect from '@/components/ui/AppSelect.vue'
import { paletteColor } from '@/utils/paletteColor'

addIcons(BiX, BiPersonPlus, BiArrowRight, BiArrowRepeat)

const props = defineProps({
	show: { type: Boolean, default: false },
	existingMembers: { type: Array, default: () => [] },
	saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add'])

// ── Helpers ──────────────────────────────────────────────
const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── State ─────────────────────────────────────────────────
const step = ref(1)
const users = ref([])
const loading = ref(false)
const fetchError = ref(false)
const selectedIds = ref([])   // array of user IDs — AppSelect v-model
const roles = ref({})

// ── Reset + fetch on open ─────────────────────────────────
const fetchUsers = async () => {
	loading.value = true
	fetchError.value = false
	try {
		const { data } = await axios.get('/api/users', { params: { per_page: 500 } })
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
		selectedIds.value = []
		roles.value = {}
		fetchUsers()
	}
})

// ── Step 1 computed ───────────────────────────────────────
const existingIds = computed(() => props.existingMembers.map(m => m.id))

// All users as AppSelect options; existing members are disabledValues (shown checked, non-interactive)
const userOptions = computed(() =>
	users.value.map(u => ({
		label:    u.name,
		value:    u.id,
		initials: getInitials(u.name),
		color:    paletteColor(u.palette),
	}))
)

// Newly selected user objects (excludes pre-existing members)
const selected = computed(() =>
	selectedIds.value
		.filter(id => !existingIds.value.includes(id))
		.map(id => users.value.find(u => u.id === id))
		.filter(Boolean)
)

// ── Navigation ────────────────────────────────────────────
const goNext = () => { if (selected.value.length) step.value = 2 }
const goBack = () => { step.value = 1 }

// ── Emit ──────────────────────────────────────────────────
const handleAdd = () => {
	if (!selected.value.length) return
	emit('add', selected.value.map(u => ({
		id:       u.id,
		name:     u.name,
		role:     roles.value[u.id] ?? '',
		initials: getInitials(u.name),
		color:    paletteColor(u.palette),
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
				<div class="relative bg-panel rounded-sm shadow-2xl w-full max-w-md z-10 transition-all flex flex-col max-h-[80vh]">

					<!-- Header -->
					<div class="border-b border-heading/8 px-6 pt-6 pb-5 shrink-0 rounded-t-sm">
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

					<!-- Step 1: Select members via dropdown -->
					<template v-if="step === 1">
						<div class="px-6 py-5 shrink-0">
							<label class="block text-base font-semibold text-text mb-1.5">Select People</label>

							<!-- Loading / error states -->
							<div v-if="loading" class="py-2 text-sm text-text">Loading users…</div>
							<div v-else-if="fetchError" class="flex items-center gap-2 py-2">
								<span class="text-sm text-text">Failed to load users.</span>
								<button @click="fetchUsers" class="text-sm text-accent hover:underline">Retry</button>
							</div>

							<!-- AppSelect dropdown -->
							<AppSelect
								v-else
								v-model="selectedIds"
								:options="userOptions"
								:disabled-values="existingIds"
								:multiple="true"
								:searchable="true"
								placeholder="Search and select people…" />
						</div>

						<!-- Step 1 Footer -->
						<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0 rounded-b-sm">
							<button @click="handleClose" class="flex-1 tazko-btn-cancel">
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
									<div :class="[!person.avatar && paletteColor(person.palette), 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden']">
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
						<div class="px-6 py-4 border-t border-heading/8 flex items-center gap-3 bg-heading/[0.01] shrink-0 rounded-b-sm">
							<button @click="goBack" :disabled="saving" class="flex-1 tazko-btn-cancel">
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
