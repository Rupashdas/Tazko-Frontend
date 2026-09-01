<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiClock, BiPlayFill, BiStopFill, BiPlusCircle,
	BiCalendar3, BiCheckCircle, BiCash, BiTrash, BiPencil,
	BiFilter, BiChevronLeft, BiChevronRight, BiArrowLeftRight,
	BiLightningCharge, BiStopwatch, BiCalendarWeek, BiDash,
	BiDownload, BiX,
} from 'oh-vue-icons/icons'
import { useTimeTrackingStore } from '@/stores/useTimeTrackingStore'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

addIcons(
	BiClock, BiPlayFill, BiStopFill, BiPlusCircle,
	BiCalendar3, BiCheckCircle, BiCash, BiTrash, BiPencil,
	BiFilter, BiChevronLeft, BiChevronRight, BiArrowLeftRight,
	BiLightningCharge, BiStopwatch, BiCalendarWeek, BiDash,
	BiDownload, BiX,
)

const store = useTimeTrackingStore()

// ── State ──────────────────────────────────────────────────────
const elapsedSeconds = ref(0)
const timerInterval  = ref(null)
const showAddEntry   = ref(false)
const editingEntry   = ref(null)
const activeTab      = ref('timeline') // 'timeline' | 'report'
const selectedDate   = ref(new Date().toISOString().split('T')[0])

const newEntry = ref({
	project_id: 1,
	task_id: 101,
	task_title: 'Dashboard UI implementation',
	project_name: 'Tazko App',
	project_color: '#6c63ff',
	date: new Date().toISOString().split('T')[0],
	start_time: '09:00',
	end_time: '10:00',
	duration_hours: 1,
	description: '',
	billable: true,
})

// ── Date Navigation ─────────────────────────────────────────────
const viewDate = computed({
	get: () => new Date(selectedDate.value + 'T00:00:00'),
	set: (val) => { selectedDate.value = val.toISOString().split('T')[0] }
})

const formattedDate = computed(() => {
	return viewDate.value.toLocaleDateString('en-US', {
		weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
	})
})

const isToday = computed(() => selectedDate.value === new Date().toISOString().split('T')[0])

const prevDay = () => {
	const d = new Date(viewDate.value)
	d.setDate(d.getDate() - 1)
	viewDate.value = d
}

const nextDay = () => {
	const d = new Date(viewDate.value)
	d.setDate(d.getDate() + 1)
	viewDate.value = d
}

const goToToday = () => {
	viewDate.value = new Date()
}

