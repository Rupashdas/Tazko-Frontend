<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiClock, BiCalendar3, BiLightningCharge, BiCheckCircle,
	BiSearch, BiX, BiChevronDown, BiChevronRight,
	BiArrowRight, BiClipboardCheck, BiPersonCheck, BiCalendarWeek,
	BiPeopleFill,
} from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'

addIcons(
	BiClock, BiCalendar3, BiLightningCharge, BiCheckCircle,
	BiSearch, BiX, BiChevronDown, BiChevronRight,
	BiArrowRight, BiClipboardCheck, BiPersonCheck, BiCalendarWeek,
	BiPeopleFill,
)

const router = useRouter()

// ── Current user (mock) ──────────────────────────────────
const currentUser = 'AH'

// ── Mock data ────────────────────────────────────────────
const projects = ref([
	{
		id: 1,
		name: 'Tazko App',
		color: 'bg-accent',
		members: [
			{ initials: 'AH', name: 'Arif Hossain', color: 'bg-accent' },
			{ initials: 'SK', name: 'Sara Khan', color: 'bg-violet-500' },
			{ initials: 'NR', name: 'Noman Rahman', color: 'bg-emerald-500' },
			{ initials: 'DM', name: 'Dina Malik', color: 'bg-amber-500' },
			{ initials: 'KU', name: 'Karim Uddin', color: 'bg-rose-500' },
		],
		tasks: [
			{ id: 101, title: 'Dashboard UI implementation', status: 'In Progress', priority: 'High', assignees: ['SK'], assignedBy: 'AH', due: '2026-04-15' },
			{ id: 102, title: 'JWT Authentication flow', status: 'Done', priority: 'Urgent', assignees: ['NR'], assignedBy: 'AH', due: '2026-03-10' },
			{ id: 103, title: 'Kanban board with drag & drop', status: 'In Progress', priority: 'High', assignees: ['AH'], assignedBy: 'SK', due: '2026-04-20' },
			{ id: 104, title: 'Role & permission system', status: 'Review', priority: 'Urgent', assignees: ['NR'], assignedBy: 'AH', due: '2026-04-05' },
			{ id: 105, title: 'Real-time notifications', status: 'Todo', priority: 'Medium', assignees: ['NR', 'SK'], assignedBy: 'AH', due: '2026-05-15' },
		],
	},
	{
		id: 2,
		name: 'Marketing Website',
		color: 'bg-emerald-500',
		members: [
			{ initials: 'SK', name: 'Sara Khan', color: 'bg-violet-500' },
			{ initials: 'DM', name: 'Dina Malik', color: 'bg-amber-500' },
			{ initials: 'TH', name: 'Tanvir Hasan', color: 'bg-sky-500' },
		],
		tasks: [
			{ id: 201, title: 'Landing page redesign', status: 'In Progress', priority: 'High', assignees: ['DM', 'SK'], assignedBy: 'AH', due: '2026-04-12' },
			{ id: 202, title: 'SEO meta tags & sitemap', status: 'Todo', priority: 'Medium', assignees: ['TH'], assignedBy: 'SK', due: '2026-04-25' },
			{ id: 203, title: 'Contact form integration', status: 'Done', priority: 'Low', assignees: ['TH'], assignedBy: 'AH', due: '2026-03-28' },
		],
	},
	{
		id: 3,
		name: 'Mobile App',
		color: 'bg-violet-500',
		members: [
			{ initials: 'AH', name: 'Arif Hossain', color: 'bg-accent' },
			{ initials: 'KU', name: 'Karim Uddin', color: 'bg-rose-500' },
			{ initials: 'RI', name: 'Rafiq Islam', color: 'bg-teal-500' },
		],
		tasks: [
			{ id: 301, title: 'Push notification service', status: 'Todo', priority: 'High', assignees: ['RI'], assignedBy: 'AH', due: '2026-05-01' },
			{ id: 302, title: 'Offline mode & sync', status: 'In Progress', priority: 'Urgent', assignees: ['AH', 'KU'], assignedBy: 'RI', due: '2026-04-08' },
			{ id: 303, title: 'App store listing assets', status: 'Review', priority: 'Low', assignees: ['KU'], assignedBy: 'AH', due: '2026-04-18' },
		],
	},
])

// ── Flatten all tasks with project context ───────────────
const allTasks = computed(() => {
	const result = []
	for (const project of projects.value) {
		for (const task of project.tasks) {
			result.push({ ...task, projectId: project.id, projectName: project.name, projectColor: project.color })
		}
	}
	return result
})

