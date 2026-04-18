<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiChevronRight, BiPlus, BiThreeDotsVertical, BiPencil, BiArchive, BiTrash,
	BiCalendar3, BiClock, BiPersonPlus, BiX, MdFolderspecialOutlined,
} from 'oh-vue-icons/icons'
import { sanitize } from '@/utils/sanitize'

addIcons(
	BiChevronRight, BiPlus, BiThreeDotsVertical, BiPencil, BiArchive, BiTrash,
	BiCalendar3, BiClock, BiPersonPlus, BiX, MdFolderspecialOutlined,
)

const props = defineProps({
	project:          { type: Object, required: true },
	liveProgress:     { type: Number, default: 0 },
	tabs:             { type: Array,  required: true },
	activeTab:        { type: String, required: true },
	moreMenuOpen:     { type: Boolean, default: false },
	canCreateTask:    { type: Boolean, default: false },
	canUpdate:        { type: Boolean, default: false },
	canArchive:       { type: Boolean, default: false },
	canDelete:        { type: Boolean, default: false },
	canManageMembers: { type: Boolean, default: false },
})

const emit = defineEmits([
	'add-task', 'toggle-more-menu',
	'edit', 'archive', 'delete',
	'add-member', 'remove-member',
	'set-active-tab',
])

const router = useRouter()

const hasAnyAction = computed(() => props.canUpdate || props.canArchive || props.canDelete)

