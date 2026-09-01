<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiArchive, BiSearch, BiX, BiArrowCounterclockwise,
	BiTrash, BiCalendar3, BiCheckCircle, BiGrid3X3Gap,
	BiListUl, MdFolderspecialOutlined, BiClock,
	BiArrowRepeat,
} from 'oh-vue-icons/icons'
import { useProjectStore } from '@/stores/useProjectStore'
import { useToast } from '@/utils/toast'

addIcons(
	BiArchive, BiSearch, BiX, BiArrowCounterclockwise,
	BiTrash, BiCalendar3, BiCheckCircle, BiGrid3X3Gap,
	BiListUl, MdFolderspecialOutlined, BiClock,
	BiArrowRepeat,
)

const router = useRouter()
const store  = useProjectStore()
const { successToast, errorToast } = useToast()

// ── View state ─────────────────────────────────────────────────────────────
const viewMode            = ref('grid')
const showUnarchiveConfirm = ref(false)
const pendingUnarchiveId   = ref(null)
const showDeleteConfirm    = ref(false)
const pendingDeleteId      = ref(null)
const restoring            = ref(false)
const deleting             = ref(false)

// ── Search (debounced) ─────────────────────────────────────────────────────
const searchQuery = ref('')
let searchTimer = null
watch(searchQuery, (val) => {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(() => {
		store.archivedSearch = val.trim()
		store.resetArchived()
		store.fetchNextArchivedPage()
	}, 350)
})

// ── Infinite scroll ────────────────────────────────────────────────────────
const sentinel = ref(null)
let observer = null

function setupObserver() {
	observer = new IntersectionObserver(
		(entries) => { if (entries[0].isIntersecting) store.fetchNextArchivedPage() },
		{ rootMargin: '120px' }
	)
	if (sentinel.value) observer.observe(sentinel.value)
}

onMounted(() => {
	store.archivedSearch = ''
	searchQuery.value    = ''
	store.resetArchived()
	store.fetchNextArchivedPage()
	setupObserver()
})

onBeforeUnmount(() => {
	observer?.disconnect()
	clearTimeout(searchTimer)
})