// ── Member color lookup across all projects ──────────────
const memberColorMap = computed(() => {
	const map = {}
	for (const project of projects.value) {
		for (const m of project.members) {
			map[m.initials] = m.color
		}
	}
	return map
})

// ── Tabs ─────────────────────────────────────────────────
const activeTab = ref('assignments')
const tabs = [
	{ key: 'assignments', label: 'My assignments', icon: 'bi-person-check' },
	{ key: 'dated', label: 'Assignments with dates', icon: 'bi-calendar-week' },
	{ key: 'delegated', label: "Stuff I've assigned", icon: 'bi-people-fill' },
]

// ── Per-tab task sources ─────────────────────────────────
const myAssignments = computed(() =>
	allTasks.value.filter(t => t.assignees.includes(currentUser))
)
const myDatedAssignments = computed(() =>
	myAssignments.value.filter(t => t.due)
)
const delegatedTasks = computed(() =>
	allTasks.value.filter(t => t.assignedBy === currentUser && !t.assignees.includes(currentUser))
)

const activeTaskSource = computed(() => {
	if (activeTab.value === 'dated') return myDatedAssignments.value
	if (activeTab.value === 'delegated') return delegatedTasks.value
	return myAssignments.value
})

// ── Filters ──────────────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref('All')
const priorityFilter = ref('All')

const filteredTasks = computed(() =>
	activeTaskSource.value.filter(t => {
		const s = !searchQuery.value || t.title.toLowerCase().includes(searchQuery.value.toLowerCase())
		const f = statusFilter.value === 'All' || t.status === statusFilter.value
		const p = priorityFilter.value === 'All' || t.priority === priorityFilter.value
		return s && f && p
	})
)

// ── Stats (always based on myAssignments, not filtered) ──
const now = new Date()
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1)
const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000 - 1)

const overdueCount = computed(() =>
	myAssignments.value.filter(t => t.status !== 'Done' && t.due && new Date(t.due) < startOfToday).length
)
const dueTodayCount = computed(() =>
	myAssignments.value.filter(t => t.status !== 'Done' && t.due && (() => {
		const d = new Date(t.due)
		return d >= startOfToday && d <= endOfToday
	})()).length
)
const inProgressCount = computed(() =>
	myAssignments.value.filter(t => t.status === 'In Progress').length
)
const completedCount = computed(() =>
	myAssignments.value.filter(t => t.status === 'Done').length
)

// ── Date grouping for "Assignments with dates" tab ───────
const dateGroups = computed(() => {
	const groups = [
		{ key: 'overdue', label: 'Overdue', cls: 'text-red-500', dotCls: 'bg-red-500', tasks: [] },
		{ key: 'today', label: 'Today', cls: 'text-amber-500', dotCls: 'bg-amber-500', tasks: [] },
		{ key: 'this-week', label: 'This week', cls: 'text-accent', dotCls: 'bg-accent', tasks: [] },
		{ key: 'later', label: 'Later', cls: 'text-text', dotCls: 'bg-slate-400', tasks: [] },
	]
	for (const t of filteredTasks.value) {
		const d = new Date(t.due)
		if (d < startOfToday && t.status !== 'Done') groups[0].tasks.push(t)
		else if (d >= startOfToday && d <= endOfToday) groups[1].tasks.push(t)
		else if (d > endOfToday && d <= endOfWeek) groups[2].tasks.push(t)
		else groups[3].tasks.push(t)
	}
	return groups.filter(g => g.tasks.length > 0)
})

// ── Project grouping for "My assignments" & "Delegated" tabs ──
const groupedByProject = computed(() => {
	const groups = []
	for (const project of projects.value) {
		const tasks = filteredTasks.value.filter(t => t.projectId === project.id)
		if (tasks.length > 0) {
			groups.push({ ...project, tasks })
		}
	}
	return groups
})

// ── Collapse state ───────────────────────────────────────
const collapsed = ref(new Set())

const toggleCollapse = (key) => {
	if (collapsed.value.has(key)) {
		collapsed.value.delete(key)
	} else {
		collapsed.value.add(key)
	}
}

const isCollapsed = (key) => collapsed.value.has(key)

