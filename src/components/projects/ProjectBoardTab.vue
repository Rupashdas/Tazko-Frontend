<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import AppSelect from '@/components/ui/AppSelect.vue'
import { paletteColor } from '@/utils/paletteColor'
import { addIcons } from 'oh-vue-icons'
import {
	BiListTask, BiKanban, BiGripVertical, BiPlus, BiSearch, BiX,
	BiLightningCharge, BiCheckCircle, BiClock, BiCalendar3,
	BiCheck2, BiTrash,
} from 'oh-vue-icons/icons'

addIcons(
	BiListTask, BiKanban, BiGripVertical, BiPlus, BiSearch, BiX,
	BiLightningCharge, BiCheckCircle, BiClock, BiCalendar3,
	BiCheck2, BiTrash,
)

const props = defineProps({
	tasks: { type: Array, required: true },
})

const emit = defineEmits(['open-task', 'add-task-click', 'tasks-reordered', 'delete-task'])

const columnStatuses = ['Todo', 'In Progress', 'Review', 'Done']

const columnConfig = {
	'Todo': { dotClass: 'bg-slate-400', labelClass: 'text-slate-500 dark:text-slate-400', headerBg: 'bg-slate-400/8', glowColor: 'rgba(148,163,184,0.15)', borderActive: 'border-slate-300/40 dark:border-slate-600/40', accent: 'hsl(220 14% 56%)' },
	'In Progress': { dotClass: 'bg-accent', labelClass: 'text-accent', headerBg: 'bg-accent/8', glowColor: 'rgba(108,99,255,0.12)', borderActive: 'border-accent/30', accent: 'var(--color-accent)' },
	'Review': { dotClass: 'bg-violet-500', labelClass: 'text-violet-500 dark:text-violet-400', headerBg: 'bg-violet-500/8', glowColor: 'rgba(139,92,246,0.12)', borderActive: 'border-violet-400/30', accent: 'rgb(139,92,246)' },
	'Done': { dotClass: 'bg-emerald-500', labelClass: 'text-emerald-600 dark:text-emerald-400', headerBg: 'bg-emerald-500/8', glowColor: 'rgba(34,197,94,0.10)', borderActive: 'border-emerald-400/30', accent: 'rgb(34,197,94)' },
}

