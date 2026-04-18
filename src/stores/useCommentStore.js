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

		_patchComment(commentId, patch) {
			const idx = this.comments.findIndex(c => c.id === commentId)
			if (idx === -1) return
			const next = typeof patch === 'function' ? patch(this.comments[idx]) : patch
			this.comments = [
				...this.comments.slice(0, idx),
				{ ...this.comments[idx], ...next },
				...this.comments.slice(idx + 1),
			]
		},

		async toggleLike(projectId, commentId) {
			const original = this.comments.find(c => c.id === commentId)
			if (!original) return

			const wasLiked = original.liked_by_me
			const originalCount = original.likes_count ?? 0

			// Optimistic
			this._patchComment(commentId, {
				liked_by_me: !wasLiked,
				likes_count: wasLiked ? Math.max(0, originalCount - 1) : originalCount + 1,
			})

			try {
				const { data } = await axios.post(`/api/projects/${projectId}/comments/${commentId}/like`)
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
