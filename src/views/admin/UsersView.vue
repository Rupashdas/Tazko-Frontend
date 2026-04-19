\
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/utils/toast'
import { paletteColor } from '@/utils/paletteColor'

import { addIcons } from 'oh-vue-icons'
import {
	BiPeople, BiSearch, BiPencil,
	BiEnvelope, BiTrash, BiX, BiPersonPlus, BiPower,
	CoLockLocked, BiArrowRepeat, MdCancelOutlined,
	BiCheck2
} from 'oh-vue-icons/icons'

addIcons(
	BiPeople, BiSearch, BiPencil,
	BiEnvelope, BiTrash, BiX, BiPersonPlus, BiPower,
	CoLockLocked, BiArrowRepeat, MdCancelOutlined,
	BiCheck2
)

const userStore = useUserStore()
const authStore = useAuthStore()
const { successToast, errorToast } = useToast()

const canCreate = computed(() => authStore.hasCapability('users.create'))
const canUpdate = computed(() => authStore.hasCapability('users.update'))
const canDelete = computed(() => authStore.hasCapability('users.delete'))
const canActivate = computed(() => authStore.hasCapability('users.activate'))
const canAssignRole = computed(() => authStore.hasCapability('users.role.assign'))
const canViewProfile = computed(() => authStore.hasCapability('users.profile.view'))

const searchQuery = ref('')
const roleFilter = ref('All')
const selectedUser = ref(null)
const showInviteModal = ref(false)
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref(null)

const editMode = ref(false)
const editName = ref('')
const editEmail = ref('')
const editErrors = ref({})

const newUser = ref({ name: '', email: '', role_id: null })
const inviteErrors = ref({})
const invitations = computed(() => userStore.invitations)
const showCancelConfirm = ref(false)
const pendingCancelId = ref(null)
const pendingRoleId = ref(null)

const users = computed(() => userStore.users)
const roles = computed(() => userStore.roles.filter(r => r.name !== 'super-admin'))
const allRoles = computed(() => userStore.roles)

const filteredUsers = computed(() => {
	let list = users.value
	if (roleFilter.value !== 'All') {
		list = list.filter(u => u.roles?.some(r => r.label === roleFilter.value || r.name === roleFilter.value))
	}
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase()
		list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
	}
	return list
})

const isOwnAccount = (userId) => authStore.user?.id === userId
const isSuperAdminUser = (user) => user.roles?.some(r => r.name === 'super-admin')
const getInitials = (name) => name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
const getPrimaryRole = (user) => user.roles?.[0] ?? null

const getRoleBadge = (roleName) => {
	const map = {
		'super-admin': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
		'admin': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
		'manager': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
		'member': 'bg-heading/8 text-text border border-heading/10',
	}
	return map[roleName] ?? 'bg-heading/8 text-text border border-heading/10'
}