const priorityConfig = {
	'Urgent': { cls: 'bg-red-500/10 text-red-500', dot: 'bg-red-500' },
	'High': { cls: 'bg-orange-500/10 text-orange-500', dot: 'bg-orange-400' },
	'Medium': { cls: 'bg-amber-500/10 text-amber-600', dot: 'bg-amber-400' },
	'Low': { cls: 'bg-slate-400/10 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
}

const getInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Filters & view ─────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref('All')
const priorityFilter = ref('All')
const viewMode = ref('board')

// ── Drag state ─────────────────────────────────────────
const isDragging = ref(false)
const dragOverColumn = ref(null)
const onDragStart = () => { isDragging.value = true }
const onDragEnd = () => { isDragging.value = false; dragOverColumn.value = null }
const onDragEnterColumn = (s) => { if (isDragging.value) dragOverColumn.value = s }

// ── Filter helpers ─────────────────────────────────────
// matchesSearchPriority: used for board columns (status handled by grouping)
const matchesSearchPriority = (t) => {
	const s = !searchQuery.value || t.title.toLowerCase().includes(searchQuery.value.toLowerCase())
	const p = priorityFilter.value === 'All' || t.priority === priorityFilter.value
	return s && p
}
// matchesFilter: full filter used for list view
const matchesFilter = (t) => {
	const f = statusFilter.value === 'All' || t.status === statusFilter.value
	return matchesSearchPriority(t) && f
}
const filteredTasks = computed(() => props.tasks.filter(matchesFilter))

// ── Stats ──────────────────────────────────────────────
const totalTasks = computed(() => props.tasks.length)
const doneCount = computed(() => props.tasks.filter(t => t.status === 'Done').length)
const inProgressCount = computed(() => props.tasks.filter(t => t.status === 'In Progress').length)
const overdueCount = computed(() => {
	const now = new Date()
	return props.tasks.filter(t => t.status !== 'Done' && t.due && new Date(t.due) < now).length
})

// ── Board columns ──────────────────────────────────────
// Must be a ref (not computed) — vuedraggable mutates the array directly.
// Applies search + priority filters so board cards update when filters change.
// Status filter is handled separately via visibleColumnStatuses (hides columns).
const buildBoardColumns = () => Object.fromEntries(
	columnStatuses.map(s => [s, props.tasks.filter(t => t.status === s && matchesSearchPriority(t))])
)
const boardColumns = ref(buildBoardColumns())

// Rebuild when tasks change OR when search/priority filter changes
watch(
	[() => props.tasks, () => props.tasks.length, searchQuery, priorityFilter],
	() => { boardColumns.value = buildBoardColumns() }
)

// In board view, the status filter shows/hides entire columns
const visibleColumnStatuses = computed(() =>
	statusFilter.value === 'All' ? columnStatuses : columnStatuses.filter(s => s === statusFilter.value)
)

const onBoardChange = (targetStatus, event) => {
	if (event.added) {
		const moved = props.tasks.find(t => t.id === event.added.element.id)
		if (moved) moved.status = targetStatus  // optimistic
	}

	if (event.added || event.moved) {
		const orders = boardColumns.value[targetStatus].map((t, i) => ({
			id: t.id,
			sort_order: i + 1,
			status: targetStatus,
		}))
		emit('tasks-reordered', orders)
	}
}

const listItems = ref([...props.tasks])
watch(() => props.tasks, () => { listItems.value = [...props.tasks] })
watch(() => props.tasks.length, () => { listItems.value = [...props.tasks] })

const onListChange = (event) => {
	if (event.moved) {
		const orders = listItems.value.map((t, i) => ({
			id: t.id,
			sort_order: i + 1,
			status: t.status,
		}))
		emit('tasks-reordered', orders)
	}
}


const formatShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const isDueOverdue = (due) => due && new Date(due) < new Date()
const isDueSoon = (due) => { if (!due) return false; const diff = Math.ceil((new Date(due) - new Date()) / 86400000); return diff >= 0 && diff <= 3 }
</script>

<template>
	<div class="p-4 md:p-5">

		<!-- Stat strip -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
			<div v-for="stat in [
				{ label: 'Total Tasks', value: totalTasks, icon: 'bi-list-task', cls: 'text-heading', bg: 'bg-heading/5' },
				{ label: 'In Progress', value: inProgressCount, icon: 'bi-lightning-charge', cls: 'text-accent', bg: 'bg-accent/10' },
				{ label: 'Done', value: doneCount, icon: 'bi-check-circle', cls: 'text-emerald-500', bg: 'bg-emerald-500/10' },
				{ label: 'Overdue', value: overdueCount, icon: 'bi-clock', cls: overdueCount ? 'text-red-500' : 'text-text', bg: overdueCount ? 'bg-red-500/10' : 'bg-heading/5' },
			]" :key="stat.label" class="bg-panel rounded-sm border border-heading/5 px-4 py-3 flex items-center gap-3">
				<div :class="[stat.bg, 'w-12 h-12 rounded-sm flex items-center justify-center shrink-0']">
					<v-icon :name="stat.icon" :class="stat.cls" scale="1.4" />
				</div>
				<div>
					<p :class="[stat.cls, 'text-xl font-bold leading-none tabular-nums']">{{ stat.value }}</p>
					<p class="text-sm text-text mt-0.5">{{ stat.label }}</p>
				</div>
			</div>
		</div>

		<!-- Toolbar -->
		<div class="bg-panel rounded-sm border border-heading/5 p-3.5 mb-4">
			<div class="flex flex-wrap items-center gap-2.5">
				<div class="relative flex-1 min-w-40">
					<v-icon name="bi-search"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
						scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search tasks…"
						class="w-full pl-9 pr-8 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
					<button v-if="searchQuery" @click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-text">
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

				<div class="flex-1 hidden sm:block" />

				<div class="flex items-center gap-1 bg-heading/5 rounded-sm p-1">
					<button @click="viewMode = 'board'"
						:class="[viewMode === 'board' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-kanban" scale="0.85" /> Board
					</button>
					<button @click="viewMode = 'list'"
						:class="[viewMode === 'list' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-list-task" scale="0.85" /> List
					</button>
				</div>
			</div>
		</div>

		<!-- ─── BOARD VIEW ─── -->
		<div v-if="viewMode === 'board'"
			:class="['board-container grid grid-cols-4 gap-4', isDragging ? 'is-dragging-global' : '']">

			<div v-for="status in visibleColumnStatuses" :key="status" :class="[
				'board-column flex flex-col rounded-sm border transition-all duration-200',
				dragOverColumn === status && isDragging ? 'column-drop-active border-accent/20' : 'border-heading/5',
			]"
				@dragenter.prevent="onDragEnterColumn(status)" @dragover.prevent="onDragEnterColumn(status)">

				<!-- Column header -->
				<div
					:class="['px-3.5 py-3 rounded-t-sm flex items-center justify-between shrink-0', columnConfig[status].headerBg]">
					<div class="flex items-center gap-2.5">
						<span
							:class="[columnConfig[status].dotClass, 'w-2.5 h-2.5 rounded-full', status === 'In Progress' ? 'animate-pulse' : '']" />
						<span :class="[columnConfig[status].labelClass, 'text-sm font-bold tracking-wide']">{{
							status }}</span>
						<span
							class="text-sm font-bold tabular-nums px-1.5 py-0.5 rounded-sm bg-heading/8 text-text leading-none">
							{{ boardColumns[status]?.length ?? 0 }}
						</span>
					</div>
					<button @click="emit('add-task-click', status)"
						class="column-add-btn w-6 h-6 rounded-sm flex items-center justify-center hover:bg-heading/10 text-text transition-all">
						<v-icon name="bi-plus" scale="0.9" />
					</button>
				</div>

				<!-- Draggable list -->
				<div class="p-2 flex-1 flex flex-col">
					<draggable :list="boardColumns[status]" item-key="id" :group="{ name: 'board-tasks' }"
						:animation="150" ghost-class="task-ghost" drag-class="task-dragging"
						chosen-class="task-chosen" :force-fallback="true" :fallback-class="'task-fallback'"
						@start="onDragStart" @end="onDragEnd" @change="(e) => onBoardChange(status, e)"
						class="tasks-list flex-1 flex flex-col gap-2">

						<template #item="{ element: task }">
							<div :class="[
								'task-card group relative flex flex-col gap-2.5 p-3 rounded-sm border cursor-grab active:cursor-grabbing select-none',
								task.status === 'Done'
									? 'opacity-55 bg-heading/[0.02] border-heading/5'
									: 'bg-panel border-heading/8 hover:border-heading/15 hover:shadow-sm',
							]" @click="emit('open-task', task.id)">

								<button
									class="absolute top-2 right-2 w-6 h-6 rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 text-text hover:text-red-500 hover:bg-red-500/10 transition-all z-10"
									@click.stop="emit('delete-task', task.id)">
									<v-icon name="bi-trash" scale="0.75" />
								</button>

								<div>
									<div class="flex items-start gap-2 mb-2.5">
										<span
											:class="[priorityConfig[task.priority]?.dot, 'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0']" />
										<p :class="[
											'text-sm font-semibold leading-snug flex-1 transition-colors',
											task.status === 'Done' ? 'line-through text-text' : 'text-heading group-hover:text-accent',
										]">{{ task.title }}</p>
									</div>

									<div class="flex items-center justify-between gap-2">
										<span
											:class="[priorityConfig[task.priority]?.cls, 'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide']">
											{{ task.priority }}
										</span>
										<div class="flex items-center gap-1.5 ml-auto">
											<span v-if="task.due" :class="[
												'text-sm tabular-nums flex items-center gap-0.5 transition-colors',
												isDueOverdue(task.due) && task.status !== 'Done' ? 'text-red-400 font-semibold'
													: isDueSoon(task.due) && task.status !== 'Done' ? 'text-amber-400 font-medium'
														: 'text-text',
											]">
												<v-icon name="bi-calendar3" scale="0.65" />{{
													formatShort(task.due) }}
											</span>
											<div class="flex items-center">
												<div
													v-for="(a, ai) in task.assignees.slice(0, 3)" :key="a.id"
													:class="[!a.avatar && paletteColor(a.palette), 'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-2 ring-panel overflow-hidden', ai > 0 ? '-ml-1.5' : '']"
													:title="a.name">
													<img v-if="a.avatar" :src="a.avatar" class="w-full h-full object-cover" :alt="a.name" />
													<span v-else>{{ getInitials(a.name) }}</span>
												</div>
												<div v-if="task.assignees.length > 3"
													class="w-7 h-7 rounded-full bg-heading/10 flex items-center justify-center text-[10px] font-bold text-text shrink-0 ring-2 ring-panel -ml-1.5">
													+{{ task.assignees.length - 3 }}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</template>

						<template #footer>
							<div v-if="boardColumns[status]?.length === 0"
								:class="['empty-drop-zone rounded-sm flex items-center justify-center min-h-[64px] transition-all duration-200', dragOverColumn === status && isDragging ? 'bg-accent/5 border-2 border-dashed border-accent/20' : 'border-2 border-dashed border-heading/8']">
								<p class="text-sm text-text font-medium select-none">{{ isDragging ?
									'Drop here' : 'No tasks' }}</p>
							</div>
						</template>
					</draggable>

					<button @click="emit('add-task-click', status)"
						class="column-add-footer w-full mt-2 flex items-center gap-1.5 px-2.5 py-2 rounded-sm text-sm font-medium text-text hover:text-text hover:bg-heading/4 transition-all group/add">
						<v-icon name="bi-plus" scale="0.85"
							class="group-hover/add:text-accent transition-colors" />
						Add task
					</button>
				</div>
			</div>
		</div>

		<!-- ─── LIST VIEW ─── -->
		<div v-else>
			<div v-if="filteredTasks.length === 0"
				class="bg-panel rounded-sm border border-heading/5 p-12 text-center">
				<v-icon name="bi-list-task" class="text-text mx-auto mb-3" scale="2.5" />
				<p class="text-base font-semibold text-text">No tasks found</p>
				<p class="text-sm text-text mt-1">Try adjusting your filters</p>
			</div>

			<div v-else class="bg-panel rounded-sm border border-heading/5 overflow-hidden">
				<div
					class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-heading/5 bg-heading/[0.02]">
					<div class="w-5" />
					<span class="text-sm font-bold uppercase text-text">Task</span>
					<span class="text-sm font-bold uppercase text-text w-20 text-center">Status</span>
					<span class="text-sm font-bold uppercase text-text w-16 text-center">Priority</span>
					<span class="text-sm font-bold uppercase text-text w-8 text-center">Who</span>
					<span class="text-sm font-bold uppercase text-text w-16 text-right">Due</span>
				</div>

				<draggable v-model="listItems" item-key="id" handle=".row-handle" :animation="150"
					ghost-class="list-row-ghost" drag-class="list-row-dragging" chosen-class="list-row-chosen"
					@start="onDragStart" @end="onDragEnd" @change="onListChange"
					class="divide-y divide-heading/[0.04]">
					<template #item="{ element: task }">
						<div v-if="matchesFilter(task)"
							class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-heading/[0.02] transition-colors group select-none cursor-pointer"
							@click="emit('open-task', task.id)">
							<div class="row-handle text-heading/15 group-hover:text-text transition-colors cursor-grab active:cursor-grabbing"
								@click.stop>
								<v-icon name="bi-grip-vertical" scale="0.85" />
							</div>
							<p
								:class="['text-base font-medium min-w-0 truncate transition-colors', task.status === 'Done' ? 'line-through text-text' : 'text-heading group-hover:text-accent']">
								{{ task.title }}
							</p>
							<div class="w-20 flex justify-center">
								<span :class="[
									'text-sm px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 whitespace-nowrap',
									columnConfig[task.status]?.labelClass,
									task.status === 'Done' ? 'bg-emerald-500/10' : task.status === 'In Progress' ? 'bg-accent/10' : task.status === 'Review' ? 'bg-violet-500/10' : 'bg-slate-400/10',
								]">
									<span
										:class="[columnConfig[task.status]?.dotClass, 'w-1 h-1 rounded-full', task.status === 'In Progress' ? 'animate-pulse' : '']" />
									{{ task.status }}
								</span>
							</div>
							<div class="w-16 flex justify-center">
								<span
									:class="[priorityConfig[task.priority]?.cls, 'text-sm px-2 py-0.5 rounded-full font-bold whitespace-nowrap']">
									{{ task.priority }}
								</span>
							</div>
							<div class="w-14 flex justify-center">
								<div class="flex items-center">
									<div
										v-for="(a, ai) in task.assignees.slice(0, 2)" :key="a.id"
										:class="[!a.avatar && paletteColor(a.palette), 'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ring-2 ring-panel overflow-hidden', ai > 0 ? '-ml-1' : '']"
										:title="a.name">
										<img v-if="a.avatar" :src="a.avatar" class="w-full h-full object-cover" :alt="a.name" />
										<span v-else>{{ getInitials(a.name) }}</span>
									</div>
									<div v-if="task.assignees.length > 2"
										class="w-6 h-6 rounded-full bg-heading/10 flex items-center justify-center text-[9px] font-bold text-text shrink-0 ring-2 ring-panel -ml-1">
										+{{ task.assignees.length - 2 }}
									</div>
								</div>
							</div>
							<div class="w-16 text-right">
								<span v-if="task.due"
									:class="['text-sm tabular-nums', isDueOverdue(task.due) && task.status !== 'Done' ? 'text-red-400 font-semibold' : 'text-text']">
									{{ formatShort(task.due) }}
								</span>
								<span v-else class="text-sm text-text">—</span>
							</div>
						</div>
					</template>
				</draggable>
			</div>
			<p class="text-center text-sm text-text mt-3">Showing {{ filteredTasks.length }} of {{ totalTasks
			}} tasks</p>
		</div>
	</div>
