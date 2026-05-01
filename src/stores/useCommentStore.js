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

		async createComment(projectId, body, currentUser) {
			const tempId = `__tmp_${Date.now()}`
			this.comments.push({
				id: tempId,
				body,
				user: {
					id:      currentUser.id,
					name:    currentUser.name,
					avatar:  currentUser.avatar ?? null,
					palette: currentUser.palette ?? 'aurora',
				},
				created_at:  new Date().toISOString(),
				is_edited:   false,
				liked_by_me: false,
				likes_count: 0,
			})

			try {
				const { data } = await axios.post(`/api/projects/${projectId}/comments`, { body })
				const idx = this.comments.findIndex(c => c.id === tempId)
				if (idx !== -1) this.comments.splice(idx, 1, data.data)
				return { success: true, comment: data.data }
			} catch (err) {
				this.comments = this.comments.filter(c => c.id !== tempId)
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to post comment.',
				}
			}
		},

		async updateComment(projectId, commentId, body) {
			const original = this.comments.find(c => c.id === commentId)
			if (!original) return { success: false, message: 'Comment not found.' }

			this._patchComment(commentId, { body, is_edited: true })

			try {
				const { data } = await axios.patch(`/api/projects/${projectId}/comments/${commentId}`, { body })
				this._patchComment(commentId, data.data)
				return { success: true }
			} catch (err) {
				this._patchComment(commentId, { body: original.body, is_edited: original.is_edited })
				return {
					success: false,
					message: err.response?.data?.message ?? 'Failed to update comment.',
				}
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
