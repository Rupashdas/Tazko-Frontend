<script setup>
import { addIcons } from 'oh-vue-icons'
import {
	BiFolder2Open, BiCalendar3, BiCheckCircle, BiThreeDotsVertical
} from 'oh-vue-icons/icons'
import ProjectActionMenu from './ProjectActionMenu.vue'
import { sanitize, excerpt } from '@/utils/sanitize'

addIcons(BiFolder2Open, BiCalendar3, BiCheckCircle, BiThreeDotsVertical)

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
		class="card card-hover flex flex-col cursor-pointer group"
		@click="emit('open')">

		<div :class="`h-1 w-full ${color}`" />

		<div class="p-5 flex-1">
			<div class="flex items-start justify-between mb-4">
				<div :class="`w-11 h-11 rounded-lg ${color} flex items-center justify-center shrink-0`">
					<v-icon name="bi-folder2-open" class="text-white" scale="1.2" />
				</div>
				<div class="flex items-center gap-1.5" @click.stop>
					<span :class="[status.cls, 'badge']">
						<span :class="[status.dot, 'w-1.5 h-1.5 rounded-full']" />
						{{ project.status }}
					</span>
					<ProjectActionMenu v-if="canUpdate || canArchive || canDelete"
						:open="menuOpen"
						:can-update="canUpdate"
						:can-archive="canArchive"
						:can-delete="canDelete"
						button-size="w-8 h-8"
						icon-scale="0.9"
						@toggle="emit('toggle-menu')"
						@open="emit('open')"
						@edit="emit('edit')"
						@archive="emit('archive')"
						@delete="emit('delete')" />
				</div>
			</div>

			<h3 class="text-base font-semibold text-heading mb-1.5 group-hover:text-accent transition-colors leading-snug">{{ project.name }}</h3>
			<p v-if="project.description" class="text-sm text-text leading-relaxed line-clamp-2 mb-4">
				{{ excerpt(project.description) }}
			</p>
			<p v-else class="text-sm text-text/60 leading-relaxed mb-4 italic">No description</p>

			<div class="mb-4">
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-sm font-semibold uppercase tracking-wider text-text/70">Progress</span>
					<span class="text-sm font-bold tabular-nums"
						:class="project.progress >= 100 ? 'text-emerald-600' : project.progress >= 60 ? 'text-accent' : 'text-text'">
						{{ project.progress }}%
					</span>
				</div>
				<div class="h-1.5 bg-heading/6 rounded-full overflow-hidden">
					<div :class="[progressColor(project.progress), 'h-full rounded-full transition-all duration-500']"
						:style="`width: ${project.progress}%`" />
				</div>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="inline-flex items-center gap-1.5 text-sm font-medium text-text">
						<v-icon name="bi-check-circle" scale="0.85" class="text-emerald-500" />
						{{ project.taskCounts.done }}/{{ project.taskCounts.total }}
					</span>
					<span :class="[priority.cls, 'badge text-sm px-2 py-0.5']">
						{{ project.priority }}
					</span>
				</div>
			</div>
		</div>

		<div class="px-5 py-3 border-t border-heading/6 flex items-center justify-between bg-heading/[0.015]">
			<div class="flex -space-x-2">
				<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
					:class="[m.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-panel overflow-hidden']"
					:title="m.name">
					<img v-if="m.avatar" :src="m.avatar" :alt="m.name" class="w-full h-full object-cover" />
					<span v-else>{{ m.initials }}</span>
				</div>
				<div v-if="project.members.length > 3"
					class="w-7 h-7 rounded-full bg-heading/10 flex items-center justify-center text-xs font-bold border-2 border-panel text-text">
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