</template>

<style scoped>
/* ── BOARD COLUMN ─────────────────────────────────── */
.board-column {
	background: color-mix(in srgb, var(--color-heading, #1a1f4e) 2%, var(--color-panel));
	transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.column-drop-active {
	background: color-mix(in srgb, var(--color-accent, #6c63ff) 3%, var(--color-panel));
	transition: background 0.15s ease, border-color 0.15s ease;
}

.column-add-btn {
	opacity: 0;
	transition: opacity 0.15s ease;
}

.board-column:hover .column-add-btn {
	opacity: 1;
}

.column-add-footer {
	transition: background 0.15s ease, color 0.15s ease;
}

/* ── BOARD CARD — GHOST (placeholder where card will land) ── */
:deep(.task-ghost) {
	opacity: 1 !important;
	background: var(--color-accent, #6c63ff) !important;
	opacity: 0.08 !important;
	border: none !important;
	border-radius: 6px !important;
	box-shadow: none !important;
}

:deep(.task-ghost) * {
	opacity: 0 !important;
}

/* ── BOARD CARD — CHOSEN (picked up, before moving) ── */
:deep(.task-chosen) {
	cursor: grabbing !important;
	z-index: 10;
}

/* ── BOARD CARD — DRAGGING (the card following the cursor) ── */
:deep(.task-dragging),
:deep(.task-fallback) {
	opacity: 1 !important;
	transform: rotate(2deg) !important;
	box-shadow:
		0 8px 25px rgba(0, 0, 0, 0.15),
		0 2px 6px rgba(0, 0, 0, 0.08) !important;
	border-radius: 6px !important;
	cursor: grabbing !important;
	z-index: 9999 !important;
	background: var(--color-panel) !important;
	border-color: rgba(0,0,0,0.06) !important;
}

/* ── LIST ROW — GHOST ──────────────────────────────── */
.list-row-ghost {
	background: rgba(99, 102, 241, 0.07) !important;
	border-left: 3px solid rgba(99, 102, 241, 0.40) !important;
	border-top: none !important;
	border-right: none !important;
	border-bottom: none !important;
	border-radius: 0 !important;
	box-shadow: none !important;
	outline: none !important;
}

.list-row-ghost * {
	opacity: 0 !important;
}

/* ── LIST ROW — CHOSEN ─────────────────────────────── */
:deep(.list-row-chosen) {
	cursor: grabbing !important;
	z-index: 10;
}

/* ── LIST ROW — DRAGGING ───────────────────────────── */
:deep(.list-row-dragging) {
	opacity: 1 !important;
	box-shadow:
		0 8px 25px rgba(0, 0, 0, 0.15),
		0 2px 6px rgba(0, 0, 0, 0.08) !important;
	border-radius: 6px !important;
	background: var(--color-panel) !important;
	cursor: grabbing !important;
	z-index: 9999 !important;
}

/* ── GLOBAL DRAG CURSOR ──────────────────────────── */
.is-dragging-global,
.is-dragging-global * {
	cursor: grabbing !important;
}


/* ── MISC ────────────────────────────────────────── */
.empty-drop-zone {
	min-height: 64px;
	transition: background 0.15s ease, border-color 0.15s ease;
}

.tasks-list {
	min-height: 2.5rem;
}

.task-card {
	transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, opacity 0.2s ease;
}
</style>
