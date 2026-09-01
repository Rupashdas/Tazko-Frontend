<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiFolder2Open, BiGripVertical } from 'oh-vue-icons/icons'
import { excerpt } from '@/utils/sanitize'

addIcons(BiFolder2Open, BiGripVertical)

defineProps({
	rows: { type: Array, required: true },
})

const emit = defineEmits(['open'])

const columns = [
	{ key: 'Planning',    label: 'Planning' },
	{ key: 'In Progress', label: 'In Progress' },
	{ key: 'On Hold',     label: 'On Hold' },
	{ key: 'Completed',   label: 'Completed' },
]

const statusColor = (status) => {
	switch (status) {
		case 'Planning':    return 'bg-slate-400'
		case 'In Progress': return 'bg-accent'
		case 'On Hold':     return 'bg-amber-500'
		case 'Completed':   return 'bg-emerald-500'
		default:            return 'bg-slate-400'
	}
}

const statusBadge = (status) => {
	switch (status) {
		case 'Planning':    return 'bg-slate-400/15 text-slate-500'
		case 'In Progress': return 'bg-accent/10 text-accent'
		case 'On Hold':     return 'bg-amber-500/15 text-amber-600'
		case 'Completed':   return 'bg-emerald-500/15 text-emerald-600'
		default:            return 'bg-slate-400/15 text-slate-500'
	}
}

const grouped = computed(() => {
	const map = {}
	columns.forEach(c => { map[c.key] = [] })
	rows.value.forEach(row => {
		const s = row.project.status
		if (!map[s]) map[s] = []
		map[s].push(row)
	})
	return map
})
</script>

<template>
	<div class="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
		<div v-for="col in columns" :key="col.key" class="flex-shrink-0 w-72">
			<div class="flex items-center gap-2 mb-3 px-1">
				<div :class="`w-2 h-2 rounded-full ${statusColor(col.key)}`" />
				<h3 class="text-sm font-semibold text-heading">{{ col.label }}</h3>
				<span class="text-sm font-bold text-text bg-heading/5 px-2 py-0.5 rounded-full tabular-nums">
					{{ grouped[col.key]?.length || 0 }}
				</span>
			</div>

			<div class="space-y-2.5 min-h-[200px]">
				<div v-for="row in grouped[col.key]" :key="row.project.id"
					@click="emit('open', row.project.id)"
					class="card card-hover p-4 cursor-pointer group">
					<div class="flex items-center gap-2 mb-2.5">
						<div :class="`w-1.5 h-1.5 rounded-full ${row.color}`" />
						<span :class="[statusBadge(row.project.status), 'badge text-sm px-2 py-0.5']">
							{{ row.project.status }}
						</span>
						<span :class="[row.priority.cls, 'badge text-sm px-2 py-0.5 ml-auto']">
							{{ row.project.priority }}
						</span>
					</div>

					<h4 class="text-sm font-semibold text-heading mb-1 group-hover:text-accent transition-colors leading-snug">
						{{ row.project.name }}
					</h4>
					<p v-if="row.project.description" class="text-sm text-text leading-relaxed line-clamp-2 mb-3">
						{{ excerpt(row.project.description) }}
					</p>

					<div class="mb-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-sm font-semibold uppercase tracking-wider text-text/70">Progress</span>
							<span class="text-sm font-bold tabular-nums"
								:class="row.project.progress >= 100 ? 'text-emerald-600' : row.project.progress >= 60 ? 'text-accent' : 'text-text'">
								{{ row.project.progress }}%
							</span>
						</div>
						<div class="h-1 bg-heading/6 rounded-full overflow-hidden">
							<div :class="`h-full rounded-full transition-all duration-500 ${row.project.progress >= 100 ? 'bg-emerald-500' : row.project.progress >= 60 ? 'bg-accent' : row.project.progress >= 30 ? 'bg-amber-500' : 'bg-red-400'}`"
								:style="`width: ${row.project.progress}%`" />
						</div>
					</div>

					<div class="flex items-center justify-between pt-2.5 border-t border-heading/6">
						<div class="flex items-center gap-1.5 text-sm text-text">
							<v-icon name="bi-check-circle" scale="0.8" class="text-emerald-500" />
							{{ row.project.taskCounts.done }}/{{ row.project.taskCounts.total }}
						</div>
						<div class="flex -space-x-1.5">
							<div v-for="(m, i) in row.project.members.slice(0, 3)" :key="i"
								:class="[m.color, 'w-5 h-5 rounded-full border border-panel flex items-center justify-center text-white text-[10px] font-bold overflow-hidden']"
								:title="m.name">
								<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
								<span v-else>{{ m.initials }}</span>
							</div>
							<div v-if="row.project.members.length > 3"
								class="w-5 h-5 rounded-full bg-heading/10 border border-panel flex items-center justify-center text-[10px] font-bold text-text">
								+{{ row.project.members.length - 3 }}
							</div>
						</div>
					</div>
				</div>

				<div v-if="!grouped[col.key]?.length" class="text-sm text-text/50 text-center py-8 italic">
					No projects
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
