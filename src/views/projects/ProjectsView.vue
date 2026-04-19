<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import { BiPlusCircle, BiArchive, MdFolderspecialOutlined } from 'oh-vue-icons/icons'

import ProjectFormModal   from '@/components/projects/ProjectFormModal.vue'
import ConfirmModal       from '@/components/ui/ConfirmModal.vue'
import ProjectStatsCards  from '@/components/projects/ProjectStatsCards.vue'
import ProjectsToolbar    from '@/components/projects/ProjectsToolbar.vue'
import ProjectCard        from '@/components/projects/ProjectCard.vue'
import ProjectListTable   from '@/components/projects/ProjectListTable.vue'
import ProjectsSkeletons  from '@/components/projects/ProjectsSkeletons.vue'

import { useProjectStore } from '@/stores/useProjectStore'
import { useAuthStore }    from '@/stores/useAuthStore'
import { useToast }        from '@/utils/toast'
import { paletteColor }    from '@/utils/paletteColor'

addIcons(BiPlusCircle, BiArchive, MdFolderspecialOutlined)

const router = useRouter()
const store  = useProjectStore()
const auth   = useAuthStore()
const { successToast, errorToast } = useToast()

const canCreate  = computed(() => auth.hasCapability('projects.create'))
const canUpdate  = computed(() => auth.hasCapability('projects.update'))
const canArchive = computed(() => auth.hasCapability('projects.archive'))
const canDelete  = computed(() => auth.hasCapability('projects.delete'))

// ── Local UI state ───────────────────────────────────────
const viewMode        = ref('grid')
const searchQuery     = ref('')
const statusFilter    = ref('All')
const priorityFilter  = ref('All')
const showFormModal   = ref(false)
const formMode        = ref('create')
const editingProject  = ref(null)
const openMenuId      = ref(null)
const archivedCount   = ref(0)

// ── Modal helpers ────────────────────────────────────────
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

// ── Derived decoration (status/priority/due/color/members) ──
const projectColors = [
	'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500',
	'bg-sky-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-teal-500',
	'bg-orange-500', 'bg-pink-500',
]
const toInitials = (name) =>
	(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const statusConfig = {
	'Planning':    { cls: 'bg-slate-400/15 text-slate-500',     dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent',           dot: 'bg-accent' },
	'On Hold':     { cls: 'bg-amber-500/15 text-amber-600',     dot: 'bg-amber-500' },
	'Completed':   { cls: 'bg-emerald-500/15 text-emerald-600', dot: 'bg-emerald-500' },
}
const priorityConfig = {
	Urgent: { cls: 'bg-red-500/15 text-red-500' },
	High:   { cls: 'bg-amber-500/15 text-amber-600' },
	Medium: { cls: 'bg-blue-500/15 text-blue-500' },
	Low:    { cls: 'bg-slate-400/15 text-slate-500' },
}
const UNKNOWN_STATUS   = { cls: 'bg-slate-400/15 text-slate-500', dot: 'bg-slate-400' }
const UNKNOWN_PRIORITY = { cls: 'bg-slate-400/15 text-slate-500' }
const statusOf   = (s) => statusConfig[s]   || UNKNOWN_STATUS
const priorityOf = (p) => priorityConfig[p] || UNKNOWN_PRIORITY

const MS_PER_DAY = 86_400_000
const daysLeft = (endDate) => {
	if (!endDate) return { label: 'No due date', cls: 'text-text' }
	const diff = Math.ceil((new Date(endDate) - new Date()) / MS_PER_DAY)
	if (diff < 0)   return { label: 'Overdue',       cls: 'text-red-500' }
	if (diff === 0) return { label: 'Due today',     cls: 'text-red-500' }
	if (diff <= 7)  return { label: `${diff}d left`, cls: 'text-amber-500' }
	return { label: `${diff}d left`, cls: 'text-text' }
}

const getProjectColor = (project, idx) =>
	project.color || projectColors[idx % projectColors.length]

const decoratedProjects = computed(() =>
	store.projects.map((p, idx) => ({
		project: {
			...p,
			taskCounts: p.task_counts ?? { done: 0, total: 0 },
			members: (p.members ?? []).map(m => ({
				...m,
				initials: toInitials(m.name),
				color:    paletteColor(m.palette),
			})),
		},
		idx,
		color:    getProjectColor(p, idx),
		due:      daysLeft(p.end_date),
		status:   statusOf(p.status),
		priority: priorityOf(p.priority),
	}))
)

// ── Menu ────────────────────────────────────────────────
const toggleMenu = (id) => {
	openMenuId.value = openMenuId.value === id ? null : id
}

// ── Archive confirm ────────────────────────────────────
const showArchiveConfirm = ref(false)
const pendingArchiveId   = ref(null)
const archiving          = ref(false)
const requestArchive = (id) => {
	openMenuId.value = null
	pendingArchiveId.value = id
	showArchiveConfirm.value = true
}
const handleArchive = async () => {
	archiving.value = true
	const result = await store.archiveProject(pendingArchiveId.value)
	archiving.value = false
	if (result.success) successToast(result.message)
	else                errorToast(result.message)
	showArchiveConfirm.value = false
	pendingArchiveId.value = null
}

// ── Delete confirm ─────────────────────────────────────
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
	if (result.success) successToast(result.message)
	else                errorToast(result.message)
	showDeleteConfirm.value = false
	pendingDeleteId.value = null
}

// ── Sync local filter → store + reset page ────────────
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

// ── Empty-state "Clear filters" helper ────────────────
const clearFilters = () => {
	statusFilter.value   = 'All'
	priorityFilter.value = 'All'
	searchQuery.value    = ''
	store.filters.search   = ''
	store.filters.status   = ''
	store.filters.priority = ''
	store.reset()
}

// ── Intersection Observer (infinite scroll) ───────────
const sentinel = ref(null)
let observer = null
const setupObserver = () => {
	observer = new IntersectionObserver(
		([entry]) => { if (entry.isIntersecting) store.fetchNextPage() },
		{ rootMargin: '120px' },
	)
	if (sentinel.value) observer.observe(sentinel.value)
}

// ── Keyboard ──────────────────────────────────────────
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
	clearFilters()
	setupObserver()
})
onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	observer?.disconnect()
})

