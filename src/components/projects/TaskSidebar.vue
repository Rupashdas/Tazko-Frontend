<script setup>
import { computed } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiCalendar3, BiClock, BiCheck2,
} from 'oh-vue-icons/icons'

addIcons(BiCalendar3, BiClock, BiCheck2)

const props = defineProps({
	task: { type: Object, required: true },
	members: { type: Array, default: () => [] },
	statusOptions: { type: Array, required: true },
	priorityOptions: { type: Array, required: true },
	statusConfig: { type: Object, required: true },
	priorityConfig: { type: Object, required: true },
})

const emit = defineEmits(['update:task'])

const updateTask = (patch) => emit('update:task', { ...props.task, ...patch })

const toggleAssignee = (member) => {
	const exists = props.task.assignees.some(a => a.initials === member.initials)
	const nextAssignees = exists
		? props.task.assignees.filter(a => a.initials !== member.initials)
		: [...props.task.assignees, member]
	updateTask({ assignees: nextAssignees })
}

const setStatus = (st) => updateTask({ status: st })
const setPriority = (pr) => updateTask({ priority: pr })

const removeLabel = (label) => {
	updateTask({ labels: props.task.labels.filter(l => l.id !== label.id) })
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const daysLeft = computed(() => {
	const diff = Math.ceil((new Date(props.task.due) - new Date()) / (1000 * 60 * 60 * 24))
	if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'text-red-500 font-bold' }
	if (diff === 0) return { label: 'Due today', cls: 'text-amber-500 font-bold' }
	if (diff <= 3) return { label: `${diff}d left`, cls: 'text-amber-500 font-semibold' }
	return { label: `${diff} days left`, cls: 'text-text' }
})
</script>

<template>
	<aside class="w-64 shrink-0 space-y-3 sticky top-24 self-start">

		<!-- Assignees -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Assignees</p>

			<div v-if="task.assignees.length" class="space-y-2 mb-3">
				<div v-for="a in task.assignees" :key="a.initials" class="flex items-center gap-2.5">
					<div :class="[a.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
						{{ a.initials }}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold text-heading leading-tight truncate">{{ a.name }}</p>
						<p class="text-xs text-text">{{ a.role }}</p>
					</div>
				</div>
			</div>
			<p v-else class="text-sm text-text mb-3">No assignees</p>

			<div class="flex flex-wrap gap-1.5 pt-3 border-t border-heading/5">
				<button
					v-for="m in members" :key="m.initials"
					@click="toggleAssignee(m)"
					:class="[m.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all shadow-sm',
						task.assignees.some(a => a.initials === m.initials)
							? 'ring-2 ring-offset-1 ring-offset-panel ring-heading/30 scale-110'
							: 'opacity-50 hover:opacity-100 hover:scale-105']"
					:title="m.name">
					{{ m.initials }}
				</button>
			</div>
		</div>

		<!-- Status -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Status</p>
			<div class="space-y-1.5">
				<button v-for="st in statusOptions" :key="st" @click="setStatus(st)" :class="['w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all border',
					task.status === st
						? statusConfig[st].cls
						: 'text-text border-transparent hover:bg-heading/5 hover:text-text']">
					<span
						:class="[statusConfig[st].dot.replace('animate-pulse', ''), 'w-1.5 h-1.5 rounded-full shrink-0']" />
					{{ st }}
					<v-icon v-if="task.status === st" name="bi-check2" scale="0.8" class="ml-auto" />
				</button>
			</div>
		</div>

		<!-- Priority -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Priority</p>
			<div class="space-y-1.5">
				<button v-for="pr in priorityOptions" :key="pr" @click="setPriority(pr)" :class="['w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all border',
					task.priority === pr
						? priorityConfig[pr].cls
						: 'text-text border-transparent hover:bg-heading/5 hover:text-text']">
					<span :class="[priorityConfig[pr].bar, 'w-1.5 h-1.5 rounded-full shrink-0']" />
					{{ pr }}
					<v-icon v-if="task.priority === pr" name="bi-check2" scale="0.8" class="ml-auto" />
				</button>
			</div>
		</div>

		<!-- Due date -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Due Date</p>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<v-icon name="bi-calendar3" class="text-text" scale="0.9" />
					<span class="text-base font-semibold text-heading">{{ formatDate(task.due) }}</span>
				</div>
			</div>
			<p :class="[daysLeft.cls, 'text-sm mt-2 flex items-center gap-1']">
				<v-icon name="bi-clock" scale="0.8" />
				{{ daysLeft.label }}
			</p>
		</div>

		<!-- Labels -->
		<div class="bg-panel rounded-sm border border-heading/5 p-4">
			<p class="text-sm font-semibold uppercase tracking-wide text-text mb-3">Labels</p>
			<div class="flex flex-wrap gap-1.5">
				<span v-for="label in task.labels" :key="label.id"
					:class="[label.color, 'text-sm px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5']">
					{{ label.name }}
					<button @click="removeLabel(label)"
						class="hover:opacity-60 transition-opacity leading-none">×</button>
				</span>
				<button
					class="text-sm px-2.5 py-1 rounded-full border border-dashed border-heading/20 text-text hover:border-accent hover:text-accent transition-colors">
					+ Add label
				</button>
			</div>
		</div>

		<!-- Meta -->
		<div class="px-1">
			<p class="text-sm text-text flex items-center gap-1.5">
				<v-icon name="bi-calendar3" scale="0.75" />
				Created {{ formatDate(task.createdAt) }}
			</p>
		</div>

	</aside>
</template>