const statusConfig = {
	'Planning':    { cls: 'bg-slate-400/15 text-slate-500',     dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent',           dot: 'bg-accent animate-pulse' },
	'On Hold':     { cls: 'bg-amber-500/15 text-amber-600',     dot: 'bg-amber-500' },
	'Completed':   { cls: 'bg-emerald-500/15 text-emerald-600', dot: 'bg-emerald-500' },
}

const daysLeft = computed(() =>
	Math.ceil((new Date(props.project.endDate) - new Date()) / (1000 * 60 * 60 * 24))
)
const formatDate = (d) =>
	new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const hasDescription = computed(() => {
	const raw = props.project.description
	if (!raw) return false
	const stripped = String(raw).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
	return stripped.length > 0
})
</script>

<template>
	<!-- Breadcrumb -->
	<div class="flex items-center gap-1.5 mb-4">
		<button @click="router.push({ name: 'projects' })"
			class="text-sm font-medium text-text hover:text-accent transition-colors">
			Projects
		</button>
		<v-icon name="bi-chevron-right" scale="0.7" class="text-text" />
		<span class="text-sm font-semibold text-text">{{ project.name }}</span>
	</div>

	<!-- Hero panel -->
	<div class="relative rounded-t-sm">
		<div class="absolute inset-0 bg-accent/8" />
		<div class="absolute inset-0 bg-panel/80 backdrop-blur-sm border border-b-0 border-heading/8 rounded-t-sm" />

		<div class="relative px-6 pt-5">

			<!-- Title row -->
			<div class="flex flex-wrap gap-5 items-start justify-between mb-4">
				<div class="flex items-start gap-4 flex-1 min-w-0">
					<div :class="[project.color || 'bg-accent', 'w-12 h-12 rounded-sm flex items-center justify-center shrink-0 shadow-lg']">
						<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.3" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-start gap-2.5 flex-wrap mb-2">
							<h1 class="page-title">{{ project.name }}</h1>
							<span :class="[statusConfig[project.status]?.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-bold border border-current/10']">
								<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</div>
					</div>
				</div>

				<!-- Action buttons -->
				<div class="flex items-center gap-2 shrink-0 mt-1">
					<button v-if="canCreateTask" @click="emit('add-task', 'Todo')" class="tazko-btn shadow-md shadow-accent/20">
						<v-icon name="bi-plus" scale="0.9" />
						Add Task
					</button>

					<div v-if="hasAnyAction" class="relative" @click.stop>
						<button
							@click="emit('toggle-more-menu', $event)"
							class="p-2 rounded-sm border border-heading/10 text-text hover:text-heading hover:bg-heading/5 transition-all"
							title="More actions">
							<v-icon name="bi-three-dots-vertical" scale="0.9" />
						</button>
						<Transition
							enter-active-class="transition-all duration-150 ease-in-out"
							leave-active-class="transition-all duration-150 ease-in-out"
							enter-from-class="opacity-0 -translate-y-1.5"
							leave-to-class="opacity-0 -translate-y-1.5">
							<div v-if="moreMenuOpen"
								class="absolute right-0 top-full mt-1 w-52 bg-panel rounded-sm border border-heading/10 shadow-xl z-30 overflow-hidden">
								<button v-if="canUpdate" @click="emit('edit')"
									class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
									<v-icon name="bi-pencil" scale="0.85" /> Edit Project
								</button>
								<button v-if="canArchive" @click="emit('archive')"
									class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
									<v-icon name="bi-archive" scale="0.85" /> Archive
								</button>
								<div v-if="canDelete && (canUpdate || canArchive)" class="h-px bg-heading/5 mx-2" />
								<button v-if="canDelete" @click="emit('delete')"
									class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
									<v-icon name="bi-trash" scale="0.85" /> Delete
								</button>
							</div>
						</Transition>
					</div>
				</div>
			</div>

			<!-- Description -->
			<div class="rounded-sm mb-4">
				<div v-if="hasDescription"
					class="project-rich-content px-2 py-1 -ml-2" v-html="sanitize(project.description)" />
				<p v-else class="text-sm text-text italic opacity-60 px-2 py-1 -ml-2">
					No description yet.
				</p>
			</div>

			<!-- Progress + meta strip -->
			<div class="flex flex-wrap items-center gap-5 mb-5">
				<div class="flex items-center gap-2.5 min-w-52">
					<div class="flex-1 h-1.5 bg-heading/10 rounded-full overflow-hidden">
						<div class="h-full bg-accent rounded-full transition-all duration-700"
							:style="`width:${liveProgress}%`" />
					</div>
					<span class="text-sm font-bold text-heading tabular-nums">{{ liveProgress }}%</span>
				</div>
				<div class="flex items-center gap-1.5 text-sm text-text">
					<v-icon name="bi-calendar3" scale="0.75" />
					{{ formatDate(project.startDate) }} → {{ formatDate(project.endDate) }}
				</div>
				<div class="flex items-center gap-1.5 text-sm"
					:class="daysLeft <= 14 ? 'text-amber-500 font-semibold' : 'text-text'">
					<v-icon name="bi-clock" scale="0.75" />
					{{ daysLeft > 0 ? `${daysLeft} days remaining` : 'Past deadline' }}
				</div>

				<!-- Member avatars -->
				<div class="flex items-center ml-auto">
					<div v-for="(m, i) in project.members" :key="m.id"
						class="relative group -ml-4 first:ml-0"
						:style="`z-index: ${project.members.length - i}`">
						<div :class="[!m.avatar && m.color, 'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel shadow-sm hover:scale-110 transition-transform cursor-pointer overflow-hidden']"
							:title="`${m.name}${m.role ? ' — ' + m.role : ''}`">
							<img v-if="m.avatar" :src="m.avatar" class="w-full h-full object-cover" :alt="m.name" />
							<span v-else>{{ m.initials }}</span>
						</div>
						<button v-if="canManageMembers" @click="emit('remove-member', m.id)"
							class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible flex items-center justify-center shadow-sm z-10 transition-all"
							:title="`Remove ${m.name}`">
							<v-icon name="bi-x" scale="0.8" />
						</button>
					</div>
					<button v-if="canManageMembers" @click="emit('add-member')"
						class="w-12 h-12 rounded-full border-2 border-dashed border-heading/20 flex items-center justify-center bg-panel -ml-1.5 text-text hover:text-accent hover:border-accent/40 transition-all"
						title="Add member">
						<v-icon name="bi-person-plus" scale="1" />
					</button>
				</div>
			</div>

			<!-- Tab bar -->
			<div class="flex items-center gap-1 flex-wrap">
				<button v-for="tab in tabs" :key="tab.key" @click="emit('set-active-tab', tab.key)" :class="[
					'inline-flex items-center gap-1.5 px-4 py-3 text-base font-semibold transition-all border-b-2 -mb-px select-none',
					activeTab === tab.key
						? 'text-accent border-accent'
						: 'text-text border-transparent hover:text-heading hover:border-heading/15',
				]">
					<v-icon :name="tab.icon" scale="0.85" />
					{{ tab.label }}
				</button>
			</div>
		</div>
	</div>
</template>