const openProject = (id) => router.push({ name: 'project-detail', params: { id } })
</script>

<template>
	<div class="pb-20 pt-8" @click="openMenuId = null">

		<!-- Header -->
		<div class="mb-8 flex items-end justify-between gap-4 flex-wrap">
			<div>
				<p class="page-eyebrow">Workspace</p>
				<h1 class="page-title">Projects</h1>
				<p class="page-subtitle">Manage your team's work across all active projects.</p>
			</div>
			<div class="flex items-center gap-2.5">
				<button
					@click.stop="router.push({ name: 'archived-projects' })"
					class="tazko-btn-outline">
					<v-icon name="bi-archive" scale="0.9" />
					Archived
					<span v-if="archivedCount > 0"
						class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-heading/10 text-sm font-bold text-text leading-none tabular-nums">
						{{ archivedCount }}
					</span>
				</button>
				<button v-if="canCreate" @click.stop="openCreateModal" class="tazko-btn shadow-lg shadow-accent/20">
					<v-icon name="bi-plus-circle" scale="0.9" />
					New Project
				</button>
			</div>
		</div>

		<ProjectStatsCards
			:total="store.meta.total"
			:active="store.meta.active_count"
			:completed="store.meta.completed_count"
			:avg-progress="store.meta.avg_progress" />

		<ProjectsToolbar
			v-model:search="searchQuery"
			v-model:statusFilter="statusFilter"
			v-model:priorityFilter="priorityFilter"
			v-model:viewMode="viewMode"
			:statuses="statuses"
			:priorities="priorities" />

		<!-- Initial-load skeletons -->
		<ProjectsSkeletons
			v-if="store.loading && store.projects.length === 0"
			:mode="viewMode"
			:count="6"
			header />

		<!-- Empty state -->
		<div v-else-if="!store.loading && store.projects.length === 0" class="text-center py-24">
			<div class="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
				<v-icon name="md-folderspecial-outlined" class="text-accent" scale="2" />
			</div>
			<h3 class="section-title mb-2">No projects found</h3>
			<p class="page-subtitle mb-6">Try adjusting your filters or create a new project.</p>
			<button @click="clearFilters"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Clear filters
			</button>
		</div>

		<!-- Grid view -->
		<div v-else-if="viewMode === 'grid'"
			class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
			<ProjectCard
				v-for="row in decoratedProjects" :key="row.project.id"
				:project="row.project"
				:color="row.color"
				:due="row.due"
				:status="row.status"
				:priority="row.priority"
				:menu-open="openMenuId === row.project.id"
				:can-update="canUpdate"
				:can-archive="canArchive"
				:can-delete="canDelete"
				@open="openProject(row.project.id)"
				@toggle-menu="toggleMenu(row.project.id)"
				@edit="openEditModal(row.project)"
				@archive="requestArchive(row.project.id)"
				@delete="requestDelete(row.project.id)" />
		</div>

		<!-- List view -->
		<ProjectListTable v-else
			:rows="decoratedProjects"
			:open-menu-id="openMenuId"
			:can-update="canUpdate"
			:can-archive="canArchive"
			:can-delete="canDelete"
			@open="openProject"
			@toggle-menu="toggleMenu"
			@edit="openEditModal"
			@archive="requestArchive"
			@delete="requestDelete" />

		<!-- Infinite-scroll sentinel -->
		<div ref="sentinel" class="h-1" />

		<!-- Infinite-scroll skeletons (more page loading) -->
		<div v-if="store.loading && store.projects.length > 0" class="mt-5">
			<ProjectsSkeletons :mode="viewMode" :count="3" />
		</div>

		<!-- Modals -->
		<ConfirmModal
			:show="showArchiveConfirm"
			title="Archive Project?"
			message="This project will be moved to the archive. You can restore it at any time from the Archived Projects page."
			icon="bi-archive"
			icon-bg="bg-amber-500/10"
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

		<ProjectFormModal
			:show="showFormModal"
			:mode="formMode"
			:project="editingProject"
			:saving="store.saving"
			@close="closeFormModal"
			@save="handleFormSave" />

	</div>
</template>
