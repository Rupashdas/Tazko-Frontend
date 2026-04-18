<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoleStore } from '@/stores/useRoleStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRolePermissions } from '@/composables/useRolePermissions'
import { useToast } from '@/utils/toast'
import { validators } from '@/utils/validators'
import { addIcons } from 'oh-vue-icons'
import {
	BiList, BiTrash, BiPlus, BiCheck2, BiX, BiSearch, CoWarning, BiChevronDown, BiShield, MdErroroutlineRound, BiArrowRepeat,
	BiPeopleFill, BiFolder, BiCheckSquareFill, BiGearFill, BiBarChartFill, BiCreditCardFill, BiPersonBadgeFill, BiPeople,
	BiSpeedometer2, BiFileEarmark, BiChatDotsFill, BiGraphUp, BiTools,
	BiActivity, BiBellFill, BiChatFill, BiClockFill, BiGearWideConnected
} from 'oh-vue-icons/icons'

addIcons(BiList, BiTrash, BiPlus, BiCheck2, BiX, BiSearch, CoWarning, BiChevronDown, BiShield, MdErroroutlineRound, BiArrowRepeat,
	BiPeopleFill, BiFolder, BiCheckSquareFill, BiGearFill, BiBarChartFill, BiCreditCardFill, BiPersonBadgeFill, BiPeople,
	BiSpeedometer2, BiFileEarmark, BiChatDotsFill, BiGraphUp, BiTools,
	BiActivity, BiBellFill, BiChatFill, BiClockFill, BiGearWideConnected)

const roleStore = useRoleStore()
const authStore = useAuthStore()
const { successToast, errorToast } = useToast()
const {
	togglePermission,
	toggleSelectAll,
	isPermissionSelected,
	isModuleFullySelected,
	moduleSelectedCount,
} = useRolePermissions()

// ── Capability flags ─────────────────────────────────────────────
const canCreate = computed(() => authStore.hasCapability('roles.create'))
const canUpdate = computed(() => authStore.hasCapability('roles.update'))
const canDelete = computed(() => authStore.hasCapability('roles.delete'))

const searchQuery = ref('')
const showAddRole = ref(false)
const newRoleName = ref('')
const newRoleLabel = ref('')
const showDeleteConfirm = ref(false)
const addRoleErrors = ref({})

// Mobile sidebar drawer
const mobileSidebarOpen = ref(false)

const filteredCapabilities = computed(() => roleStore.filteredCapabilities(searchQuery.value))
const totalPermissions = computed(() => Object.values(roleStore.capabilities || {}).reduce((sum, caps) => sum + caps.length, 0))
const selectedPermissionsCount = computed(() => Object.values(roleStore.selectedPermissions || {}).reduce((sum, list) => sum + list.length, 0))
const coveragePercent = computed(() => totalPermissions.value ? Math.round((selectedPermissionsCount.value / totalPermissions.value) * 100) : 0)
const moduleList = computed(() => Object.keys(filteredCapabilities.value || {}))

onMounted(() => roleStore.init())

function toastErrors(messages) {
	if (!messages?.length) { errorToast('Something went wrong.'); return }
	messages.forEach(msg => errorToast(msg))
}

async function handleSave() {
	const result = await roleStore.saveChanges()
	result.success ? successToast('Changes saved!') : toastErrors(result.messages)
}

async function handleDelete() {
	const result = await roleStore.deleteRole()
	if (result.success) {
		showDeleteConfirm.value = false
	} else {
		toastErrors(result.messages)
	}
}

