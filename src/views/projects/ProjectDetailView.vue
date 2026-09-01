<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useCommentStore } from '@/stores/useCommentStore'
import { useToast } from '@/utils/toast'
import { paletteColor } from '@/utils/paletteColor'
import axios from '@/axios'
import { addIcons } from 'oh-vue-icons'
import {
	BiX, BiKanban, BiBarChart, BiFileEarmark, BiActivity, BiChat,
} from 'oh-vue-icons/icons'

import ProjectDetailSkeleton from '@/components/projects/ProjectDetailSkeleton.vue'
import ProjectDetailHero from '@/components/projects/ProjectDetailHero.vue'
import ProjectBoardTab from '@/components/projects/ProjectBoardTab.vue'
import ProjectOverviewTab from '@/components/projects/ProjectOverviewTab.vue'
import ProjectFilesTab from '@/components/projects/ProjectFilesTab.vue'
import ProjectCommentsTab from '@/components/projects/ProjectCommentsTab.vue'
import ProjectActivityTab from '@/components/projects/ProjectActivityTab.vue'
import AddTaskModal from '@/components/projects/AddTaskModal.vue'
import AddMemberModal from '@/components/projects/AddMemberModal.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

addIcons(BiX, BiKanban, BiBarChart, BiFileEarmark, BiActivity, BiChat)

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

// Comment capabilities
const canViewComments   = computed(() => auth.hasCapability('comments.view'))
const canCreateComment  = computed(() => auth.hasCapability('comments.create'))
const canEditComment    = computed(() => auth.hasCapability('comments.update'))
const canDeleteComment  = computed(() => auth.hasCapability('comments.delete'))
const canReactComment   = computed(() => auth.hasCapability('comments.react'))

// ── Project data (from store) ──────────────────────────
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
		members: (p.members ?? []).map((m) => ({
			...m,
			initials: getInitials(m.name),
			color: paletteColor(m.palette),
		})),
	}
})

// ── Workspace users (for assignee auto-add feature) ──────
const allUsers = ref([])

const workspaceOnlyUsers = computed(() => {
	if (!project.value?.members) return []
	const memberIds = new Set(project.value.members.map(m => m.id))
	return allUsers.value
		.filter(u => !memberIds.has(u.id))
		.map(u => ({
			...u,
			initials: getInitials(u.name),
			color: paletteColor(u.palette),
		}))
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

// ── Add Task modal ─────────────────────────────────────
const showAddTask = ref(false)
const addTaskDefaultStatus = ref('Todo')

const openAddTaskModal = (status = 'Todo') => {
	addTaskDefaultStatus.value = status
	showAddTask.value = true
}

const addingTask = ref(false)
const handleAddTaskSave = async (data) => {
	const { _newMembers, ...payload } = data
	addingTask.value = true
	const result = await store.createTask(project.value.id, payload)
	addingTask.value = false
	if (result.success) {
		showAddTask.value = false
		if (_newMembers?.length) {
			_newMembers.forEach(m => successToast(`${m.name} added to project and assigned`))
		}
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
	const [, , usersRes] = await Promise.allSettled([
		store.fetchProject(route.params.id),
		store.fetchTasks(route.params.id),
		axios.get('/api/users', { params: { per_page: 500 } }),
	])
	if (usersRes.status === 'fulfilled') {
		allUsers.value = usersRes.value.data.data ?? []
	}
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

		<!-- SKELETON LOADER -->
		<ProjectDetailSkeleton v-if="store.loadingProject" />

		<!-- ERROR STATE -->
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

		<!-- HERO + TAB BAR + TAB CONTENT -->
		<template v-else-if="store.currentProject && project">

			<ProjectDetailHero
				:project="project"
				:live-progress="liveProgress"
				:tabs="tabs"
				:active-tab="activeTab"
				:more-menu-open="moreMenuOpen"
				:can-create-task="canCreateTask"
				:can-update="canUpdate"
				:can-archive="canArchive"
				:can-delete="canDelete"
				:can-manage-members="canManageMembers"
				@add-task="handleAddTaskClick"
				@toggle-more-menu="toggleMoreMenu"
				@edit="openEditProject()"
				@archive="requestArchive"
				@delete="requestDelete"
				@add-member="openAddMember"
				@remove-member="handleRemoveMember"
				@set-active-tab="setActiveTab" />

			<!-- TAB CONTENT PANEL -->
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
			:workspace-users="workspaceOnlyUsers"
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
