<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useCommentStore } from '@/stores/useCommentStore'
import { useToast } from '@/utils/toast'
import { sanitize } from '@/utils/sanitize'
import { addIcons } from 'oh-vue-icons'
import {
	BiPencil, BiThreeDotsVertical, BiPlus, BiCheck2, BiX,
	BiPeople, BiCalendar3, BiClock, BiChevronRight,
	BiPersonPlus, BiKanban, BiBarChart, BiFileEarmark,
	BiActivity, BiChat, BiArchive, BiTrash, BiFiles,
	MdFolderspecialOutlined,
} from 'oh-vue-icons/icons'

import ProjectBoardTab from '@/components/projects/ProjectBoardTab.vue'
import ProjectOverviewTab from '@/components/projects/ProjectOverviewTab.vue'
import ProjectFilesTab from '@/components/projects/ProjectFilesTab.vue'
import ProjectCommentsTab from '@/components/projects/ProjectCommentsTab.vue'
import ProjectActivityTab from '@/components/projects/ProjectActivityTab.vue'
import AddTaskModal from '@/components/projects/AddTaskModal.vue'
import AddMemberModal from '@/components/projects/AddMemberModal.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

addIcons(
	BiPencil, BiThreeDotsVertical, BiPlus, BiCheck2, BiX,
	BiPeople, BiCalendar3, BiClock, BiChevronRight,
	BiPersonPlus, BiKanban, BiBarChart, BiFileEarmark,
	BiActivity, BiChat, BiArchive, BiTrash, BiFiles,
	MdFolderspecialOutlined,
)

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const store = useProjectStore()
const commentStore = useCommentStore()
const { successToast, errorToast } = useToast()

const canViewFiles      = computed(() => auth.hasCapability('files.view'))
const canViewActivity   = computed(() => auth.hasCapability('activity.view'))
const canUploadFiles    = computed(() => auth.hasCapability('files.upload'))
const canCreateTask     = computed(() => auth.hasCapability('tasks.create'))
const canUpdate         = computed(() => auth.hasCapability('projects.update'))
const canArchive        = computed(() => auth.hasCapability('projects.archive'))
const canDelete         = computed(() => auth.hasCapability('projects.delete'))
const canManageMembers  = computed(() => auth.hasCapability('projects.members.manage'))
const hasAnyAction      = computed(() => canUpdate.value || canArchive.value || canDelete.value)

// Comment capabilities
const canViewComments   = computed(() => auth.hasCapability('comments.view'))
const canCreateComment  = computed(() => auth.hasCapability('comments.create'))
const canEditComment    = computed(() => auth.hasCapability('comments.update'))
const canDeleteComment  = computed(() => auth.hasCapability('comments.delete'))
const canReactComment   = computed(() => auth.hasCapability('comments.react'))

