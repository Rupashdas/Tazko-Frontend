<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTaskDetailStore } from '@/stores/useTaskDetailStore'
import { useTaskCommentStore } from '@/stores/useTaskCommentStore'
import { useToast } from '@/utils/toast'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { addIcons } from 'oh-vue-icons'
import { BiChevronRight } from 'oh-vue-icons/icons'

import TaskHeaderCard from '@/components/projects/TaskHeaderCard.vue'
import TaskSubtasksCard from '@/components/projects/TaskSubtasksCard.vue'
import TaskCommentsActivityCard from '@/components/projects/TaskCommentsActivityCard.vue'
import TaskSidebar from '@/components/projects/TaskSidebar.vue'

addIcons(BiChevronRight)

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const taskStore = useTaskDetailStore()
const taskCommentStore = useTaskCommentStore()
const { errorToast, successToast } = useToast()

const projectId = computed(() => route.params.id)
const taskId    = computed(() => route.params.taskId)

const hasValidTaskId = computed(() => {
	const id = route.params.taskId
	return id !== undefined && id !== null && String(id).trim() !== ''
})

// ── Capabilities ──────────────────────────────────────
const canUpdate         = computed(() => auth.hasCapability('tasks.update'))
const canDelete         = computed(() => auth.hasCapability('tasks.delete'))
const canUpdateStatus   = computed(() => auth.hasCapability('tasks.status.update'))
const canUpdatePriority = computed(() => auth.hasCapability('tasks.priority.update'))
const canUpdateDeadline = computed(() => auth.hasCapability('tasks.deadline.update'))
const canAssign         = computed(() => auth.hasCapability('tasks.assign'))
const canManageSubtasks = computed(() => auth.hasCapability('tasks.subtask.manage'))

const canViewComments  = computed(() => auth.hasCapability('comments.view'))
const canCreateComment = computed(() => auth.hasCapability('comments.create'))
const canEditComment   = computed(() => auth.hasCapability('comments.update'))
const canDeleteComment = computed(() => auth.hasCapability('comments.delete'))
const canReactComment  = computed(() => auth.hasCapability('comments.react'))

