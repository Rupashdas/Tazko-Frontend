import { defineStore } from 'pinia'
import axios from '@/axios'

export const useCommentStore = defineStore('comments', {
	state: () => ({
		comments: [],
		loading: false,
		saving: false,
	}),

	actions: {
		async fetchComments(projectId) {
			this.loading = true
			try {
				const { data } = await axios.get(`/api/projects/${projectId}/comments`)
				this.comments = data.data ?? []
			} catch (err) {
				console.error('[CommentStore] fetchComments:', err)
				this.comments = []
			} finally {
				this.loading = false
			}
		},

		async createComment(projectId, body) {
			this.saving = true
			try {
				const { data } = await axios.post(`/api/projects/${projectId}/comments`, { body })
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

		async updateComment(projectId, commentId, body) {
			this.saving = true
			try {
				const { data } = await axios.patch(`/api/projects/${projectId}/comments/${commentId}`, { body })
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

		async deleteComment(projectId, commentId) {
			try {
				await axios.delete(`/api/projects/${projectId}/comments/${commentId}`)
				this.comments = this.comments.filter(c => c.id !== commentId)
				return { success: true }
			} catch (err) {
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to delete comment.',
				}
			}
		},

		async toggleLike(projectId, commentId) {
			// Optimistic update
			const comment = this.comments.find(c => c.id === commentId)
			if (!comment) return

			const wasLiked = comment.liked_by_me
			comment.liked_by_me = !wasLiked
			comment.likes_count = wasLiked
				? Math.max(0, (comment.likes_count ?? 0) - 1)
				: (comment.likes_count ?? 0) + 1

			try {
				const { data } = await axios.post(`/api/projects/${projectId}/comments/${commentId}/like`)
				comment.liked_by_me = data.liked
				comment.likes_count = data.likes_count
			} catch {
				// Revert on failure
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
