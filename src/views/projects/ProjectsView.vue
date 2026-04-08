<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiPlusCircle, BiSearch, BiGrid3X3Gap, BiListUl,
	MdFolderspecialOutlined, BiCalendar3,
	BiThreeDotsVertical, BiArchive, BiPencil, BiTrash,
	BiCheckCircle, BiClock,
	BiArrowRight,
	BiX, BiLightningCharge, BiGraphUp,
} from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'

addIcons(
	BiPlusCircle, BiSearch, BiGrid3X3Gap, BiListUl,
	MdFolderspecialOutlined, BiCalendar3,
	BiThreeDotsVertical, BiArchive, BiPencil, BiTrash,
	BiCheckCircle, BiClock,
	BiArrowRight,
	BiX, BiLightningCharge, BiGraphUp,
)

const router = useRouter()
const viewMode = ref('grid')
const searchQuery = ref('')
const statusFilter = ref('All')
const priorityFilter = ref('All')
const showFormModal = ref(false)
const formMode = ref('create')
const editingProject = ref(null)
const openMenuId = ref(null)

// ── Archive confirm ────────────────────────────────────────────
const showArchiveConfirm = ref(false)
const pendingArchiveId = ref(null)

// ── Available project colors ───────────────────────────────────
const projectColors = [
	'bg-violet-500',
	'bg-rose-500',
	'bg-emerald-500',
	'bg-amber-500',
	'bg-sky-500',
	'bg-fuchsia-500',
	'bg-indigo-500',
	'bg-teal-500',
	'bg-orange-500',
	'bg-pink-500',
]

const openCreateModal = () => {
	formMode.value = 'create'
	editingProject.value = null
	showFormModal.value = true
}

const openEditModal = (project) => {
	openMenuId.value = null
	formMode.value = 'edit'
	editingProject.value = project
	showFormModal.value = true
}

const closeFormModal = () => {
	showFormModal.value = false
	editingProject.value = null
}

const handleFormSave = (data) => {
	if (formMode.value === 'edit' && editingProject.value) {
		const idx = projects.value.findIndex(p => p.id === editingProject.value.id)
		if (idx !== -1) {
			projects.value[idx] = { ...projects.value[idx], ...data }
		}
	} else {
		projects.value.push({
			id: Date.now(),
			name: data.name,
			description: data.description,
			goal: data.goal,
			color: data.color || projectColors[0],
			priority: data.priority,
			status: data.status,
			startDate: data.startDate,
			endDate: data.endDate,
			is_archived: false,
			progress: 0,
			members: [],
			taskCounts: { total: 0, done: 0 },
		})
	}
	closeFormModal()
}

const statuses = ['All', 'Planning', 'In Progress', 'On Hold', 'Completed']
const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low']

// ── Project data (is_archived: false for active projects) ──────
const projects = ref([
	{
		id: 1,
		name: 'Tazko App',
		description: 'Main project management SaaS — frontend and backend development.',
		status: 'In Progress',
		priority: 'High',
		color: 'bg-violet-500',
		progress: 62,
		startDate: '2026-01-15',
		endDate: '2026-06-30',
		is_archived: false,
		members: [
			{ name: 'Arif H', initials: 'AH', color: 'bg-accent' },
			{ name: 'Sara K', initials: 'SK', color: 'bg-violet-500' },
			{ name: 'Noman R', initials: 'NR', color: 'bg-emerald-500' },
		],
		taskCounts: { total: 48, done: 30 },
	},
	{
		id: 2,
		name: 'Backend Core',
		description: 'Laravel API, authentication, role & permission system.',
		status: 'In Progress',
		priority: 'Urgent',
		color: 'bg-rose-500',
		progress: 45,
		startDate: '2026-02-01',
		endDate: '2026-05-15',
		is_archived: false,
		members: [
			{ name: 'Arif H', initials: 'AH', color: 'bg-accent' },
			{ name: 'Noman R', initials: 'NR', color: 'bg-emerald-500' },
		],
		taskCounts: { total: 32, done: 14 },
	},
	{
		id: 3,
		name: 'Documentation',
		description: 'Technical docs, API reference, and onboarding guides.',
		status: 'Planning',
		priority: 'Low',
		color: 'bg-emerald-500',
		progress: 12,
		startDate: '2026-03-01',
		endDate: '2026-07-31',
		is_archived: false,
		members: [
			{ name: 'Sara K', initials: 'SK', color: 'bg-violet-500' },
		],
		taskCounts: { total: 15, done: 2 },
	},
	{
		id: 4,
		name: 'Mobile App',
		description: 'React Native mobile client for iOS and Android.',
		status: 'Planning',
		priority: 'Medium',
		color: 'bg-sky-500',
		progress: 5,
		startDate: '2026-04-01',
		endDate: '2026-09-30',
		is_archived: false,
		members: [
			{ name: 'Sara K', initials: 'SK', color: 'bg-violet-500' },
			{ name: 'Dina M', initials: 'DM', color: 'bg-amber-500' },
		],
		taskCounts: { total: 10, done: 0 },
	},
	{
		id: 5,
		name: 'Design System',
		description: 'Component library, tokens, and design guidelines.',
		status: 'On Hold',
		priority: 'Medium',
		color: 'bg-amber-500',
		progress: 38,
		startDate: '2026-01-20',
		endDate: '2026-05-01',
		is_archived: false,
		members: [
			{ name: 'Sara K', initials: 'SK', color: 'bg-violet-500' },
		],
		taskCounts: { total: 22, done: 8 },
	},
	{
		id: 6,
		name: 'QA & Testing',
		description: 'End-to-end testing suite with Playwright and PHPUnit.',
		status: 'Completed',
		priority: 'High',
		color: 'bg-fuchsia-500',
		progress: 100,
		startDate: '2026-01-10',
		endDate: '2026-02-28',
		is_archived: false,
		members: [
			{ name: 'Arif H', initials: 'AH', color: 'bg-accent' },
			{ name: 'Noman R', initials: 'NR', color: 'bg-emerald-500' },
		],
		taskCounts: { total: 20, done: 20 },
	},
])

