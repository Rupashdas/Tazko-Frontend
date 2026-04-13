<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiPlusCircle, BiSearch, BiGrid3X3Gap, BiListUl,
	MdFolderspecialOutlined, BiCalendar3,
	BiThreeDotsVertical, BiArchive, BiPencil, BiTrash,
	BiCheckCircle, BiClock,
	BiArrowRight, BiArrowRepeat,
	BiX, BiLightningCharge, BiGraphUp,
} from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/utils/toast'

addIcons(
	BiPlusCircle, BiSearch, BiGrid3X3Gap, BiListUl,
	MdFolderspecialOutlined, BiCalendar3,
	BiThreeDotsVertical, BiArchive, BiPencil, BiTrash,
	BiCheckCircle, BiClock,
	BiArrowRight, BiArrowRepeat,
	BiX, BiLightningCharge, BiGraphUp,
)

const router = useRouter()
const store  = useProjectStore()
const auth   = useAuthStore()
const { successToast, errorToast } = useToast()

const canCreate  = computed(() => auth.hasCapability('projects.create'))
const canUpdate  = computed(() => auth.hasCapability('projects.update'))
const canArchive = computed(() => auth.hasCapability('projects.archive'))
const canDelete  = computed(() => auth.hasCapability('projects.delete'))

const viewMode      = ref('grid')
const searchQuery   = ref('')
const statusFilter  = ref('All')
const priorityFilter = ref('All')
const showFormModal  = ref(false)
const formMode       = ref('create')
const editingProject = ref(null)
const openMenuId     = ref(null)

// ── Archive confirm ────────────────────────────────────────────
const showArchiveConfirm = ref(false)
const pendingArchiveId   = ref(null)
const archiving          = ref(false)

// ── Available project colors ───────────────────────────────────
const projectColors = [
	'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500',
	'bg-sky-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-teal-500',
	'bg-orange-500', 'bg-pink-500',
]