const getStatusBadge = (status) => {
	const map = { pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', expired: 'bg-red-500/15 text-red-600 dark:text-red-400', accepted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
	return map[status] ?? 'bg-heading/8 text-text'
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

onMounted(() => userStore.init())

const openUserPopup = (user) => {
	selectedUser.value = user
	pendingRoleId.value = getPrimaryRole(user)?.id ?? null
	editMode.value = false
	editName.value = user.name
	editEmail.value = user.email
	editErrors.value = {}
}

const closeUserPopup = () => {
	selectedUser.value = null
	editMode.value = false
	editErrors.value = {}
}

const startEdit = () => {
	editName.value = selectedUser.value.name
	editEmail.value = selectedUser.value.email
	editErrors.value = {}
	editMode.value = true
}

const handleUpdateUser = async () => {
	editErrors.value = {}
	const res = await userStore.updateUser(selectedUser.value.id, { name: editName.value, email: editEmail.value })
	if (res.success) {
		successToast(res.message)
		const updated = users.value.find(u => u.id === selectedUser.value.id)
		if (updated) selectedUser.value = updated
		editMode.value = false
	} else {
		if (res.errors) editErrors.value = Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
		else errorToast(res.message)
	}
}

const handleToggleActive = async (user) => {
	const res = await userStore.toggleActive(user.id)
	if (res.success) {
		successToast(res.message)
		const updated = users.value.find(u => u.id === user.id)
		if (updated && selectedUser.value?.id === user.id) selectedUser.value = updated
	} else {
		errorToast(res.message)
	}
}

const handleAssignRole = async () => {
	if (!pendingRoleId.value) return
	const res = await userStore.assignRole(selectedUser.value.id, pendingRoleId.value)
	if (res.success) {
		successToast(res.message)
		const updated = users.value.find(u => u.id === selectedUser.value.id)
		if (updated) selectedUser.value = updated
		closeUserPopup()
	} else {
		errorToast(res.message)
	}
}

const confirmDelete = (userId) => {
	pendingDeleteId.value = userId
	showDeleteConfirm.value = true
}

const handleDelete = async () => {
	const res = await userStore.deleteUser(pendingDeleteId.value)
	if (res.success) {
		successToast(res.message)
		showDeleteConfirm.value = false
		pendingDeleteId.value = null
		if (selectedUser.value?.id === pendingDeleteId.value) closeUserPopup()
	} else {
		errorToast(res.message)
	}
}

const validateInvite = () => {
	const e = {}
	if (!newUser.value.name.trim()) e.name = 'Name is required'
	if (!newUser.value.email.trim()) e.email = 'Email is required'
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.value.email)) e.email = 'Enter a valid email'
	inviteErrors.value = e
	return !Object.keys(e).length
}

const handleInvite = async () => {
	if (!validateInvite()) return
	const res = await userStore.sendInvitation({ name: newUser.value.name, email: newUser.value.email, role_id: newUser.value.role_id || null })
	if (res.success) {
		successToast(res.message)
		closeInviteModal()
	} else {
		if (res.errors) {
			inviteErrors.value = Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
		} else {
			errorToast(res.message)
		}
	}
}

const closeInviteModal = () => {
	showInviteModal.value = false
	newUser.value = { name: '', email: '', role_id: null }
	inviteErrors.value = {}
}

const handleResend = async (invitationId) => {
	const res = await userStore.resendInvitation(invitationId)
	if (res.success) successToast(res.message)
	else errorToast(res.message)
}

const handleCancel = async () => {
	const res = await userStore.cancelInvitation(pendingCancelId.value)
	if (res.success) {
		successToast(res.message)
		showCancelConfirm.value = false
		pendingCancelId.value = null
	} else {
		errorToast(res.message)
	}
}
</script>

