<script setup>
import { addIcons } from 'oh-vue-icons'
import { MdFolderspecialOutlined } from 'oh-vue-icons/icons'
import ProjectActionMenu from './ProjectActionMenu.vue'

addIcons(MdFolderspecialOutlined)

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
	<div class="bg-panel rounded-sm border border-heading/8">
		<table class="w-full">
			<thead>
				<tr class="border-b border-heading/8 bg-heading/[0.02]">
					<th class="text-left px-5 py-3 text-sm font-semibold uppercase tracking-wide text-text">Project</th>
					<th class="hidden sm:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Status</th>
					<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Priority</th>
					<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text w-36">Progress</th>
					<th class="hidden md:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Tasks</th>
					<th class="hidden lg:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Team</th>
					<th class="hidden lg:table-cell text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Due</th>
					<th class="px-4 py-3" />
				</tr>
			</thead>
			<tbody class="divide-y divide-heading/5">
				<tr v-for="{ project, color, due, status, priority } in rows" :key="project.id"
					class="hover:bg-heading/[0.015] transition-colors cursor-pointer group"
					@click="emit('open', project.id)">
					<td class="px-5 py-4">
						<div class="flex items-center gap-3">
							<div :class="`w-8 h-8 rounded-sm ${color} flex items-center justify-center shrink-0`">
								<v-icon name="md-folderspecial-outlined" class="text-white" scale="0.85" />
							</div>
							<div>
								<p class="text-base font-semibold text-heading group-hover:text-accent transition-colors">{{ project.name }}</p>
								<p class="text-sm text-text line-clamp-1 max-w-xs mt-0.5">{{ project.description }}</p>
							</div>
						</div>
					</td>
					<td class="hidden sm:table-cell px-4 py-4">
						<span :class="[status.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-semibold']">
							<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
							{{ project.status }}
						</span>
					</td>
					<td class="hidden md:table-cell px-4 py-4">
						<span :class="[priority.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
							{{ project.priority }}
						</span>
					</td>
					<td class="hidden md:table-cell px-4 py-4">
						<div class="flex items-center gap-2">
							<div class="flex-1 h-1.5 bg-heading/8 rounded-full overflow-hidden min-w-16">
								<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all']"
									:style="`width: ${project.progress}%`" />
							</div>
							<span class="text-sm font-bold text-text w-8 text-right tabular-nums">{{ project.progress }}%</span>
						</div>
					</td>
					<td class="hidden md:table-cell px-4 py-4">
						<span class="text-base text-text font-medium">{{ project.taskCounts.done }}/{{ project.taskCounts.total }}</span>
					</td>
					<td class="hidden lg:table-cell px-4 py-4">
						<div class="flex -space-x-1.5">
							<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
								:class="[m.color, 'w-6 h-6 rounded-full border-2 border-panel flex items-center justify-center text-white text-sm font-bold overflow-hidden']"
								:title="m.name">
								<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
								<span v-else>{{ m.initials }}</span>
							</div>
							<div v-if="project.members.length > 3"
								class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel flex items-center justify-center text-sm font-bold text-text">
								+{{ project.members.length - 3 }}
							</div>
						</div>
					</td>
					<td class="hidden lg:table-cell px-4 py-4">
						<span class="text-sm font-medium" :class="due.cls">
							{{ due.label }}
						</span>
					</td>
					<td v-if="canUpdate || canArchive || canDelete" class="px-4 py-4" @click.stop>
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
</template>

<style scoped>
.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
