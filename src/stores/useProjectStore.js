import { defineStore } from 'pinia'
import axios from '@/axios'

export const useProjectStore = defineStore('projects', {
	state: () => ({
		projects: [],
		loading: false,
		saving: false,
		meta: {
			current_page: 0,
			last_page: 1,
			per_page: 6,
			total: 0,
			has_more: false,
			active_count: 0,
			completed_count: 0,
			avg_progress: 0,
		},
		filters: {
			search: '',
			status: '',
			priority: '',
		},

		// ── Single project (detail view) ─────────────────────────
		currentProject: null,
		loadingProject: false,
		projectError: null,

		// ── Tasks (for current project) ───────────────────────
		tasks: [],
		loadingTasks: false,

		// ── Archived ──────────────────────────────────────────────
		archived: [],
		archivedLoading: false,
		archivedMeta: {
			current_page: 0,
			last_page: 1,
			per_page: 6,
			total: 0,
			has_more: false,
			completed: 0,
			incomplete: 0,
		},
		archivedSearch: '',
	}),

	actions: {
		async reorderTasks(projectId, taskOrders) {
			// taskOrders: [{id, sort_order}]
			try {
				await axios.post(`/api/projects/${projectId}/tasks/reorder`, { tasks: taskOrders })
				taskOrders.forEach(({ id, sort_order }) => {
					const task = this.tasks.find(t => t.id === id)
					if (task) task.sort_order = sort_order
				})
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to reorder tasks.',
				}
			}
		},

		async updateTask(projectId, taskId, payload) {
			try {
				const { data } = await axios.patch(`/api/projects/${projectId}/tasks/${taskId}`, payload)
				this._replaceTask(data.data)
				if (data.data.project?.members) {
					this._mergeProjectMembers(projectId, data.data.project.members)
				}
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to update task.',
				}
			}
		},

		/**
		 * Merge an updated task (from any source, e.g. taskDetailStore) into
		 * the board's tasks array so the kanban view stays in sync with the
		 * detail view. Safe to call even if the task isn't currently in the
		 * array (e.g. different project open).
		 */
		_replaceTask(raw) {
			if (!raw?.id) return false
			const normalized = { ...raw, due: raw.due_date ?? null }
			const idx = this.tasks.findIndex(t => t.id === raw.id)
			if (idx !== -1) {
				this.tasks.splice(idx, 1, normalized)
				return true
			}
			// Returning false lets callers decide whether to refetch — e.g.
			// the kanban board may need a full reload if the task came from
			// a different project than the one currently open.
			return false
		},

		async deleteTask(projectId, taskId) {
			try {
				await axios.delete(`/api/projects/${projectId}/tasks/${taskId}`)
				this.tasks = this.tasks.filter(t => t.id !== taskId)
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete task.',
				}
			}
		},

		async createTask(projectId, payload) {
			try {
				const { data } = await axios.post(`/api/projects/${projectId}/tasks`, payload)
				const task = { ...data.data, due: data.data.due_date ?? null }
				this.tasks.push(task)
				if (data.data.project?.members) {
					this._mergeProjectMembers(projectId, data.data.project.members)
				}
				return { success: true, task }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to create task.',
					errors: err.response?.data?.errors ?? {},
				}
			}
		},

		async fetchTasks(projectId) {
			this.loadingTasks = true
			try {
				const { data } = await axios.get(`/api/projects/${projectId}/tasks`)
				// Normalize due_date → due so the board template stays consistent
				this.tasks = (data.data ?? []).map(t => ({ ...t, due: t.due_date ?? null }))
			} catch (err) {
				console.error('[ProjectStore] fetchTasks:', err)
				this.tasks = []
			} finally {
				this.loadingTasks = false
			}
		},

		async fetchProject(id) {
			this.loadingProject = true
			this.projectError = null
			this.currentProject = null
			// Clear stale tasks immediately so the kanban board doesn't flash
			// a previous project's tasks while the new project loads.
			this.tasks = []
			try {
				const { data } = await axios.get(`/api/projects/${id}`)
				this.currentProject = data.data
			} catch (err) {
				const status = err.response?.status
				if (status === 404) {
					this.projectError = 'Project not found.'
				} else if (status === 403) {
					this.projectError = err.response?.data?.message ?? 'You do not have access to this project.'
				} else {
					this.projectError = 'Something went wrong. Please try again.'
				}
			} finally {
				this.loadingProject = false
			}
		},

		/**
		 * Reset pagination and project list, then fetch page 1.
		 * Call this whenever a filter or search value changes.
		 */
		async reset() {
			this.projects = []
			this.meta.current_page = 0
			this.meta.has_more = true
			await this.fetchNextPage()
		},

		/**
		 * Fetch the next page and append results to this.projects.
		 * Used by the Intersection Observer for infinite scroll.
		 */
		async createProject(payload) {
			this.saving = true
			try {
				const { data } = await axios.post('/api/projects', payload)
				return { success: true, message: data.message, project: data.data }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to create project.',
					errors: err.response?.data?.errors ?? {},
				}
			} finally {
				this.saving = false
			}
		},

		async updateProject(projectId, payload) {
			this.saving = true

			// structuredClone handles edge cases (Date objects, undefined,
			// nested arrays of nulls) that the JSON round-trip silently
			// corrupts. Falls back to null when there's nothing to snapshot.
			const snapshot = this.currentProject?.id === projectId
				? structuredClone(this.currentProject)
				: null

			if (snapshot) Object.assign(this.currentProject, payload)

			try {
				const { data } = await axios.put(`/api/projects/${projectId}`, payload)
				const idx = this.projects.findIndex(p => p.id === projectId)
				if (idx !== -1) this.projects[idx] = data.data
				if (this.currentProject?.id === projectId) this.currentProject = data.data
				return { success: true, message: data.message, project: data.data }
			} catch (err) {
				if (snapshot && this.currentProject?.id === projectId) {
					this.currentProject = snapshot
				}
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to update project.',
					errors: err.response?.data?.errors ?? {},
				}
			} finally {
				this.saving = false
			}
		},

		async deleteProject(projectId) {
			try {
				const project = this.projects.find(p => p.id === projectId)
				const { data } = await axios.delete(`/api/projects/${projectId}`)
				this.projects = this.projects.filter(p => p.id !== projectId)
				this.meta.total = Math.max(0, this.meta.total - 1)
				this._decrementStatFor(project)
				return { success: true, message: data.message }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete project.',
				}
			}
		},

		async archiveProject(projectId) {
			try {
				const project = this.projects.find(p => p.id === projectId)
				const { data } = await axios.patch(`/api/projects/${projectId}/archive`)
				this.projects = this.projects.filter(p => p.id !== projectId)
				this.meta.total = Math.max(0, this.meta.total - 1)
				this._decrementStatFor(project)
				return { success: true, message: data.message }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to archive project.',
				}
			}
		},

		/** Update active-project stat counters after a project is removed. */
		_decrementStatFor(project) {
			if (!project) return
			if (project.status === 'In Progress') {
				this.meta.active_count = Math.max(0, this.meta.active_count - 1)
			} else if (project.status === 'Completed') {
				this.meta.completed_count = Math.max(0, this.meta.completed_count - 1)
			}
			// Recalculate avg_progress from remaining projects
			const remaining = this.projects
			if (remaining.length === 0) {
				this.meta.avg_progress = 0
			} else {
				const sum = remaining.reduce((acc, p) => acc + (p.progress ?? 0), 0)
				this.meta.avg_progress = Math.round(sum / remaining.length)
			}
		},

		// ── Archived actions ──────────────────────────────────────

		resetArchived() {
			this.archived = []
			this.archivedMeta.current_page = 0
			this.archivedMeta.has_more = true
		},

		async fetchNextArchivedPage() {
			if (this.archivedLoading || !this.archivedMeta.has_more) return
			this.archivedLoading = true
			try {
				const params = {
					page: this.archivedMeta.current_page + 1,
					per_page: this.archivedMeta.per_page,
				}
				if (this.archivedSearch) params.search = this.archivedSearch

				const { data } = await axios.get('/api/projects/archived', { params })
				this.archived.push(...(data.data ?? []))
				this.archivedMeta = data.meta
			} catch (err) {
				console.error('[ProjectStore] fetchNextArchivedPage:', err)
			} finally {
				this.archivedLoading = false
			}
		},

		async restoreProject(projectId) {
			try {
				const project = this.archived.find(p => p.id === projectId)
				const { data } = await axios.patch(`/api/projects/${projectId}/restore`)
				this.archived = this.archived.filter(p => p.id !== projectId)
				this.archivedMeta.total = Math.max(0, this.archivedMeta.total - 1)
				if (project?.status === 'Completed') {
					this.archivedMeta.completed = Math.max(0, this.archivedMeta.completed - 1)
				} else {
					this.archivedMeta.incomplete = Math.max(0, this.archivedMeta.incomplete - 1)
				}
				return { success: true, message: data.message }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to restore project.',
				}
			}
		},

		async removeMember(projectId, userId) {
			try {
				await axios.delete(`/api/projects/${projectId}/members/${userId}`)
				if (this.currentProject?.id === projectId) {
					this.currentProject.members = this.currentProject.members.filter(m => m.id !== userId)
				}
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to remove member.',
				}
			}
		},

		async addMembers(projectId, members) {
			try {
				const { data } = await axios.post(`/api/projects/${projectId}/members`, {
					members: members.map(m => ({ user_id: m.id, role: m.role || null })),
				})
				if (this.currentProject?.id === projectId) {
					this.currentProject.members = data.members
				}
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to add members.',
				}
			}
		},

		async deleteArchivedProject(projectId) {
			try {
				const project = this.archived.find(p => p.id === projectId)
				const { data } = await axios.delete(`/api/projects/${projectId}`)
				this.archived = this.archived.filter(p => p.id !== projectId)
				this.archivedMeta.total = Math.max(0, this.archivedMeta.total - 1)
				if (project?.status === 'Completed') {
					this.archivedMeta.completed = Math.max(0, this.archivedMeta.completed - 1)
				} else {
					this.archivedMeta.incomplete = Math.max(0, this.archivedMeta.incomplete - 1)
				}
				return { success: true, message: data.message }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete project.',
				}
			}
		},

		/**
		 * Merge a fresh member list (from a task API response) into currentProject.members.
		 * Does nothing if currentProject is null or the project ID doesn't match.
		 */
		_mergeProjectMembers(projectId, members) {
			if (!this.currentProject || this.currentProject.id !== projectId || !Array.isArray(members)) return
			this.currentProject.members = members
		},

		async fetchNextPage() {
			if (this.loading || !this.meta.has_more) return

			this.loading = true
			try {
				const params = {
					page: this.meta.current_page + 1,
					per_page: this.meta.per_page,
				}

				if (this.filters.search) params.search = this.filters.search
				if (this.filters.status) params.status = this.filters.status
				if (this.filters.priority) params.priority = this.filters.priority

				const { data } = await axios.get('/api/projects', { params })

				this.projects.push(...(data.data ?? []))
				this.meta = data.meta
			} catch (err) {
				console.error('[ProjectStore] fetchNextPage:', err)
			} finally {
				this.loading = false
			}
		},
	},
})