const generateRoleName = () => {
	newRoleName.value = newRoleLabel.value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

async function handleAddRole() {
	addRoleErrors.value = {}
	const labelErr = validators.required(newRoleLabel.value, 'Role name')
	if (labelErr) { addRoleErrors.value = { label: labelErr }; return }

	const result = await roleStore.createRole({ name: newRoleName.value, label: newRoleLabel.value })
	if (result.success) {
		successToast('Role created successfully!')
		closeModal()
	} else {
		toastErrors(result.messages)
	}
}

function closeModal() {
	showAddRole.value = false
	newRoleName.value = ''
	newRoleLabel.value = ''
	addRoleErrors.value = {}
}

function selectRoleAndClose(role) {
	roleStore.selectRole(role)
	mobileSidebarOpen.value = false
}

function getRoleInitial(label) {
	return label?.charAt(0)?.toUpperCase() || '?'
}

// Map modules to oh-vue-icons Bootstrap Icon names (kebab-case)
function getModuleIcon(module) {
	const icons = {
		users: 'bi-people-fill',
		projects: 'bi-folder',
		tasks: 'bi-check-square-fill',
		settings: 'bi-gear-fill',
		reports: 'bi-bar-chart-fill',
		billing: 'bi-credit-card-fill',
		roles: 'bi-person-badge-fill',
		teams: 'bi-people',
		dashboard: 'bi-speedometer2',
		files: 'bi-file-earmark',
		messages: 'bi-chat-dots-fill',
		analytics: 'bi-graph-up',
		activity: 'bi-activity',
		clients: 'bi-people',
		comments: 'bi-chat-fill',
		notification: 'bi-bell-fill',
		search: 'bi-search',
		system: 'bi-gear-wide-connected',
		time: 'bi-clock-fill',
	}
	return icons[module?.toLowerCase()]
}
</script>

<template>
	<!-- Outer wrapper: fixed height on desktop so the two panels can each scroll independently -->
	<div class="flex flex-col bg-body text-text relative min-h-[600px]">

		<!-- PAGE LOADING OVERLAY -->
		<Transition name="fade">
			<div v-if="roleStore.isPageLoading"
				class="absolute inset-0 bg-panel/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-sm gap-3">
				<div class="w-10 h-10 rounded-full border-3 border-accent border-t-transparent animate-spin" />
				<p class="text-base text-text font-medium">Loading roles…</p>
			</div>
		</Transition>

		<!-- ── MOBILE TOP BAR ──────────────────────────────────── -->
		<div class="flex lg:hidden items-center gap-3 px-4 py-3  border-b border-heading/10 bg-panel shrink-0">
			<!-- Hamburger / selected role -->
			<button @click="mobileSidebarOpen = true"
				class="flex items-center gap-2 px-3 py-2 rounded-sm bg-heading/6 hover:bg-heading/10 transition-colors text-base font-medium text-heading">
				<v-icon name="bi-list" scale="1" />
				<span class="truncate max-w-[140px]">{{ roleStore.selectedRole?.label || 'Select role' }}</span>
			</button>

			<div class="flex-1" />

			<!-- Mobile action buttons -->
			<template v-if="roleStore.selectedRole">
				<button v-if="canDelete && !roleStore.selectedRole.is_system_role" @click="showDeleteConfirm = true"
					class="p-2 rounded-sm text-red-400 hover:bg-red-50 border border-red-100 transition-all">
					<v-icon name="bi-trash" scale="0.9" />
				</button>
				<button v-if="canUpdate" @click="handleSave"
					:disabled="roleStore.loading.save || roleStore.isSuperAdmin"
					class="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold bg-accent text-white hover:bg-accent/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
					<v-icon v-if="roleStore.loading.save" name="bi-arrow-repeat" scale="1" class="animate-spin" />
					<v-icon v-else name="bi-check2" scale="1" />
					{{ roleStore.loading.save ? 'Saving…' : 'Save' }}
				</button>
			</template>
		</div>

		<!-- ── BODY: SIDEBAR + MAIN (desktop side-by-side, full height) ── -->
		<div class="flex flex-1">

			<!-- ── SIDEBAR (desktop: always visible & self-scrolling) ───── -->
			<aside
				class="hidden lg:flex w-64 border-r border-heading/10 bg-panel flex-col shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] rounded-sm shadow-sm">

				<!-- Sidebar Header -->
				<div class="px-5 pt-5 pb-4 border-b border-heading/10 shrink-0">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="section-title">Roles</h2>
							<p class="section-desc mt-0.5">Manage Roles</p>
						</div>
						<button v-if="canCreate" @click="showAddRole = true"
							class="w-8 h-8 rounded-sm bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition-all active:scale-95 shadow-sm"
							title="Add new role">
							<v-icon name="bi-plus" scale="1.2" />
						</button>
					</div>
				</div>

				<!-- Role List — this part scrolls independently -->
				<div v-scrollbar class="flex-1 overflow-y-auto"><ul class="py-3 px-3 space-y-1">
					<li v-for="role in roleStore.roles" :key="role.id">
						<button @click="roleStore.selectRole(role)"
							class="w-full text-base text-left px-3 py-3 rounded-sm transition-all duration-150 flex items-center gap-3 group"
							:class="roleStore.selectedRole?.id === role.id
								? 'bg-accent/15 text-heading'
								: 'hover:bg-heading/5 text-text'">
							<span
								class="w-7 h-7 rounded-sm flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
								:class="roleStore.selectedRole?.id === role.id
									? 'bg-accent text-white'
									: 'bg-heading/10 text-heading group-hover:bg-accent/20'">
								{{ getRoleInitial(role.label) }}
							</span>
							<span class="text-base font-medium truncate">{{ role.label }}</span>
							<span v-if="roleStore.selectedRole?.id === role.id"
								class="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
						</button>
					</li>

					<li v-if="!roleStore.roles?.length" class="px-3 py-8 text-center">
						<p class="text-base text-text">No roles yet</p>
						<button v-if="canCreate" @click="showAddRole = true"
							class="mt-2 text-sm text-accent hover:underline">
							Create one →
						</button>
					</li>
				</ul></div>

				<!-- Sidebar Footer -->
				<div class="px-5 py-4 border-t border-heading/10 shrink-0">
					<p class="text-base text-text">
						{{ roleStore.roles?.length || 0 }} role{{ roleStore.roles?.length !== 1 ? 's' : '' }} total
					</p>
				</div>
			</aside>

			<!-- ── MAIN PANEL (scrolls independently) ───────────────────── -->
			<div class="flex-1 flex flex-col">

				<!-- Panel Header — sticky, never scrolls away -->
				<div
					class="px-4 sm:px-8 z-1 pt-5 sticky top-21 pb-4 border-b border-heading/10 flex items-start justify-between gap-4 shrink-0 bg-body">
					<div class="min-w-0">
						<h1 class="text-base font-bold text-heading truncate">
							{{ roleStore.selectedRole?.label || 'Select a Role' }}
						</h1>
						<p v-if="roleStore.selectedRole" class="text-base text-text mt-0.5 font-mono truncate">
							{{ roleStore.selectedRole.name }}
						</p>
					</div>

					<!-- Desktop Stats + Actions -->
					<div v-if="roleStore.selectedRole" class="hidden lg:flex items-center gap-3 shrink-0">
						<!-- Coverage pill -->
						<div class="flex items-center gap-2 px-4 py-2 bg-heading/5 rounded-sm">
							<div class="w-2 h-2 rounded-full"
								:class="coveragePercent > 66 ? 'bg-emerald-400' : coveragePercent > 33 ? 'bg-yellow-400' : 'bg-red-400'" />
							<span class="text-sm font-semibold text-text">
								{{ selectedPermissionsCount }}/{{ totalPermissions }} ({{ coveragePercent }}%)
							</span>
						</div>

						<button v-if="canDelete && !roleStore.selectedRole.is_system_role"
							@click="showDeleteConfirm = true"
							class="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-base font-medium text-red-500 border border-red-500/20 hover:bg-red-500/8 hover:border-red-500/30 active:scale-95 transition-all cursor-pointer">
							<v-icon name="bi-trash" scale="0.8" />
							Delete
						</button>

						<button v-if="canUpdate" @click="handleSave"
							:disabled="roleStore.loading.save || roleStore.isSuperAdmin" class="tazko-btn">
							<v-icon v-if="roleStore.loading.save" name="bi-arrow-repeat" scale="1"
								class="animate-spin" />
							<v-icon v-else name="bi-check2" scale="1" />
							{{ roleStore.loading.save ? 'Saving…' : 'Save Changes' }}
						</button>
					</div>
				</div>

				<!-- Mobile coverage pill -->
				<div v-if="roleStore.selectedRole"
					class="flex lg:hidden items-center gap-2 px-4 py-2 border-b border-heading/6 shrink-0">
					<div class="w-2 h-2 rounded-full shrink-0"
						:class="coveragePercent > 66 ? 'bg-emerald-400' : coveragePercent > 33 ? 'bg-yellow-400' : 'bg-red-400'" />
					<span class="text-sm text-text font-medium">
						{{ selectedPermissionsCount }} of {{ totalPermissions }} permissions ({{ coveragePercent }}%)
					</span>
				</div>

				<!-- Search bar -->
				<div v-if="roleStore.selectedRole"
					class="px-4 sm:px-8 py-3  border-b border-heading/6 shrink-0 bg-body">
					<div class="relative">
						<v-icon name="bi-search"
							class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text pointer-events-none"
							scale="0.85" />
						<input v-model="searchQuery" type="text" placeholder="Search permissions…"
							class="w-full pl-9 pr-4 py-2 text-base bg-heading/3 border border-heading/8 focus:border-accent/40 focus:outline-none rounded-sm transition-colors" />
					</div>
				</div>

				<!-- Super-admin notice -->
				<div v-if="roleStore.isSuperAdmin"
					class="mx-4 sm:mx-8 mt-4 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-sm flex items-center gap-1 shrink-0">
					<v-icon name="co-warning" class="text-amber-500" scale="0.8" />
					<p class="text-sm text-amber-600 font-medium">
						Super-admin has all permissions by default. Changes cannot be made to this role.
					</p>

				</div>

				<!-- ── MODULE CARDS — this is the ONLY scrolling region ── -->
				<div v-scrollbar class="flex-1 overflow-y-auto"><div class="px-4 sm:px-8 py-6">

					<!-- No role selected -->
					<div v-if="!roleStore.selectedRole"
						class="flex flex-col items-center justify-center h-64 text-center">
						<div class="w-16 h-16 rounded-sm bg-heading/5 flex items-center justify-center mb-4">
							<v-icon name="bi-shield" class="text-heading" scale="1.5" />
						</div>
						<p class="text-heading font-medium">No role selected</p>
						<p class="text-base text-text mt-1">Pick a role from the sidebar to manage its permissions
						</p>
					</div>

					<!-- No results from search -->
					<div v-else-if="moduleList.length === 0 && searchQuery"
						class="flex flex-col items-center justify-center h-48 text-center">
						<p class="text-heading font-medium">No results for "{{ searchQuery }}"</p>
						<button @click="searchQuery = ''" class="text-base text-accent hover:underline mt-2">
							Clear search
						</button>
					</div>

					<!-- Module Cards -->
					<div v-else class="space-y-3">
						<div v-for="(caps, module) in filteredCapabilities" :key="module"
							class="bg-panel border border-heading/10 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">

							<!-- Module Header -->
							<button type="button"
								class="w-full flex justify-between items-center px-4 sm:px-5 py-4 hover:bg-heading/3 transition-colors"
								@click="roleStore.collapsedModules[module] = !roleStore.collapsedModules[module]">
								<div class="flex items-center gap-3 min-w-0">
									<span class="text-lg leading-none shrink-0"><v-icon :name="getModuleIcon(module)" scale="1" /></span>
									<div class="text-left min-w-0 flex w-full items-center gap-2">
										<h3 class="font-semibold capitalize text-heading text-base">{{ module }}</h3>
										<p class="text-sm text-text mt-0.5">(
											{{ moduleSelectedCount(module) }} of {{
												roleStore.capabilities[module]?.length }}
											permission{{ roleStore.capabilities[module]?.length !== 1 ? 's' : '' }} )
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
									<!-- Mini progress bar (hidden on very small screens) -->
									<div class="hidden sm:flex items-center gap-2">
										<div class="w-16 sm:w-20 h-1.5 bg-heading/10 rounded-full overflow-hidden">
											<div class="h-full bg-accent rounded-full transition-all duration-300"
												:style="{
													width: roleStore.capabilities[module]?.length
														? (moduleSelectedCount(module) / roleStore.capabilities[module].length * 100) + '%'
														: '0%'
												}" />
										</div>
									</div>

									<!-- Select All toggle -->
									<label v-if="canUpdate" class="flex items-center gap-1.5 cursor-pointer"
										@click.stop>
										<input type="checkbox" class="sr-only" :disabled="roleStore.isSuperAdmin"
											:checked="isModuleFullySelected(module)"
											@change="toggleSelectAll(module)" />
										<div class="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
											:class="isModuleFullySelected(module) ? 'bg-accent border-accent' : 'border-heading/25'">
											<v-icon v-if="isModuleFullySelected(module)" name="bi-check2"
												class="text-white" scale="1" />
										</div>
										<span class="text-sm text-text font-medium">All</span>
									</label>

									<!-- Collapse chevron -->
									<v-icon name="bi-chevron-down"
										class="text-text transition-transform duration-200" />
								</div>
							</button>

							<!-- Capabilities Grid -->
							<div v-show="!roleStore.collapsedModules[module]"
								class="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-heading/6">
								<label v-for="cap in caps" :key="cap.id"
									class="flex items-center gap-3 py-2 px-3 rounded-sm transition-colors group" :class="[
										isPermissionSelected(module, cap.id) ? 'bg-accent/8 text-heading' : 'text-text',
										(roleStore.isSuperAdmin || !canUpdate) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-heading/4'
									]">
									<div class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150"
										:class="isPermissionSelected(module, cap.id)
											? 'bg-accent border-accent'
											: 'border-heading/20 group-hover:border-accent/40'">
										<v-icon v-if="isPermissionSelected(module, cap.id)" name="bi-check2"
											class="text-white" scale="1" />
									</div>
									<input type="checkbox" class="sr-only"
										:disabled="roleStore.isSuperAdmin || !canUpdate"
										:checked="isPermissionSelected(module, cap.id)"
										@change="togglePermission(module, cap.id)" />
									<span class="text-base leading-snug">{{ cap.label }}</span>
								</label>
							</div>
						</div>
					</div>
				</div>
				<!-- END scrollable region -->
			</div></div>
		</div>
		<!-- END body -->


		<!-- ── MOBILE SIDEBAR DRAWER ────────────────────────────── -->
		<Teleport to="body">
			<Transition name="fade">
				<div v-if="mobileSidebarOpen" class="fixed inset-0 z-50 lg:hidden flex">
					<!-- Backdrop -->
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="mobileSidebarOpen = false" />

					<!-- Drawer panel -->
					<Transition name="slide-left">
						<div v-if="mobileSidebarOpen"
							class="relative w-72 max-w-[85vw] bg-panel h-full flex flex-col shadow-2xl">

							<!-- Drawer Header -->
							<div
								class="px-5 pt-5 pb-4 border-b border-heading/10 flex items-center justify-between shrink-0">
								<div>
									<h2 class="section-title">Roles</h2>
									<p class="section-desc mt-0.5">Manage Roles</p>
								</div>
								<div class="flex items-center gap-2">
									<button v-if="canCreate" @click="showAddRole = true; mobileSidebarOpen = false"
										class="w-8 h-8 rounded-sm bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition-all active:scale-95"
										title="Add new role">
										<v-icon name="bi-plus" scale="1.2" />
									</button>
									<button @click="mobileSidebarOpen = false"
										class="w-8 h-8 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
										<v-icon name="bi-x" scale="1.2" />
									</button>
								</div>
							</div>

							<!-- Role List -->
							<div v-scrollbar class="flex-1 overflow-y-auto"><ul class="py-3 px-3 space-y-1">
								<li v-for="role in roleStore.roles" :key="role.id">
									<button @click="selectRoleAndClose(role)"
										class="w-full text-left px-3 py-3 rounded-sm transition-all duration-150 flex items-center gap-3 group"
										:class="roleStore.selectedRole?.id === role.id
											? 'bg-accent/15 text-heading'
											: 'hover:bg-heading/5 text-text'">
										<span
											class="w-7 h-7 rounded-sm flex items-center justify-center text-sm font-bold shrink-0"
											:class="roleStore.selectedRole?.id === role.id
												? 'bg-accent text-white'
												: 'bg-heading/10 text-heading group-hover:bg-accent/20'">
											{{ getRoleInitial(role.label) }}
										</span>
										<span class="text-base font-medium truncate">{{ role.label }}</span>
										<span v-if="roleStore.selectedRole?.id === role.id"
											class="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
									</button>
								</li>

								<li v-if="!roleStore.roles?.length" class="px-3 py-8 text-center">
									<p class="text-base text-text">No roles yet</p>
									<button v-if="canCreate" @click="showAddRole = true; mobileSidebarOpen = false"
										class="mt-2 text-sm text-accent hover:underline">
										Create one →
									</button>
								</li>
							</ul></div>

							<!-- Drawer Footer -->
							<div class="px-5 py-4 border-t border-heading/10 shrink-0">
								<p class="text-base text-text">
									{{ roleStore.roles?.length || 0 }} role{{ roleStore.roles?.length !== 1 ? 's' : ''
									}} total
								</p>
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</Teleport>


		<!-- ── DELETE CONFIRM MODAL ──────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl p-6 border border-heading/10 transition-all">
						<button @click="showDeleteConfirm = false"
							class="absolute top-3 right-3 w-7 h-7 rounded-sm flex items-center justify-center text-text hover:bg-heading/8 transition-all">
							<v-icon name="bi-x" scale="1.3" />
						</button>
						<div class="w-12 h-12 rounded-sm bg-red-500/10 flex items-center justify-center mx-auto mb-4">
							<v-icon name="bi-trash" class="text-red-500" scale="1.2" />
						</div>
						<h3 class="section-title text-center mb-1">Delete Role?</h3>
						<p class="text-base text-text text-center mb-6">
							Are you sure you want to delete
							<strong class="text-heading">{{ roleStore.selectedRole?.label }}</strong>?
							This action cannot be undone.
						</p>
						<div class="flex gap-3">
							<button @click="showDeleteConfirm = false" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleDelete" :disabled="roleStore.loading.delete"
								class="flex-1 tazko-btn-danger">
								<v-icon v-if="roleStore.loading.delete" name="bi-arrow-repeat" scale="1"
									class="animate-spin" />
								<v-icon v-else name="bi-trash" scale="1" />
								{{ roleStore.loading.delete ? 'Deleting…' : 'Delete' }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>


		<!-- ── ADD ROLE MODAL ────────────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showAddRole && canCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="closeModal" />
					<div
						class="relative w-full max-w-md bg-panel rounded-sm shadow-2xl border border-heading/10 overflow-hidden transition-all">

						<div class="px-6 py-5 border-b border-heading/10 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center">
									<v-icon name="bi-shield" class="text-accent" />
								</div>
								<h2 class=" section-title">Create New Role</h2>
							</div>
							<button @click="closeModal"
								class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.3" />
							</button>
						</div>
						<form @submit.prevent="handleAddRole">
							<div class="p-6 space-y-5">
								<div class="flex flex-col gap-2">
									<label class="block text-base font-semibold text-text">
										Role Display Name <span class="text-red-400">*</span>
									</label>
									<input @input="generateRoleName(); addRoleErrors.label = null" v-model="newRoleLabel" type="text"
										placeholder="e.g. Project Manager" class="input-field"
										:class="(addRoleErrors.label || roleStore.errors?.label) ? 'border-red-400 bg-red-50/30' : ''" />
									<p v-if="addRoleErrors.label" class="text-red-500 text-base mt-1.5 flex items-center gap-1">
										<v-icon name="md-erroroutline-round" />
										{{ addRoleErrors.label }}
									</p>
									<p v-else-if="roleStore.errors?.label"
										class="text-red-500 text-base mt-1.5 flex items-center gap-1">
										<v-icon name="md-erroroutline-round" />
										{{ roleStore.errors.label[0] }}
									</p>
								</div>
								<div v-if="newRoleName" class="flex items-center gap-2 px-3 py-2 bg-heading/5 rounded-sm">
									<span class="text-base text-text font-medium">Slug:</span>
									<code class="text-sm font-mono text-accent">{{ newRoleName }}</code>
								</div>
							</div>

							<div class="px-6 py-4 border-t border-heading/10 flex justify-end gap-3">
								<button @click="closeModal" class="flex-1 tazko-btn-cancel">
									<v-icon name="bi-x" scale="1" />
									Cancel
								</button>
								<button type="submit" :disabled="roleStore.loading.create"
									class="flex-1 tazko-btn">
									<v-icon v-if="roleStore.loading.create" name="bi-arrow-repeat" scale="1" class="animate-spin" />
									<v-icon v-else name="bi-check2" scale="1" />
									{{ roleStore.loading.create ? 'Creating…' : 'Create Role' }}
								</button>
							</div>
						</form>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
/* Modal transitions */
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

/* Fade */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* Mobile drawer slide-in from left */
.slide-left-enter-active,
.slide-left-leave-active {
	transition: transform 0.25s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
	transform: translateX(-100%);
}
</style>