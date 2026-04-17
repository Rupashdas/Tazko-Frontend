<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiClock, BiPlayFill, BiStopFill, BiPlusCircle,
	BiCalendar3, BiCheckCircle, BiCash, BiTrash, BiPencil,
	BiFilter, BiChevronLeft, BiChevronRight, BiArrowLeftRight,
	BiLightningCharge, BiStopwatch, BiCalendarWeek, BiDash,
} from 'oh-vue-icons/icons'
import { useTimeTrackingStore } from '@/stores/useTimeTrackingStore'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

addIcons(
	BiClock, BiPlayFill, BiStopFill, BiPlusCircle,
	BiCalendar3, BiCheckCircle, BiCash,
	BiFilter, BiChevronLeft, BiChevronRight, BiArrowLeftRight,
	BiLightningCharge, BiStopwatch, BiCalendarWeek, BiDash,
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
	<div class="pb-20 pt-0 px-0 min-h-screen" style="background: var(--color-body);">

		<!-- ── Top Bar ─────────────────────────────────── -->
		<div class="sticky top-0 z-40 bg-panel border-b border-heading/8 px-4 py-3">
			<div class="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
				<!-- Left: Title -->
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
						<v-icon name="bi-stopwatch" class="text-accent" scale="1.1" />
					</div>
					<div>
						<h1 class="text-lg font-bold text-heading leading-tight">Time Tracking</h1>
						<p class="text-xs text-text">Track and manage your work hours</p>
					</div>
				</div>

				<!-- Center: Date Navigation -->
				<div class="flex items-center gap-1">
					<button @click="prevDay"
						class="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-heading/6 text-text hover:text-heading transition-colors">
						<v-icon name="bi-chevron-left" scale="1" />
					</button>
					<button @click="goToToday"
						class="px-3 h-8 rounded-sm flex items-center justify-center hover:bg-heading/6 text-text hover:text-heading transition-colors text-sm font-medium">
						Today
					</button>
					<button @click="nextDay"
						class="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-heading/6 text-text hover:text-heading transition-colors">
						<v-icon name="bi-chevron-right" scale="1" />
					</button>
					<div class="ml-2 min-w-[200px]">
						<AppDatePicker v-model="selectedDate" size="sm" />
					</div>
				</div>

				<!-- Right: Actions -->
				<div class="flex items-center gap-2">
					<button @click="openAddEntry"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all">
						<v-icon name="bi-plus-circle" scale="0.85" />
						Add Entry
					</button>
					<button
						class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-sm font-semibold text-text hover:bg-heading/5 hover:text-heading transition-all">
						<v-icon name="bi-download" scale="0.85" />
						Export
					</button>
				</div>
			</div>
		</div>

		<div class="max-w-screen-2xl mx-auto px-4 py-6">
			<!-- ── Stats Row ─────────────────────────────── -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
				<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-sm bg-indigo-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-stopwatch" class="text-indigo-500" scale="1.1" />
					</div>
					<div>
						<p class="text-xl font-bold text-heading tabular-nums">{{ dateTotal.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text">{{ formattedDate.split(',')[0] }}</p>
					</div>
				</div>
				<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-sm bg-violet-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-calendar-week" class="text-violet-500" scale="1.1" />
					</div>
					<div>
						<p class="text-xl font-bold text-heading tabular-nums">{{ store.weekTotal.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text">This Week</p>
					</div>
				</div>
				<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-sm bg-emerald-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-cash" class="text-emerald-500" scale="1.1" />
					</div>
					<div>
						<p class="text-xl font-bold text-heading tabular-nums">{{ store.totalBillable.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text">Billable</p>
					</div>
				</div>
				<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-sm bg-amber-500/10 flex items-center justify-center shrink-0">
						<v-icon name="bi-lightning-charge" class="text-amber-500" scale="1.1" />
					</div>
					<div>
						<p class="text-xl font-bold text-heading tabular-nums">{{ store.totalNonBillable.toFixed(1) }}<span
								class="text-sm font-medium text-text">h</span></p>
						<p class="text-xs text-text">Non-Billable</p>
					</div>
				</div>
			</div>

			<!-- ── Main Grid ─────────────────────────────── -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

				<!-- LEFT: Timer + Timeline -->
				<div class="lg:col-span-8 space-y-5">

					<!-- Timer Card -->
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="p-6 flex flex-col sm:flex-row items-center gap-6"
							style="background: linear-gradient(135deg, #f8f6ff 0%, #fff9f0 100%);">
							<!-- Timer Display -->
							<div class="relative shrink-0">
								<div class="w-32 h-32 rounded-full border-[3px] border-heading/10 flex items-center justify-center"
									style="background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,252,245,1) 100%); box-shadow: 0 0 30px rgba(108,99,255,0.08);">
									<div class="text-center">
										<p class="text-3xl font-bold text-heading tracking-tight tabular-nums leading-none"
											style="font-family: 'Manrope', sans-serif;">
											{{ displayTime }}
										</p>
										<p class="text-[10px] text-text mt-1.5 font-medium uppercase tracking-wider">Elapsed</p>
									</div>
								</div>
								<div v-if="running"
									class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50">
								</div>
							</div>

							<!-- Controls -->
							<div class="flex-1 text-center sm:text-left">
								<div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
									<button v-if="!running" @click="startTimer"
										class="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/30">
										<v-icon name="bi-play-fill" scale="1" />
										Start Timer
									</button>
									<button v-else @click="stopTimer"
										class="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30">
										<v-icon name="bi-stop-fill" scale="1" />
										Stop Timer
									</button>
								</div>
								<div v-if="store.activeTimer" class="mt-3">
									<p class="text-sm font-semibold text-accent">{{ store.activeTimer.task_title }}</p>
									<p class="text-xs text-text">{{ store.activeTimer.project_name }}</p>
								</div>
								<p v-else class="mt-2 text-xs text-text italic">Select a task or start the timer</p>
							</div>

							<!-- Total for day -->
							<div class="text-center sm:text-right shrink-0">
								<p class="text-3xl font-bold text-heading tabular-nums">{{ dateTotal.toFixed(1) }}h</p>
								<p class="text-xs text-text">Total on {{ isToday ? 'today' : 'this day' }}</p>
								<p class="text-xs text-text mt-1">{{ selectedDateEntries.length }} entries</p>
							</div>
						</div>
					</div>

					<!-- Vertical Timeline -->
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8 flex items-center justify-between">
							<h2 class="section-title">Activity Timeline</h2>
							<span class="text-xs text-text">{{ selectedDateEntries.length }} entries</span>
						</div>

						<div v-if="selectedDateEntries.length" class="divide-y divide-heading/5">
							<!-- Timeline entries grouped by hour -->
							<div v-for="group in timelineGroups.filter(g => g.entries.length > 0)" :key="group.hour">
								<div class="px-5 py-2 bg-heading/[0.02]">
									<span class="text-xs font-bold text-text uppercase tracking-wider">{{ group.label }}</span>
								</div>
								<div v-for="entry in group.entries" :key="entry.id"
									class="px-5 py-3.5 hover:bg-heading/[0.02] transition-colors group">
									<div class="flex items-start gap-4">
										<!-- Project indicator -->
										<div class="shrink-0 mt-1">
											<div class="w-3 h-3 rounded-sm" :style="{ background: entry.project_color }"></div>
										</div>

										<!-- Content -->
										<div class="flex-1 min-w-0">
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold text-heading">{{ entry.task_title }}</p>
													<p class="text-xs text-text mt-0.5">{{ entry.project_name }} · {{ entry.description || 'No description' }}</p>
												</div>
												<div class="flex items-center gap-2 shrink-0">
													<span
														class="inline-flex items-center px-2 py-0.5 rounded bg-heading/8 text-xs font-semibold text-heading">
														{{ entry.duration_hours.toFixed(1) }}h
													</span>
													<span v-if="entry.billable"
														class="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
														<v-icon name="bi-cash" scale="0.7" />
														Billable
													</span>
												</div>
											</div>
											<div class="flex items-center gap-4 mt-1.5">
												<span class="text-xs text-text">{{ entry.start_time }} – {{ entry.end_time }}</span>
											</div>
										</div>

										<!-- Actions -->
										<div class="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button @click="editEntry(entry)"
												class="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-heading/8 text-text hover:text-heading transition-colors">
												<v-icon name="bi-pencil" scale="0.75" />
											</button>
											<button @click="removeEntry(entry.id)"
												class="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-red-50 text-text hover:text-red-500 transition-colors">
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
								<v-icon name="bi-calendar3" class="text-accent" scale="1.2" />
							</div>
							<h3 class="text-sm font-semibold text-heading mb-1">No entries on this day</h3>
							<p class="text-xs text-text mb-4">Start the timer or add a manual entry to track your work.</p>
							<button @click="openAddEntry"
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-heading/10 text-xs font-medium text-text hover:bg-heading/5 transition-all">
								<v-icon name="bi-plus-circle" scale="0.7" />
								Add Entry
							</button>
						</div>
					</div>
				</div>

				<!-- RIGHT: Sidebar -->
				<div class="lg:col-span-4 space-y-5">

					<!-- Weekly Overview -->
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">This Week</h2>
						</div>
						<div class="p-4">
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
									class="flex-1 flex flex-col items-center gap-1.5">
									<div class="w-full flex items-end" style="height: 100px;">
										<div class="w-full rounded-t-sm transition-all"
											:class="day.isToday ? 'bg-accent' : 'bg-accent/30'"
											:style="{ height: `${Math.max((day.hours / 10) * 100, 4)}%` }">
										</div>
									</div>
									<span class="text-[10px] font-medium"
										:class="day.isToday ? 'text-accent' : 'text-text'">
										{{ day.label }}
									</span>
								</div>
							</div>
							<div class="mt-3 pt-3 border-t border-heading/5 flex items-center justify-between">
								<span class="text-xs text-text">Weekly goal: 40h</span>
								<span class="text-xs font-semibold text-accent">{{ store.weekTotal.toFixed(1) }}h</span>
							</div>
						</div>
					</div>

					<!-- Quick Start Tasks -->
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">Recent Tasks</h2>
							<p class="text-xs text-text mt-0.5">Start timer on recent work</p>
						</div>
						<div class="divide-y divide-heading/5">
							<button v-for="task in recentTasks" :key="task.id"
								@click="running ? '' : quickStart(task.id, task.title, task.project)"
								class="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-heading/[0.02] transition-colors text-left"
								:class="{ 'opacity-50 cursor-not-allowed': running }">
								<div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: task.color }"></div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-heading truncate">{{ task.title }}</p>
									<div class="flex items-center gap-2 mt-0.5">
										<span class="text-xs text-text">{{ task.project }}</span>
										<span class="text-xs text-text/50">·</span>
										<span class="text-xs text-text/60">{{ task.lastUsed }}</span>
									</div>
								</div>
								<v-icon name="bi-play-fill" class="text-accent shrink-0" scale="0.75" />
							</button>
						</div>
					</div>

					<!-- Project Breakdown -->
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">By Project</h2>
						</div>
						<div class="p-5 space-y-3">
							<div v-for="project in store.projectHours" :key="project.name">
								<div class="flex items-center justify-between mb-1.5">
									<div class="flex items-center gap-2">
										<div class="w-2 h-2 rounded-full" :style="{ background: project.color }"></div>
										<span class="text-sm font-medium text-heading">{{ project.name }}</span>
									</div>
									<span class="text-xs font-semibold text-text">{{ project.hours.toFixed(1) }}h</span>
								</div>
								<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
									<div class="h-full rounded-full"
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
					<div class="bg-panel rounded-sm border border-heading/8 overflow-hidden">
						<div class="px-5 py-4 border-b border-heading/8">
							<h2 class="section-title">Filters</h2>
						</div>
						<div class="p-5 space-y-4">
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Project</label>
								<AppSelect v-model="store.filterProject" :options="projectOptions" size="sm" />
							</div>
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Billable</label>
								<AppSelect v-model="store.filterDateFrom" :options="[
									{ label: 'All', value: '' },
									{ label: 'Billable Only', value: 'billable' },
									{ label: 'Non-Billable Only', value: 'non-billable' },
								]" size="sm" />
							</div>
							<button v-if="store.filterProject || store.filterDateFrom"
								@click="store.filterProject = ''; store.filterDateFrom = ''"
								class="text-xs text-accent hover:text-accent/80 font-semibold">
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
				<div v-if="showAddEntry"
					class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-heading/30 backdrop-blur-sm"
					@click.self="showAddEntry = false">
					<div class="bg-panel rounded-sm border border-heading/10 shadow-2xl w-full max-w-lg overflow-hidden">
						<div class="px-6 py-4 border-b border-heading/8 flex items-center justify-between"
							style="background: linear-gradient(135deg, #f8f6ff 0%, #fff9f0 100%);">
							<div>
								<h2 class="text-xl font-bold text-heading">{{ editingEntry ? 'Edit Entry' : 'New Time Entry' }}</h2>
								<p class="text-sm text-text mt-0.5">{{ editingEntry ? 'Update your time entry' : 'Add a manual time entry' }}</p>
							</div>
							<button @click="showAddEntry = false"
								class="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-heading/10 text-text hover:text-heading transition-colors">
								<v-icon name="bi-x" scale="1" />
							</button>
						</div>

						<form @submit.prevent="saveEntry" class="p-6 space-y-4">
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Date</label>
									<AppDatePicker v-model="newEntry.date" size="sm" />
								</div>
								<div>
									<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Billable</label>
									<div class="flex items-center h-9 gap-4 mt-0.5">
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="radio" v-model="newEntry.billable" :value="true" class="accent-accent" />
											<span class="text-sm text-text">Yes</span>
										</label>
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="radio" v-model="newEntry.billable" :value="false" class="accent-accent" />
											<span class="text-sm text-text">No</span>
										</label>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Start Time</label>
									<input v-model="newEntry.start_time" type="time" class="input-field text-sm w-full" required />
								</div>
								<div>
									<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">End Time</label>
									<input v-model="newEntry.end_time" type="time" class="input-field text-sm w-full" required />
								</div>
							</div>

							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Task</label>
								<input v-model="newEntry.task_title" type="text"
									placeholder="What were you working on?"
									class="input-field text-sm w-full" required />
							</div>

							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Project</label>
								<AppSelect v-model="newEntry.project_id" :options="[
									{ label: 'Tazko App', value: 1 },
									{ label: 'Brand Refresh', value: 2 },
									{ label: 'API Migration', value: 3 },
								]" size="sm" />
							</div>

							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-text block mb-1.5">Description</label>
								<input v-model="newEntry.description" type="text"
									placeholder="Optional notes..."
									class="input-field text-sm w-full" />
							</div>

							<div class="flex items-center justify-end gap-3 pt-2">
								<button type="button" @click="showAddEntry = false" class="tazko-btn-cancel">Cancel</button>
								<button type="submit"
									class="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all">
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
.modal-enter-active,
.modal-leave-active {
	transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
	transform: scale(0.97);
}
</style>
