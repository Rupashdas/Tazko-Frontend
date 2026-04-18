import { defineStore } from 'pinia'
import axios from '@/axios'

export const useRoleStore = defineStore('roles', {
	state: () => ({
		roles: [],
		capabilities: {},
		selectedRole: null,
		selectedPermissions: {},
		collapsedModules: {},
		loaded: false,
		loading: {
			page: false,
			save: false,
			delete: false,
			create: false,
		},
		errors: {},
	}),

	getters: {
		isPageLoading: (state) => state.loading.page,
		isSuperAdmin: (state) => state.selectedRole?.name === 'super-admin',
		filteredCapabilities: (state) => (searchQuery = '') => {
			if (!searchQuery.trim()) return state.capabilities
			return Object.fromEntries(
				Object.entries(state.capabilities)
					.map(([module, caps]) => [
						module,
						caps.filter(c =>
							c.label.toLowerCase().includes(searchQuery.toLowerCase())
						),
					])
					.filter(([, caps]) => caps.length > 0)
			)
		},
		selectedCapabilityIds: (state) =>
			Object.values(state.selectedPermissions).flat(),
	},

	actions: {
		/*─────────────────────
		| INIT (Parallel fetch, unified loader)
		──────────────────────*/
		async init() {
			if (this.loaded) return

			this.loading.page = true

			try {
				const [capRes, roleRes] = await Promise.all([
					axios.get('/api/capabilities'),
					axios.get('/api/roles'),
				])

				// Set capabilities
				this.capabilities = capRes.data ?? {}
				const collapsedNext = { ...this.collapsedModules }
				const permsNext     = { ...this.selectedPermissions }
				Object.keys(this.capabilities).forEach(module => {
					if (!(module in collapsedNext)) collapsedNext[module] = false
					if (!permsNext[module]) permsNext[module] = []
				})
				this.collapsedModules    = collapsedNext
				this.selectedPermissions = permsNext

				// Set roles
				this.roles = roleRes.data.data ?? []
				if (this.roles.length) this.selectRole(this.roles[0])

				this.loaded = true
			} catch (err) {
				console.error('[RoleStore] init:', err)
				const message = err.response?.data?.message || 'Failed to load roles.'
				return { success: false, message }
			} finally {
				this.loading.page = false
			}
		},

		togglePermission(module, capId) {
			const list = this.selectedPermissions[module] ?? []
			const idx = list.indexOf(capId)
			this.selectedPermissions = {
				...this.selectedPermissions,
				[module]: idx > -1
					? list.filter(id => id !== capId)
					: [...list, capId],
			}
		},

		toggleSelectAll(module) {
			const allIds = (this.capabilities[module] ?? []).map(c => c.id)
			const current = this.selectedPermissions[module] ?? []
			this.selectedPermissions = {
				...this.selectedPermissions,
				[module]: current.length === allIds.length ? [] : [...allIds],
			}
		},

		selectRole(role) {
			if (!role || !this.capabilities) return
			this.selectedRole = role

			const next = Object.fromEntries(
				Object.keys(this.capabilities).map(module => [module, []])
			)

			if (role.capabilities) {
				role.capabilities.forEach(roleCap => {
					const entry = Object.entries(this.capabilities).find(
						([, caps]) => caps.some(c => c.id === roleCap.id)
					)
					if (entry) {
						const [module] = entry
						next[module] = [...next[module], roleCap.id]
					}
				})
			}

			this.selectedPermissions = next
		},

		async createRole({ name, label }) {
			this.errors = {}
			this.loading.create = true
			try {
				const response = await axios.post('/api/roles', { name, label, capabilities: [] })
				const newRole = response.data.data
				this.roles.push(newRole)
				this.selectRole(newRole)
				return { success: true }
			} catch (err) {
				if (err.response) {
					if (err.response.status === 422) {
						this.errors = err.response.data.errors ?? {}
						// Flatten all validation messages into a single array
						const messages = Object.values(this.errors).flat()
						return { success: false, messages }
					}
					const message = err.response.data.message || 'Forbidden'
					this.errors = { general: message }
					return { success: false, messages: [message] }
				}
				this.errors = { general: 'Network error' }
				return { success: false, messages: ['Network error. Please try again.'] }
			} finally {
				this.loading.create = false
			}
		},

		async saveChanges() {
			if (!this.selectedRole) return
			this.loading.save = true
			try {
				const capabilityIds = this.selectedCapabilityIds
				await axios.put(`/api/roles/${this.selectedRole.id}`, {
					name: this.selectedRole.name,
					label: this.selectedRole.label,
					capabilities: capabilityIds,
				})

				const allCaps = Object.values(this.capabilities).flat()
				const updatedCaps = allCaps.filter(c => capabilityIds.includes(c.id))
				this.selectedRole = { ...this.selectedRole, capabilities: updatedCaps }

				const idx = this.roles.findIndex(r => r.id === this.selectedRole.id)
				if (idx > -1) {
					this.roles = [
						...this.roles.slice(0, idx),
						{ ...this.roles[idx], capabilities: updatedCaps },
						...this.roles.slice(idx + 1),
					]
				}

				return { success: true }
			} catch (err) {
				console.error('[RoleStore] saveChanges:', err)
				if (err.response?.status === 422) {
					const messages = Object.values(err.response.data.errors ?? {}).flat()
					return { success: false, messages }
				}
				const message = err.response?.data?.message || 'Failed to save changes.'
				return { success: false, messages: [message] }
			} finally {
				this.loading.save = false
			}
		},

		async deleteRole() {
			if (!this.selectedRole) return
			this.loading.delete = true
			try {
				await axios.delete(`/api/roles/${this.selectedRole.id}`)
				this.roles = this.roles.filter(r => r.id !== this.selectedRole.id)
				this.selectedRole = this.roles[0] ?? null
				if (this.selectedRole) this.selectRole(this.selectedRole)
				return { success: true }
			} catch (err) {
				console.error('[RoleStore] deleteRole:', err)
				const message = err.response?.data?.message || 'Failed to delete role.'
				return { success: false, messages: [message] }
			} finally {
				this.loading.delete = false
			}
		},
	},
})