// Only show non-archived projects in the main list
const activeProjects = computed(() => projects.value.filter(p => !p.is_archived))

const filteredProjects = computed(() => {
	return activeProjects.value.filter(p => {
		const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
			p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
		const matchStatus = statusFilter.value === 'All' || p.status === statusFilter.value
		const matchPriority = priorityFilter.value === 'All' || p.priority === priorityFilter.value
		return matchSearch && matchStatus && matchPriority
	})
})

// Count of locally-archived projects (for the badge on Archived button)
const archivedCount = computed(() => projects.value.filter(p => p.is_archived).length)

const totalProjects = computed(() => activeProjects.value.length)
const activeCount = computed(() => activeProjects.value.filter(p => p.status === 'In Progress').length)
const completedCount = computed(() => activeProjects.value.filter(p => p.status === 'Completed').length)
const avgProgress = computed(() => {
	if (!activeProjects.value.length) return 0
	return Math.round(activeProjects.value.reduce((a, p) => a + p.progress, 0) / activeProjects.value.length)
})

const statusConfig = {
	'Planning':    { cls: 'bg-slate-400/15 text-slate-500', dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent',        dot: 'bg-accent' },
	'On Hold':     { cls: 'bg-amber-500/15 text-amber-600',  dot: 'bg-amber-500' },
	'Completed':   { cls: 'bg-emerald-500/15 text-emerald-600', dot: 'bg-emerald-500' },
}
const priorityConfig = {
	Urgent: { cls: 'bg-red-500/15 text-red-500' },
	High:   { cls: 'bg-amber-500/15 text-amber-600' },
	Medium: { cls: 'bg-blue-500/15 text-blue-500' },
	Low:    { cls: 'bg-slate-400/15 text-slate-500' },
}

const progressColor = (p) => {
	if (p >= 100) return 'bg-emerald-500'
	if (p >= 60)  return 'bg-accent'
	if (p >= 30)  return 'bg-amber-500'
	return 'bg-red-400'
}

const daysLeft = (endDate) => {
	const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
	if (diff < 0)  return { label: 'Overdue',   cls: 'text-red-500' }
	if (diff === 0) return { label: 'Due today', cls: 'text-red-500' }
	if (diff <= 7) return { label: `${diff}d left`, cls: 'text-amber-500' }
	return { label: `${diff}d left`, cls: 'text-text' }
}

const formatDate = (d) =>
	new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const toggleMenu = (id) => { openMenuId.value = openMenuId.value === id ? null : id }

// ── Archive ────────────────────────────────────────────────────
const requestArchive = (id) => {
	openMenuId.value = null
	pendingArchiveId.value = id
	showArchiveConfirm.value = true
}

const handleArchive = () => {
	// TODO: axios.patch(`/api/projects/${pendingArchiveId.value}/archive`)
	const project = projects.value.find(p => p.id === pendingArchiveId.value)
	if (project) project.is_archived = true
	showArchiveConfirm.value = false
	pendingArchiveId.value = null
}

const getProjectColor = (project, idx) =>
	project.color || projectColors[idx % projectColors.length]
</script>

<template>
	<div class="pb-20 pt-8 px-1" @click="openMenuId = null">

		<!-- ── Header ─────────────────────────────────── -->
		<div class="mb-8 flex items-end justify-between gap-4 flex-wrap">
			<div>
				<p class="page-eyebrow">Workspace</p>
				<h1 class="page-title">Projects</h1>
				<p class="page-subtitle">Manage your team's work across all active projects.</p>
			</div>
			<div class="flex items-center gap-2.5">
				<!-- Archived button -->
				<button
					@click.stop="router.push({ name: 'archived-projects' })"
					class="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 hover:text-heading transition-all">
					<v-icon name="bi-archive" scale="0.9" />
					Archived
					<span v-if="archivedCount > 0"
						class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-heading/10 text-sm font-bold text-text leading-none tabular-nums">
						{{ archivedCount }}
					</span>
				</button>
				<!-- New Project button -->
				<button @click.stop="openCreateModal"
					class="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white text-base font-semibold hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/25">
					<v-icon name="bi-plus-circle" scale="0.9" />
					New Project
				</button>
			</div>
		</div>

		<!-- ── Stat Cards ─────────────────────────────── -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
					<v-icon name="md-folderspecial-outlined" class="text-accent" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ totalProjects }}</p>
					<p class="text-base text-text mt-0.5">Total</p>
				</div>
			</div>
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-blue-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-lightning-charge" class="text-blue-500" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ activeCount }}</p>
					<p class="text-base text-text mt-0.5">Active</p>
				</div>
			</div>
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-emerald-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-check-circle" class="text-emerald-500" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ completedCount }}</p>
					<p class="text-base text-text mt-0.5">Completed</p>
				</div>
			</div>
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-violet-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-graph-up" class="text-violet-500" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ avgProgress }}<span
							class="text-base font-medium text-text">%</span></p>
					<p class="text-base text-text mt-0.5">Avg Progress</p>
				</div>
			</div>
		</div>

		<!-- ── Toolbar ────────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-3.5 mb-6">
			<div class="flex flex-wrap items-center gap-2.5">
				<div class="relative flex-1 min-w-48">
					<v-icon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none" scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search projects…"
						class="w-full pl-9 pr-8 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
					<button v-if="searchQuery" @click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-text">
						<v-icon name="bi-x" scale="0.8" />
					</button>
				</div>

				<div class="w-36">
					<AppSelect
						v-model="statusFilter"
						:options="[{ label: 'All Status', value: 'All' }, ...statuses.slice(1).map(s => ({ label: s, value: s }))]"
						placeholder="All Status"
						size="sm"
						:highlight="true"
						inactive-value="All" />
				</div>

				<div class="w-36">
					<AppSelect
						v-model="priorityFilter"
						:options="[{ label: 'All Priority', value: 'All' }, ...priorities.slice(1).map(p => ({ label: p, value: p }))]"
						placeholder="All Priority"
						size="sm"
						:highlight="true"
						inactive-value="All" />
				</div>

				<div class="flex-1 hidden sm:block" />

				<div class="flex items-center gap-1 bg-heading/5 rounded-sm p-1">
					<button @click="viewMode = 'grid'"
						:class="[viewMode === 'grid' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-grid-3x3-gap" scale="0.85" /> Grid
					</button>
					<button @click="viewMode = 'list'"
						:class="[viewMode === 'list' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-list-ul" scale="0.85" /> List
					</button>
				</div>
			</div>
		</div>

		<!-- ── Empty State ────────────────────────────── -->
		<div v-if="filteredProjects.length === 0" class="text-center py-24">
			<div class="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
				<v-icon name="md-folderspecial-outlined" class="text-accent" scale="2" />
			</div>
			<h3 class="section-title mb-2">No projects found</h3>
			<p class="page-subtitle mb-6">Try adjusting your filters or create a new project.</p>
			<button @click="statusFilter = 'All'; priorityFilter = 'All'; searchQuery = ''"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Clear filters
			</button>
		</div>

		<!-- ── GRID VIEW ──────────────────────────────── -->
		<div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
			<div v-for="(project, idx) in filteredProjects" :key="project.id"
				class="bg-panel rounded-sm border border-heading/8 hover:shadow-xl hover:shadow-heading/5 hover:-translate-y-0.5 hover:border-accent/20 transition-all duration-200 group overflow-hidden flex flex-col cursor-pointer"
				@click="router.push({ name: 'project-detail', params: { id: project.id } })">

				<div :class="`h-1 w-full ${getProjectColor(project, idx)}`" />

				<div class="p-5 flex-1">
					<div class="flex items-start justify-between mb-3">
						<div :class="`w-10 h-10 rounded-sm ${getProjectColor(project, idx)} flex items-center justify-center shrink-0 shadow-sm`">
							<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.0" />
						</div>
						<div class="flex items-center gap-1.5" @click.stop>
							<span :class="[statusConfig[project.status].cls, 'inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-semibold']">
								<span :class="[statusConfig[project.status].dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
							<div class="relative">
								<button @click="toggleMenu(project.id)"
									class="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-heading/5 transition-colors text-text hover:text-text">
									<v-icon name="bi-three-dots-vertical" scale="0.8" />
								</button>
								<Transition name="fade-drop">
									<div v-if="openMenuId === project.id"
										class="absolute right-0 top-full mt-1 w-44 bg-panel rounded-sm border border-heading/10 shadow-xl z-20 overflow-hidden">
										<button
											@click="router.push({ name: 'project-detail', params: { id: project.id } })"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-arrow-right" scale="0.85" /> Open
										</button>
										<button
											@click.stop="openEditModal(project)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-pencil" scale="0.85" /> Edit
										</button>
										<button
											@click.stop="requestArchive(project.id)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
											<v-icon name="bi-archive" scale="0.85" /> Archive
										</button>
										<div class="h-px bg-heading/5 mx-2" />
										<button
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 transition-colors">
											<v-icon name="bi-trash" scale="0.85" /> Delete
										</button>
									</div>
								</Transition>
							</div>
						</div>
					</div>

					<h3 class="section-title mb-1.5 group-hover:text-accent transition-colors">{{ project.name }}</h3>
					<div
						v-if="project.description"
						class="text-base text-text leading-relaxed line-clamp-2 mb-4 rich-content"
						v-html="project.description" />
					<p v-else class="text-base text-text leading-relaxed line-clamp-2 mb-4 italic">No description</p>

					<div class="mb-4">
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-sm font-semibold uppercase tracking-wide text-text">Progress</span>
							<span class="text-sm font-bold tabular-nums"
								:class="project.progress >= 100 ? 'text-emerald-500' : project.progress >= 60 ? 'text-accent' : 'text-text'">
								{{ project.progress }}%
							</span>
						</div>
						<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
							<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all duration-500']"
								:style="`width: ${project.progress}%`" />
						</div>
					</div>

					<div class="flex items-center gap-2 flex-wrap">
						<span class="inline-flex items-center gap-1 text-sm text-text font-medium">
							<v-icon name="bi-check-circle" scale="0.75" class="text-emerald-500" />
							{{ project.taskCounts.done }}/{{ project.taskCounts.total }} tasks
						</span>
						<span :class="[priorityConfig[project.priority].cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
							{{ project.priority }}
						</span>
					</div>
				</div>

				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between bg-heading/[0.015]">
					<div class="flex -space-x-2">
						<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
							:class="[m.color, 'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel']"
							:title="m.name">
							{{ m.initials }}
						</div>
						<div v-if="project.members.length > 3"
							class="w-10 h-10 rounded-full bg-heading/10 flex items-center justify-center text-sm font-bold border-2 border-panel text-text">
							+{{ project.members.length - 3 }}
						</div>
					</div>
					<div class="flex items-center gap-1.5 text-sm font-medium" :class="daysLeft(project.endDate).cls">
						<v-icon name="bi-calendar3" scale="0.75" />
						{{ daysLeft(project.endDate).label }}
					</div>
				</div>
			</div>
		</div>

		<!-- ── LIST VIEW ──────────────────────────────── -->
		<div v-else class="bg-panel rounded-sm border border-heading/8">
			<table class="w-full">
				<thead>
					<tr class="border-b border-heading/8 bg-heading/[0.02]">
						<th class="text-left px-5 py-3 text-sm font-semibold uppercase tracking-wide text-text">Project</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Status</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Priority</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text w-36">Progress</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Tasks</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Team</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Due</th>
						<th class="px-4 py-3" />
					</tr>
				</thead>
				<tbody class="divide-y divide-heading/5">
					<tr v-for="(project, idx) in filteredProjects" :key="project.id"
						class="hover:bg-heading/[0.015] transition-colors cursor-pointer group"
						@click="router.push({ name: 'project-detail', params: { id: project.id } })">
						<td class="px-5 py-4">
							<div class="flex items-center gap-3">
								<div :class="`w-8 h-8 rounded-sm ${getProjectColor(project, idx)} flex items-center justify-center shrink-0`">
									<v-icon name="md-folderspecial-outlined" class="text-white" scale="0.85" />
								</div>
								<div>
									<p class="text-base font-semibold text-heading group-hover:text-accent transition-colors">{{ project.name }}</p>
									<p class="text-sm text-text line-clamp-1 max-w-xs mt-0.5">{{ project.description }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-4">
							<span :class="[statusConfig[project.status].cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-semibold']">
								<span :class="[statusConfig[project.status].dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</td>
						<td class="px-4 py-4">
							<span :class="[priorityConfig[project.priority].cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
								{{ project.priority }}
							</span>
						</td>
						<td class="px-4 py-4">
							<div class="flex items-center gap-2">
								<div class="flex-1 h-1.5 bg-heading/8 rounded-full overflow-hidden min-w-16">
									<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all']"
										:style="`width: ${project.progress}%`" />
								</div>
								<span class="text-sm font-bold text-text w-8 text-right tabular-nums">{{ project.progress }}%</span>
							</div>
						</td>
						<td class="px-4 py-4">
							<span class="text-base text-text font-medium">{{ project.taskCounts.done }}/{{ project.taskCounts.total }}</span>
						</td>
						<td class="px-4 py-4">
							<div class="flex -space-x-1.5">
								<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
									:class="[m.color, 'w-6 h-6 rounded-full border-2 border-panel flex items-center justify-center text-white text-sm font-bold']"
									:title="m.name">
									{{ m.initials }}
								</div>
								<div v-if="project.members.length > 3"
									class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel flex items-center justify-center text-sm font-bold text-text">
									+{{ project.members.length - 3 }}
								</div>
							</div>
						</td>
						<td class="px-4 py-4">
							<span class="text-sm font-medium" :class="daysLeft(project.endDate).cls">
								{{ daysLeft(project.endDate).label }}
							</span>
						</td>
						<td class="px-4 py-4" @click.stop>
							<div class="relative">
								<button @click="toggleMenu(project.id)"
									class="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-heading/5 transition-colors text-text">
									<v-icon name="bi-three-dots-vertical" scale="0.85" />
								</button>
								<Transition name="fade-drop">
									<div v-if="openMenuId === project.id"
										class="absolute right-0 top-full mt-1 w-44 bg-panel rounded-sm border border-heading/10 shadow-xl z-20 overflow-hidden">
										<button
											@click="router.push({ name: 'project-detail', params: { id: project.id } })"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-arrow-right" scale="0.85" /> Open
										</button>
										<button
											@click.stop="openEditModal(project)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-pencil" scale="0.85" /> Edit
										</button>
										<button
											@click.stop="requestArchive(project.id)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
											<v-icon name="bi-archive" scale="0.85" /> Archive
										</button>
										<div class="h-px bg-heading/5 mx-2" />
										<button
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 transition-colors">
											<v-icon name="bi-trash" scale="0.85" /> Delete
										</button>
									</div>
								</Transition>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- ── ARCHIVE CONFIRM MODAL ──────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showArchiveConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showArchiveConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-amber-50 flex items-center justify-center mb-4">
							<v-icon name="bi-archive" class="text-amber-500" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Archive Project?</h3>
						<p class="text-base text-text mb-6">
							This project will be moved to the archive. You can restore it at any time from the Archived Projects page.
						</p>
						<div class="flex gap-3">
							<button @click="showArchiveConfirm = false" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleArchive"
								class="flex-1 inline-flex gap-2 items-center justify-center px-6 py-3 text-base tracking-wide rounded-sm shadow-sm text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all cursor-pointer">
								<v-icon name="bi-archive" scale="1" />
								Archive
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── PROJECT FORM MODAL (shared create/edit) ─── -->
		<ProjectFormModal
			:show="showFormModal"
			:mode="formMode"
			:project="editingProject"
			@close="closeFormModal"
			@save="handleFormSave" />

	</div>
</template>

<style scoped>
.fade-drop-enter-active,
.fade-drop-leave-active {
	transition: all 0.15s ease;
}
.fade-drop-enter-from,
.fade-drop-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}

.modal-enter-active,
.modal-leave-active {
	transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
	transform: scale(0.96);
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>