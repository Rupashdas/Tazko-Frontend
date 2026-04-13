<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
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

const canViewFiles = computed(() => auth.hasCapability('files.view'))
const canViewActivity = computed(() => auth.hasCapability('activity.view'))
const canUploadFiles = computed(() => auth.hasCapability('files.upload'))

// ── Project data ──────────────────────────────────────
const project = ref({
	id: route.params.id,
	name: 'Tazko App',
	description: 'Main project management SaaS — full-stack development including Vue.js frontend, Laravel API backend, authentication, role & permission system, and task management.',
	status: 'In Progress',
	priority: 'High',
	progress: 62,
	startDate: '2026-01-15',
	endDate: '2026-06-30',
	goal: 'Build a complete, production-ready project management platform for teams of all sizes.',
	color: 'bg-accent',
	members: [
		{ initials: 'AH', name: 'Arif Hossain', role: 'Project Manager', color: 'bg-accent' },
		{ initials: 'SK', name: 'Sara Khan', role: 'Frontend Dev', color: 'bg-violet-500' },
		{ initials: 'NR', name: 'Noman Rahman', role: 'Backend Dev', color: 'bg-emerald-500' },
		{ initials: 'DM', name: 'Dina Malik', role: 'Designer', color: 'bg-amber-500' },
		{ initials: 'KU', name: 'Karim Uddin', role: 'QA Engineer', color: 'bg-rose-500' },
	],
})

// ── Tasks ─────────────────────────────────────────────
const tasks = ref([
	{ id: 1, title: 'Design system & component library', status: 'Done', priority: 'High', assignees: ['SK'], due: '2025-03-01' },
	{ id: 2, title: 'JWT Authentication flow', status: 'Done', priority: 'Urgent', assignees: ['NR'], due: '2025-03-10' },
	{ id: 3, title: 'Dashboard UI implementation', status: 'In Progress', priority: 'High', assignees: ['SK'], due: '2025-04-15' },
	{ id: 4, title: 'Kanban board with drag & drop', status: 'In Progress', priority: 'High', assignees: ['AH'], due: '2025-04-20' },
	{ id: 5, title: 'Role & permission system', status: 'Review', priority: 'Urgent', assignees: ['NR'], due: '2025-04-10' },
	{ id: 6, title: 'File upload & management', status: 'Todo', priority: 'Medium', assignees: ['DM'], due: '2025-05-01' },
	{ id: 7, title: 'Real-time notifications', status: 'Todo', priority: 'Medium', assignees: ['NR'], due: '2025-05-15' },
	{ id: 8, title: 'Time tracking module', status: 'Todo', priority: 'Low', assignees: ['KU'], due: '2025-06-01' },
	{ id: 9, title: 'Reports & analytics dashboard', status: 'Todo', priority: 'Low', assignees: ['AH', 'SK'], due: '2025-06-15' },
	{ id: 10, title: 'Mobile responsiveness audit', status: 'Review', priority: 'Medium', assignees: ['DM', 'KU'], due: '2025-04-25' },
])

// ── Activity ──────────────────────────────────────────
const recentActivity = ref([
	{ initials: 'SK', color: 'bg-violet-500', text: 'Updated Dashboard UI task to In Progress', time: '2h ago' },
	{ initials: 'NR', color: 'bg-emerald-500', text: 'Completed JWT auth implementation', time: '5h ago' },
	{ initials: 'AH', color: 'bg-accent', text: 'Added 3 new tasks to the board', time: '1d ago' },
	{ initials: 'DM', color: 'bg-amber-500', text: 'Uploaded new design mockups', time: '2d ago' },
	{ initials: 'KU', color: 'bg-rose-500', text: 'Started mobile responsiveness audit', time: '2d ago' },
	{ initials: 'NR', color: 'bg-emerald-500', text: 'Assigned role & permission task to NR', time: '3d ago' },
])

