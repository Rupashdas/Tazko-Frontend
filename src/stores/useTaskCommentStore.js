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
				const idx = this.comments.findIndex(c => c.id === commentId)
				if (idx !== -1) this.comments[idx] = data.data
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

		async toggleLike(projectId, taskId, commentId) {
			const comment = this.comments.find(c => c.id === commentId)
			if (!comment) return

			const wasLiked = comment.liked_by_me
			comment.liked_by_me = !wasLiked
			comment.likes_count = wasLiked
				? Math.max(0, (comment.likes_count ?? 0) - 1)
				: (comment.likes_count ?? 0) + 1

			try {
				const { data } = await axios.post(
					`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}/like`
				)
				comment.liked_by_me = data.liked
				comment.likes_count = data.likes_count
			} catch {
				comment.liked_by_me = wasLiked
				comment.likes_count = wasLiked
					? (comment.likes_count ?? 0) + 1
					: Math.max(0, (comment.likes_count ?? 0) - 1)
			}
		},

		clearComments() {
			this.comments = []
			this.loading = false
			this.saving = false
		},
	},
})