// ── Config maps (same as ProjectBoardTab) ────────────────
const columnConfig = {
	'Todo': { dotClass: 'bg-slate-400', labelClass: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-400/10' },
	'In Progress': { dotClass: 'bg-accent', labelClass: 'text-accent', bg: 'bg-accent/10' },
	'Review': { dotClass: 'bg-violet-500', labelClass: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10' },
	'Done': { dotClass: 'bg-emerald-500', labelClass: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
}

const priorityConfig = {
	'Urgent': { cls: 'bg-red-500/10 text-red-500', dot: 'bg-red-500' },
	'High': { cls: 'bg-orange-500/10 text-orange-500', dot: 'bg-orange-400' },
	'Medium': { cls: 'bg-amber-500/10 text-amber-600', dot: 'bg-amber-400' },
	'Low': { cls: 'bg-slate-400/10 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
}

// ── Helpers ──────────────────────────────────────────────
const formatShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const isDueOverdue = (due) => due && new Date(due) < startOfToday
const isDueSoon = (due) => {
	if (!due) return false
	const diff = Math.ceil((new Date(due) - now) / 86400000)
	return diff >= 0 && diff <= 3
}

// ── Navigation ───────────────────────────────────────────
const openTask = (projectId, taskId) => {
	router.push({ name: 'task-detail', params: { id: projectId, taskId } })
}
const openProject = (projectId) => {
	router.push({ name: 'project-detail', params: { id: projectId } })
}
</script>

<template>
	<div class="pb-20 pt-8">

		<!-- ── Page header ──────────────────────────────── -->
		<div class="mb-6">
			<p class="page-eyebrow">Workspace</p>
			<h1 class="page-title">My Stuff</h1>
			<p class="page-subtitle">Every task assigned to you, across all of your projects.</p>
		</div>

		<!-- ── Stat strip ───────────────────────────────── -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			<div v-for="stat in [
				{ label: 'Overdue', value: overdueCount, icon: 'bi-clock', cls: overdueCount ? 'text-red-500' : 'text-text', bg: overdueCount ? 'bg-red-500/10' : 'bg-heading/5' },
				{ label: 'Due Today', value: dueTodayCount, icon: 'bi-calendar3', cls: dueTodayCount ? 'text-amber-500' : 'text-text', bg: dueTodayCount ? 'bg-amber-500/10' : 'bg-heading/5' },
				{ label: 'In Progress', value: inProgressCount, icon: 'bi-lightning-charge', cls: 'text-accent', bg: 'bg-accent/10' },
				{ label: 'Completed', value: completedCount, icon: 'bi-check-circle', cls: 'text-emerald-500', bg: 'bg-emerald-500/10' },
			]" :key="stat.label" class="card card-hover p-4 flex items-center gap-3">
				<div :class="[stat.bg, 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0']">
					<v-icon :name="stat.icon" :class="stat.cls" scale="1.2" />
				</div>
				<div class="min-w-0">
					<p :class="[stat.cls, 'text-xl font-bold leading-none tabular-nums']">{{ stat.value }}</p>
					<p class="text-xs text-text mt-1 font-medium">{{ stat.label }}</p>
				</div>
			</div>
		</div>

		<!-- ── Tab bar ──────────────────────────────────── -->
		<div class="border-b border-heading/8 mb-6 overflow-x-auto scrollbar-thin">
			<div class="flex items-center gap-1">
				<button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="[
					'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap select-none border-b-2 -mb-px transition-all duration-150',
					activeTab === tab.key
						? 'text-accent border-accent'
						: 'text-text border-transparent hover:text-heading hover:border-heading/15',
				]">
					<v-icon :name="tab.icon" scale="0.85" />
					{{ tab.label }}
				</button>
			</div>
		</div>

		<!-- ── Toolbar ──────────────────────────────────── -->
		<div class="card p-3 mb-6">
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative flex-1 min-w-48">
					<v-icon name="bi-search"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
						scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search tasks…"
						class="tazko-search pl-9 pr-8 py-2" />
					<button v-if="searchQuery" type="button" aria-label="Clear search" @click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-heading transition-colors">
						<v-icon name="bi-x" scale="0.8" />
					</button>
				</div>

				<div class="w-36">
					<AppSelect
						v-model="statusFilter"
						:options="[
							{ label: 'All Status', value: 'All' },
							{ label: 'Todo', value: 'Todo' },
							{ label: 'In Progress', value: 'In Progress' },
							{ label: 'Review', value: 'Review' },
							{ label: 'Done', value: 'Done' },
						]"
						placeholder="All Status"
						size="sm"
						:highlight="true"
						inactive-value="All" />
				</div>

				<div class="w-36">
					<AppSelect
						v-model="priorityFilter"
						:options="[
							{ label: 'All Priority', value: 'All' },
							{ label: 'Urgent', value: 'Urgent' },
							{ label: 'High', value: 'High' },
							{ label: 'Medium', value: 'Medium' },
							{ label: 'Low', value: 'Low' },
						]"
						placeholder="All Priority"
						size="sm"
						:highlight="true"
						inactive-value="All" />
				</div>
			</div>
		</div>

		<!-- ═══ TAB: My assignments / Stuff I've assigned (grouped by project) ═══ -->
		<template v-if="activeTab === 'assignments' || activeTab === 'delegated'">
			<div v-if="groupedByProject.length > 0" class="flex flex-col gap-4">
				<div v-for="group in groupedByProject" :key="group.id" class="card overflow-hidden">

					<!-- Project section header -->
					<div
						class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-heading/3 transition-colors select-none"
						@click="toggleCollapse(group.id)">
						<v-icon
							:name="isCollapsed(group.id) ? 'bi-chevron-right' : 'bi-chevron-down'"
							class="text-text shrink-0" scale="0.8" />
						<span :class="[group.color, 'w-2.5 h-2.5 rounded-full shrink-0']" />
						<button
							class="text-sm font-semibold text-heading hover:text-accent transition-colors truncate"
							@click.stop="openProject(group.id)">
							{{ group.name }}
						</button>
						<span class="badge badge-neutral tabular-nums shrink-0">{{ group.tasks.length }}</span>
						<div class="flex-1" />
						<button
							class="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-text hover:text-accent transition-colors shrink-0"
							@click.stop="openProject(group.id)">
							View project <v-icon name="bi-arrow-right" scale="0.7" />
						</button>
					</div>

					<!-- Task rows -->
					<div v-show="!isCollapsed(group.id)" class="border-t border-heading/8 divide-y divide-heading/6">
						<div v-for="task in group.tasks" :key="task.id"
							class="group flex items-center gap-3 px-4 py-3 hover:bg-heading/3 transition-colors cursor-pointer"
							@click="openTask(group.id, task.id)">
							<span :class="[priorityConfig[task.priority]?.dot, 'w-1.5 h-1.5 rounded-full shrink-0']" />
							<p :class="[
								'text-sm font-medium flex-1 min-w-0 truncate transition-colors',
								task.status === 'Done' ? 'line-through text-text' : 'text-heading group-hover:text-accent',
							]">{{ task.title }}</p>
							<span :class="[
								columnConfig[task.status]?.bg,
								columnConfig[task.status]?.labelClass,
								'badge text-sm px-2 py-0.5 shrink-0 hidden sm:inline-flex',
							]">
								<span :class="[columnConfig[task.status]?.dotClass, 'w-1.5 h-1.5 rounded-full', task.status === 'In Progress' ? 'animate-pulse' : '']" />
								{{ task.status }}
							</span>
							<span :class="[priorityConfig[task.priority]?.cls, 'badge text-sm px-2 py-0.5 shrink-0 hidden md:inline-flex']">
								{{ task.priority }}
							</span>
							<div class="flex items-center shrink-0">
								<div v-for="(ini, ai) in task.assignees.slice(0, 2)" :key="ini"
									:class="[memberColorMap[ini] || 'bg-accent', 'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-2 ring-panel', ai > 0 ? '-ml-1.5' : '']"
									:title="ini">
									{{ ini }}
								</div>
								<div v-if="task.assignees.length > 2"
									class="w-7 h-7 rounded-full bg-heading/10 flex items-center justify-center text-[10px] font-bold text-text shrink-0 ring-2 ring-panel -ml-1.5">
									+{{ task.assignees.length - 2 }}
								</div>
							</div>
							<div class="w-16 text-right shrink-0 hidden sm:block">
								<span v-if="task.due" :class="[
									'text-sm tabular-nums',
									isDueOverdue(task.due) && task.status !== 'Done' ? 'text-red-500 font-semibold'
										: isDueSoon(task.due) && task.status !== 'Done' ? 'text-amber-600 font-medium'
											: 'text-text',
								]">{{ formatShort(task.due) }}</span>
								<span v-else class="text-sm text-text">—</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Empty for project-grouped tabs -->
			<div v-else class="card p-12 text-center">
				<div class="w-12 h-12 rounded-xl bg-heading/5 flex items-center justify-center mx-auto mb-4">
					<v-icon :name="activeTaskSource.length > 0 ? 'bi-search' : 'bi-clipboard-check'"
						class="text-text" scale="1.4" />
				</div>
				<h3 class="section-title mb-1">{{ activeTaskSource.length > 0 ? 'No tasks found' : (activeTab === 'delegated' ? "You haven't assigned any tasks yet" : 'No tasks assigned to you') }}</h3>
				<p class="text-sm text-text">
					{{ activeTaskSource.length > 0 ? 'Try adjusting your search or filters.' : 'Tasks will appear here as soon as they land on your plate.' }}
				</p>
			</div>
		</template>

		<!-- ═══ TAB: Assignments with dates (grouped by date) ═══ -->
		<template v-if="activeTab === 'dated'">
			<div v-if="dateGroups.length > 0" class="flex flex-col gap-4">
				<div v-for="group in dateGroups" :key="group.key" class="card overflow-hidden">

					<!-- Date group header -->
					<div
						class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-heading/3 transition-colors select-none"
						@click="toggleCollapse(group.key)">
						<v-icon
							:name="isCollapsed(group.key) ? 'bi-chevron-right' : 'bi-chevron-down'"
							class="text-text shrink-0" scale="0.8" />
						<span :class="[group.dotCls, 'w-2.5 h-2.5 rounded-full shrink-0']" />
						<span :class="[group.cls, 'text-sm font-semibold']">{{ group.label }}</span>
						<span class="badge badge-neutral tabular-nums shrink-0">{{ group.tasks.length }}</span>
					</div>

					<!-- Task rows -->
					<div v-show="!isCollapsed(group.key)" class="border-t border-heading/8 divide-y divide-heading/6">
						<div v-for="task in group.tasks" :key="task.id"
							class="group flex items-center gap-3 px-4 py-3 hover:bg-heading/3 transition-colors cursor-pointer"
							@click="openTask(task.projectId, task.id)">
							<span :class="[priorityConfig[task.priority]?.dot, 'w-1.5 h-1.5 rounded-full shrink-0']" />
							<p :class="[
								'text-sm font-medium flex-1 min-w-0 truncate transition-colors',
								task.status === 'Done' ? 'line-through text-text' : 'text-heading group-hover:text-accent',
							]">{{ task.title }}</p>
							<!-- Project pill -->
							<button
								class="badge badge-neutral text-sm px-2 py-0.5 shrink-0 hidden lg:inline-flex hover:text-accent transition-colors"
								@click.stop="openProject(task.projectId)">
								<span :class="[task.projectColor, 'w-1.5 h-1.5 rounded-full']" />
								{{ task.projectName }}
							</button>
							<span :class="[
								columnConfig[task.status]?.bg,
								columnConfig[task.status]?.labelClass,
								'badge text-sm px-2 py-0.5 shrink-0 hidden sm:inline-flex',
							]">
								<span :class="[columnConfig[task.status]?.dotClass, 'w-1.5 h-1.5 rounded-full', task.status === 'In Progress' ? 'animate-pulse' : '']" />
								{{ task.status }}
							</span>
							<span :class="[priorityConfig[task.priority]?.cls, 'badge text-sm px-2 py-0.5 shrink-0 hidden md:inline-flex']">
								{{ task.priority }}
							</span>
							<div class="w-16 text-right shrink-0">
								<span v-if="task.due" :class="[
									'text-sm tabular-nums',
									isDueOverdue(task.due) && task.status !== 'Done' ? 'text-red-500 font-semibold'
										: isDueSoon(task.due) && task.status !== 'Done' ? 'text-amber-600 font-medium'
											: 'text-text',
								]">{{ formatShort(task.due) }}</span>
								<span v-else class="text-sm text-text">—</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Empty for dated tab -->
			<div v-else class="card p-12 text-center">
				<div class="w-12 h-12 rounded-xl bg-heading/5 flex items-center justify-center mx-auto mb-4">
					<v-icon name="bi-calendar-week" class="text-text" scale="1.4" />
				</div>
				<h3 class="section-title mb-1">{{ myDatedAssignments.length > 0 ? 'No tasks found' : 'No tasks with due dates' }}</h3>
				<p class="text-sm text-text">
					{{ myDatedAssignments.length > 0 ? 'Try adjusting your search or filters.' : 'Scheduled work will show up here, grouped by when it is due.' }}
				</p>
			</div>
		</template>

	</div>
</template>
