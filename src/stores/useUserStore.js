import { defineStore } from 'pinia'
import axios from '@/axios'
import { useRoleStore } from '@/stores/useRoleStore'

export const useUserStore = defineStore('users', {
	state: () => ({
		users: [],
		roles: [],
		invitations: [],
		loading: {
			page: false,
			save: false,
			delete: false,
			invite: false,
			resend: false,
			activate: false,
		},
		loaded: false,
	}),

	actions: {
		async init() {
			if (this.loaded) return
			this.loading.page = true
			try {
				const roleStore = useRoleStore()

				const [usersRes, invitationsRes] = await Promise.all([
					axios.get('/api/users'),
					axios.get('/api/invitations'),
					roleStore.init(),
				])

				this.users = usersRes.data.data ?? []
				this.roles = roleStore.roles
				this.invitations = invitationsRes.data.data ?? []

				this.loaded = true
			} catch (err) {
				console.error('[UserStore] init:', err)
			} finally {
				this.loading.page = false
			}
		},

		/*── Invitations ─────────────────────────────────────*/
		async fetchInvitations() {
			try {
				const { data } = await axios.get('/api/invitations')
				this.invitations = data.data ?? []
			} catch (err) {
				console.error('[UserStore] fetchInvitations:', err)
			}
		},

		async sendInvitation({ name, email, role_id }) {
			this.loading.invite = true
			try {
				const { data } = await axios.post('/api/invitations', { name, email, role_id })
				this.invitations.unshift(data.data)
				return { success: true, message: data.message }
			} catch (err) {
				const errors = err.response?.data?.errors ?? {}
				const message = err.response?.data?.message ?? 'Failed to send invitation.'
				return { success: false, message, errors }
			} finally {
				this.loading.invite = false
			}
		},

		async resendInvitation(invitationId) {
			this.loading.resend = true
			try {
				const { data } = await axios.post(`/api/invitations/${invitationId}/resend`)
				const idx = this.invitations.findIndex(i => i.id === invitationId)
				if (idx !== -1) this.invitations[idx] = data.data
				return { success: true, message: data.message }
			} catch (err) {
				return { success: false, message: err.response?.data?.message ?? 'Failed to resend.' }
			} finally {
				this.loading.resend = false
			}
		},

		async cancelInvitation(invitationId) {
			try {
				const { data } = await axios.delete(`/api/invitations/${invitationId}`)
				this.invitations = this.invitations.filter(i => i.id !== invitationId)
				return { success: true, message: data.message }
			} catch (err) {
				return { success: false, message: err.response?.data?.message ?? 'Failed to cancel.' }
			}
		},

		/*── Users ───────────────────────────────────────────*/

		async updateUser(userId, payload) {
			this.loading.save = true
			try {
				const { data } = await axios.put(`/api/users/${userId}`, payload)
				this._replaceUser(data.data)
				return { success: true, message: data.message }
			} catch (err) {
				const errors = err.response?.data?.errors ?? {}
				return { success: false, message: err.response?.data?.message ?? 'Failed to update user.', errors }
			} finally {
				this.loading.save = false
			}
		},

		async toggleActive(userId) {
			this.loading.activate = true
			try {
				const { data } = await axios.patch(`/api/users/${userId}/active`)
				this._replaceUser(data.data)
				return { success: true, message: data.message }
			} catch (err) {
				return { success: false, message: err.response?.data?.message ?? 'Failed to toggle activation.' }
			} finally {
				this.loading.activate = false
			}
		},

		async assignRole(userId, roleId) {
			this.loading.save = true
			try {
				const { data } = await axios.patch(`/api/users/${userId}/role`, { role_id: roleId })
				this._replaceUser(data.data)
				return { success: true, message: data.message }
			} catch (err) {
				return { success: false, message: err.response?.data?.message ?? 'Failed to assign role.' }
			} finally {
				this.loading.save = false
			}
		},

		async deleteUser(userId) {
			this.loading.delete = true
			try {
				const { data } = await axios.delete(`/api/users/${userId}`)
				this.users = this.users.filter(u => u.id !== userId)
				return { success: true, message: data.message }
			} catch (err) {
				return { success: false, message: err.response?.data?.message ?? 'Failed to delete user.' }
			} finally {
				this.loading.delete = false
			}
		},

		async reload() {
			this.loaded = false
			await this.init()
		},

		async refreshRoles() {
			try {
				const { data } = await axios.get('/api/roles')
				this.roles = data.data ?? []
			} catch (err) {
				console.error('[UserStore] refreshRoles:', err)
			}
		},

		_replaceUser(updated) {
			const idx = this.users.findIndex(u => u.id === updated.id)
			if (idx !== -1) this.users[idx] = updated
		},
	},
})