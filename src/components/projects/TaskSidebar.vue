<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { paletteColor } from '@/utils/paletteColor'
import {
	BiCalendar3, BiClock, BiCheck2, BiX,
} from 'oh-vue-icons/icons'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

addIcons(BiCalendar3, BiClock, BiCheck2, BiX)

const props = defineProps({
	task: { type: Object, required: true },
	members: { type: Array, default: () => [] },
	workspaceUsers: { type: Array, default: () => [] },
	statusOptions: { type: Array, required: true },
	priorityOptions: { type: Array, required: true },
	statusConfig: { type: Object, required: true },
	priorityConfig: { type: Object, required: true },
	availableLabels: { type: Array, default: () => [] },

	// Capability flags from parent
	canUpdate:         { type: Boolean, default: false },
	canUpdateStatus:   { type: Boolean, default: false },
	canUpdatePriority: { type: Boolean, default: false },
	canUpdateDeadline: { type: Boolean, default: false },
	canAssign:         { type: Boolean, default: false },

})

const emit = defineEmits(['save', 'create-label'])

// ── Avatar helpers ─────────────────────────────────────
const getUserInitials = (name) => {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Status / Priority / Due ────────────────────────────
const setStatus = (st) => {
	if (!props.canUpdateStatus || props.task.status === st) return
	emit('save', { status: st })
}

const setPriority = (pr) => {
	if (!props.canUpdatePriority || props.task.priority === pr) return
	emit('save', { priority: pr })
}

const setDueDate = (date) => {
	if (!props.canUpdateDeadline) return
	emit('save', { due_date: date })
}

// ── Assignees ──────────────────────────────────────────
const currentAssigneeIds = computed(() =>
	props.task.assignees.map(a => a.id)
)

const assigneeOptions = computed(() => [
	...props.members.map(m => ({
		label: m.name,
		value: m.id,
		color: m.color ?? paletteColor(m.palette),
		initials: m.initials ?? getUserInitials(m.name),
		avatar: m.avatar ?? null,
		group: 'Project Members',
	})),
	...props.workspaceUsers.map(u => ({
		label: u.name,
		value: u.id,
		color: u.color ?? paletteColor(u.palette),
		initials: u.initials ?? getUserInitials(u.name),
		avatar: u.avatar ?? null,
		group: 'Add from Workspace',
		isNonMember: true,
	})),
])

const handleAssigneeChange = (newIds) => {
	if (!props.canAssign) return
	emit('save', { assignee_ids: newIds })
}

const removeAssignee = (userId) => {
	if (!props.canAssign) return
	const nextIds = props.task.assignees.filter(a => a.id !== userId).map(a => a.id)
	emit('save', { assignee_ids: nextIds })
}

// ── Labels ─────────────────────────────────────────────
const removeLabel = (label) => {
	if (!props.canUpdate) return
	const nextIds = props.task.labels.filter(l => l.id !== label.id).map(l => l.id)
	emit('save', { label_ids: nextIds })
}

const addLabel = (labelId) => {
	if (!props.canUpdate) return
	if (props.task.labels.some(l => l.id === labelId)) return
	const nextIds = [...props.task.labels.map(l => l.id), labelId]
	emit('save', { label_ids: nextIds })
	labelInput.value = ''
	showLabelInput.value = false
}

const addCustomLabel = async () => {
	const name = labelInput.value.trim()
	if (!name || !props.canUpdate) return
	emit('create-label', { name })
	labelInput.value = ''
	showLabelInput.value = false
}

const formatDate = (d) => d
	? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	: ''

const daysLeft = computed(() => {
	if (!props.task.due) return null
	const diff = Math.ceil((new Date(props.task.due) - new Date()) / (1000 * 60 * 60 * 24))
	if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'text-red-500 font-bold' }
	if (diff === 0) return { label: 'Due today', cls: 'text-amber-500 font-bold' }
	if (diff <= 3) return { label: `${diff}d left`, cls: 'text-amber-500 font-semibold' }
	return { label: `${diff} days left`, cls: 'text-text' }
})

