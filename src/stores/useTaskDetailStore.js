import { defineStore } from 'pinia'
import axios from '@/axios'
import { useProjectStore } from '@/stores/useProjectStore'
import { paletteColor } from '@/utils/paletteColor'

const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Deep clone helper for snapshots (simple JSON-safe data only).
const clone = (v) => JSON.parse(JSON.stringify(v))

// Normalize the API task payload to match the shape child components expect:
//   due_date  → due
//   is_done   → done (on each subtask)
//   assignees → + initials + color
//   project_id lifted to top level
const normalizeTask = (raw) => ({
	...raw,
	project_id: raw.project?.id ?? null,
	due: raw.due_date ?? null,
	assignees: (raw.assignees ?? []).map(a => ({
		...a,
		initials: getInitials(a.name),
		color: paletteColor(a.palette),
	})),
	subtasks: (raw.subtasks ?? []).map(s => ({
		...s,
		done: !!s.is_done,
	})),
	labels: raw.labels ?? [],
})

export const useTaskDetailStore = defineStore('taskDetail', {
	state: () => ({
		task: null,
		loading: false,
		saving: false,
		error: null,

		// Project-wide label palette
		labels: [],
		labelsLoading: false,
	}),

	actions: {
		// ───────────────────────────────────────────────────────
		// Read
		// ───────────────────────────────────────────────────────
		async fetchTask(projectId, taskId) {
			this.loading = true
			this.error = null
			try {
				const { data } = await axios.get(`/api/projects/${projectId}/tasks/${taskId}`)
				this.task = normalizeTask(data.data)
				return { success: true }
			} catch (err) {
				this.error = err.response?.data?.message ?? 'Failed to load task.'
				this.task = null
				return { success: false, message: this.error }
			} finally {
				this.loading = false
			}
		},

		async fetchLabels(projectId) {
			this.labelsLoading = true
			try {
				const { data } = await axios.get(`/api/projects/${projectId}/labels`)
				this.labels = data.data ?? []
			} catch (err) {
				console.error('[TaskDetailStore] fetchLabels:', err)
				this.labels = []
			} finally {
				this.labelsLoading = false
			}
		},

		// ───────────────────────────────────────────────────────
		// Task update — optimistic
		//
		// `payload`   → fields sent to the API (status, priority, due_date, …)
		// `localPatch`→ object merged into `this.task` for the optimistic UI update.
		//               The caller builds this because only it can resolve
		//               `assignee_ids` / `label_ids` into full objects with
		//               avatar colors etc. When omitted, `payload` is used directly
		//               (fine for scalar fields like title/status/priority).
		// ───────────────────────────────────────────────────────
		async updateTask(projectId, taskId, payload, localPatch = null) {
			if (!this.task) return { success: false, message: 'Task not loaded.' }

			const snapshot = clone(this.task)
			const patch    = localPatch ?? payload

			// Optimistic mutation
			this.task = { ...this.task, ...patch }
			// Mirror due_date → due so the sidebar countdown updates immediately.
			if ('due_date' in patch) this.task.due = patch.due_date

			this.saving = true
			try {
				const { data } = await axios.patch(
					`/api/projects/${projectId}/tasks/${taskId}`,
					payload
				)
				// Reconcile with server truth (keeps extras like updated_at in sync).
				this.task = normalizeTask(data.data)
				// Keep the board/list view in the projectStore in sync.
				useProjectStore()._replaceTask(data.data)
				return { success: true }
			} catch (err) {
				this.task = snapshot
				return {
					success: false,
					status:  err.response?.status,
					message: err.response?.data?.message ?? 'Failed to update task.',
				}
			} finally {
				this.saving = false
			}
		},

		async deleteTask(projectId, taskId) {
			// Non-optimistic on purpose — we navigate away on success, so there's
			// nothing local to revert to. The confirm modal already gates this.
			try {
				await axios.delete(`/api/projects/${projectId}/tasks/${taskId}`)
				this.task = null
				// Remove from the board/list view too.
				const projectStore = useProjectStore()
				projectStore.tasks = projectStore.tasks.filter(t => t.id !== taskId)
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete task.',
				}
			}
		},

		// ───────────────────────────────────────────────────────
		// Labels — optimistic (for create; toggle goes through updateTask)
		// ───────────────────────────────────────────────────────
		async createLabel(projectId, { name, color }) {
			// Two-step (create label + attach to task) so we do NOT push the
			// temp label onto the task optimistically — the caller handles that
			// in a second updateTask() call once we have the real id.
			try {
				const { data } = await axios.post(`/api/projects/${projectId}/labels`, { name, color })
				this.labels.push(data.data)
				return { success: true, label: data.data }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to create label.',
				}
			}
		},

		// ───────────────────────────────────────────────────────
		// Subtasks — all optimistic
		// ───────────────────────────────────────────────────────
		async addSubtask(projectId, taskId, title) {
			if (!this.task) return { success: false, message: 'Task not loaded.' }

			// Temp id (negative so it never collides with a real one).
			const tempId = -Date.now()
			const temp = {
				id: tempId,
				title,
				done: false,
				is_done: false,
				sort_order: (this.task.subtasks?.length ?? 0) + 1,
				_pending: true,
			}
			this.task.subtasks = [...(this.task.subtasks ?? []), temp]

			try {
				const { data } = await axios.post(
					`/api/projects/${projectId}/tasks/${taskId}/subtasks`,
					{ title }
				)
				// Swap temp → real
				this.task.subtasks = this.task.subtasks.map(s =>
					s.id === tempId ? { ...data.data, done: !!data.data.is_done } : s
				)
				return { success: true }
			} catch (err) {
				// Drop temp
				this.task.subtasks = this.task.subtasks.filter(s => s.id !== tempId)
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to add subtask.',
				}
			}
		},

		async updateSubtask(projectId, taskId, subtaskId, payload) {
			if (!this.task?.subtasks) return { success: false }

			const idx = this.task.subtasks.findIndex(s => s.id === subtaskId)
			if (idx === -1) return { success: false, message: 'Subtask not found.' }

			const snapshot = { ...this.task.subtasks[idx] }
			// Optimistic: apply whichever keys are in payload, plus mirror is_done → done.
			const next = { ...snapshot, ...payload }
			if ('is_done' in payload) next.done = !!payload.is_done
			this.task.subtasks = this.task.subtasks.map((s, i) => i === idx ? next : s)

			try {
				const { data } = await axios.patch(
					`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
					payload
				)
				// Reconcile
				this.task.subtasks = this.task.subtasks.map((s, i) =>
					i === idx ? { ...data.data, done: !!data.data.is_done } : s
				)
				return { success: true }
			} catch (err) {
				this.task.subtasks = this.task.subtasks.map((s, i) => i === idx ? snapshot : s)
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to update subtask.',
				}
			}
		},

		/**
		 * POST /subtasks/reorder
		 *
		 * orderedIds is the array of subtask ids in their new order.
		 * Optimistic: reshuffles `task.subtasks` immediately (and updates
		 * sort_order on each). On failure, restores the snapshot.
		 */
		async reorderSubtasks(projectId, taskId, orderedIds) {
			if (!this.task?.subtasks) return { success: false }

			const snapshot = clone(this.task.subtasks)
			const byId = Object.fromEntries(this.task.subtasks.map(s => [s.id, s]))

			// Optimistic re-order
			this.task.subtasks = orderedIds
				.map((id, i) => byId[id] ? { ...byId[id], sort_order: i + 1 } : null)
				.filter(Boolean)

			try {
				await axios.post(
					`/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`,
					{
						subtasks: orderedIds.map((id, i) => ({ id, sort_order: i + 1 })),
					}
				)
				return { success: true }
			} catch (err) {
				this.task.subtasks = snapshot
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to reorder subtasks.',
				}
			}
		},

		async deleteSubtask(projectId, taskId, subtaskId) {
			if (!this.task?.subtasks) return { success: false }

			const idx = this.task.subtasks.findIndex(s => s.id === subtaskId)
			if (idx === -1) return { success: false }

			const removed = this.task.subtasks[idx]
			this.task.subtasks = this.task.subtasks.filter(s => s.id !== subtaskId)

			try {
				await axios.delete(
					`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`
				)
				return { success: true }
			} catch (err) {
				// Restore at original position
				this.task.subtasks = [
					...this.task.subtasks.slice(0, idx),
					removed,
					...this.task.subtasks.slice(idx),
				]
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete subtask.',
				}
			}
		},

		clear() {
			this.task = null
			this.loading = false
			this.saving = false
			this.error = null
			this.labels = []
			this.labelsLoading = false
		},
	},
})
