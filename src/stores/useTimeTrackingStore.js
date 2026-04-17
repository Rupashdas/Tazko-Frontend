import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MOCK_USERS = [
	{ id: 1, name: 'Alex Chen',    initials: 'AC', color: '#6c63ff' },
	{ id: 2, name: 'Sarah Kim',   initials: 'SK', color: '#ec4899' },
	{ id: 3, name: 'Mike Torres', initials: 'MT', color: '#f59e0b' },
	{ id: 4, name: 'Emma Wilson', initials: 'EW', color: '#10b981' },
]

const MOCK_PROJECTS = [
	{ id: 1, name: 'Tazko App',      color: '#6c63ff' },
	{ id: 2, name: 'Brand Refresh',  color: '#ec4899' },
	{ id: 3, name: 'API Migration',  color: '#f59e0b' },
]

const MOCK_TASKS = [
	{ id: 101, title: 'Dashboard UI implementation', project_id: 1, status: 'In Progress', priority: 'High' },
	{ id: 102, title: 'API endpoint documentation',   project_id: 1, status: 'Todo',        priority: 'Medium' },
	{ id: 103, title: 'User authentication flow',      project_id: 2, status: 'Review',       priority: 'High' },
	{ id: 104, title: 'Database schema review',         project_id: 3, status: 'Done',         priority: 'Urgent' },
]

const today = new Date()
const fmt   = (d) => d.toISOString().split('T')[0]

// Generate last 7 days of entries
const makeEntries = () => {
	const entries = []
	const descriptions = [
		'Working on dashboard components',
		'Code review and feedback',
		'Bug fixes and testing',
		'Feature implementation',
		'Documentation updates',
		'Team meeting and sync',
		'Performance optimization',
	]
	const billable = [true, false]

	for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
		const date = new Date(today)
		date.setDate(date.getDate() - dayOffset)
		const numEntries = 2 + Math.floor(Math.random() * 3)

		for (let i = 0; i < numEntries; i++) {
			const startHour = 9 + Math.floor(Math.random() * 4)
			const duration  = 0.5 + Math.floor(Math.random() * 5) * 0.5
			const project   = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)]
			const task      = MOCK_TASKS.find(t => t.project_id === project.id) || MOCK_TASKS[0]

			entries.push({
				id: entries.length + 1,
				user_id: 1,
				project_id: project.id,
				project_name: project.name,
				project_color: project.color,
				task_id: task.id,
				task_title: task.title,
				date: fmt(date),
				start_time: `${String(startHour).padStart(2, '0')}:00`,
				end_time: `${String(startHour + Math.floor(duration)).padStart(2, '0')}:${duration % 1 !== 0 ? '30' : '00'}`,
				duration_hours: duration,
				description: descriptions[Math.floor(Math.random() * descriptions.length)],
				billable: billable[Math.floor(Math.random() * billable.length)],
				is_manual: Math.random() > 0.6,
			})
		}
	}
	return entries
}

const makeWeeklyData = () => {
	const weeks = []
	for (let w = 3; w >= 0; w--) {
		const weekStart = new Date(today)
		weekStart.setDate(weekStart.getDate() - (w * 7) - today.getDay())
		const days = []
		let total = 0
		for (let d = 0; d < 7; d++) {
			const day = new Date(weekStart)
			day.setDate(day.getDate() + d)
			const hours = 4 + Math.random() * 6
			total += hours
			days.push({ date: fmt(day), hours: Math.round(hours * 10) / 10 })
		}
		weeks.push({ label: `Week of ${fmt(weekStart)}`, days, total: Math.round(total * 10) / 10 })
	}
	return weeks
}

export const useTimeTrackingStore = defineStore('time-tracking', () => {
	// ── State ──────────────────────────────────────────────────
	const entries        = ref(makeEntries())
	const weeklyData     = ref(makeWeeklyData())
	const activeTimer    = ref(null) // { task_id, task_title, project_name, started_at }
	const loading        = ref(false)
	const filterDateFrom = ref('')
	const filterDateTo   = ref('')
	const filterProject  = ref('')
	const filterUser     = ref('')

	// ── Getters ──────────────────────────────────────────────
	const todayTotal = computed(() => {
		const todayStr = fmt(new Date())
		return entries.value
			.filter(e => e.date === todayStr)
			.reduce((sum, e) => sum + e.duration_hours, 0)
	})

	const weekTotal = computed(() => {
		const weekStart = new Date(today)
		weekStart.setDate(today.getDate() - today.getDay())
		const weekStr = fmt(weekStart)
		return entries.value
			.filter(e => e.date >= weekStr)
			.reduce((sum, e) => sum + e.duration_hours, 0)
	})

	const filteredEntries = computed(() => {
		return entries.value.filter(e => {
			if (filterDateFrom.value && e.date < filterDateFrom.value) return false
			if (filterDateTo.value   && e.date > filterDateTo.value)   return false
			if (filterProject.value && e.project_id !== filterProject.value) return false
			if (filterUser.value     && e.user_id !== parseInt(filterUser.value)) return false
			return true
		})
	})

	const totalBillable = computed(() =>
		entries.value.filter(e => e.billable).reduce((sum, e) => sum + e.duration_hours, 0))

	const totalNonBillable = computed(() =>
		entries.value.filter(e => !e.billable).reduce((sum, e) => sum + e.duration_hours, 0))

	const projectHours = computed(() => {
		const map = {}
		entries.value.forEach(e => {
			if (!map[e.project_name]) map[e.project_name] = { name: e.project_name, color: e.project_color, hours: 0 }
			map[e.project_name].hours += e.duration_hours
		})
		return Object.values(map).sort((a, b) => b.hours - a.hours)
	})

	// ── Actions ───────────────────────────────────────────────
	function startTimer(taskId, taskTitle, projectName) {
		activeTimer.value = {
			task_id: taskId,
			task_title: taskTitle,
			project_name: projectName,
			started_at: Date.now(),
		}
	}

	function stopTimer() {
		if (!activeTimer.value) return
		const elapsed = (Date.now() - activeTimer.value.started_at) / 3_600_000
		const now = new Date()
		const dateStr = fmt(now)
		const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

		entries.value.unshift({
			id: entries.value.length + 1,
			user_id: 1,
			project_id: 1,
			project_name: activeTimer.value.project_name,
			project_color: '#6c63ff',
			task_id: activeTimer.value.task_id,
			task_title: activeTimer.value.task_title,
			date: dateStr,
			start_time: timeStr,
			end_time: timeStr,
			duration_hours: Math.round(elapsed * 100) / 100,
			description: 'Timer session',
			billable: true,
			is_manual: false,
		})
		activeTimer.value = null
	}

	function addEntry(entry) {
		entries.value.unshift({
			...entry,
			id: entries.value.length + 1,
			user_id: 1,
		})
	}

	function updateEntry(id, updates) {
		const idx = entries.value.findIndex(e => e.id === id)
		if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...updates }
	}

	function deleteEntry(id) {
		entries.value = entries.value.filter(e => e.id !== id)
	}

	return {
		entries,
		weeklyData,
		activeTimer,
		loading,
		filterDateFrom,
		filterDateTo,
		filterProject,
		filterUser,
		todayTotal,
		weekTotal,
		filteredEntries,
		totalBillable,
		totalNonBillable,
		projectHours,
		startTimer,
		stopTimer,
		addEntry,
		updateEntry,
		deleteEntry,
	}
})