// ── Label input state ──────────────────────────────────
const showLabelInput = ref(false)
const labelInput = ref('')

const filteredLabels = computed(() =>
	props.availableLabels.filter(l =>
		!props.task.labels.some(tl => tl.id === l.id) &&
		l.name.toLowerCase().includes(labelInput.value.toLowerCase())
	)
)

// ── Position calendar dropdown ─────────────────────────
const dueDateCardRef = ref(null)

const repositionCalendar = () => {
	const dropdown = document.getElementById('app-datepicker-dropdown')
	const card = dueDateCardRef.value
	if (dropdown && card) {
		const cardRect = card.getBoundingClientRect()
		dropdown.style.setProperty('left', cardRect.left + 'px', 'important')
		dropdown.style.setProperty('width', '256px', 'important')
	}
}

onMounted(() => {
	const observer = new MutationObserver(() => repositionCalendar())
	observer.observe(document.body, {
		childList: true, subtree: true,
		attributes: true, attributeFilter: ['style'],
	})
	window.addEventListener('scroll', repositionCalendar)
	window.addEventListener('resize', repositionCalendar)

	onUnmounted(() => {
		observer.disconnect()
		window.removeEventListener('scroll', repositionCalendar)
		window.removeEventListener('resize', repositionCalendar)
	})
})
</script>

