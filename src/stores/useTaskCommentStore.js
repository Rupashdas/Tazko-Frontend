import { defineStore } from 'pinia'
import axios from '@/axios'

export const useTaskCommentStore = defineStore('taskComments', {
	state: () => ({
		comments: [],
		loading: false,
		saving: false,
	}),

	actions: {
		async fetchComments(projectId, taskId) {
			this.loading = true
			try {
				const { data } = await axios.get(`/api/projects/${projectId}/tasks/${taskId}/comments`)
				this.comments = data.data ?? []
			} catch (err) {
				console.error('[TaskCommentStore] fetchComments:', err)
				this.comments = []
			} finally {
				this.loading = false
			}
		},

		async createComment(projectId, taskId, body) {
			this.saving = true
			try {
				const { data } = await axios.post(`/api/projects/${projectId}/tasks/${taskId}/comments`, { body })
				this.comments.push(data.data)
				return { success: true, comment: data.data }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to post comment.',
				}
			} finally {
				this.saving = false
			}
		},

		async updateComment(projectId, taskId, commentId, body) {
			this.saving = true
			try {
				const { data } = await axios.patch(
					`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
					{ body }
				)
				this.comments = this.comments.map(c => c.id === commentId ? data.data : c)
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to update comment.',
				}
			} finally {
				this.saving = false
			}
		},

		async deleteComment(projectId, taskId, commentId) {
			try {
				await axios.delete(`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`)
				this.comments = this.comments.filter(c => c.id !== commentId)
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete comment.',
				}
			}
		},

		_patchComment(commentId, patch) {
			const idx = this.comments.findIndex(c => c.id === commentId)
			if (idx === -1) return
			this.comments = [
				...this.comments.slice(0, idx),
				{ ...this.comments[idx], ...patch },
				...this.comments.slice(idx + 1),
			]
		},

		async toggleLike(projectId, taskId, commentId) {
			const original = this.comments.find(c => c.id === commentId)
			if (!original) return

			const wasLiked = original.liked_by_me
			const originalCount = original.likes_count ?? 0

			this._patchComment(commentId, {
				liked_by_me: !wasLiked,
				likes_count: wasLiked ? Math.max(0, originalCount - 1) : originalCount + 1,
			})

			try {
				const { data } = await axios.post(
					`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}/like`
				)
				this._patchComment(commentId, {
					liked_by_me: data.liked,
					likes_count: data.likes_count,
				})
			} catch {
				this._patchComment(commentId, {
					liked_by_me: wasLiked,
					likes_count: originalCount,
				})
			}
		},

		clearComments() {
			this.comments = []
			this.loading = false
			this.saving = false
		},
	},
})