// ── Computed ──────────────────────────────────────────────────────
const running     = computed(() => store.activeTimer !== null)
const displayTime = computed(() => {
	const s = elapsedSeconds.value
	const h = Math.floor(s / 3600)
	const m = Math.floor((s % 3600) / 60)
	const sec = s % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const selectedDateEntries = computed(() =>
	store.entries
		.filter(e => e.date === selectedDate.value)
		.sort((a, b) => a.start_time.localeCompare(b.start_time))
)

const dateTotal = computed(() =>
	selectedDateEntries.value.reduce((sum, e) => sum + e.duration_hours, 0)
)

// Group entries by hour for vertical timeline
const timelineGroups = computed(() => {
	const groups = []
	for (let h = 6; h <= 22; h++) {
		const hourEntries = selectedDateEntries.value.filter(e => {
			const startH = parseInt(e.start_time.split(':')[0])
			return startH === h
		})
		groups.push({ hour: h, label: h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`, entries: hourEntries })
	}
	return groups
})

// ── Timer Controls ────────────────────────────────────────────────
const startTimer = () => {
	store.startTimer(101, 'Dashboard UI implementation', 'Tazko App')
	elapsedSeconds.value = 0
	timerInterval.value = setInterval(() => { elapsedSeconds.value++ }, 1000)
}

const stopTimer = () => {
	clearInterval(timerInterval.value)
	timerInterval.value = null
	store.stopTimer()
	elapsedSeconds.value = 0
}

const quickStart = (taskId, taskTitle, projectName) => {
	clearInterval(timerInterval.value)
	store.startTimer(taskId, taskTitle, projectName)
	elapsedSeconds.value = 0
	timerInterval.value = setInterval(() => { elapsedSeconds.value++ }, 1000)
}

// ── Entry Management ─────────────────────────────────────────────
const openAddEntry = () => {
	editingEntry.value = null
	newEntry.value = {
		project_id: 1, task_id: 101,
		task_title: '', project_name: 'Tazko App', project_color: '#6c63ff',
		date: selectedDate.value,
		start_time: '09:00', end_time: '10:00',
		duration_hours: 1, description: '', billable: true,
	}
	showAddEntry.value = true
}

const saveEntry = () => {
	if (editingEntry.value) {
		store.updateEntry(editingEntry.value.id, { ...newEntry.value })
	} else {
		store.addEntry({ ...newEntry.value })
	}
	showAddEntry.value = false
}

const editEntry = (entry) => {
	editingEntry.value = entry
	newEntry.value = { ...entry }
	showAddEntry.value = true
}

const removeEntry = (id) => {
	store.deleteEntry(id)
}

// ── Filter ───────────────────────────────────────────────────────
const projectOptions = [
	{ label: 'All Projects', value: '' },
	{ label: 'Tazko App',    value: '1' },
	{ label: 'Brand Refresh', value: '2' },
	{ label: 'API Migration', value: '3' },
]

const recentTasks = [
	{ id: 101, title: 'Dashboard UI implementation', project: 'Tazko App', color: '#6c63ff', lastUsed: '2h ago' },
	{ id: 102, title: 'API endpoint documentation', project: 'Tazko App', color: '#6c63ff', lastUsed: 'Yesterday' },
	{ id: 103, title: 'User authentication flow', project: 'Brand Refresh', color: '#ec4899', lastUsed: '3 days ago' },
	{ id: 104, title: 'Database schema review', project: 'API Migration', color: '#f59e0b', lastUsed: '1 week ago' },
]

onMounted(() => {
	if (store.activeTimer) {
		elapsedSeconds.value = Math.floor((Date.now() - store.activeTimer.started_at) / 1000)
		timerInterval.value = setInterval(() => { elapsedSeconds.value++ }, 1000)
	}
})

onBeforeUnmount(() => {
	clearInterval(timerInterval.value)
})
</script>

<template>
	<div class="pb-20 min-h-screen bg-body">

		<!-- ── Top Bar ─────────────────────────────────── -->
		<div class="sticky top-0 z-40 bg-panel/90 backdrop-blur-md border-b border-heading/8 px-4 py-3">
			<div class="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
				<!-- Left: Title -->
				<div class="flex items-center gap-3 min-w-0">
					<div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-stopwatch" class="text-accent" scale="1.1" />
					</div>
					<div class="min-w-0">
						<h1 class="text-base font-semibold text-heading leading-tight truncate">Time Tracking</h1>
						<p class="text-xs text-text truncate">Track and manage your work hours</p>
					</div>
				</div>

				<!-- Center: Date Navigation -->
				<div class="flex items-center gap-1 order-3 lg:order-none w-full lg:w-auto">
					<button @click="prevDay" aria-label="Previous day"
						class="w-9 h-9 rounded-md flex items-center justify-center hover:bg-heading/5 text-text hover:text-heading transition-all duration-150 active:scale-95 shrink-0">
						<v-icon name="bi-chevron-left" scale="1" />
					</button>
					<button @click="goToToday"
						class="px-3 h-9 rounded-md flex items-center justify-center hover:bg-heading/5 text-text hover:text-heading transition-all duration-150 text-sm font-medium shrink-0"
						:class="isToday ? 'text-accent bg-accent/10' : ''">
						Today
					</button>
					<button @click="nextDay" aria-label="Next day"
						class="w-9 h-9 rounded-md flex items-center justify-center hover:bg-heading/5 text-text hover:text-heading transition-all duration-150 active:scale-95 shrink-0">
						<v-icon name="bi-chevron-right" scale="1" />
					</button>
					<div class="ml-2 flex-1 lg:flex-none min-w-[200px]">
						<AppDatePicker v-model="selectedDate" size="sm" />
					</div>
				</div>

				<!-- Right: Actions -->
				<div class="flex items-center gap-2 shrink-0">
					<button @click="openAddEntry" class="tazko-btn">
						<v-icon name="bi-plus-circle" scale="0.85" />
						Add Entry
					</button>
					<button class="tazko-btn-outline">
						<v-icon name="bi-download" scale="0.85" />
						<span class="hidden sm:inline">Export</span>
					</button>
				</div>
			</div>
		</div>

		<div class="max-w-screen-2xl mx-auto px-4 py-6">
			<!-- ── Stats Row ─────────────────────────────── -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
				<div class="card card-hover p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-stopwatch" class="text-accent" scale="1.2" />
					</div>
					<div class="min-w-0">
						<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ dateTotal.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text mt-1 font-medium truncate">{{ formattedDate.split(',')[0] }}</p>
					</div>
				</div>
				<div class="card card-hover p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-calendar-week" class="text-violet-600" scale="1.2" />
					</div>
					<div class="min-w-0">
						<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.weekTotal.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text mt-1 font-medium">This Week</p>
					</div>
				</div>
				<div class="card card-hover p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-cash" class="text-emerald-600" scale="1.2" />
					</div>
					<div class="min-w-0">
						<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.totalBillable.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text mt-1 font-medium">Billable</p>
					</div>
				</div>
				<div class="card card-hover p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-lightning-charge" class="text-amber-600" scale="1.2" />
					</div>
					<div class="min-w-0">
						<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.totalNonBillable.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text mt-1 font-medium">Non-Billable</p>
					</div>
				</div>
			</div>

			<!-- ── Main Grid ─────────────────────────────── -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

				<!-- LEFT: Timer + Timeline -->
				<div class="lg:col-span-8 flex flex-col gap-6">

					<!-- Timer Card -->
					<div class="card overflow-hidden">
						<div class="p-6 flex flex-col sm:flex-row items-center gap-6 timer-surface">
							<!-- Timer Display -->
							<div class="relative shrink-0">
								<div class="w-32 h-32 rounded-full border-2 border-heading/10 bg-panel flex items-center justify-center">
									<div class="text-center">
										<p class="text-2xl font-bold text-heading tracking-tight tabular-nums leading-none">
											{{ displayTime }}
										</p>
										<p class="text-xs text-text mt-2 font-medium uppercase tracking-wider">Elapsed</p>
									</div>
								</div>
								<div v-if="running"
									class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse ring-4 ring-red-500/20">
								</div>
							</div>

							<!-- Controls -->
							<div class="flex-1 text-center sm:text-left">
								<div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
									<button v-if="!running" @click="startTimer" class="tazko-btn">
										<v-icon name="bi-play-fill" scale="1" />
										Start Timer
									</button>
									<button v-else @click="stopTimer" class="tazko-btn-danger">
										<v-icon name="bi-stop-fill" scale="1" />
										Stop Timer
									</button>
								</div>
								<div v-if="store.activeTimer" class="mt-3">
									<p class="text-sm font-semibold text-accent">{{ store.activeTimer.task_title }}</p>
									<p class="text-xs text-text mt-0.5">{{ store.activeTimer.project_name }}</p>
								</div>
								<p v-else class="mt-3 text-sm text-text">Select a task or start the timer</p>
							</div>

							<!-- Total for day -->
							<div class="text-center sm:text-right shrink-0">
								<p class="text-2xl font-bold text-heading tabular-nums leading-none">{{ dateTotal.toFixed(1) }}h</p>
								<p class="text-xs text-text mt-1.5">Total on {{ isToday ? 'today' : 'this day' }}</p>
								<p class="text-xs text-text mt-0.5 tabular-nums">{{ selectedDateEntries.length }} entries</p>
							</div>
						</div>
					</div>

					<!-- Vertical Timeline -->
					<div class="card overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8 flex items-center justify-between gap-3">
							<div>
								<h2 class="section-title">Activity Timeline</h2>
								<p class="section-desc">Everything logged on this day</p>
							</div>
							<span class="badge badge-neutral shrink-0 tabular-nums">{{ selectedDateEntries.length }} entries</span>
						</div>

						<div v-if="selectedDateEntries.length" class="divide-y divide-heading/6">
							<!-- Timeline entries grouped by hour -->
							<div v-for="group in timelineGroups.filter(g => g.entries.length > 0)" :key="group.hour">
								<div class="px-5 py-2 bg-heading/3 border-b border-heading/6">
									<span class="text-xs font-semibold text-text uppercase tracking-wider">{{ group.label }}</span>
								</div>
								<div v-for="entry in group.entries" :key="entry.id"
									class="px-5 py-4 hover:bg-heading/3 transition-colors group">
									<div class="flex items-start gap-4">
										<!-- Project indicator -->
										<div class="shrink-0 mt-1.5">
											<div class="w-2.5 h-2.5 rounded-full" :style="{ background: entry.project_color }"></div>
										</div>

										<!-- Content -->
										<div class="flex-1 min-w-0">
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0">
													<p class="text-sm font-semibold text-heading truncate">{{ entry.task_title }}</p>
													<p class="text-xs text-text mt-1">{{ entry.project_name }} · {{ entry.description || 'No description' }}</p>
												</div>
												<div class="flex items-center gap-2 shrink-0">
													<span class="badge badge-neutral tabular-nums">
														{{ entry.duration_hours.toFixed(1) }}h
													</span>
													<span v-if="entry.billable" class="badge badge-success hidden sm:inline-flex">
														<v-icon name="bi-cash" scale="0.7" />
														Billable
													</span>
												</div>
											</div>
											<div class="flex items-center gap-4 mt-2">
												<span class="text-xs text-text tabular-nums">{{ entry.start_time }} – {{ entry.end_time }}</span>
											</div>
										</div>

										<!-- Actions -->
										<div class="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
											<button @click="editEntry(entry)" aria-label="Edit entry"
												class="w-8 h-8 rounded-md flex items-center justify-center hover:bg-heading/8 text-text hover:text-heading transition-all duration-150">
												<v-icon name="bi-pencil" scale="0.75" />
											</button>
											<button @click="removeEntry(entry.id)" aria-label="Delete entry"
												class="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500/10 text-text hover:text-red-600 transition-all duration-150">
												<v-icon name="bi-trash" scale="0.75" />
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Empty State -->
						<div v-else class="text-center py-16 px-5">
							<div class="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
								<v-icon name="bi-calendar3" class="text-accent" scale="1.4" />
							</div>
							<h3 class="section-title mb-1.5">No entries on this day</h3>
							<p class="text-sm text-text mb-5">Start the timer or add a manual entry to track your work.</p>
							<button @click="openAddEntry" class="tazko-btn-outline">
								<v-icon name="bi-plus-circle" scale="0.85" />
								Add Entry
							</button>
						</div>
					</div>
				</div>

				<!-- RIGHT: Sidebar -->
				<div class="lg:col-span-4 flex flex-col gap-6">

					<!-- Weekly Overview -->
					<div class="card overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">This Week</h2>
							<p class="section-desc">Hours logged per day</p>
						</div>
						<div class="p-5">
							<div class="flex items-end gap-2 h-28">
								<div v-for="(day, i) in [
									{ label: 'Mon', hours: 6.5, isToday: false },
									{ label: 'Tue', hours: 8.2, isToday: false },
									{ label: 'Wed', hours: 5.5, isToday: false },
									{ label: 'Thu', hours: 7.0, isToday: false },
									{ label: 'Fri', hours: 4.8, isToday: false },
									{ label: 'Sat', hours: 0, isToday: false },
									{ label: 'Sun', hours: 0, isToday: false },
								].concat(store.weekTotal > 0 ? [{ label: 'Now', hours: store.weekTotal % 10, isToday: true }] : [])" :key="i"
									class="flex-1 flex flex-col items-center gap-2">
									<div class="w-full flex items-end" style="height: 100px;">
										<div class="w-full rounded-t-md transition-all duration-300"
											:class="day.isToday ? 'bg-accent' : 'bg-accent/25'"
											:style="{ height: `${Math.max((day.hours / 10) * 100, 4)}%` }">
										</div>
									</div>
									<span class="text-xs font-medium"
										:class="day.isToday ? 'text-accent' : 'text-text'">
										{{ day.label }}
									</span>
								</div>
							</div>
							<div class="mt-4 pt-4 border-t border-heading/6 flex items-center justify-between gap-3">
								<span class="text-sm text-text">Weekly goal: 40h</span>
								<span class="text-sm font-semibold text-accent tabular-nums">{{ store.weekTotal.toFixed(1) }}h</span>
							</div>
						</div>
					</div>

					<!-- Quick Start Tasks -->
					<div class="card overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">Recent Tasks</h2>
							<p class="section-desc">Start the timer on recent work</p>
						</div>
						<div class="divide-y divide-heading/6">
							<button v-for="task in recentTasks" :key="task.id"
								@click="running ? '' : quickStart(task.id, task.title, task.project)"
								class="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-heading/3 transition-colors text-left group"
								:class="{ 'opacity-50 cursor-not-allowed': running }">
								<div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: task.color }"></div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-heading truncate">{{ task.title }}</p>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs text-text truncate">{{ task.project }}</span>
										<span class="text-xs text-text/50">·</span>
										<span class="text-xs text-text/70 shrink-0">{{ task.lastUsed }}</span>
									</div>
								</div>
								<v-icon name="bi-play-fill" class="text-accent shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" scale="0.85" />
							</button>
						</div>
					</div>

					<!-- Project Breakdown -->
					<div class="card overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">By Project</h2>
							<p class="section-desc">Time distribution</p>
						</div>
						<div class="p-5 flex flex-col gap-4">
							<div v-for="project in store.projectHours" :key="project.name">
								<div class="flex items-center justify-between gap-3 mb-2">
									<div class="flex items-center gap-2 min-w-0">
										<div class="w-2 h-2 rounded-full shrink-0" :style="{ background: project.color }"></div>
										<span class="text-sm font-medium text-heading truncate">{{ project.name }}</span>
									</div>
									<span class="text-sm font-semibold text-text shrink-0 tabular-nums">{{ project.hours.toFixed(1) }}h</span>
								</div>
								<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
									<div class="h-full rounded-full transition-all duration-300"
										:style="{
											width: `${(project.hours / Math.max(...store.projectHours.map(p => p.hours), 1)) * 100}%`,
											background: project.color
										}">
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Filters -->
					<div class="card overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">Filters</h2>
							<p class="section-desc">Narrow down your entries</p>
						</div>
						<div class="p-5 flex flex-col gap-4">
							<div>
								<label class="form-label">Project</label>
								<AppSelect v-model="store.filterProject" :options="projectOptions" size="sm" />
							</div>
							<div>
								<label class="form-label">Billable</label>
								<AppSelect v-model="store.filterDateFrom" :options="[
									{ label: 'All', value: '' },
									{ label: 'Billable Only', value: 'billable' },
									{ label: 'Non-Billable Only', value: 'non-billable' },
								]" size="sm" />
							</div>
							<button v-if="store.filterProject || store.filterDateFrom"
								@click="store.filterProject = ''; store.filterDateFrom = ''"
								class="text-sm text-accent hover:brightness-110 font-semibold self-start transition-all">
								Clear all filters
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Add/Edit Entry Modal ─────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showAddEntry" class="modal-overlay" @click.self="showAddEntry = false">
					<div class="modal-content w-full max-w-lg" @click.stop>
						<div class="px-6 py-5 border-b border-heading/8 flex items-start justify-between gap-4">
							<div>
								<h2 class="text-lg font-semibold text-heading">{{ editingEntry ? 'Edit Entry' : 'New Time Entry' }}</h2>
								<p class="text-sm text-text mt-1">{{ editingEntry ? 'Update your time entry' : 'Add a manual time entry' }}</p>
							</div>
							<button @click="showAddEntry = false" aria-label="Close"
								class="w-9 h-9 rounded-md flex items-center justify-center hover:bg-heading/8 text-text hover:text-heading transition-all duration-150 shrink-0 active:scale-95">
								<v-icon name="bi-x" scale="1" />
							</button>
						</div>

						<form @submit.prevent="saveEntry" class="p-6 flex flex-col gap-4">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label class="form-label">Date</label>
									<AppDatePicker v-model="newEntry.date" size="sm" />
								</div>
								<div>
									<label class="form-label">Billable</label>
									<div class="flex items-center gap-5 h-10">
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="radio" v-model="newEntry.billable" :value="true" class="accent-accent w-4 h-4" />
											<span class="text-sm text-text">Yes</span>
										</label>
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="radio" v-model="newEntry.billable" :value="false" class="accent-accent w-4 h-4" />
											<span class="text-sm text-text">No</span>
										</label>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label class="form-label">Start Time</label>
									<input v-model="newEntry.start_time" type="time" class="input-field" required />
								</div>
								<div>
									<label class="form-label">End Time</label>
									<input v-model="newEntry.end_time" type="time" class="input-field" required />
								</div>
							</div>

							<div>
								<label class="form-label">Task</label>
								<input v-model="newEntry.task_title" type="text"
									placeholder="What were you working on?"
									class="input-field" required />
							</div>

							<div>
								<label class="form-label">Project</label>
								<AppSelect v-model="newEntry.project_id" :options="[
									{ label: 'Tazko App', value: 1 },
									{ label: 'Brand Refresh', value: 2 },
									{ label: 'API Migration', value: 3 },
								]" size="sm" />
							</div>

							<div>
								<label class="form-label">Description</label>
								<input v-model="newEntry.description" type="text"
									placeholder="Optional notes…"
									class="input-field" />
								<p class="form-hint">Add context so this entry is easy to recognise later.</p>
							</div>

							<div class="flex items-center justify-end gap-3 pt-2">
								<button type="button" @click="showAddEntry = false" class="tazko-btn-cancel">Cancel</button>
								<button type="submit" class="tazko-btn">
									{{ editingEntry ? 'Update' : 'Add Entry' }}
								</button>
							</div>
						</form>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
/* Subtle accent-tinted surface for the timer, derived from theme tokens */
.timer-surface {
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--color-accent) 6%, var(--color-panel)) 0%,
		var(--color-panel) 100%
	);
}

.modal-enter-active,
.modal-leave-active {
	transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
	transform: scale(0.97);
}
</style>
