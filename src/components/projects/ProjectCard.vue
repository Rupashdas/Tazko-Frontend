<script setup>
import { addIcons } from 'oh-vue-icons'
import {
	MdFolderspecialOutlined, BiCalendar3, BiCheckCircle,
} from 'oh-vue-icons/icons'
import ProjectActionMenu from './ProjectActionMenu.vue'
import { sanitize } from '@/utils/sanitize'

addIcons(MdFolderspecialOutlined, BiCalendar3, BiCheckCircle)

defineProps({
	project:  { type: Object, required: true },
	color:    { type: String, required: true },
	due:      { type: Object, required: true },
	status:   { type: Object, required: true },
	priority: { type: Object, required: true },
	menuOpen: { type: Boolean, default: false },
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
	<div
		class="bg-panel rounded-sm border border-heading/8 hover:shadow-xl hover:shadow-heading/5 hover:-translate-y-0.5 hover:border-accent/20 transition-all duration-200 group overflow-hidden flex flex-col cursor-pointer"
		@click="emit('open')">

		<div :class="`h-1 w-full ${color}`" />

		<div class="p-5 flex-1">
			<div class="flex items-start justify-between mb-3">
				<div :class="`w-10 h-10 rounded-sm ${color} flex items-center justify-center shrink-0 shadow-sm`">
					<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.0" />
				</div>
				<div class="flex items-center gap-1.5" @click.stop>
					<span :class="[status.cls, 'inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-semibold']">
						<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
						{{ project.status }}
					</span>
					<ProjectActionMenu v-if="canUpdate || canArchive || canDelete"
						:open="menuOpen"
						:can-update="canUpdate"
						:can-archive="canArchive"
						:can-delete="canDelete"
						button-size="w-7 h-7"
						icon-scale="0.8"
						@toggle="emit('toggle-menu')"
						@open="emit('open')"
						@edit="emit('edit')"
						@archive="emit('archive')"
						@delete="emit('delete')" />
				</div>
			</div>

			<h3 class="section-title mb-1.5 group-hover:text-accent transition-colors">{{ project.name }}</h3>
			<div
				v-if="project.description"
				class="text-base text-text leading-relaxed line-clamp-2 mb-4 rich-content"
				v-html="sanitize(project.description)" />
			<p v-else class="text-base text-text leading-relaxed line-clamp-2 mb-4 italic">No description</p>

			<div class="mb-4">
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-sm font-semibold uppercase tracking-wide text-text">Progress</span>
					<span class="text-sm font-bold tabular-nums"
						:class="project.progress >= 100 ? 'text-emerald-500' : project.progress >= 60 ? 'text-accent' : 'text-text'">
						{{ project.progress }}%
					</span>
				</div>
				<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
					<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all duration-500']"
						:style="`width: ${project.progress}%`" />
				</div>
			</div>

			<div class="flex items-center gap-2 flex-wrap">
				<span class="inline-flex items-center gap-1 text-sm text-text font-medium">
					<v-icon name="bi-check-circle" scale="0.75" class="text-emerald-500" />
					{{ project.taskCounts.done }}/{{ project.taskCounts.total }} tasks
				</span>
				<span :class="[priority.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
					{{ project.priority }}
				</span>
			</div>
		</div>

		<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between bg-heading/[0.015]">
			<div class="flex -space-x-2">
				<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
					:class="[m.color, 'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel overflow-hidden']"
					:title="m.name">
					<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
					<span v-else>{{ m.initials }}</span>
				</div>
				<div v-if="project.members.length > 3"
					class="w-10 h-10 rounded-full bg-heading/10 flex items-center justify-center text-sm font-bold border-2 border-panel text-text">
					+{{ project.members.length - 3 }}
				</div>
			</div>
			<div class="flex items-center gap-1.5 text-sm font-medium" :class="due.cls">
				<v-icon name="bi-calendar3" scale="0.75" />
				{{ due.label }}
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