<template>
	<div class="space-y-5 relative">

		<!-- Loading overlay -->
		<Transition name="fade">
			<div v-if="userStore.loading.page"
				class="absolute inset-0 bg-panel/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-sm gap-3">
				<div class="w-10 h-10 rounded-full border-3 border-accent border-t-transparent animate-spin" />
				<p class="text-base text-text font-medium">Loading users…</p>
			</div>
		</Transition>

		<!-- ── MAIN USERS PANEL ─────────────────────────────── -->
		<div class="flex flex-col bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">

			<!-- Top Bar -->
			<div class="px-5 sm:px-7 py-5 border-b border-heading/8 flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-11 h-11 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-people" class="text-accent" scale="1.3" />
					</div>
					<div>
						<div class="flex items-center gap-2.5 flex-wrap">
							<h1 class="section-title">Manage Users</h1>
							<span
								class="px-2.5 py-0.5 rounded-full text-base font-bold bg-heading/8 text-text tabular-nums">{{
									users.length }}</span>
						</div>
						<p class="section-desc mt-0.5">Invite and manage workspace members</p>
					</div>
				</div>
				<button v-if="canCreate" @click="showInviteModal = true"
					class="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white text-base font-semibold rounded-sm shadow-sm hover:bg-accent/88 active:scale-95 transition-all shrink-0">
					<v-icon name="bi-person-plus" scale="1" />
					Invite User
				</button>
			</div>

			<!-- Filter Bar -->
			<div class="px-5 sm:px-7 py-3 border-b border-heading/6 flex flex-wrap items-center gap-3 bg-body/40">
				<div class="relative flex-1 min-w-48">
					<v-icon name="bi-search"
						class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text pointer-events-none" scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search users…"
						class="w-full pl-10 pr-4 py-2 text-base bg-heading/3 border border-heading/8 focus:border-accent/40 focus:outline-none rounded-sm transition-colors" />
				</div>
				<div class="flex items-center gap-1.5 flex-wrap">
					<button v-for="role in ['All', ...allRoles.map(r => r.label)]" :key="role"
						@click="roleFilter = role" class="px-3 py-2 rounded-sm text-sm font-semibold transition-all"
						:class="roleFilter === role ? 'bg-accent text-white' : 'bg-heading/6 text-text hover:bg-heading/10'">
						{{ role }}
					</button>
				</div>
			</div>

			<!-- Desktop Table -->
			<div class="hidden sm:block overflow-x-auto flex-1">
				<table class="w-full min-w-[520px]">
					<thead>
						<tr class="border-b border-heading/6 bg-body/40">
							<th class="px-7 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">User</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Role</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Status</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Joined</th>
							<th class="px-7 py-3 text-right text-sm font-semibold uppercase tracking-wide text-text">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-heading/5">
						<tr v-for="user in filteredUsers" :key="user.id"
							class="group transition-colors hover:bg-heading/3"
							:class="{ 'opacity-50': !user.is_active }">
							<td class="px-7 py-4">
								<div class="flex items-center gap-3">
									<img v-if="user.avatar" :src="user.avatar" alt="Avatar"
										class="w-10 h-10 rounded-full object-cover shrink-0" />
									<div v-else
										class="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
										:class="paletteColor(user.palette)">
										{{ getInitials(user.name) }}
									</div>
									<div class="min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<p class="text-base font-semibold text-heading leading-tight truncate">{{
												user.name }}</p>
											<span v-if="isOwnAccount(user.id)"
												class="shrink-0 text-sm font-bold px-2 py-0.5 rounded-sm bg-accent/15 text-accent">You</span>
										</div>
										<p class="text-base text-text mt-0.5 truncate">{{ user.email }}</p>
									</div>
								</div>
							</td>
							<td class="px-4 py-4">
								<span v-if="getPrimaryRole(user)"
									class="inline-flex px-2.5 py-1 rounded-sm text-sm font-semibold"
									:class="getRoleBadge(getPrimaryRole(user).name)">
									{{ getPrimaryRole(user).label }}
								</span>
								<span v-else class="text-sm text-text italic">No role</span>
							</td>
							<td class="px-4 py-4">
								<span
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-sm font-semibold"
									:class="user.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'">
									<span class="w-2 h-2 rounded-full"
										:class="user.is_active ? 'bg-emerald-500' : 'bg-red-500'" />
									{{ user.is_active ? 'Active' : 'Inactive' }}
								</span>
							</td>
							<td class="px-4 py-4">
								<span class="text-base text-text">{{ formatDate(user.created_at) }}</span>
							</td>
							<td class="px-7 py-4 text-right">
								<div class="flex items-center justify-end gap-1.5" @click.stop>
									<button v-if="canViewProfile || canUpdate" @click="openUserPopup(user)"
										class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-accent hover:bg-accent/10 transition-all"
										title="View / Edit">
										<v-icon name="bi-pencil" scale="0.85" />
									</button>
									<button v-if="canActivate && !isOwnAccount(user.id) && !isSuperAdminUser(user)"
										@click="handleToggleActive(user)" :disabled="userStore.loading.activate"
										:title="user.is_active ? 'Deactivate' : 'Activate'"
										class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
										:class="user.is_active ? 'text-text hover:text-amber-500 hover:bg-amber-500/10' : 'text-text hover:text-emerald-500 hover:bg-emerald-500/10'">
										<v-icon name="bi-power" scale="1.1" />
									</button>
									<button v-if="canDelete && !isOwnAccount(user.id) && !isSuperAdminUser(user)"
										@click="confirmDelete(user.id)"
										class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-red-500 hover:bg-red-500/10 transition-all"
										title="Delete">
										<v-icon name="bi-trash" scale="1" />
									</button>
								</div>
							</td>
						</tr>
						<tr v-if="filteredUsers.length === 0">
							<td colspan="5" class="px-7 py-16 text-center">
								<p class="text-base font-semibold text-text">No users found</p>
								<p class="text-base text-text mt-0.5">Try adjusting your search or filter</p>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Mobile Card List -->
			<div class="sm:hidden divide-y divide-heading/5">
				<div v-for="user in filteredUsers" :key="user.id"
					class="px-5 py-4 flex items-center gap-3 hover:bg-heading/3 transition-colors"
					:class="{ 'opacity-50': !user.is_active }">
					<img v-if="user.avatar" :src="user.avatar" alt="Avatar"
						class="w-10 h-10 rounded-full object-cover shrink-0" />
					<div v-else
						class="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
						:class="paletteColor(user.palette)">
						{{ getInitials(user.name) }}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-1.5 flex-wrap">
							<p class="text-base font-semibold text-heading truncate">{{ user.name }}</p>
							<span v-if="isOwnAccount(user.id)"
								class="text-sm font-bold px-2 py-0.5 rounded-sm bg-accent/15 text-accent shrink-0">You</span>
						</div>
						<p class="text-base text-text truncate mt-0.5">{{ user.email }}</p>
						<div class="flex items-center gap-2 mt-1.5 flex-wrap">
							<span v-if="getPrimaryRole(user)"
								class="inline-flex px-2 py-0.5 rounded-sm text-sm font-semibold"
								:class="getRoleBadge(getPrimaryRole(user).name)">
								{{ getPrimaryRole(user).label }}
							</span>
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-sm font-semibold"
								:class="user.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'">
								<span class="w-1.5 h-1.5 rounded-full"
									:class="user.is_active ? 'bg-emerald-500' : 'bg-red-500'" />
								{{ user.is_active ? 'Active' : 'Inactive' }}
							</span>
						</div>
						<div class="flex items-center gap-1.5 mt-1.5">
							<button v-if="canViewProfile || canUpdate" @click="openUserPopup(user)"
								class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-accent hover:bg-accent/10 transition-all"
								title="View / Edit">
								<v-icon name="bi-pencil" scale="0.85" />
							</button>
							<button v-if="canActivate && !isOwnAccount(user.id) && !isSuperAdminUser(user)"
								@click="handleToggleActive(user)" :disabled="userStore.loading.activate"
								:title="user.is_active ? 'Deactivate' : 'Activate'"
								class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
								:class="user.is_active ? 'text-text hover:text-amber-500 hover:bg-amber-500/10' : 'text-text hover:text-emerald-500 hover:bg-emerald-500/10'">
								<v-icon name="bi-power" scale="1.1" />
							</button>
							<button v-if="canDelete && !isOwnAccount(user.id) && !isSuperAdminUser(user)"
								@click="confirmDelete(user.id)"
								class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-red-500 hover:bg-red-500/10 transition-all"
								title="Delete">
								<v-icon name="bi-trash" scale="1" />
							</button>
						</div>
					</div>
				</div>
				<div v-if="filteredUsers.length === 0" class="px-5 py-16 text-center">
					<p class="text-lg text-text font-medium">No users found</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="px-7 py-4 border-t border-heading/8 bg-body/40">
				<p class="text-base text-text">{{ filteredUsers.length }} of {{ users.length }} user{{
					users.length !== 1 ? 's' : '' }} in workspace</p>
			</div>
		</div>

		<!-- ── PENDING INVITATIONS ──────────────────────────────── -->
		<div v-if="canCreate && invitations.length > 0"
			class="flex flex-col bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden">
			<div class="px-5 sm:px-7 py-5 border-b border-heading/8 flex items-center justify-between flex-wrap gap-3">
				<div class="flex items-center gap-3">
					<div class="w-11 h-11 rounded-sm bg-amber-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-envelope" class="text-amber-600" scale="1.1" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="section-title">Pending Invitations</h2>
							<span
								class="px-2.5 py-0.5 rounded-full text-base font-bold bg-amber-500/15 text-amber-600 tabular-nums">{{
									invitations.length }}</span>
						</div>
						<p class="section-desc mt-0.5">Invitations waiting to be accepted</p>
					</div>
				</div>
			</div>

			<div class="hidden sm:block overflow-x-auto">
				<table class="w-full min-w-[620px]">
					<thead>
						<tr class="border-b border-heading/6 bg-body/40">
							<th class="px-7 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Invitee</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Role</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Invited By</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Status</th>
							<th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text">Expires</th>
							<th class="px-7 py-3 text-right text-sm font-semibold uppercase tracking-wide text-text">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-heading/5">
						<tr v-for="inv in invitations" :key="inv.id" class="group hover:bg-heading/3 transition-colors">
							<td class="px-7 py-4">
								<p class="text-base font-semibold text-heading leading-tight truncate">{{ inv.name }}
								</p>
								<p class="text-base text-text mt-0.5 truncate">{{ inv.email }}</p>
							</td>
							<td class="px-4 py-4">
								<span v-if="inv.role" class="inline-flex px-2.5 py-1 rounded-sm text-sm font-semibold"
									:class="getRoleBadge(inv.role.name)">{{ inv.role.label }}</span>
								<span v-else class="text-base text-text italic">No role</span>
							</td>
							<td class="px-4 py-4">
								<div class="flex items-center gap-2">
									<img v-if="inv.invited_by.avatar" :src="inv.invited_by.avatar" alt="Avatar"
										class="w-7 h-7 rounded-full object-cover shrink-0" />
									<div v-else
										class="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
										:class="paletteColor(inv.invited_by.palette)">
										{{ getInitials(inv.invited_by.name) }}
									</div>
									<span class="text-base text-heading font-medium truncate">{{ inv.invited_by.name
									}}</span>
								</div>
							</td>
							<td class="px-4 py-4">
								<span
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-sm font-semibold capitalize"
									:class="getStatusBadge(inv.status)">
									<span class="w-1.5 h-1.5 rounded-full"
										:class="inv.status === 'pending' ? 'bg-amber-400' : inv.status === 'expired' ? 'bg-red-400' : 'bg-emerald-400'" />
									{{ inv.status }}
								</span>
							</td>
							<td class="px-4 py-4">
								<span class="text-base text-text">{{ formatDate(inv.expires_at) }}</span>
							</td>
							<td class="px-7 py-4 text-right">
								<div class="flex items-center justify-end gap-2">
									<button @click="handleResend(inv.id)" :disabled="userStore.loading.resend"
										class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-accent hover:bg-accent/10 transition-all disabled:opacity-40"
										title="Resend">
										<v-icon name="bi-arrow-repeat" scale="1.1" />
									</button>
									<button @click="pendingCancelId = inv.id; showCancelConfirm = true"
										class="w-9 h-9 rounded-sm flex items-center justify-center cursor-pointer text-text hover:text-red-500 hover:bg-red-500/10 transition-all"
										title="Cancel">
										<v-icon name="md-cancel-outlined" scale="1.1" />
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Mobile invitations -->
			<div class="sm:hidden divide-y divide-heading/5">
				<div v-for="inv in invitations" :key="inv.id" class="px-5 py-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-base font-semibold text-heading">{{ inv.name }}</p>
							<p class="text-base text-text mt-0.5 truncate">{{ inv.email }}</p>
							<div class="flex items-center gap-2 mt-2 flex-wrap">
								<span v-if="inv.role" class="inline-flex px-2 py-0.5 rounded-sm text-sm font-semibold"
									:class="getRoleBadge(inv.role.name)">{{ inv.role.label }}</span>
								<span
									class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-sm font-semibold capitalize"
									:class="getStatusBadge(inv.status)">{{ inv.status }}</span>
							</div>
						</div>
						<div class="flex items-center gap-1.5 shrink-0">
							<button @click="handleResend(inv.id)"
								class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:text-accent hover:bg-accent/10 transition-all"
								title="Resend">
								<v-icon name="bi-arrow-repeat" scale="1.1" />
							</button>
							<button @click="pendingCancelId = inv.id; showCancelConfirm = true"
								class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:text-red-500 hover:bg-red-500/10 transition-all"
								title="Cancel">
								<v-icon name="md-cancel-outlined" scale="1.1" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ── USER POPUP MODAL ──────────────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="selectedUser" class="fixed inset-0 z-50 flex items-center justify-center p-4"
					@mousedown.self="closeUserPopup">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="closeUserPopup" />
					<div
						v-scrollbar class="relative w-full max-w-xl bg-panel rounded-sm shadow-2xl border border-heading/10 overflow-hidden max-h-[90vh] overflow-y-auto transition-all">

						<div class="px-6 py-5 border-b border-heading/8 flex items-start justify-between gap-3">
							<div class="flex items-center gap-3 min-w-0">
								<div class="w-12 h-12 rounded-sm flex items-center justify-center text-white text-base font-bold shrink-0"
									:class="paletteColor(selectedUser.palette)">
									{{ getInitials(selectedUser.name) }}
								</div>
								<div class="min-w-0">
									<div class="flex items-center gap-1.5 flex-wrap">
										<p class="section-title">{{ selectedUser.name }}</p>
										<span v-if="isOwnAccount(selectedUser.id)"
											class="shrink-0 text-sm font-bold px-2 py-0.5 rounded-sm bg-accent/15 text-accent">You</span>
										<span v-if="isSuperAdminUser(selectedUser)"
											class="shrink-0 text-sm font-bold px-2 py-0.5 rounded-sm bg-violet-100 text-violet-700">Super
											Admin</span>
									</div>
									<p class="text-base text-text mt-0.5">{{ selectedUser.email }}</p>
								</div>
							</div>
							<button @click="closeUserPopup"
								class="w-8 h-8 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all shrink-0">
								<v-icon name="bi-x" scale="1.1" />
							</button>
						</div>

						<div class="p-6 space-y-5">

							<!-- Edit user info -->
							<div v-if="canUpdate">
								<p class="text-base font-bold uppercase text-text mb-3">User Info</p>
								<div v-if="!editMode" class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="block text-base font-semibold text-text">Name</span>
										<span class="text-base font-semibold text-text">{{ selectedUser.name }}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="block text-base font-semibold text-text">Email</span>
										<span class="text-base font-semibold text-text max-w-lg">{{ selectedUser.email
										}}</span>
									</div>
									<button @click="startEdit"
										class="mt-2 inline-flex items-center gap-1.5 text-base font-semibold text-accent hover:underline transition-all">
										<v-icon name="bi-pencil" scale="0.8" />
										Edit
									</button>
								</div>
								<div v-else class="space-y-3">
									<div class="flex flex-col gap-1.5">
										<label class="block text-base font-semibold text-text">Name</label>
										<input v-model="editName" type="text" class="input-field"
											:class="{ 'border-red-400': editErrors.name }" />
										<p v-if="editErrors.name" class="text-red-500 text-sm mt-1">{{ editErrors.name
										}}</p>
									</div>
									<div class="flex flex-col gap-1.5">
										<label class="block text-base font-semibold text-text">Email</label>
										<input v-model="editEmail" type="email" class="input-field"
											:class="{ 'border-red-400': editErrors.email }" />
										<p v-if="editErrors.email" class="text-red-500 text-sm mt-1">{{
											editErrors.email }}</p>
									</div>
									<div class="flex gap-2">
										<button @click="editMode = false" class="flex-1 tazko-btn-cancel">
											<v-icon name="bi-x" scale="1" />
											Cancel
										</button>
										<button @click="handleUpdateUser" :disabled="userStore.loading.save" class="flex-1 tazko-btn">
											<v-icon v-if="userStore.loading.save" name="bi-arrow-repeat"
												class="animate-spin" scale="1" />
											<v-icon v-else name="bi-check2" scale="1" />
											{{ userStore.loading.save ? 'Saving…' : 'Save' }}
										</button>
									</div>
								</div>
							</div>

							<!-- Activate / Deactivate -->
							<div
								v-if="canActivate && !isOwnAccount(selectedUser.id) && !isSuperAdminUser(selectedUser)">
								<p class="text-base font-bold uppercase text-text mb-2">Account Status</p>
								<button @click="handleToggleActive(selectedUser)" :disabled="userStore.loading.activate"
									class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-sm text-base font-semibold transition-all disabled:opacity-40"
									:class="selectedUser.is_active
										? 'bg-amber-500/8 text-amber-600 hover:bg-amber-500/15 border border-amber-500/20'
										: 'bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/15 border border-emerald-500/20'">
									<v-icon v-if="userStore.loading.activate" name="bi-arrow-repeat"
										class="animate-spin" scale="1" />
									<v-icon v-else name="bi-power" scale="1" />
									{{ userStore.loading.activate ? 'Processing…' : (selectedUser.is_active ?
										'Deactivate User' : 'Activate User') }}
								</button>
							</div>

							<!-- Assign Role -->
							<div v-if="canAssignRole && !isOwnAccount(selectedUser.id)">
								<p class="text-base font-bold uppercase text-text mb-3">Assign Role</p>
								<div v-if="isSuperAdminUser(selectedUser)"
									class="px-4 py-3 bg-violet-50 border border-violet-100 rounded-sm flex items-center gap-3">
									<v-icon name="co-lock-locked" class="text-violet-600" />
									<p class="text-base text-violet-600 font-medium">Super-admin role cannot be changed.
									</p>
								</div>
								<template v-else>
									<div class="grid grid-cols-1 gap-1.5">
										<button v-for="role in roles" :key="role.id" @click="pendingRoleId = role.id"
											class="flex items-center gap-2.5 px-4 py-3 rounded-sm border text-base font-medium transition-all"
											:class="pendingRoleId === role.id
												? 'border-accent/40 bg-accent/8 text-accent'
												: 'border-heading/10 hover:border-heading/20 hover:bg-heading/4 text-text'">
											<span class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
												:class="pendingRoleId === role.id ? 'border-accent bg-accent' : 'border-text/20'" />
											{{ role.label }}
										</button>
									</div>
									<button @click="handleAssignRole"
										:disabled="userStore.loading.save || pendingRoleId === getPrimaryRole(selectedUser)?.id"
										class="mt-3 w-full tazko-btn">
										<v-icon v-if="userStore.loading.save" name="bi-arrow-repeat"
											class="animate-spin" scale="1" />
										<v-icon v-else name="bi-check2" scale="1" />
										{{ userStore.loading.save ? 'Saving…' : 'Apply Role' }}
									</button>
								</template>
							</div>

							<!-- Delete -->
							<div v-if="canDelete && !isOwnAccount(selectedUser.id) && !isSuperAdminUser(selectedUser)"
								class="pt-2 border-t border-heading/8">
								<button @click="confirmDelete(selectedUser.id); closeUserPopup()"
									class="w-full tazko-btn-danger">
									<v-icon name="bi-trash" scale="1" />
									Delete User
								</button>
							</div>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── INVITE MODAL ──────────────────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="closeInviteModal" />
					<div
						class="relative w-full max-w-md bg-panel rounded-sm shadow-2xl border border-heading/10 overflow-hidden transition-all">
						<div class="px-6 py-5 border-b border-heading/10 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
									<v-icon name="bi-person-plus" class="text-accent" scale="1.1" />
								</div>
								<h2 class="section-title">Invite User</h2>
							</div>
							<button @click="closeInviteModal"
								class="w-8 h-8 rounded-sm flex items-center justify-center text-text hover:text-text hover:bg-heading/8 transition-all">
								<v-icon name="bi-x" scale="1.1" />
							</button>
						</div>
						<div class="p-6 space-y-4">
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Name <span
										class="text-red-400">*</span></label>
								<input v-model="newUser.name" type="text" placeholder="John Doe" class="input-field"
									:class="{ 'border-red-400': inviteErrors.name }" />
								<p v-if="inviteErrors.name" class="text-red-500 text-sm mt-1">{{ inviteErrors.name }}
								</p>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Email <span
										class="text-red-400">*</span></label>
								<input v-model="newUser.email" type="email" placeholder="john@company.com"
									class="input-field" :class="{ 'border-red-400': inviteErrors.email }" />
								<p v-if="inviteErrors.email" class="text-red-500 text-sm mt-1">{{ inviteErrors.email
								}}</p>
							</div>
							<div class="flex flex-col gap-1.5">
								<label class="block text-base font-semibold text-text">Role <span
										class="text-text font-normal">(optional)</span></label>
								<div class="grid grid-cols-2 gap-2">
									<button v-for="role in roles" :key="role.id" @click="newUser.role_id = role.id"
										class="flex items-center gap-2.5 px-4 py-3 rounded-sm border text-base font-medium transition-all"
										:class="newUser.role_id === role.id
											? 'border-accent/40 bg-accent/8 text-accent'
											: 'border-heading/10 hover:border-heading/20 hover:bg-heading/4 text-text'">
										<span class="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors"
											:class="newUser.role_id === role.id ? 'border-accent bg-accent' : 'border-text/20'" />
										{{ role.label }}
									</button>
								</div>
							</div>
						</div>
						<div class="px-6 py-4 border-t border-heading/10 flex justify-end gap-3">
							<button @click="closeInviteModal" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleInvite" :disabled="userStore.loading.invite" class="flex-1 tazko-btn">
								<v-icon v-if="userStore.loading.invite" name="bi-arrow-repeat" class="animate-spin"
									scale="1" />
								<v-icon v-else name="bi-person-plus" scale="1" />
								{{ userStore.loading.invite ? 'Sending…' : 'Send Invitation' }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── DELETE CONFIRM MODAL ──────────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
					<div
						class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 overflow-hidden p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-red-50 flex items-center justify-center mb-4">
							<v-icon name="bi-trash" class="text-red-500" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Delete User?</h3>
						<p class="text-base text-text mb-5">This will permanently delete the user. This action cannot be
							undone.
						</p>
						<div class="flex gap-3">
							<button @click="showDeleteConfirm = false" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleDelete" :disabled="userStore.loading.delete" class="flex-1 tazko-btn-danger">
								<v-icon v-if="userStore.loading.delete" name="bi-arrow-repeat" class="animate-spin"
									scale="1" />
								<v-icon v-else name="bi-trash" scale="1" />
								{{ userStore.loading.delete ? 'Deleting…' : 'Delete' }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── CANCEL INVITE CONFIRM ─────────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showCancelConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showCancelConfirm = false" />
					<div
						class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 overflow-hidden p-6 transition-all">
						<h3 class="section-title mb-2">Cancel Invitation?</h3>
						<p class="text-base text-text mb-5">The user won't be able to join unless re-invited.</p>
						<div class="flex gap-3">
							<button @click="showCancelConfirm = false" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Keep
							</button>
							<button @click="handleCancel" class="flex-1 tazko-btn-danger">
								<v-icon name="md-cancel-outlined" scale="1" />
								Cancel Invite
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
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

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>