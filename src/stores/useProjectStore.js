import { defineStore } from 'pinia'
import axios from '@/axios'

export const useProjectStore = defineStore('projects', {
	state: () => ({
		projects: [],
		loading: false,
		meta: {
			current_page:    0,
			last_page:       1,
			per_page:        6,
			total:           0,
			has_more:        false,
			active_count:    0,
			completed_count: 0,
			avg_progress:    0,
		},
		filters: {
			search:   '',
			status:   '',
			priority: '',
		},
	}),

	actions: {
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
		async fetchNextPage() {
			if (this.loading || !this.meta.has_more) return

			this.loading = true
			try {
				const params = {
					page:     this.meta.current_page + 1,
					per_page: this.meta.per_page,
				}

				if (this.filters.search)   params.search   = this.filters.search
				if (this.filters.status)   params.status   = this.filters.status
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