// ── Derive initials & color from API member objects ────────────
const memberColors = [
	'bg-accent', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
	'bg-sky-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-teal-500',
]
const toInitials = (name) =>
	(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const memberColor = (id) => memberColors[id % memberColors.length]

// ── Modal helpers ──────────────────────────────────────────────
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

const handleFormSave = async (data) => {
	const payload = {
		name:        data.name,
		description: data.description,
		goal:        data.goal,
		color:       data.color,
		priority:    data.priority,
		status:      data.status,
		start_date:  data.startDate,
		end_date:    data.endDate,
	}

	const result = formMode.value === 'edit'
		? await store.updateProject(editingProject.value.id, payload)
		: await store.createProject(payload)

	if (result.success) {
		successToast(result.message)
		closeFormModal()
		if (formMode.value === 'create') store.reset()
	} else {
		errorToast(result.message)
	}
}

const statuses   = ['All', 'Planning', 'In Progress', 'On Hold', 'Completed']
const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low']

// ── Stats derived from loaded page data ────────────────────────
const totalProjects  = computed(() => store.meta.total)
const activeCount    = computed(() => store.meta.active_count)
const completedCount = computed(() => store.meta.completed_count)
const avgProgress    = computed(() => store.meta.avg_progress)
const archivedCount = ref(0)

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
// Fallbacks so an unknown status/priority value can't crash the template.
const UNKNOWN_STATUS = { cls: 'bg-slate-400/15 text-slate-500', dot: 'bg-slate-400' }
const UNKNOWN_PRIORITY = { cls: 'bg-slate-400/15 text-slate-500' }
const statusOf = (s) => statusConfig[s] || UNKNOWN_STATUS
const priorityOf = (p) => priorityConfig[p] || UNKNOWN_PRIORITY

const progressColor = (p) => {
	if (p >= 100) return 'bg-emerald-500'
	if (p >= 60)  return 'bg-accent'
	if (p >= 30)  return 'bg-amber-500'
	return 'bg-red-400'
}

const MS_PER_DAY = 86_400_000
const daysLeft = (endDate) => {
	if (!endDate) return { label: 'No due date', cls: 'text-text' }
	const diff = Math.ceil((new Date(endDate) - new Date()) / MS_PER_DAY)
	if (diff < 0)  return { label: 'Overdue',   cls: 'text-red-500' }
	if (diff === 0) return { label: 'Due today', cls: 'text-red-500' }
	if (diff <= 7) return { label: `${diff}d left`, cls: 'text-amber-500' }
	return { label: `${diff}d left`, cls: 'text-text' }
}

const toggleMenu = (id) => { openMenuId.value = openMenuId.value === id ? null : id }

// ── Archive ────────────────────────────────────────────────────
const requestArchive = (id) => {
	openMenuId.value = null
	pendingArchiveId.value = id
	showArchiveConfirm.value = true
}

const handleArchive = async () => {
	archiving.value = true
	const result = await store.archiveProject(pendingArchiveId.value)
	archiving.value = false
	if (result.success) {
		successToast(result.message)
	} else {
		errorToast(result.message)
	}
	showArchiveConfirm.value = false
	pendingArchiveId.value = null
}

const getProjectColor = (project, idx) =>
	project.color || projectColors[idx % projectColors.length]

// Pre-compute per-card derived values once per render so the template
// doesn't invoke daysLeft()/statusOf()/priorityOf() multiple times per row.
const decoratedProjects = computed(() =>
	store.projects.map((p, idx) => ({
		project: {
			...p,
			taskCounts: p.task_counts ?? { done: 0, total: 0 },
			members: (p.members ?? []).map(m => ({
				...m,
				initials: toInitials(m.name),
				color:    memberColor(m.id),
			})),
		},
		idx,
		color:    getProjectColor(p, idx),
		due:      daysLeft(p.end_date),
		status:   statusOf(p.status),
		priority: priorityOf(p.priority),
	}))
)

// ── Delete confirm (was an unwired no-op menu item) ───────────
const showDeleteConfirm = ref(false)
const pendingDeleteId   = ref(null)
const deleting          = ref(false)
const requestDelete = (id) => {
	openMenuId.value = null
	pendingDeleteId.value = id
	showDeleteConfirm.value = true
}
const handleDelete = async () => {
	deleting.value = true
	const result = await store.deleteProject(pendingDeleteId.value)
	deleting.value = false
	if (result.success) {
		successToast(result.message)
	} else {
		errorToast(result.message)
	}
	showDeleteConfirm.value = false
	pendingDeleteId.value = null
}

// ── Sync local filter state → store, then reset ───────────────
// isMounted guard prevents watches from triggering store.reset()
// before onMounted (which owns the first load call).
let isMounted = false
let searchDebounce = null

watch(searchQuery, (val) => {
	if (!isMounted) return
	clearTimeout(searchDebounce)
	searchDebounce = setTimeout(() => {
		store.filters.search = val.trim()
		store.reset()
	}, 350)
})

watch(statusFilter, (val) => {
	if (!isMounted) return
	store.filters.status = val === 'All' ? '' : val
	store.reset()
})

watch(priorityFilter, (val) => {
	if (!isMounted) return
	store.filters.priority = val === 'All' ? '' : val
	store.reset()
})

// ── Intersection Observer (infinite scroll) ───────────────────
const sentinel = ref(null)
let observer = null

const setupObserver = () => {
	observer = new IntersectionObserver(
		([entry]) => { if (entry.isIntersecting) store.fetchNextPage() },
		{ rootMargin: '120px' },
	)
	if (sentinel.value) observer.observe(sentinel.value)
}

// ── Keyboard: Escape closes the topmost overlay ───────────────
const onKeydown = (e) => {
	if (e.key !== 'Escape') return
	if (showDeleteConfirm.value)  { showDeleteConfirm.value = false; return }
	if (showArchiveConfirm.value) { showArchiveConfirm.value = false; return }
	if (showFormModal.value)      { closeFormModal(); return }
	if (openMenuId.value !== null) openMenuId.value = null
}
onMounted(() => {
	window.addEventListener('keydown', onKeydown)
	isMounted = true
	// Always wipe any leftover filter state from a previous visit
	// so the UI dropdowns and the store are in sync from the start.
	store.filters.search   = ''
	store.filters.status   = ''
	store.filters.priority = ''
	searchQuery.value    = ''
	statusFilter.value   = 'All'
	priorityFilter.value = 'All'
	store.reset()
	setupObserver()
})
onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	observer?.disconnect()
})
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
				<button v-if="canCreate" @click.stop="openCreateModal"
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
					<button v-if="searchQuery"
						type="button"
						aria-label="Clear search"
						@click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-heading">
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

		<!-- ── Skeleton: Grid (initial load) ────────────── -->
		<div v-if="store.loading && store.projects.length === 0 && viewMode === 'grid'"
			class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
			<div v-for="n in 6" :key="n"
				class="bg-panel rounded-sm border border-heading/8 overflow-hidden flex flex-col animate-pulse">
				<div class="h-1 w-full bg-heading/10" />
				<div class="p-5 flex-1">
					<div class="flex items-start justify-between mb-3">
						<div class="w-10 h-10 rounded-sm bg-heading/10" />
						<div class="w-20 h-6 rounded-full bg-heading/10" />
					</div>
					<div class="h-4 bg-heading/10 rounded w-3/4 mb-2" />
					<div class="h-3 bg-heading/8 rounded w-full mb-1" />
					<div class="h-3 bg-heading/8 rounded w-5/6 mb-4" />
					<div class="mb-4">
						<div class="h-1.5 bg-heading/8 rounded-full w-full" />
					</div>
					<div class="flex gap-2">
						<div class="h-6 w-24 rounded-full bg-heading/8" />
						<div class="h-6 w-16 rounded-full bg-heading/8" />
					</div>
				</div>
				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between">
					<div class="flex -space-x-2">
						<div v-for="a in 3" :key="a" class="w-10 h-10 rounded-full bg-heading/10 border-2 border-panel" />
					</div>
					<div class="h-4 w-16 rounded bg-heading/8" />
				</div>
			</div>
		</div>

		<!-- ── Skeleton: List (initial load) ─────────────── -->
		<div v-if="store.loading && store.projects.length === 0 && viewMode === 'list'"
			class="bg-panel rounded-sm border border-heading/8 overflow-hidden animate-pulse">
			<!-- header row -->
			<div class="border-b border-heading/8 bg-heading/[0.02] px-5 py-3 flex gap-6">
				<div class="h-3 w-32 rounded bg-heading/10" />
				<div class="h-3 w-16 rounded bg-heading/10" />
				<div class="h-3 w-16 rounded bg-heading/10" />
				<div class="h-3 w-24 rounded bg-heading/10" />
				<div class="h-3 w-12 rounded bg-heading/10" />
				<div class="h-3 w-12 rounded bg-heading/10" />
				<div class="h-3 w-16 rounded bg-heading/10" />
			</div>
			<!-- skeleton rows -->
			<div v-for="n in 6" :key="n"
				class="flex items-center gap-4 px-5 py-4 border-b border-heading/5 last:border-0">
				<!-- project name + icon -->
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<div class="w-8 h-8 rounded-sm bg-heading/10 shrink-0" />
					<div class="space-y-1.5 flex-1">
						<div class="h-3.5 bg-heading/10 rounded w-2/5" />
						<div class="h-3 bg-heading/8 rounded w-3/5" />
					</div>
				</div>
				<!-- status badge -->
				<div class="h-6 w-24 rounded-full bg-heading/10 shrink-0" />
				<!-- priority badge -->
				<div class="h-6 w-16 rounded-full bg-heading/8 shrink-0" />
				<!-- progress bar -->
				<div class="flex items-center gap-2 w-36 shrink-0">
					<div class="flex-1 h-1.5 bg-heading/8 rounded-full" />
					<div class="h-3 w-8 rounded bg-heading/8" />
				</div>
				<!-- tasks -->
				<div class="h-3 w-10 rounded bg-heading/8 shrink-0" />
				<!-- team avatars -->
				<div class="flex -space-x-1.5 shrink-0">
					<div v-for="a in 3" :key="a" class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
				</div>
				<!-- due date -->
				<div class="h-3 w-14 rounded bg-heading/8 shrink-0" />
			</div>
		</div>

		<!-- ── Empty State ────────────────────────────── -->
		<div v-if="!store.loading && store.projects.length === 0" class="text-center py-24">
			<div class="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
				<v-icon name="md-folderspecial-outlined" class="text-accent" scale="2" />
			</div>
			<h3 class="section-title mb-2">No projects found</h3>
			<p class="page-subtitle mb-6">Try adjusting your filters or create a new project.</p>
			<button @click="statusFilter = 'All'; priorityFilter = 'All'; searchQuery = ''; store.filters.search = ''; store.filters.status = ''; store.filters.priority = ''; store.reset()"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Clear filters
			</button>
		</div>

		<!-- ── GRID VIEW ──────────────────────────────── -->
		<div v-else-if="viewMode === 'grid' && store.projects.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
			<div v-for="{ project, color, due, status, priority } in decoratedProjects" :key="project.id"
				class="bg-panel rounded-sm border border-heading/8 hover:shadow-xl hover:shadow-heading/5 hover:-translate-y-0.5 hover:border-accent/20 transition-all duration-200 group overflow-hidden flex flex-col cursor-pointer"
				@click="router.push({ name: 'project-detail', params: { id: project.id } })">

				<div :class="`h-1 w-full ${color}`" />

				<div class="p-5 flex-1">
					<div class="flex items-start justify-between mb-3">
						<div :class="`w-10 h-10 rounded-sm ${color} flex items-center justify-center shrink-0 shadow-sm`">
							<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.0" />
						</div>
						<div class="flex items-center gap-1.5" @click.stop>
							<span :class="[status.cls, 'inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-semibold']">
								<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
							<div v-if="canUpdate || canArchive || canDelete" class="relative">
								<button type="button"
									:aria-expanded="openMenuId === project.id"
									aria-haspopup="menu"
									@click="toggleMenu(project.id)"
									class="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-heading/5 transition-colors text-text">
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
										<button v-if="canUpdate"
											@click.stop="openEditModal(project)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-pencil" scale="0.85" /> Edit
										</button>
										<button v-if="canArchive"
											@click.stop="requestArchive(project.id)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
											<v-icon name="bi-archive" scale="0.85" /> Archive
										</button>
										<template v-if="canDelete">
											<div class="h-px bg-heading/5 mx-2" />
											<button
												@click.stop="requestDelete(project.id)"
												class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
												<v-icon name="bi-trash" scale="0.85" /> Delete
											</button>
										</template>
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
						<span :class="[priority.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
							{{ project.priority }}
						</span>
					</div>
				</div>

				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between bg-heading/[0.015]">
					<div class="flex -space-x-2">
						<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
							:class="[m.color, 'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel overflow-hidden']"
							:title="m.name">
							<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
							<span v-else>{{ m.initials }}</span>
						</div>
						<div v-if="project.members.length > 3"
							class="w-10 h-10 rounded-full bg-heading/10 flex items-center justify-center text-sm font-bold border-2 border-panel text-text">
							+{{ project.members.length - 3 }}
						</div>
					</div>
					<div class="flex items-center gap-1.5 text-sm font-medium" :class="due.cls">
						<v-icon name="bi-calendar3" scale="0.75" />
						{{ due.label }}
					</div>
				</div>
			</div>
		</div>

		<!-- ── LIST VIEW ──────────────────────────────── -->
		<div v-else-if="store.projects.length" class="bg-panel rounded-sm border border-heading/8">
			<table class="w-full">
				<thead>
					<tr class="border-b border-heading/8 bg-heading/[0.02]">
						<th class="text-left px-5 py-3 text-sm font-semibold uppercase tracking-wide text-text">Project</th>
						<th class="hidden sm:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Status</th>
						<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Priority</th>
						<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text w-36">Progress</th>
						<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Tasks</th>
						<th class="hidden lg:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Team</th>
						<th class="hidden lg:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Due</th>
						<th class="px-4 py-3" />
					</tr>
				</thead>
				<tbody class="divide-y divide-heading/5">
					<tr v-for="{ project, color, due, status, priority } in decoratedProjects" :key="project.id"
						class="hover:bg-heading/[0.015] transition-colors cursor-pointer group"
						@click="router.push({ name: 'project-detail', params: { id: project.id } })">
						<td class="px-5 py-4">
							<div class="flex items-center gap-3">
								<div :class="`w-8 h-8 rounded-sm ${color} flex items-center justify-center shrink-0`">
									<v-icon name="md-folderspecial-outlined" class="text-white" scale="0.85" />
								</div>
								<div>
									<p class="text-base font-semibold text-heading group-hover:text-accent transition-colors">{{ project.name }}</p>
									<p class="text-sm text-text line-clamp-1 max-w-xs mt-0.5">{{ project.description }}</p>
								</div>
							</div>
						</td>
						<td class="hidden sm:table-cell px-4 py-4">
							<span :class="[status.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-semibold']">
								<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</td>
						<td class="hidden md:table-cell px-4 py-4">
							<span :class="[priority.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
								{{ project.priority }}
							</span>
						</td>
						<td class="hidden md:table-cell px-4 py-4">
							<div class="flex items-center gap-2">
								<div class="flex-1 h-1.5 bg-heading/8 rounded-full overflow-hidden min-w-16">
									<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all']"
										:style="`width: ${project.progress}%`" />
								</div>
								<span class="text-sm font-bold text-text w-8 text-right tabular-nums">{{ project.progress }}%</span>
							</div>
						</td>
						<td class="hidden md:table-cell px-4 py-4">
							<span class="text-base text-text font-medium">{{ project.taskCounts.done }}/{{ project.taskCounts.total }}</span>
						</td>
						<td class="hidden lg:table-cell px-4 py-4">
							<div class="flex -space-x-1.5">
								<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
									:class="[m.color, 'w-6 h-6 rounded-full border-2 border-panel flex items-center justify-center text-white text-sm font-bold overflow-hidden']"
									:title="m.name">
									<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
									<span v-else>{{ m.initials }}</span>
								</div>
								<div v-if="project.members.length > 3"
									class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel flex items-center justify-center text-sm font-bold text-text">
									+{{ project.members.length - 3 }}
								</div>
							</div>
						</td>
						<td class="hidden lg:table-cell px-4 py-4">
							<span class="text-sm font-medium" :class="due.cls">
								{{ due.label }}
							</span>
						</td>
						<td v-if="canUpdate || canArchive || canDelete" class="px-4 py-4" @click.stop>
							<div class="relative">
								<button type="button"
									:aria-expanded="openMenuId === project.id"
									aria-haspopup="menu"
									@click="toggleMenu(project.id)"
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
										<button v-if="canUpdate"
											@click.stop="openEditModal(project)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
											<v-icon name="bi-pencil" scale="0.85" /> Edit
										</button>
										<button v-if="canArchive"
											@click.stop="requestArchive(project.id)"
											class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
											<v-icon name="bi-archive" scale="0.85" /> Archive
										</button>
										<template v-if="canDelete">
											<div class="h-px bg-heading/5 mx-2" />
											<button
												@click.stop="requestDelete(project.id)"
												class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
												<v-icon name="bi-trash" scale="0.85" /> Delete
											</button>
										</template>
									</div>
								</Transition>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- ── Infinite scroll sentinel ─────────────────── -->
		<div ref="sentinel" class="h-1"></div>

		<!-- ── Skeleton: Grid (infinite scroll) ─────────────── -->
		<div v-if="store.loading && store.projects.length > 0 && viewMode === 'grid'"
			class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
			<div v-for="n in 3" :key="n"
				class="bg-panel rounded-sm border border-heading/8 overflow-hidden flex flex-col animate-pulse">
				<div class="h-1 w-full bg-heading/10" />
				<div class="p-5 flex-1">
					<div class="flex items-start justify-between mb-3">
						<div class="w-10 h-10 rounded-sm bg-heading/10" />
						<div class="w-20 h-6 rounded-full bg-heading/10" />
					</div>
					<div class="h-4 bg-heading/10 rounded w-3/4 mb-2" />
					<div class="h-3 bg-heading/8 rounded w-full mb-1" />
					<div class="h-3 bg-heading/8 rounded w-5/6 mb-4" />
					<div class="mb-4">
						<div class="h-1.5 bg-heading/8 rounded-full w-full" />
					</div>
					<div class="flex gap-2">
						<div class="h-6 w-24 rounded-full bg-heading/8" />
						<div class="h-6 w-16 rounded-full bg-heading/8" />
					</div>
				</div>
				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between">
					<div class="flex -space-x-2">
						<div v-for="a in 3" :key="a" class="w-10 h-10 rounded-full bg-heading/10 border-2 border-panel" />
					</div>
					<div class="h-4 w-16 rounded bg-heading/8" />
				</div>
			</div>
		</div>

		<!-- ── Skeleton: List (infinite scroll) ──────────────── -->
		<div v-if="store.loading && store.projects.length > 0 && viewMode === 'list'"
			class="bg-panel rounded-sm border border-heading/8 overflow-hidden animate-pulse">
			<div v-for="n in 3" :key="n"
				class="flex items-center gap-4 px-5 py-4 border-b border-heading/5 last:border-0">
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<div class="w-8 h-8 rounded-sm bg-heading/10 shrink-0" />
					<div class="space-y-1.5 flex-1">
						<div class="h-3.5 bg-heading/10 rounded w-2/5" />
						<div class="h-3 bg-heading/8 rounded w-3/5" />
					</div>
				</div>
				<div class="h-6 w-24 rounded-full bg-heading/10 shrink-0" />
				<div class="h-6 w-16 rounded-full bg-heading/8 shrink-0" />
				<div class="flex items-center gap-2 w-36 shrink-0">
					<div class="flex-1 h-1.5 bg-heading/8 rounded-full" />
					<div class="h-3 w-8 rounded bg-heading/8" />
				</div>
				<div class="h-3 w-10 rounded bg-heading/8 shrink-0" />
				<div class="flex -space-x-1.5 shrink-0">
					<div v-for="a in 3" :key="a" class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
				</div>
				<div class="h-3 w-14 rounded bg-heading/8 shrink-0" />
			</div>
		</div>

		<ConfirmModal
			:show="showArchiveConfirm"
			title="Archive Project?"
			message="This project will be moved to the archive. You can restore it at any time from the Archived Projects page."
			icon="bi-archive"
			icon-bg="bg-amber-50 dark:bg-amber-500/10"
			icon-color="text-amber-500"
			confirm-label="Archive"
			confirming-label="Archiving…"
			confirm-bg="bg-amber-500 hover:bg-amber-600"
			:loading="archiving"
			@close="showArchiveConfirm = false"
			@confirm="handleArchive" />

		<ConfirmModal
			:show="showDeleteConfirm"
			title="Delete Project?"
			message="This action cannot be undone. All tasks, comments, and files associated with this project will be permanently removed."
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deleting"
			@close="showDeleteConfirm = false"
			@confirm="handleDelete" />

		<!-- ── PROJECT FORM MODAL (shared create/edit) ─── -->
		<ProjectFormModal
			:show="showFormModal"
			:mode="formMode"
			:project="editingProject"
			:saving="store.saving"
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
	transform: scale(0.97);
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