// ── Decorated projects (members with initials/color) ──────────────────────
const AVATAR_COLORS = [
	'bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500',
	'bg-sky-500','bg-indigo-500','bg-teal-500','bg-orange-500',
]
function colorFor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }
function initialsFor(name) {
	return name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

const decoratedProjects = computed(() =>
	store.archived.map(p => ({
		...p,
		decoratedMembers: (p.members ?? []).map(m => ({
			...m,
			initials: initialsFor(m.name),
			color:    colorFor(m.id),
		})),
	}))
)

// ── Helpers ────────────────────────────────────────────────────────────────
const statusConfig = {
	'Planning':    { cls: 'bg-slate-400/15 text-slate-500',      dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent',             dot: 'bg-accent' },
	'On Hold':     { cls: 'bg-amber-500/15 text-amber-600',       dot: 'bg-amber-500' },
	'Completed':   { cls: 'bg-emerald-500/15 text-emerald-600',   dot: 'bg-emerald-500' },
}

const priorityConfig = {
	Urgent: { cls: 'bg-red-500/15 text-red-500' },
	High:   { cls: 'bg-amber-500/15 text-amber-600' },
	Medium: { cls: 'bg-blue-500/15 text-blue-500' },
	Low:    { cls: 'bg-slate-400/15 text-slate-500' },
}

const progressColor = (p) => {
	if (p >= 100) return 'bg-emerald-500'
	if (p >= 60)  return 'bg-accent'
	if (p >= 30)  return 'bg-amber-500'
	return 'bg-red-400'
}

const formatDate = (d) =>
	d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ── Actions ────────────────────────────────────────────────────────────────
const confirmUnarchive = (id) => {
	pendingUnarchiveId.value = id
	showUnarchiveConfirm.value = true
}

const handleUnarchive = async () => {
	restoring.value = true
	const result = await store.restoreProject(pendingUnarchiveId.value)
	restoring.value = false
	showUnarchiveConfirm.value = false
	pendingUnarchiveId.value   = null
	result.success ? successToast(result.message, 'Restored') : errorToast(result.message)
}

const confirmDelete = (id) => {
	pendingDeleteId.value = id
	showDeleteConfirm.value = true
}

const handleDelete = async () => {
	deleting.value = true
	const result = await store.deleteArchivedProject(pendingDeleteId.value)
	deleting.value = false
	showDeleteConfirm.value = false
	pendingDeleteId.value   = null
	result.success ? successToast(result.message, 'Deleted') : errorToast(result.message)
}

const openProject = (id) => router.push({ name: 'project-detail', params: { id } })
</script>

<template>
	<div class="pb-20 pt-8">

		<!-- ── Page Header ──────────────────────────────── -->
		<div class="mb-6 flex items-end justify-between gap-4 flex-wrap">
			<div>
				<p class="page-eyebrow">Projects</p>
				<h1 class="page-title">Archived Projects</h1>
				<p class="page-subtitle">Projects that have been put on hold or completed and archived.</p>
			</div>
			<button
				@click="router.push({ name: 'projects' })"
				class="tazko-btn-outline shrink-0">
				<span aria-hidden="true">←</span>
				Back to Projects
			</button>
		</div>

		<!-- ── Stat strip ────────────────────────────────── -->
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
			<div class="card card-hover p-4 flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-heading/8 flex items-center justify-center shrink-0">
					<v-icon name="bi-archive" class="text-text" scale="1.2" />
				</div>
				<div class="min-w-0">
					<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.archivedMeta.total }}</p>
					<p class="text-xs text-text mt-1 font-medium">Archived</p>
				</div>
			</div>
			<div class="card card-hover p-4 flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-check-circle" class="text-emerald-600" scale="1.2" />
				</div>
				<div class="min-w-0">
					<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.archivedMeta.completed }}</p>
					<p class="text-xs text-text mt-1 font-medium">Completed</p>
				</div>
			</div>
			<div class="card card-hover p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
				<div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-clock" class="text-amber-600" scale="1.2" />
				</div>
				<div class="min-w-0">
					<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ store.archivedMeta.incomplete }}</p>
					<p class="text-xs text-text mt-1 font-medium">Incomplete</p>
				</div>
			</div>
		</div>

		<!-- ── Toolbar ────────────────────────────────────── -->
		<div class="card p-3 mb-6">
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative flex-1 min-w-48">
					<v-icon name="bi-search"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
						scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search archived projects…"
						class="tazko-search pl-9 pr-8 py-2" />
					<button v-if="searchQuery" type="button" aria-label="Clear search" @click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-heading transition-colors">
						<v-icon name="bi-x" scale="0.8" />
					</button>
				</div>
				<div class="flex-1 hidden sm:block" />
				<div class="flex items-center gap-1 bg-heading/5 rounded-md p-1">
					<button @click="viewMode = 'grid'"
						:class="[viewMode === 'grid' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-heading',
							'px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-grid-3x3-gap" scale="0.85" /> Grid
					</button>
					<button @click="viewMode = 'list'"
						:class="[viewMode === 'list' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-heading',
							'px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-list-ul" scale="0.85" /> List
					</button>
				</div>
			</div>
		</div>

		<!-- ── Initial skeleton — grid ────────────────────── -->
		<div v-if="store.archivedLoading && store.archived.length === 0 && viewMode === 'grid'"
			class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
			<div v-for="n in 6" :key="n" class="card overflow-hidden animate-pulse">
				<div class="h-1 bg-heading/10 w-full" />
				<div class="p-5 flex flex-col gap-3">
					<div class="flex items-start justify-between">
						<div class="w-10 h-10 bg-heading/10 rounded-lg" />
						<div class="w-20 h-6 bg-heading/10 rounded-md" />
					</div>
					<div class="h-4 bg-heading/10 rounded w-3/4" />
					<div class="h-3 bg-heading/8 rounded w-full" />
					<div class="h-3 bg-heading/8 rounded w-2/3" />
					<div class="h-1.5 bg-heading/8 rounded-full mt-1" />
					<div class="flex gap-2">
						<div class="h-6 w-20 bg-heading/8 rounded-md" />
						<div class="h-6 w-16 bg-heading/8 rounded-md" />
					</div>
				</div>
				<div class="px-5 py-3 border-t border-heading/8 flex justify-between">
					<div class="flex -space-x-2">
						<div v-for="i in 2" :key="i" class="w-8 h-8 rounded-full bg-heading/10 border-2 border-panel" />
					</div>
					<div class="w-24 h-7 bg-heading/10 rounded-md" />
				</div>
			</div>
		</div>

		<!-- ── Initial skeleton — list ────────────────────── -->
		<div v-else-if="store.archivedLoading && store.archived.length === 0 && viewMode === 'list'"
			class="card overflow-hidden animate-pulse">
			<div class="border-b border-heading/8 bg-heading/3 px-5 py-3 flex gap-4">
				<div v-for="n in 5" :key="n" class="h-3 bg-heading/10 rounded" :class="n===1?'w-40':'w-20'" />
			</div>
			<div class="divide-y divide-heading/6">
				<div v-for="n in 6" :key="n" class="px-5 py-4 flex items-center gap-4">
					<div class="w-9 h-9 bg-heading/10 rounded-lg shrink-0" />
					<div class="flex-1 flex flex-col gap-2">
						<div class="h-3.5 bg-heading/10 rounded w-44" />
						<div class="h-3 bg-heading/8 rounded w-64" />
					</div>
					<div class="w-20 h-6 bg-heading/8 rounded-md hidden sm:block" />
					<div class="w-28 h-2 bg-heading/8 rounded-full hidden md:block" />
					<div class="w-12 h-3 bg-heading/8 rounded hidden lg:block" />
					<div class="w-20 h-7 bg-heading/10 rounded-md ml-auto" />
				</div>
			</div>
		</div>

		<!-- ── Empty state ────────────────────────────────── -->
		<div v-else-if="!store.archivedLoading && store.archived.length === 0" class="card p-12 text-center">
			<div class="w-14 h-14 bg-heading/5 rounded-xl flex items-center justify-center mx-auto mb-4">
				<v-icon name="bi-archive" class="text-text" scale="1.6" />
			</div>
			<h3 class="section-title mb-1.5">No archived projects</h3>
			<p class="text-sm text-text mb-6 max-w-sm mx-auto leading-relaxed">
				{{ searchQuery ? 'No results for your search.' : 'Projects you archive will appear here, ready to restore at any time.' }}
			</p>
			<button v-if="searchQuery" @click="searchQuery = ''" class="tazko-btn-outline">
				<v-icon name="bi-x" scale="0.9" />
				Clear search
			</button>
		</div>

		<!-- ── GRID VIEW ──────────────────────────────────── -->
		<div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
			<div v-for="project in decoratedProjects" :key="project.id"
				class="card card-hover group overflow-hidden flex flex-col cursor-pointer opacity-85 hover:opacity-100"
				@click="openProject(project.id)">

				<!-- Color stripe -->
				<div :class="`h-1 w-full ${project.color} opacity-60`" />

				<div class="p-5 flex-1 flex flex-col gap-4">
					<!-- Header row -->
					<div class="flex items-start justify-between gap-3">
						<div :class="`w-10 h-10 rounded-lg ${project.color} opacity-60 flex items-center justify-center shrink-0`">
							<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.0" />
						</div>
						<span class="badge badge-neutral shrink-0">
							<v-icon name="bi-archive" scale="0.7" />
							Archived
						</span>
					</div>

					<!-- Title + description -->
					<div>
						<h3 class="section-title line-clamp-1 group-hover:text-accent transition-colors">{{ project.name }}</h3>
						<p class="text-sm text-text leading-relaxed line-clamp-2 mt-1.5">{{ project.description }}</p>
					</div>

					<!-- Progress -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<span class="text-xs font-semibold uppercase tracking-wider text-text">Progress</span>
							<span class="text-sm font-bold tabular-nums text-heading">{{ project.progress }}%</span>
						</div>
						<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
							<div :class="[progressColor(project.progress), 'h-full rounded-full opacity-60 transition-all duration-300']"
								:style="`width: ${project.progress}%`" />
						</div>
					</div>

					<!-- Status + priority chips -->
					<div class="flex items-center gap-2 flex-wrap">
						<span :class="[statusConfig[project.status]?.cls, 'badge']">
							<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
							{{ project.status }}
						</span>
						<span :class="[priorityConfig[project.priority]?.cls, 'badge']">
							{{ project.priority }}
						</span>
					</div>

					<!-- Archived date -->
					<p class="text-xs text-text flex items-center gap-1.5 mt-auto">
						<v-icon name="bi-calendar3" scale="0.75" />
						Archived {{ formatDate(project.archived_at) }}
					</p>
				</div>

				<!-- Card footer -->
				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between gap-3">
					<!-- Members -->
					<div class="flex -space-x-2">
						<template v-for="(m, i) in project.decoratedMembers.slice(0, 3)" :key="i">
							<img v-if="m.avatar" :src="m.avatar" :title="m.name"
								class="w-8 h-8 rounded-full border-2 border-panel object-cover opacity-70" />
							<div v-else :class="[m.color, 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-panel opacity-70']"
								:title="m.name">
								{{ m.initials }}
							</div>
						</template>
					</div>
					<!-- Actions -->
					<div class="flex items-center gap-1.5" @click.stop>
						<button
							@click="confirmUnarchive(project.id)"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/8 transition-all duration-150 active:scale-[0.98]"
							title="Restore project">
							<v-icon name="bi-arrow-counterclockwise" scale="0.85" />
							Unarchive
						</button>
						<button
							@click="confirmDelete(project.id)"
							class="w-8 h-8 rounded-md flex items-center justify-center text-text hover:text-red-600 hover:bg-red-500/10 transition-all duration-150"
							title="Delete permanently">
							<v-icon name="bi-trash" scale="0.85" />
						</button>
					</div>
				</div>
			</div>

			<!-- Infinite scroll skeleton rows -->
			<template v-if="store.archivedLoading && store.archived.length > 0">
				<div v-for="n in 3" :key="`sk-${n}`" class="card overflow-hidden animate-pulse">
					<div class="h-1 bg-heading/10 w-full" />
					<div class="p-5 flex flex-col gap-3">
						<div class="h-4 bg-heading/10 rounded w-3/4" />
						<div class="h-3 bg-heading/8 rounded w-full" />
						<div class="h-1.5 bg-heading/8 rounded-full mt-1" />
					</div>
				</div>
			</template>
		</div>

		<!-- ── LIST VIEW ──────────────────────────────────── -->
		<div v-else-if="store.archived.length" class="card overflow-hidden">
			<table class="data-table">
				<thead>
					<tr>
						<th>Project</th>
						<th class="hidden sm:table-cell">Status</th>
						<th class="hidden md:table-cell w-36">Progress</th>
						<th class="hidden md:table-cell">Tasks</th>
						<th class="hidden lg:table-cell">Archived</th>
						<th class="text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="project in decoratedProjects" :key="project.id"
						class="opacity-85 hover:opacity-100 cursor-pointer"
						@click="openProject(project.id)">
						<td>
							<div class="flex items-center gap-3">
								<div :class="`w-9 h-9 rounded-lg ${project.color} opacity-60 flex items-center justify-center shrink-0`">
									<v-icon name="md-folderspecial-outlined" class="text-white" scale="0.85" />
								</div>
								<div class="min-w-0">
									<p class="text-sm font-semibold text-heading truncate">{{ project.name }}</p>
									<p class="text-xs text-text line-clamp-1 max-w-xs mt-0.5">{{ project.description }}</p>
								</div>
							</div>
						</td>
						<td class="hidden sm:table-cell">
							<span :class="[statusConfig[project.status]?.cls, 'badge']">
								<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</td>
						<td class="hidden md:table-cell">
							<div class="flex items-center gap-2">
								<div class="flex-1 h-1.5 bg-heading/8 rounded-full overflow-hidden min-w-16">
									<div :class="[progressColor(project.progress), 'h-full rounded-full opacity-60']"
										:style="`width: ${project.progress}%`" />
								</div>
								<span class="text-sm font-semibold text-heading w-9 text-right tabular-nums">{{ project.progress }}%</span>
							</div>
						</td>
						<td class="hidden md:table-cell">
							<span class="text-sm text-text font-medium tabular-nums">{{ project.task_counts.done }}/{{ project.task_counts.total }}</span>
						</td>
						<td class="hidden lg:table-cell">
							<span class="text-sm text-text">{{ formatDate(project.archived_at) }}</span>
						</td>
						<td class="text-right" @click.stop>
							<div class="flex items-center justify-end gap-1.5">
								<button
									@click="confirmUnarchive(project.id)"
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/8 transition-all duration-150 active:scale-[0.98]"
									title="Restore project">
									<v-icon name="bi-arrow-counterclockwise" scale="0.8" />
									<span class="hidden sm:inline">Unarchive</span>
								</button>
								<button
									@click="confirmDelete(project.id)"
									class="w-8 h-8 rounded-md flex items-center justify-center text-text hover:text-red-600 hover:bg-red-500/10 transition-all duration-150"
									title="Delete permanently">
									<v-icon name="bi-trash" scale="0.9" />
								</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>

			<!-- Infinite scroll skeleton rows (list) -->
			<template v-if="store.archivedLoading && store.archived.length > 0">
				<div v-for="n in 3" :key="`sk-l-${n}`"
					class="px-4 py-4 border-t border-heading/6 flex items-center gap-4 animate-pulse">
					<div class="w-9 h-9 bg-heading/10 rounded-lg shrink-0" />
					<div class="flex-1 flex flex-col gap-2">
						<div class="h-3.5 bg-heading/10 rounded w-44" />
						<div class="h-3 bg-heading/8 rounded w-64" />
					</div>
					<div class="w-20 h-6 bg-heading/8 rounded-md hidden sm:block" />
					<div class="w-28 h-2 bg-heading/8 rounded-full hidden md:block" />
					<div class="w-20 h-7 bg-heading/10 rounded-md ml-auto" />
				</div>
			</template>

			<div class="px-4 py-3 border-t border-heading/8">
				<p class="text-sm text-text">{{ store.archivedMeta.total }} archived project{{ store.archivedMeta.total !== 1 ? 's' : '' }}</p>
			</div>
		</div>

		<!-- Sentinel for infinite scroll -->
		<div ref="sentinel" />

		<!-- ── Unarchive Confirm Modal ─────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showUnarchiveConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showUnarchiveConfirm = false">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showUnarchiveConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-xl shadow-sm border border-heading/10 p-6" @click.stop>
						<div class="w-12 h-12 rounded-md bg-accent/10 flex items-center justify-center mb-4">
							<v-icon name="bi-arrow-counterclockwise" class="text-accent" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Unarchive Project?</h3>
						<p class="text-sm text-text mb-6 leading-relaxed">
							This project will be restored to your active projects list and become visible to the team again.
						</p>
						<div class="flex gap-3">
							<button @click="showUnarchiveConfirm = false" :disabled="restoring" class="flex-1 tazko-btn-cancel">
								Cancel
							</button>
							<button @click="handleUnarchive" :disabled="restoring" class="flex-1 tazko-btn">
								<v-icon v-if="restoring" name="bi-arrow-repeat" scale="1" class="animate-spin" />
								<v-icon v-else name="bi-arrow-counterclockwise" scale="1" />
								{{ restoring ? 'Restoring…' : 'Unarchive' }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── Delete Confirm Modal ────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showDeleteConfirm = false">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-xl shadow-sm border border-heading/10 p-6" @click.stop>
						<div class="w-12 h-12 rounded-md bg-red-500/10 flex items-center justify-center mb-4">
							<v-icon name="bi-trash" class="text-red-600" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Delete Permanently?</h3>
						<p class="text-sm text-text mb-6 leading-relaxed">
							This will permanently delete the project and all its tasks. This action cannot be undone.
						</p>
						<div class="flex gap-3">
							<button @click="showDeleteConfirm = false" :disabled="deleting" class="flex-1 tazko-btn-cancel">
								Cancel
							</button>
							<button @click="handleDelete" :disabled="deleting" class="flex-1 tazko-btn-danger">
								<v-icon v-if="deleting" name="bi-arrow-repeat" scale="1" class="animate-spin" />
								<v-icon v-else name="bi-trash" scale="1" />
								{{ deleting ? 'Deleting…' : 'Delete' }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

	</div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
	transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
	transform: scale(0.97);
}
</style>