// ── Avatar helpers (shared with sidebar members) ──────
const memberColors = ['bg-accent', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500']

const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Data (delegated to store) ─────────────────────────
const task    = computed(() => taskStore.task)
const loading = computed(() => taskStore.loading)
const saving  = computed(() => taskStore.saving)
const error   = computed(() => taskStore.error)

const members = computed(() =>
	(task.value?.project?.members ?? []).map((m, i) => ({
		...m,
		initials: getInitials(m.name),
		color: memberColors[i % memberColors.length],
	}))
)

// ── Bootstrap ─────────────────────────────────────────
const init = async () => {
	if (!hasValidTaskId.value) return
	const res = await taskStore.fetchTask(projectId.value, taskId.value)
	if (!res.success) errorToast(taskStore.error)
	// Load project label palette only if the user can edit task labels.
	if (canUpdate.value) taskStore.fetchLabels(projectId.value)
}

onMounted(init)

// ── Save orchestration ───────────────────────────────
// Build the optimistic `localPatch` that mirrors the API `payload`.
// The store applies this to `task` immediately; on API failure it rolls back.
//
// For `assignee_ids` / `label_ids` we need full objects (with avatar colors /
// label styling), which only the view can resolve from `members` / palette.
const buildLocalPatch = (payload) => {
	const patch = { ...payload }

	if ('assignee_ids' in patch) {
		patch.assignees = patch.assignee_ids
			.map(id => members.value.find(m => m.id === id))
			.filter(Boolean)
		delete patch.assignee_ids
	}

	if ('label_ids' in patch) {
		// Resolve against both the project palette and any labels already on
		// the task (so removing one from the palette still renders the others).
		const pool = [...taskStore.labels, ...(task.value?.labels ?? [])]
		patch.labels = patch.label_ids
			.map(id => pool.find(l => l.id === id))
			.filter(Boolean)
		delete patch.label_ids
	}

	return patch
}

const saveTask = async (payload) => {
	const localPatch = buildLocalPatch(payload)
	const res = await taskStore.updateTask(projectId.value, taskId.value, payload, localPatch)
	if (!res.success) errorToast(res.message)
	return res
}

// ── Subtasks ─────────────────────────────────────────
const onAddSubtask = async ({ title }) => {
	const res = await taskStore.addSubtask(projectId.value, taskId.value, title)
	if (!res.success) errorToast(res.message)
}

const onToggleSubtask = async ({ id, done }) => {
	const res = await taskStore.updateSubtask(projectId.value, taskId.value, id, { is_done: done })
	if (!res.success) errorToast(res.message)
}

const onRemoveSubtask = async ({ id }) => {
	const res = await taskStore.deleteSubtask(projectId.value, taskId.value, id)
	if (!res.success) errorToast(res.message)
}

const onReorderSubtasks = async (orderedIds) => {
	const res = await taskStore.reorderSubtasks(projectId.value, taskId.value, orderedIds)
	if (!res.success) errorToast(res.message)
}

// ── Labels ───────────────────────────────────────────
// Sidebar emits `create-label` when the user types a brand-new label name.
// Create it in the project palette, then sync into the task's label_ids.
const onCreateLabel = async ({ name }) => {
	const res = await taskStore.createLabel(projectId.value, { name })
	if (!res.success) {
		errorToast(res.message)
		return
	}
	const nextIds = [...(task.value?.labels ?? []).map(l => l.id), res.label.id]
	await saveTask({ label_ids: nextIds })
}

// ── Delete task ──────────────────────────────────────
const showDeleteModal = ref(false)
const deleting = ref(false)

const confirmDelete = async () => {
	deleting.value = true
	const res = await taskStore.deleteTask(projectId.value, taskId.value)
	deleting.value = false
	showDeleteModal.value = false
	if (res.success) {
		successToast('Task deleted.')
		router.push({ name: 'project-detail', params: { id: projectId.value } })
	} else {
		errorToast(res.message)
	}
}

// ── Sidebar/header config ─────────────────────────────
const statusOptions   = ['Todo', 'In Progress', 'Review', 'Done']
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']

const statusConfig = {
	'Todo':        { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300 border-slate-200/60 dark:border-slate-600/40', dot: 'bg-slate-400', icon: 'bi-circle' },
	'In Progress': { cls: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent animate-pulse', icon: 'bi-arrow-repeat' },
	'Review':      { cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-500/30', dot: 'bg-violet-500', icon: 'bi-exclamation-circle' },
	'Done':        { cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30', dot: 'bg-emerald-500', icon: 'bi-check2-circle' },
}

const priorityConfig = {
	'Low':    { cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400 border-slate-200/60', bar: 'bg-slate-400' },
	'Medium': { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50', bar: 'bg-amber-500' },
	'High':   { cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/50', bar: 'bg-orange-500' },
	'Urgent': { cls: 'bg-red-500/10 text-red-500 border-red-200/50 dark:border-red-500/30', bar: 'bg-red-500' },
}

// ── Lazy-load comments on first tab open ──────────────
const activeSection = ref('comments')
const commentsFetched = ref(false)

const triggerCommentFetch = () => {
	if (!commentsFetched.value && canViewComments.value && task.value) {
		commentsFetched.value = true
		taskCommentStore.fetchComments(projectId.value, taskId.value)
	}
}

watch(activeSection, (section) => {
	if (section === 'comments') triggerCommentFetch()
})

// Trigger if task loads while comments tab is already active
watch(task, () => {
	if (activeSection.value === 'comments') triggerCommentFetch()
})

onUnmounted(() => {
	taskStore.clear()
	taskCommentStore.clearComments()
})
</script>

<template>
	<div class="pb-24 pt-6 px-1">

		<!-- ── Invalid task id ────────────────────────── -->
		<div v-if="!hasValidTaskId" class="text-center py-24">
			<h3 class="section-title mb-2">Task not found</h3>
			<p class="page-subtitle mb-6">The task you're looking for doesn't exist or has been removed.</p>
			<button @click="router.push({ name: 'projects' })"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Back to projects
			</button>
		</div>

		<!-- ── Loading skeleton ────────────────────────── -->
		<div v-else-if="loading && !task" class="animate-pulse">

			<!-- Skeleton breadcrumb -->
			<div class="flex items-center gap-1.5 text-sm text-text mb-5 flex-wrap">
				<div class="h-3 w-16 bg-heading/10 rounded" />
				<div class="h-3 w-3 bg-heading/10 rounded" />
				<div class="h-3 w-36 bg-heading/10 rounded" />
				<div class="h-3 w-3 bg-heading/10 rounded" />
				<div class="h-3 w-28 bg-heading/10 rounded" />
			</div>

			<!-- Skeleton: main two-column layout -->
			<div class="flex flex-col lg:flex-row gap-6 items-start">

				<!-- LEFT: TaskHeader + Subtasks + Comments -->
				<div class="flex-1 min-w-0 w-full space-y-4">

					<!-- TaskHeaderCard skeleton -->
					<div class="bg-panel rounded-sm border border-heading/5 p-6">
						<!-- Status + priority pills -->
						<div class="flex items-center gap-2 mb-4 flex-wrap">
							<div class="h-7 w-28 bg-heading/10 rounded-full" />
							<div class="h-7 w-28 bg-heading/10 rounded-full" />
						</div>
						<!-- Title -->
						<div class="h-7 w-2/3 bg-heading/10 rounded mb-5" />
						<!-- Description label -->
						<div class="h-3 w-24 bg-heading/10 rounded mb-2" />
						<!-- Description lines -->
						<div class="space-y-2">
							<div class="h-4 w-full bg-heading/10 rounded" />
							<div class="h-4 w-4/5 bg-heading/10 rounded" />
							<div class="h-4 w-3/4 bg-heading/10 rounded" />
						</div>
					</div>

					<!-- TaskSubtasksCard skeleton -->
					<div class="bg-panel rounded-sm border border-heading/5 p-5">
						<!-- Header row -->
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class="h-4 w-24 bg-heading/10 rounded" />
								<div class="h-5 w-12 bg-heading/10 rounded" />
								<div class="h-5 w-12 bg-heading/10 rounded" />
							</div>
							<div class="h-8 w-16 bg-heading/10 rounded" />
						</div>
						<!-- Progress bar -->
						<div class="h-1.5 w-full bg-heading/8 rounded-full mb-4" />
						<!-- Subtask rows -->
						<div class="space-y-0.5">
							<div v-for="i in 3" :key="i" class="flex items-center gap-3 px-3 py-3">
								<div class="w-[18px] h-[18px] bg-heading/10 rounded" />
								<div class="h-4 flex-1 bg-heading/10 rounded" />
							</div>
						</div>
					</div>

					<!-- TaskCommentsActivityCard skeleton -->
					<div class="bg-panel rounded-sm border border-heading/5 overflow-hidden">
						<!-- Tab buttons -->
						<div class="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-heading/5">
							<div class="h-10 w-28 bg-heading/10 rounded" />
							<div class="h-10 w-24 bg-heading/10 rounded" />
						</div>
						<!-- Comment items -->
						<div class="p-5 space-y-4">
							<div v-for="i in 3" :key="i" class="flex items-start gap-3">
								<div class="w-8 h-8 bg-heading/10 rounded-full shrink-0" />
								<div class="flex-1 space-y-1.5">
									<div class="h-3 w-24 bg-heading/10 rounded" />
									<div class="h-4 w-full bg-heading/10 rounded" />
									<div class="h-4 w-3/4 bg-heading/10 rounded" />
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- RIGHT: Sticky sidebar skeleton -->
				<div class="w-full lg:w-64 shrink-0 space-y-3">
					<!-- Assignees -->
					<div class="bg-panel rounded-sm border border-heading/5 p-4">
						<div class="h-3 w-20 bg-heading/10 rounded mb-3" />
						<div v-for="i in 2" :key="i" class="flex items-center gap-2.5 mb-2">
							<div class="w-7 h-7 bg-heading/10 rounded-full shrink-0" />
							<div class="flex-1 space-y-1">
								<div class="h-3 w-20 bg-heading/10 rounded" />
								<div class="h-2 w-12 bg-heading/10 rounded" />
							</div>
						</div>
					</div>

					<!-- Status -->
					<div class="bg-panel rounded-sm border border-heading/5 p-4">
						<div class="h-3 w-16 bg-heading/10 rounded mb-3" />
						<div v-for="i in 4" :key="i" class="h-8 w-full bg-heading/10 rounded mb-1.5" />
					</div>

					<!-- Priority -->
					<div class="bg-panel rounded-sm border border-heading/5 p-4">
						<div class="h-3 w-18 bg-heading/10 rounded mb-3" />
						<div v-for="i in 4" :key="i" class="h-8 w-full bg-heading/10 rounded mb-1.5" />
					</div>

					<!-- Due Date -->
					<div class="bg-panel rounded-sm border border-heading/5 p-4">
						<div class="h-3 w-18 bg-heading/10 rounded mb-3" />
						<div class="h-8 w-full bg-heading/10 rounded" />
					</div>

					<!-- Labels -->
					<div class="bg-panel rounded-sm border border-heading/5 p-4">
						<div class="h-3 w-14 bg-heading/10 rounded mb-3" />
						<div class="flex flex-wrap gap-2">
							<div class="h-6 w-16 bg-heading/10 rounded-full" />
							<div class="h-6 w-20 bg-heading/10 rounded-full" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Error state ─────────────────────────────── -->
		<div v-else-if="error" class="text-center py-24">
			<h3 class="section-title mb-2">Failed to load task</h3>
			<p class="page-subtitle mb-6">{{ error }}</p>
			<button @click="init"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Try again
			</button>
		</div>

		<!-- ── REAL CONTENT ──────────────────────────── -->
		<div v-else-if="task">

			<!-- Breadcrumb -->
			<div class="flex items-center gap-1.5 text-sm text-text mb-5 flex-wrap">
				<button @click="router.push({ name: 'projects' })" class="hover:text-accent transition-colors font-medium">
					Projects
				</button>
				<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
				<button
					@click="router.push({ name: 'project-detail', params: { id: projectId } })"
					class="hover:text-accent transition-colors font-medium">
					{{ task?.project?.name ?? '…' }}
				</button>
				<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
				<span class="text-text font-semibold truncate max-w-xs">{{ task?.title ?? '…' }}</span>
			</div>

			<!-- ── MAIN TWO-COLUMN LAYOUT ─────────────────── -->
			<div class="flex flex-col lg:flex-row gap-6 items-start">

			<!-- LEFT: Main content -->
			<div class="flex-1 min-w-0 w-full space-y-4">
				<TaskHeaderCard
					:task="task"
					:members="members"
					:status-config="statusConfig"
					:priority-config="priorityConfig"
					:can-update="canUpdate"
					:can-delete="canDelete"
					:saving="saving"
					@save="saveTask"
					@delete="showDeleteModal = true" />

				<TaskSubtasksCard
					:subtasks="task.subtasks ?? []"
					:can-manage="canManageSubtasks"
					:saving="saving"
					@add="onAddSubtask"
					@toggle="onToggleSubtask"
					@remove="onRemoveSubtask"
					@reorder="onReorderSubtasks" />

				<TaskCommentsActivityCard
					:activity="[]"
					:members="members"
					:project-id="projectId"
					:task-id="taskId"
					:can-create="canCreateComment"
					:can-edit="canEditComment"
					:can-delete="canDeleteComment"
					:can-react="canReactComment"
					@update:active-section="activeSection = $event" />
			</div>

			<!-- RIGHT: Sticky sidebar -->
			<TaskSidebar
				:task="task"
				:members="members"
				:status-options="statusOptions"
				:priority-options="priorityOptions"
				:status-config="statusConfig"
				:priority-config="priorityConfig"
				:available-labels="taskStore.labels"
				:can-update="canUpdate"
				:can-update-status="canUpdateStatus"
				:can-update-priority="canUpdatePriority"
				:can-update-deadline="canUpdateDeadline"
				:can-assign="canAssign"
				@save="saveTask"
				@create-label="onCreateLabel" />
			</div>
		</div>

		<ConfirmModal
			:show="showDeleteModal"
			title="Delete Task"
			message="Are you sure you want to delete this task? This action cannot be undone."
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deleting"
			@close="showDeleteModal = false"
			@confirm="confirmDelete" />
	</div>
</template>