// ── Project data (from store) ──────────────────────────
const memberColors = ['bg-accent', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500']

const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const project = computed(() => {
	const p = store.currentProject
	if (!p) return null
	return {
		...p,
		startDate: p.start_date,
		endDate: p.end_date,
		members: (p.members ?? []).map((m, i) => ({
			...m,
			initials: getInitials(m.name),
			color: memberColors[i % memberColors.length],
		})),
	}
})


// ── Live progress — recalculates as tasks change status ──
const liveProgress = computed(() => {
	const tasks = store.tasks
	if (!tasks.length) return project.value?.progress ?? 0
	const done = tasks.filter(t => t.status === 'Done').length
	return Math.round((done / tasks.length) * 100)
})

// ── Activity (populated when activity API is implemented) ──
const recentActivity = ref([])

// ── Status config ─────────────────────────────────────
const statusConfig = {
	'Planning': { cls: 'bg-slate-400/15 text-slate-500', dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent', dot: 'bg-accent animate-pulse' },
	'On Hold': { cls: 'bg-amber-500/15 text-amber-600', dot: 'bg-amber-500' },
	'Completed': { cls: 'bg-emerald-500/15 text-emerald-600', dot: 'bg-emerald-500' },
}

// ── Tabs with URL query persistence ───────────────────
const allTabs = [
	{ key: 'board', label: 'Board', icon: 'bi-kanban', requiredCap: null },
	{ key: 'overview', label: 'Overview', icon: 'bi-bar-chart', requiredCap: null },
	{ key: 'files', label: 'Files', icon: 'bi-file-earmark', requiredCap: 'files.view' },
	{ key: 'comments', label: 'Comments', icon: 'bi-chat', requiredCap: 'comments.view' },
	{ key: 'activity', label: 'Activity', icon: 'bi-activity', requiredCap: 'activity.view' },
]
const tabs = computed(() =>
	allTabs.filter(t => !t.requiredCap || auth.hasCapability(t.requiredCap))
)

const activeTab = ref('board')

// Sync from query on mount and route changes
const syncTabFromQuery = () => {
	const q = route.query.tab
	const visible = tabs.value.some(t => t.key === q)
	activeTab.value = (typeof q === 'string' && visible) ? q : (tabs.value[0]?.key || 'board')
}

watch(() => route.query.tab, syncTabFromQuery)

// Re-sync whenever the visible tab set changes (permissions can load
// async, so the first sync on mount may pick the wrong default).
watch(tabs, (val) => {
	if (!val.length) return
	if (!val.some(t => t.key === activeTab.value)) {
		syncTabFromQuery()
	}
}, { immediate: true })

// Lazy-load comments on first open
const commentsFetched = ref(false)
watch(activeTab, (tab) => {
	if (tab === 'comments' && !commentsFetched.value && store.currentProject) {
		commentsFetched.value = true
		commentStore.fetchComments(store.currentProject.id)
	}
})

const setActiveTab = (key) => {
	if (key === activeTab.value) return
	activeTab.value = key
	router.replace({ query: { ...route.query, tab: key } })
}

// ── Stats used in hero strip ───────────────────────────
const daysLeft = computed(() => Math.ceil((new Date(project.value.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Robust empty-description check: handles '', '<p></p>', '<p><br></p>',
// whitespace-only, and HTML that strips to nothing.
const hasDescription = computed(() => {
	const raw = project.value.description
	if (!raw) return false
	const stripped = String(raw).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
	return stripped.length > 0
})

// ── Add Task modal ─────────────────────────────────────
const showAddTask = ref(false)
const addTaskDefaultStatus = ref('Todo')

const openAddTaskModal = (status = 'Todo') => {
	addTaskDefaultStatus.value = status
	showAddTask.value = true
}

const addingTask = ref(false)
const handleAddTaskSave = async (data) => {
	addingTask.value = true
	const result = await store.createTask(project.value.id, data)
	addingTask.value = false
	if (result.success) {
		showAddTask.value = false
	} else {
		errorToast(result.message)
	}
}

const handleAddTaskClick = (status) => {
	setActiveTab('board')
	openAddTaskModal(status || 'Todo')
}


const openTask = (taskId) => router.push({ name: 'task-detail', params: { id: route.params.id, taskId } })

// ── Add Member modal ──────────────────────────────────
const showAddMember = ref(false)
const addingMembers = ref(false)
const openAddMember = () => { showAddMember.value = true }
const handleAddMembers = async (people) => {
	addingMembers.value = true
	const result = await store.addMembers(project.value.id, people)
	addingMembers.value = false
	if (result.success) {
		showAddMember.value = false
	} else {
		errorToast(result.message)
	}
}

const handleRemoveMember = async (userId) => {
	const result = await store.removeMember(project.value.id, userId)
	if (!result.success) {
		errorToast(result.message)
	}
}

// ── Edit Project modal ────────────────────────────────
const showEditProject = ref(false)
const editFocusField = ref(null)

const openEditProject = (focus = null) => {
	editFocusField.value = focus
	showEditProject.value = true
	moreMenuOpen.value = false
}

const handleEditProjectSave = async (data) => {
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

	const result = await store.updateProject(project.value.id, payload)

	if (result.success) {
		successToast(result.message)
		showEditProject.value = false
	} else {
		errorToast(result.message)
	}
}

// ── More menu (three dots) ────────────────────────────
const moreMenuOpen = ref(false)
const toggleMoreMenu = (e) => {
	e?.stopPropagation()
	moreMenuOpen.value = !moreMenuOpen.value
}
const closeMoreMenu = () => { moreMenuOpen.value = false }

// Single mount hook: wire the outside-click listener and sync tabs once
// the component is actually in the DOM.
onMounted(async () => {
	document.addEventListener('click', closeMoreMenu)
	await Promise.all([
		store.fetchProject(route.params.id),
		store.fetchTasks(route.params.id),
	])
	syncTabFromQuery()
})
onBeforeUnmount(() => {
	document.removeEventListener('click', closeMoreMenu)
	commentStore.clearComments()
})

// ── Task reorder (drag — handles both status change + sort order) ──
const handleTasksReordered = (orders) => {
	store.reorderTasks(project.value.id, orders)
}

// ── Task delete ───────────────────────────
const showDeleteTaskConfirm = ref(false)
const taskToDelete = ref(null)
const deletingTask = ref(false)

const requestDeleteTask = (taskId) => {
	taskToDelete.value = taskId
	showDeleteTaskConfirm.value = true
}

const handleDeleteTask = async () => {
	deletingTask.value = true
	const result = await store.deleteTask(project.value.id, taskToDelete.value)
	deletingTask.value = false
	showDeleteTaskConfirm.value = false
	taskToDelete.value = null
	if (!result.success) errorToast(result.message)
}

// ── Archive / Delete  confirm ──────────────
const showArchiveConfirm = ref(false)
const showDeleteConfirm = ref(false)
const archiving = ref(false)
const deleting = ref(false)

const requestArchive = () => {
	moreMenuOpen.value = false
	showArchiveConfirm.value = true
}
const handleArchive = async () => {
	archiving.value = true
	const result = await store.archiveProject(project.value.id)
	archiving.value = false
	showArchiveConfirm.value = false
	if (result.success) {
		successToast(result.message)
		router.push({ name: 'projects' })
	} else {
		errorToast(result.message)
	}
}

const requestDelete = () => {
	moreMenuOpen.value = false
	showDeleteConfirm.value = true
}
const handleDelete = async () => {
	deleting.value = true
	const result = await store.deleteProject(project.value.id)
	deleting.value = false
	showDeleteConfirm.value = false
	if (result.success) {
		successToast(result.message)
		router.push({ name: 'projects' })
	} else {
		errorToast(result.message)
	}
}

</script>

<template>
	<div class="pb-20 pt-8">

		<!-- ════════════════════════════════════════════ -->
		<!-- SKELETON LOADER                             -->
		<!-- ════════════════════════════════════════════ -->
		<div v-if="store.loadingProject" class="animate-pulse">
			<!-- Breadcrumb skeleton -->
			<div class="flex items-center gap-1.5 mb-4">
				<div class="h-3 w-16 bg-heading/10 rounded" />
				<div class="h-3 w-3 bg-heading/10 rounded" />
				<div class="h-3 w-36 bg-heading/10 rounded" />
			</div>

			<!-- Hero section -->
			<div class="bg-panel border border-heading/8 rounded-t-sm px-6 pt-5 pb-0">
				<!-- Title row skeleton -->
				<div class="flex flex-wrap gap-5 items-start justify-between mb-4">
					<div class="flex items-start gap-4 flex-1 min-w-0">
						<div class="w-12 h-12 rounded-sm bg-heading/10 shrink-0" />
						<div class="flex-1 space-y-2 pt-1">
							<div class="h-5 w-56 bg-heading/10 rounded" />
							<div class="h-3 w-24 bg-heading/10 rounded" />
						</div>
					</div>
					<!-- Add Task button skeleton -->
					<div class="h-10 w-28 bg-heading/10 rounded-sm shrink-0" />
				</div>
				<!-- Description skeleton -->
				<div class="space-y-2 mb-4 px-2">
					<div class="h-3 w-full bg-heading/10 rounded" />
					<div class="h-3 w-5/6 bg-heading/10 rounded" />
					<div class="h-3 w-3/4 bg-heading/10 rounded" />
				</div>
				<!-- Progress + meta strip skeleton -->
				<div class="flex flex-wrap items-center gap-5 mb-5">
					<div class="h-1.5 w-52 bg-heading/10 rounded-full" />
					<div class="h-3 w-40 bg-heading/10 rounded" />
					<div class="h-3 w-28 bg-heading/10 rounded" />
					<!-- Member avatars skeleton -->
					<div class="flex items-center ml-auto">
						<div v-for="n in 4" :key="n" class="w-12 h-12 rounded-full bg-heading/10 border-2 border-panel -ml-4 first:ml-0" />
						<div class="w-12 h-12 rounded-full bg-heading/10 border-2 border-dashed border-heading/20 -ml-1.5" />
					</div>
				</div>
				<!-- Tab bar skeleton -->
				<div class="flex items-center gap-1 flex-wrap">
					<div v-for="n in 5" :key="n" class="h-10 w-24 bg-heading/10 rounded-sm" />
				</div>
			</div>

			<!-- Tab content panel skeleton (Board tab = default) -->
			<div class="bg-panel border border-heading/8 rounded-b-sm mt-0.5 p-4 md:p-5">
				<!-- Stat strip (4 cards) -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
					<div v-for="n in 4" :key="n" class="bg-heading/5 rounded-sm border border-heading/5 px-4 py-3 flex items-center gap-3">
						<div class="w-12 h-12 rounded-sm bg-heading/10 shrink-0" />
						<div class="space-y-1.5">
							<div class="h-5 w-10 bg-heading/10 rounded" />
							<div class="h-3 w-16 bg-heading/8 rounded" />
						</div>
					</div>
				</div>
				<!-- Toolbar skeleton -->
				<div class="bg-heading/5 rounded-sm border border-heading/5 p-3.5 mb-4">
					<div class="flex flex-wrap items-center gap-2.5">
						<div class="h-9 w-full max-w-xs bg-heading/10 rounded-sm" />
						<div class="h-9 w-36 bg-heading/10 rounded-sm" />
						<div class="h-9 w-36 bg-heading/10 rounded-sm" />
						<div class="flex-1 hidden sm:block" />
						<div class="h-9 w-36 bg-heading/10 rounded-sm" />
					</div>
				</div>
				<!-- Board columns skeleton (4 columns) -->
				<div class="grid grid-cols-4 gap-4">
					<div v-for="n in 4" :key="n" class="rounded-sm border border-heading/5">
						<!-- Column header -->
						<div class="px-3.5 py-3 bg-heading/5 rounded-t-sm flex items-center gap-2">
							<div class="w-2.5 h-2.5 rounded-full bg-heading/10" />
							<div class="h-3 w-20 bg-heading/10 rounded" />
							<div class="ml-auto w-5 h-5 bg-heading/10 rounded" />
						</div>
						<!-- Column body with task cards -->
						<div class="p-2 space-y-2">
							<div v-for="i in 3" :key="i" class="bg-panel rounded-sm border border-heading/8 p-3">
								<div class="h-3 w-full bg-heading/8 rounded mb-2" />
								<div class="h-3 w-4/5 bg-heading/8 rounded mb-3" />
								<div class="flex items-center justify-between">
									<div class="h-4 w-12 bg-heading/8 rounded-full" />
									<div class="flex -space-x-1.5">
										<div class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
										<div class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
									</div>
								</div>
							</div>
							<!-- Empty drop zone -->
							<div class="min-h-[64px] border-2 border-dashed border-heading/8 rounded-sm" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ════════════════════════════════════════════ -->
		<!-- ERROR STATE                                 -->
		<!-- ════════════════════════════════════════════ -->
		<div v-else-if="store.projectError"
			class="flex flex-col items-center justify-center py-24 gap-4 text-center">
			<div class="w-14 h-14 rounded-sm bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
				<v-icon name="bi-x" class="text-red-500" scale="1.6" />
			</div>
			<p class="text-base font-semibold text-heading">{{ store.projectError }}</p>
			<button @click="router.push({ name: 'projects' })" class="tazko-btn-outline">
				Back to Projects
			</button>
		</div>

		<!-- ════════════════════════════════════════════ -->
		<!-- HERO + TAB BAR                              -->
		<!-- ════════════════════════════════════════════ -->
		<template v-else-if="store.currentProject">

		<!-- Breadcrumb -->
		<div class="flex items-center gap-1.5 mb-4">
			<button @click="router.push({ name: 'projects' })"
				class="text-sm font-medium text-text hover:text-accent transition-colors">
				Projects
			</button>
			<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
			<span class="text-sm font-semibold text-text">{{ project.name }}</span>
		</div>

		<!-- Hero panel -->
		<div class="relative rounded-t-sm">
			<div class="absolute inset-0 bg-accent/8" />
			<div class="absolute inset-0 bg-panel/80 backdrop-blur-sm border border-b-0 border-heading/8 rounded-t-sm" />

			<div class="relative px-6 pt-5">

				<!-- Title row -->
				<div class="flex flex-wrap gap-5 items-start justify-between mb-4">
					<div class="flex items-start gap-4 flex-1 min-w-0">
						<div
							:class="[project.color || 'bg-accent', 'w-12 h-12 rounded-sm flex items-center justify-center shrink-0 shadow-lg']">
							<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.3" />
						</div>

						<div class="min-w-0 flex-1">
							<!-- Title — edit via three-dot menu -->
							<div class="flex items-start gap-2.5 flex-wrap mb-2">
								<h1 class="page-title">{{ project.name }}</h1>
								<span
									:class="[statusConfig[project.status]?.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-bold border border-current/10']">
									<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
									{{ project.status }}
								</span>
							</div>
						</div>
					</div>

					<!-- Action buttons -->
					<div class="flex items-center gap-2 shrink-0 mt-1">
						<button v-if="canCreateTask" @click="handleAddTaskClick('Todo')" class="tazko-btn shadow-md shadow-accent/20">
							<v-icon name="bi-plus" scale="0.9" />
							Add Task
						</button>

						<!-- More menu (three dots) — only shown if user has at least one action -->
						<div v-if="hasAnyAction" class="relative" @click.stop>
							<button
								@click="toggleMoreMenu"
								class="p-2 rounded-sm border border-heading/10 text-text hover:text-heading hover:bg-heading/5 transition-all"
								title="More actions">
								<v-icon name="bi-three-dots-vertical" scale="0.9" />
							</button>
							<Transition
								enter-active-class="transition-all duration-150 ease-in-out"
								leave-active-class="transition-all duration-150 ease-in-out"
								enter-from-class="opacity-0 -translate-y-1.5"
								leave-to-class="opacity-0 -translate-y-1.5">
								<div v-if="moreMenuOpen"
									class="absolute right-0 top-full mt-1 w-52 bg-panel rounded-sm border border-heading/10 shadow-xl z-30 overflow-hidden">
									<button v-if="canUpdate" @click="openEditProject()"
										class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
										<v-icon name="bi-pencil" scale="0.85" /> Edit Project
									</button>
									<button v-if="canArchive" @click="requestArchive"
										class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
										<v-icon name="bi-archive" scale="0.85" /> Archive
									</button>
									<div v-if="canDelete && (canUpdate || canArchive)" class="h-px bg-heading/5 mx-2" />
									<button v-if="canDelete" @click="requestDelete"
										class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
										<v-icon name="bi-trash" scale="0.85" /> Delete
									</button>
								</div>
							</Transition>
						</div>
					</div>
				</div>

				<!-- Description — edit via three-dot menu -->
				<div class="rounded-sm mb-4">
					<div v-if="hasDescription"
						class="project-rich-content px-2 py-1 -ml-2" v-html="sanitize(project.description)" />
					<p v-else class="text-sm text-text italic opacity-60 px-2 py-1 -ml-2">
						No description yet.
					</p>
				</div>

				<!-- Progress + meta strip -->
				<div class="flex flex-wrap items-center gap-5 mb-5">
					<div class="flex items-center gap-2.5 min-w-52">
						<div class="flex-1 h-1.5 bg-heading/10 rounded-full overflow-hidden">
							<div class="h-full bg-accent rounded-full transition-all duration-700"
								:style="`width:${liveProgress}%`" />
						</div>
						<span class="text-sm font-bold text-heading tabular-nums">{{ liveProgress }}%</span>
					</div>
					<div class="flex items-center gap-1.5 text-sm text-text">
						<v-icon name="bi-calendar3" scale="0.75" />
						{{ formatDate(project.startDate) }} → {{ formatDate(project.endDate) }}
					</div>
					<div class="flex items-center gap-1.5 text-sm"
						:class="daysLeft <= 14 ? 'text-amber-500 font-semibold' : 'text-text'">
						<v-icon name="bi-clock" scale="0.75" />
						{{ daysLeft > 0 ? `${daysLeft} days remaining` : 'Past deadline' }}
					</div>

					<!-- Member avatars -->
					<div class="flex items-center ml-auto">
						<div v-for="(m, i) in project.members" :key="m.id"
							class="relative group -ml-4 first:ml-0"
							:style="`z-index: ${project.members.length - i}`">
							<div :class="[!m.avatar && m.color, 'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel shadow-sm hover:scale-110 transition-transform cursor-pointer overflow-hidden']"
								:title="`${m.name}${m.role ? ' — ' + m.role : ''}`">
								<img v-if="m.avatar" :src="m.avatar" class="w-full h-full object-cover" :alt="m.name" />
								<span v-else>{{ m.initials }}</span>
							</div>
							<button v-if="canManageMembers" @click="handleRemoveMember(m.id)"
								class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible flex items-center justify-center shadow-sm z-10 transition-all"
								:title="`Remove ${m.name}`">
								<v-icon name="bi-x" scale="0.8" />
							</button>
						</div>
						<button v-if="canManageMembers" @click="openAddMember"
							class="w-12 h-12 rounded-full border-2 border-dashed border-heading/20 flex items-center justify-center bg-panel -ml-1.5 text-text hover:text-accent hover:border-accent/40 transition-all"
							title="Add member">
							<v-icon name="bi-person-plus" scale="1" />
						</button>
					</div>
				</div>

				<!-- Tab bar -->
				<div class="flex items-center gap-1 flex-wrap">
					<button v-for="tab in tabs" :key="tab.key" @click="setActiveTab(tab.key)" :class="[
						'inline-flex items-center gap-1.5 px-4 py-3 text-base font-semibold transition-all border-b-2 -mb-px select-none',
						activeTab === tab.key
							? 'text-accent border-accent'
							: 'text-text border-transparent hover:text-heading hover:border-heading/15',
					]">
						<v-icon :name="tab.icon" scale="0.85" />
						{{ tab.label }}
					</button>
				</div>

			</div>
		</div>

		<!-- ════════════════════════════════════════════ -->
		<!-- TAB CONTENT PANEL                           -->
		<!-- ════════════════════════════════════════════ -->
		<div class="bg-panel border border-heading/8 rounded-sm">

			<ProjectBoardTab
				v-show="activeTab === 'board'"
				:tasks="store.tasks"
				:members="project.members"
				@open-task="openTask"
				@add-task-click="openAddTaskModal"
				@tasks-reordered="handleTasksReordered"
				@delete-task="requestDeleteTask" />

			<ProjectOverviewTab
				v-show="activeTab === 'overview'"
				:project="project"
				:progress="liveProgress"
				:tasks="store.tasks"
				:activity="recentActivity"
				:can-manage-members="canManageMembers"
				@add-member-click="openAddMember" />

			<ProjectFilesTab
				v-if="canViewFiles"
				v-show="activeTab === 'files'"
				:project-id="project.id"
				:can-upload="canUploadFiles"
				:can-delete="canUploadFiles" />

			<ProjectCommentsTab
				v-if="canViewComments"
				v-show="activeTab === 'comments'"
				:project-id="project.id"
				:members="project.members"
				:can-create="canCreateComment"
				:can-edit="canEditComment"
				:can-delete="canDeleteComment"
				:can-react="canReactComment" />

			<ProjectActivityTab
				v-show="activeTab === 'activity'"
				:can-view="canViewActivity"
				:activity="recentActivity" />

		</div>

		</template>

		<!-- Modals -->
		<AddTaskModal
			:show="showAddTask"
			:members="project?.members ?? []"
			:default-status="addTaskDefaultStatus"
			:project-id="project?.id"
			:saving="addingTask"
			@close="showAddTask = false"
			@save="handleAddTaskSave" />

		<AddMemberModal
			:show="showAddMember"
			:existing-members="project?.members ?? []"
			:saving="addingMembers"
			@close="showAddMember = false"
			@add="handleAddMembers" />

		<ProjectFormModal
			:show="showEditProject"
			mode="edit"
			:project="project ?? {}"
			:focus-field="editFocusField"
			:saving="store.saving"
			@close="showEditProject = false"
			@save="handleEditProjectSave" />

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
			message="This action cannot be undone. All tasks, comments, and files associated with this project will be permanently deleted."
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deleting"
			@close="showDeleteConfirm = false"
			@confirm="handleDelete" />

		<ConfirmModal
			:show="showDeleteTaskConfirm"
			title="Delete Task?"
			message="This task will be permanently deleted and cannot be recovered."
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deletingTask"
			@close="showDeleteTaskConfirm = false"
			@confirm="handleDeleteTask" />

	</div>
</template>

<style scoped>
/* Rich content — saved HTML from RichTextEditor */
:deep(.project-rich-content) {
	font-size: 0.875rem;
	line-height: 1.65;
	color: var(--color-text, #333);
}
:deep(.project-rich-content p) { margin: 0 0 0.35em 0; }
:deep(.project-rich-content p:last-child) { margin-bottom: 0; }
:deep(.project-rich-content h1) { font-size: 1.7em; font-weight: 700; color: var(--color-heading, #111); margin: 0.6em 0 0.3em; }
:deep(.project-rich-content strong) { font-weight: 700; }
:deep(.project-rich-content code) { font-family: 'Fira Code', monospace; font-size: 0.82em; background: rgba(99, 102, 241, 0.1); padding: 0.15em 0.4em; border-radius: 5px; color: #6366f1; }
:deep(.project-rich-content a) { color: var(--color-accent, #6366f1); text-decoration: underline; }

:deep([data-file-attachment]) {
	margin: 8px 0;
	display: block;
}
:deep(.file-attachment-wrapper) {
	position: relative;
	margin: 8px 0;
}
:deep(.file-attachment-wrapper .inline-flex) {
	border-radius: 8px;
}
:deep(.file-attachment-image),
:deep(.file-attachment-video),
:deep(.file-attachment-audio) {
	max-width: 100%;
	border-radius: 6px;
}
:deep(.file-attachment-image) { max-height: 320px; object-fit: contain; }
:deep(.file-attachment-video) { max-height: 320px; background: #000; }
:deep(.relative.w-full.max-w-\\[320px\\]) {
	cursor: pointer;
}
:deep(.file-attachment-delete) {
	position: absolute;
	top: -8px;
	right: -8px;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: #ef4444;
	color: white;
	border: 2px solid #fff;
	cursor: pointer;
	display: none;
	align-items: center;
	justify-content: center;
	padding: 0;
	z-index: 2;
}
:deep(.file-attachment-wrapper:hover) .file-attachment-delete { display: flex; }

/* Media embed */
:deep([data-media-embed]) {
	margin: 12px 0;
	display: block;
}
:deep(div[data-node-view-wrapper]) {
	display: block;
}
:deep([data-node-view-wrapper]:not(.file-attachment-wrapper) .me-aspect) {
	position: relative;
	width: 100%;
	padding-top: 56.25%;
	background: #000;
	border-radius: 6px;
	overflow: hidden;
}
:deep(.me-iframe) {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: none;
}
:deep(.me-thumbnail) {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #111;
}
:deep(.me-play-btn) {
	position: relative;
	z-index: 2;
	width: 72px;
	height: 72px;
	background: rgba(0, 0, 0, 0.65);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	cursor: pointer;
}
:deep(.me-platform-badge) {
	position: absolute;
	top: 10px;
	left: 10px;
	z-index: 3;
	background: rgba(0, 0, 0, 0.6);
	color: #fff;
	font-size: 0.7rem;
	font-weight: 700;
	padding: 3px 8px;
	border-radius: 4px;
}
:deep(.me-caption) {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	background: rgba(var(--color-heading-rgb, 17, 17, 17), 0.04);
	border-top: 1px solid rgba(var(--color-heading-rgb, 17, 17, 17), 0.08);
}
:deep(.me-caption-label) {
	font-size: 0.72rem;
	font-weight: 700;
	color: var(--color-accent, #6366f1);
}
:deep(.me-caption-link) {
	font-size: 0.72rem;
	color: #888;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-decoration: none;
}
</style>
