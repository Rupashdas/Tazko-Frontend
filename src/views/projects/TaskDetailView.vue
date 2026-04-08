<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import { BiChevronRight } from 'oh-vue-icons/icons'

import TaskHeaderCard from '@/components/projects/TaskHeaderCard.vue'
import TaskSubtasksCard from '@/components/projects/TaskSubtasksCard.vue'
import TaskCommentsActivityCard from '@/components/projects/TaskCommentsActivityCard.vue'
import TaskSidebar from '@/components/projects/TaskSidebar.vue'

addIcons(BiChevronRight)

const router = useRouter()
const route = useRoute()

// ── Task data ─────────────────────────────────────────
const task = ref({
	id: route.params.taskId,
	title: 'Dashboard UI & analytics widgets',
	description: 'Build the main dashboard with task summary cards, project progress bars, recent activity feed, and quick action shortcuts. The layout should be responsive and load data progressively. Pay attention to empty states — each widget needs a graceful fallback.',
	status: 'In Progress',
	priority: 'High',
	assignees: [
		{ initials: 'SK', name: 'Sara Khan', color: 'bg-violet-500', role: 'Frontend Developer' },
	],
	due: '2026-03-10',
	project: { id: route.params.id, name: 'Tazko App' },
	createdAt: '2026-02-20',
	labels: [
		{ id: 1, name: 'Frontend', color: 'bg-accent/15 text-accent border-accent/20' },
		{ id: 2, name: 'UI', color: 'bg-violet-500/15 text-violet-600 border-violet-200' },
	],
})

const members = [
	{ initials: 'AH', name: 'Arif Hossain', color: 'bg-accent', role: 'Project Manager' },
	{ initials: 'SK', name: 'Sara Khan', color: 'bg-violet-500', role: 'Frontend Dev' },
	{ initials: 'NR', name: 'Noman Rahman', color: 'bg-emerald-500', role: 'Backend Dev' },
	{ initials: 'DM', name: 'Dina Malik', color: 'bg-amber-500', role: 'Designer' },
	{ initials: 'KU', name: 'Karim Uddin', color: 'bg-red-400', role: 'QA Engineer' },
]

// ── Config maps ───────────────────────────────────────────
const statusOptions = ['Todo', 'In Progress', 'Review', 'Done']
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']

const statusConfig = {
	'Todo': { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300 border-slate-200/60 dark:border-slate-600/40', dot: 'bg-slate-400', icon: 'bi-circle' },
	'In Progress': { cls: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent animate-pulse', icon: 'bi-arrow-repeat' },
	'Review': { cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-500/30', dot: 'bg-violet-500', icon: 'bi-exclamation-circle' },
	'Done': { cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30', dot: 'bg-emerald-500', icon: 'bi-check2-circle' },
}

const priorityConfig = {
	'Low': { cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400 border-slate-200/60', bar: 'bg-slate-400' },
	'Medium': { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50', bar: 'bg-amber-500' },
	'High': { cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/50', bar: 'bg-orange-500' },
	'Urgent': { cls: 'bg-red-500/10 text-red-500 border-red-200/50 dark:border-red-500/30', bar: 'bg-red-500' },
}

// ── Subtasks ──────────────────────────────────────────
const subtasks = ref([
	{ id: 1, title: 'Design widget layout in Figma', done: true },
	{ id: 2, title: 'Build stat card components', done: true },
	{ id: 3, title: 'Integrate project progress bars', done: false },
	{ id: 4, title: 'Build recent activity feed', done: false },
	{ id: 5, title: 'Add empty states for each widget', done: false },
])

// ── Comments ──────────────────────────────────────────
const comments = ref([
	{
		id: 1, author: 'Arif Hossain', initials: 'AH', color: 'bg-accent',
		text: 'Sara, the empty states are critical — make sure each widget has a proper illustration or message when there\'s no data yet.',
		time: 'Feb 21, 2:30 PM', likes: 2,
	},
	{
		id: 2, author: 'Sara Khan', initials: 'SK', color: 'bg-violet-500',
		text: 'Understood! I\'ll handle empty states with subtle SVG illustrations + a CTA to add data. Starting with the task summary card.',
		time: 'Feb 21, 3:15 PM', likes: 1,
	},
	{
		id: 3, author: 'Noman Rahman', initials: 'NR', color: 'bg-emerald-500',
		text: 'I\'ll expose a /dashboard/stats endpoint by EOD so you can wire up the real data.',
		time: 'Feb 22, 10:00 AM', likes: 3,
	},
])

// ── Activity ──────────────────────────────────────────
const activity = [
	{ initials: 'SK', color: 'bg-violet-500', text: 'Changed status from Todo → In Progress', time: 'Feb 22, 9:00 AM', type: 'status' },
	{ initials: 'AH', color: 'bg-accent', text: 'Assigned task to Sara Khan', time: 'Feb 21, 1:00 PM', type: 'assign' },
	{ initials: 'AH', color: 'bg-accent', text: 'Set priority to High', time: 'Feb 21, 12:50 PM', type: 'priority' },
	{ initials: 'AH', color: 'bg-accent', text: 'Created this task', time: 'Feb 20, 10:00 AM', type: 'create' },
]

// ── Header card action handlers (placeholders) ────────
const handleEdit = () => { /* TODO: open edit modal */ }
const handleArchive = () => { /* TODO: archive confirmation */ }
const handleDelete = () => { /* TODO: delete confirmation */ }
</script>

<template>
	<div class="pb-24 pt-6 px-1">

		<!-- ── Breadcrumb ─────────────────────────────── -->
		<div class="flex items-center gap-1.5 text-sm text-text mb-5 flex-wrap">
			<button @click="router.push({ name: 'projects' })" class="hover:text-accent transition-colors font-medium">
				Projects
			</button>
			<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
			<button @click="router.push({ name: 'project-detail', params: { id: task.project.id } })"
				class="hover:text-accent transition-colors font-medium">
				{{ task.project.name }}
			</button>
			<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
			<span class="text-text font-semibold truncate max-w-xs">{{ task.title }}</span>
		</div>

		<!-- ── MAIN TWO-COLUMN LAYOUT ─────────────────── -->
		<div class="flex gap-6 items-start">

			<!-- LEFT: Main content -->
			<div class="flex-1 min-w-0 space-y-4">
				<TaskHeaderCard
					v-model:task="task"
					:members="members"
					:status-config="statusConfig"
					:priority-config="priorityConfig"
					@edit="handleEdit"
					@archive="handleArchive"
					@delete="handleDelete" />

				<TaskSubtasksCard v-model:subtasks="subtasks" />

				<TaskCommentsActivityCard
					v-model:comments="comments"
					:activity="activity"
					:members="members" />
			</div>

			<!-- RIGHT: Sticky sidebar -->
			<TaskSidebar
				v-model:task="task"
				:members="members"
				:status-options="statusOptions"
				:priority-options="priorityOptions"
				:status-config="statusConfig"
				:priority-config="priorityConfig" />
		</div>
	</div>
</template>