<style scoped>
	:deep(.due-date-wrapper) { width: 100%; }
	:deep(.due-date-wrapper > div) { width: 100%; flex: 1; }
	:deep(.due-date-wrapper > div > button) {
		background: transparent !important;
		border: none !important;
		padding: 0 !important;
		font-size: 1rem;
		font-weight: 600;
		justify-content: flex-start;
		width: 100%;
		min-width: 0;
	}
	:deep(.due-date-wrapper > div > button:focus) { outline: none !important; border: none !important; }
	:deep(.due-date-wrapper .absolute.left-3) { display: none; }
	:deep(.due-date-wrapper .absolute.right-3) { display: none; }
	:deep(#app-datepicker-dropdown) { width: 256px !important; }
</style>

<template>
	<aside class="w-64 shrink-0 space-y-3 sticky top-24 self-start">

		<!-- ── Assignees ─────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Assignees</p>

			<!-- Current assignee list -->
			<div v-if="task.assignees.length" class="space-y-2 mb-3">
				<div
					v-for="a in task.assignees"
					:key="a.id ?? a.name"
					class="flex items-center gap-2.5 group">

					<!-- Avatar with thumbnail support -->
					<div :class="[a.color ?? paletteColor(a.palette), 'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm overflow-hidden']">
						<img v-if="a.avatar" :src="a.avatar" class="w-full h-full object-cover" :alt="a.name" />
						<span v-else>{{ getUserInitials(a.name) }}</span>
					</div>

					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-heading leading-tight truncate">{{ a.name }}</p>
						<p v-if="a.role" class="text-xs text-text">{{ a.role }}</p>
					</div>

					<!-- Remove on hover -->
					<button
						v-if="canAssign"
						@click="removeAssignee(a.id)"
						class="opacity-0 group-hover:opacity-100 transition-opacity text-text hover:text-red-400 shrink-0"
						:title="`Remove ${a.name}`">
						<v-icon name="bi-x" scale="0.9" />
					</button>
				</div>
			</div>

			<p v-else class="text-sm text-text mb-3">No assignees yet</p>

			<!-- Grouped searchable assignee selector -->
			<AppSelect
				v-if="canAssign && (members.length || workspaceUsers.length)"
				:model-value="currentAssigneeIds"
				@update:model-value="handleAssigneeChange"
				:options="assigneeOptions"
				placeholder="Assign member…"
				:searchable="true"
				:multiple="true"
				:hide-value="true"
				size="sm" />
		</div>

		<!-- ── Status ─────────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Status</p>
			<div class="space-y-1.5">
				<button v-for="st in statusOptions" :key="st"
					@click="setStatus(st)"
					:disabled="!canUpdateStatus"
					:class="['w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all border',
						task.status === st
							? statusConfig[st].cls
							: 'text-text border-transparent hover:bg-heading/5 hover:text-text',
						!canUpdateStatus && 'cursor-not-allowed opacity-60 hover:bg-transparent']">
					<span
						:class="[statusConfig[st].dot.replace('animate-pulse', ''), 'w-1.5 h-1.5 rounded-full shrink-0']" />
					{{ st }}
					<v-icon v-if="task.status === st" name="bi-check2" scale="0.8" class="ml-auto" />
				</button>
			</div>
		</div>

		<!-- ── Priority ───────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Priority</p>
			<div class="space-y-1.5">
				<button v-for="pr in priorityOptions" :key="pr"
					@click="setPriority(pr)"
					:disabled="!canUpdatePriority"
					:class="['w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all border',
						task.priority === pr
							? priorityConfig[pr].cls
							: 'text-text border-transparent hover:bg-heading/5 hover:text-text',
						!canUpdatePriority && 'cursor-not-allowed opacity-60 hover:bg-transparent']">
					<span :class="[priorityConfig[pr].bar, 'w-1.5 h-1.5 rounded-full shrink-0']" />
					{{ pr }}
					<v-icon v-if="task.priority === pr" name="bi-check2" scale="0.8" class="ml-auto" />
				</button>
			</div>
		</div>

		<!-- ── Due Date ───────────────────────────────── -->
		<div ref="dueDateCardRef" class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Due Date</p>
			<div :class="['due-date-wrapper flex items-center gap-2 w-full transition-opacity',
				canUpdateDeadline ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70 pointer-events-none']">
				<v-icon name="bi-calendar3" class="text-text shrink-0" scale="0.9" />
				<AppDatePicker
					:modelValue="task.due"
					@update:modelValue="setDueDate"
					placeholder="Set due date…" />
			</div>
			<p v-if="daysLeft" :class="[daysLeft.cls, 'text-sm mt-2 flex items-center gap-1']">
				<v-icon name="bi-clock" scale="0.8" />
				{{ daysLeft.label }}
			</p>
		</div>

		<!-- ── Labels ─────────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Labels</p>
			<div class="space-y-2.5">
				<div class="flex flex-wrap gap-1.5">
					<span v-for="label in task.labels" :key="label.id"
						:class="[label.color, 'text-sm px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5']">
						{{ label.name }}
						<button v-if="canUpdate" @click="removeLabel(label)"
							class="hover:opacity-60 transition-opacity leading-none">×</button>
					</span>
				</div>

				<div v-if="showLabelInput && canUpdate" class="relative">
					<input
						v-model="labelInput"
						type="text"
						placeholder="Type or select label…"
						@keydown.enter="addCustomLabel"
						@keydown.escape="showLabelInput = false"
						class="w-full px-0 py-2 border-0 border-b-2 border-heading/20 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors" />

					<div v-if="labelInput && filteredLabels.length" class="absolute top-full left-0 right-0 mt-1 bg-panel border border-heading/10 rounded-sm shadow-lg z-50">
						<button
							v-for="label in filteredLabels" :key="label.id"
							@click="addLabel(label.id)"
							class="w-full text-left px-3 py-2 text-sm hover:bg-heading/5 transition-colors flex items-center gap-2">
							<span :class="[label.color, 'px-2 py-0.5 rounded-full text-xs font-semibold border']">
								{{ label.name }}
							</span>
						</button>
					</div>
				</div>

				<button
					v-if="!showLabelInput && canUpdate"
					@click="showLabelInput = true"
					class="text-sm px-2.5 py-1 rounded-full border border-dashed border-heading/20 text-text hover:border-accent hover:text-accent transition-colors">
					+ Add label
				</button>
			</div>
		</div>

		<!-- ── Meta ───────────────────────────────────── -->
		<div class="px-1">
			<p v-if="task.created_at" class="text-sm text-text flex items-center gap-1.5">
				<v-icon name="bi-calendar3" scale="0.75" />
				Created {{ formatDate(task.created_at) }}
			</p>
		</div>

	</aside>
</template>
