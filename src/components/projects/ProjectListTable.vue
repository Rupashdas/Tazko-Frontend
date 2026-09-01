<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiFolder2Open, BiCalendar3, BiCheckCircle } from 'oh-vue-icons/icons'
import ProjectActionMenu from './ProjectActionMenu.vue'
import { excerpt } from '@/utils/sanitize'

addIcons(BiFolder2Open, BiCalendar3, BiCheckCircle)

defineProps({
	rows:       { type: Array, required: true },
	openMenuId: { type: [Number, String, null], default: null },
	canUpdate:  { type: Boolean, default: false },
	canArchive: { type: Boolean, default: false },
	canDelete:  { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'toggle-menu', 'edit', 'archive', 'delete'])

const progressColor = (p) => {
	if (p >= 100) return 'bg-emerald-500'
	if (p >= 60)  return 'bg-accent'
	if (p >= 30)  return 'bg-amber-500'
	return 'bg-red-400'
}
</script>

<template>
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="data-table w-full">
				<thead>
					<tr>
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70 w-8" />
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70">Project</th>
						<th class="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70">Status</th>
						<th class="hidden md:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70">Priority</th>
						<th class="hidden md:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70 w-40">Progress</th>
						<th class="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70">Tasks</th>
						<th class="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text/70">Due</th>
						<th v-if="canUpdate || canArchive || canDelete" class="px-4 py-3 w-10" />
					</tr>
				</thead>
				<tbody class="divide-y divide-heading/5">
					<tr v-for="{ project, color, due, status, priority } in rows" :key="project.id"
						class="hover:bg-heading/3 transition-colors cursor-pointer group"
						@click="emit('open', project.id)">
						<td class="px-4 py-3.5">
							<div :class="`w-2 h-2 rounded-full ${color}`" />
						</td>
						<td class="px-4 py-3.5">
							<div class="flex items-center gap-3">
								<div :class="`w-9 h-9 rounded-md ${color} flex items-center justify-center shrink-0`">
									<v-icon name="bi-folder2-open" class="text-white" scale="0.9" />
								</div>
								<div class="min-w-0">
									<p class="text-sm font-semibold text-heading group-hover:text-accent transition-colors truncate">{{ project.name }}</p>
									<p class="text-sm text-text/70 truncate mt-0.5">{{ excerpt(project.description) || 'No description' }}</p>
								</div>
							</div>
						</td>
						<td class="hidden sm:table-cell px-4 py-3.5">
							<span :class="[status.cls, 'badge']">
								<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</td>
						<td class="hidden md:table-cell px-4 py-3.5">
							<span :class="[priority.cls, 'badge']">
								{{ project.priority }}
							</span>
						</td>
						<td class="hidden md:table-cell px-4 py-3.5">
							<div class="flex items-center gap-2.5">
								<div class="flex-1 h-1.5 bg-heading/6 rounded-full overflow-hidden min-w-20">
									<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all']"
										:style="`width: ${project.progress}%`" />
								</div>
								<span class="text-sm font-bold text-text w-8 text-right tabular-nums">{{ project.progress }}%</span>
							</div>
						</td>
						<td class="hidden lg:table-cell px-4 py-3.5">
							<span class="text-sm text-text font-medium">{{ project.taskCounts.done }}/{{ project.taskCounts.total }}</span>
						</td>
						<td class="hidden lg:table-cell px-4 py-3.5">
							<span class="text-sm font-medium flex items-center gap-1.5" :class="due.cls">
								<v-icon name="bi-calendar3" scale="0.75" />
								{{ due.label }}
							</span>
						</td>
						<td v-if="canUpdate || canArchive || canDelete" class="px-4 py-3.5" @click.stop>
							<ProjectActionMenu
								:open="openMenuId === project.id"
								:can-update="canUpdate"
								:can-archive="canArchive"
								:can-delete="canDelete"
								@toggle="emit('toggle-menu', project.id)"
								@open="emit('open', project.id)"
								@edit="emit('edit', project)"
								@archive="emit('archive', project.id)"
								@delete="emit('delete', project.id)" />
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