// ── Status config ─────────────────────────────────────
const statusConfig = {
	'Planning': { cls: 'bg-slate-400/15 text-slate-500', dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent', dot: 'bg-accent animate-pulse' },
	'On Hold': { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
	'Completed': { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
}

// ── Tabs with URL query persistence ───────────────────
const allTabs = [
	{ key: 'board', label: 'Board', icon: 'bi-kanban', requiredCap: null },
	{ key: 'overview', label: 'Overview', icon: 'bi-bar-chart', requiredCap: null },
	{ key: 'files', label: 'Files', icon: 'bi-file-earmark', requiredCap: 'files.view' },
	{ key: 'comments', label: 'Comments', icon: 'bi-chat', requiredCap: null },
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

const handleAddTaskSave = (data) => {
	const t2 = { id: Date.now(), ...data }
	tasks.value.push(t2)
	showAddTask.value = false
}

const handleAddTaskClick = (status) => {
	setActiveTab('board')
	openAddTaskModal(status || 'Todo')
}

const openTask = (taskId) => router.push({ name: 'task-detail', params: { id: route.params.id, taskId } })

// ── Add Member modal ──────────────────────────────────
const showAddMember = ref(false)
const openAddMember = () => { showAddMember.value = true }
const handleAddMembers = (people) => {
	for (const p of people) {
		if (!project.value.members.some(m => m.initials === p.initials)) {
			project.value.members.push(p)
		}
	}
	showAddMember.value = false
}

// ── Edit Project modal ────────────────────────────────
const showEditProject = ref(false)
const editFocusField = ref(null)

const openEditProject = (focus = null) => {
	editFocusField.value = focus
	showEditProject.value = true
	moreMenuOpen.value = false
}

const handleEditProjectSave = (data) => {
	// Preserve members/id/progress etc. the edit form doesn't own, so a partial
	// payload from ProjectFormModal can't silently wipe the team list.
	const preserved = { members: project.value.members }
	project.value = { ...project.value, ...data }
	if (!Array.isArray(data?.members)) project.value.members = preserved.members
	showEditProject.value = false
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
onMounted(() => {
	document.addEventListener('click', closeMoreMenu)
	syncTabFromQuery()
})
onBeforeUnmount(() => document.removeEventListener('click', closeMoreMenu))

// ── Archive / Delete  confirm ──────────────
const showArchiveConfirm = ref(false)
const showDeleteConfirm = ref(false)

const requestArchive = () => {
	moreMenuOpen.value = false
	showArchiveConfirm.value = true
}
const handleArchive = () => {
	// TODO: API call to archive project
	showArchiveConfirm.value = false
	router.push({ name: 'projects' })
}

const requestDelete = () => {
	moreMenuOpen.value = false
	showDeleteConfirm.value = true
}
const handleDelete = () => {
	// TODO: API call to delete project
	showDeleteConfirm.value = false
	router.push({ name: 'projects' })
}

</script>

<template>
	<div class="pb-20 pt-6 px-1">

		<!-- ════════════════════════════════════════════ -->
		<!-- HERO + TAB BAR                              -->
		<!-- ════════════════════════════════════════════ -->
		<div class="relative rounded-t-sm">
			<div class="absolute inset-0 bg-accent/8" />
			<div class="absolute inset-0 bg-panel/80 backdrop-blur-sm border border-b-0 border-heading/8 rounded-t-sm" />

			<div class="relative px-6 pt-5">

				<!-- Breadcrumb -->
				<div class="flex items-center gap-1.5 mb-4">
					<button @click="router.push({ name: 'projects' })"
						class="text-sm font-medium text-text hover:text-accent transition-colors">
						Projects
					</button>
					<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
					<span class="text-sm font-semibold text-text">{{ project.name }}</span>
				</div>

				<!-- Title row -->
				<div class="flex flex-wrap gap-5 items-start justify-between mb-4">
					<div class="flex items-start gap-4 flex-1 min-w-0">
						<div
							class="w-12 h-12 rounded-sm bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/30">
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
						<button @click="handleAddTaskClick('Todo')"
							class="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-accent text-white text-base font-semibold hover:bg-accent/90 active:scale-95 transition-all shadow-md shadow-accent/20">
							<v-icon name="bi-plus" scale="0.9" />
							Add Task
						</button>

						<!-- More menu (three dots) -->
						<div class="relative" @click.stop>
							<button
								@click="toggleMoreMenu"
								class="p-2 rounded-sm border border-heading/10 text-text hover:text-heading hover:bg-heading/5 transition-all"
								title="More actions">
								<v-icon name="bi-three-dots-vertical" scale="0.9" />
							</button>
							<Transition name="fade-drop">
								<div v-if="moreMenuOpen"
									class="absolute right-0 top-full mt-1 w-52 bg-panel rounded-sm border border-heading/10 shadow-xl z-30 overflow-hidden">
									<button @click="openEditProject()"
										class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
										<v-icon name="bi-pencil" scale="0.85" /> Edit Project
									</button>
									<button @click="requestArchive"
										class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
										<v-icon name="bi-archive" scale="0.85" /> Archive
									</button>
									<div class="h-px bg-heading/5 mx-2" />
									<button @click="requestDelete"
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
						class="project-rich-content px-2 py-1 -ml-2" v-html="project.description" />
					<p v-else class="text-sm text-text italic opacity-60 px-2 py-1 -ml-2">
						No description yet.
					</p>
				</div>

				<!-- Progress + meta strip -->
				<div class="flex flex-wrap items-center gap-5 mb-5">
					<div class="flex items-center gap-2.5 min-w-52">
						<div class="flex-1 h-1.5 bg-heading/10 rounded-full overflow-hidden">
							<div class="h-full bg-accent rounded-full transition-all duration-700"
								:style="`width:${project.progress}%`" />
						</div>
						<span class="text-sm font-bold text-heading tabular-nums">{{ project.progress }}%</span>
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
						<div v-for="(m, i) in project.members" :key="m.initials"
							:class="[m.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-panel shadow-sm -ml-1.5 first:ml-0 hover:scale-110 transition-transform cursor-pointer']"
							:title="`${m.name} — ${m.role}`" :style="`z-index: ${project.members.length - i}`">
							{{ m.initials }}
						</div>
						<button @click="openAddMember"
							class="w-7 h-7 rounded-full border-2 border-dashed border-heading/20 flex items-center justify-center bg-panel -ml-1.5 text-text hover:text-accent hover:border-accent/40 transition-all"
							title="Add member">
							<v-icon name="bi-person-plus" scale="0.7" />
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
				v-model:tasks="tasks"
				:members="project.members"
				@open-task="openTask"
				@add-task-click="openAddTaskModal" />

			<ProjectOverviewTab
				v-show="activeTab === 'overview'"
				:project="project"
				:tasks="tasks"
				:activity="recentActivity"
				@add-member-click="openAddMember" />

			<ProjectFilesTab
				v-if="canViewFiles"
				v-show="activeTab === 'files'"
				:can-upload="canUploadFiles" />

			<ProjectCommentsTab
				v-show="activeTab === 'comments'"
				:members="project.members" />

			<ProjectActivityTab
				v-show="activeTab === 'activity'"
				:can-view="canViewActivity"
				:activity="recentActivity" />

		</div>

		<!-- Modals -->
		<AddTaskModal
			:show="showAddTask"
			:members="project.members"
			:default-status="addTaskDefaultStatus"
			@close="showAddTask = false"
			@save="handleAddTaskSave" />

		<AddMemberModal
			:show="showAddMember"
			:existing-members="project.members"
			@close="showAddMember = false"
			@add="handleAddMembers" />

		<ProjectFormModal
			:show="showEditProject"
			mode="edit"
			:project="project"
			:focus-field="editFocusField"
			@close="showEditProject = false"
			@save="handleEditProjectSave" />

		<!-- ── Archive confirm modal ──────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showArchiveConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showArchiveConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
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

		<!-- ── Delete confirm modal ───────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
							<v-icon name="bi-trash" class="text-red-500" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Delete Project?</h3>
						<p class="text-base text-text mb-6">
							This action cannot be undone. All tasks, comments, and files associated with this project will be permanently deleted.
						</p>
						<div class="flex gap-3">
							<button @click="showDeleteConfirm = false" class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleDelete"
								class="flex-1 inline-flex gap-2 items-center justify-center px-6 py-3 text-base tracking-wide rounded-sm shadow-sm text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all cursor-pointer">
								<v-icon name="bi-trash" scale="1" />
								Delete
							</button>
						</div>
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

.modal-enter-from .relative,
.modal-leave-to .relative {
	transform: scale(0.97);
}

.fade-drop-enter-active,
.fade-drop-leave-active {
	transition: all 0.15s ease;
}
.fade-drop-enter-from,
.fade-drop-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}

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
:deep([data-node-view-wrapper]) {
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
