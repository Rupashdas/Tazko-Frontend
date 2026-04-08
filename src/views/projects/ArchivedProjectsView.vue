<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addIcons } from 'oh-vue-icons'
import {
	BiArchive, BiSearch, BiX, BiArrowCounterclockwise,
	BiTrash, BiCalendar3, BiCheckCircle, BiGrid3X3Gap,
	BiListUl, MdFolderspecialOutlined, BiClock,
	BiLightningCharge,
} from 'oh-vue-icons/icons'

addIcons(
	BiArchive, BiSearch, BiX, BiArrowCounterclockwise,
	BiTrash, BiCalendar3, BiCheckCircle, BiGrid3X3Gap,
	BiListUl, MdFolderspecialOutlined, BiClock,
	BiLightningCharge,
)

const router = useRouter()

// ── Mock archived projects ─────────────────────────────────────
// Replace with real API call: axios.get('/api/projects?archived=1')
const archivedProjects = ref([
	{
		id: 101,
		name: 'Legacy API Migration',
		description: 'Migrating old REST endpoints to the new versioned API structure.',
		status: 'On Hold',
		priority: 'Medium',
		color: 'bg-slate-500',
		progress: 55,
		startDate: '2025-10-01',
		endDate: '2026-01-31',
		archivedAt: '2026-03-15',
		members: [
			{ name: 'Noman R', initials: 'NR', color: 'bg-emerald-500' },
		],
		taskCounts: { total: 24, done: 13 },
	},
	{
		id: 102,
		name: 'v1 Mobile Prototype',
		description: 'Early prototype of the mobile app — replaced by the current React Native project.',
		status: 'Completed',
		priority: 'Low',
		color: 'bg-indigo-400',
		progress: 100,
		startDate: '2025-07-01',
		endDate: '2025-09-30',
		archivedAt: '2026-02-10',
		members: [
			{ name: 'Sara K', initials: 'SK', color: 'bg-violet-500' },
			{ name: 'Dina M', initials: 'DM', color: 'bg-amber-500' },
		],
		taskCounts: { total: 18, done: 18 },
	},
	{
		id: 103,
		name: 'Client Portal (Pilot)',
		description: 'Pilot client-facing portal. Scope changed — archived pending full redesign.',
		status: 'Planning',
		priority: 'Low',
		color: 'bg-teal-500',
		progress: 8,
		startDate: '2026-01-01',
		endDate: '2026-03-01',
		archivedAt: '2026-03-20',
		members: [
			{ name: 'Arif H', initials: 'AH', color: 'bg-accent' },
		],
		taskCounts: { total: 6, done: 0 },
	},
])

const searchQuery = ref('')
const viewMode = ref('grid')
const showUnarchiveConfirm = ref(false)
const pendingUnarchiveId = ref(null)
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref(null)

const filtered = computed(() => {
	const q = searchQuery.value.toLowerCase()
	if (!q) return archivedProjects.value
	return archivedProjects.value.filter(
		p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
	)
})

// ── Helpers ────────────────────────────────────────────────────
const statusConfig = {
	'Planning':    { cls: 'bg-slate-400/15 text-slate-500',  dot: 'bg-slate-400' },
	'In Progress': { cls: 'bg-accent/10 text-accent',         dot: 'bg-accent' },
	'On Hold':     { cls: 'bg-amber-500/15 text-amber-600',   dot: 'bg-amber-500' },
	'Completed':   { cls: 'bg-emerald-500/15 text-emerald-600', dot: 'bg-emerald-500' },
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
	new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// ── Actions ────────────────────────────────────────────────────
const confirmUnarchive = (id) => {
	pendingUnarchiveId.value = id
	showUnarchiveConfirm.value = true
}

const handleUnarchive = () => {
	// TODO: axios.patch(`/api/projects/${pendingUnarchiveId.value}/unarchive`)
	archivedProjects.value = archivedProjects.value.filter(p => p.id !== pendingUnarchiveId.value)
	showUnarchiveConfirm.value = false
	pendingUnarchiveId.value = null
}

const confirmDelete = (id) => {
	pendingDeleteId.value = id
	showDeleteConfirm.value = true
}

const handleDelete = () => {
	// TODO: axios.delete(`/api/projects/${pendingDeleteId.value}`)
	archivedProjects.value = archivedProjects.value.filter(p => p.id !== pendingDeleteId.value)
	showDeleteConfirm.value = false
	pendingDeleteId.value = null
}
</script>

<template>
	<div class="pb-20 pt-8 px-1">

		<!-- ── Page Header ──────────────────────────────── -->
		<div class="mb-8 flex items-end justify-between gap-4 flex-wrap">
			<div>
				<p class="page-eyebrow">Projects</p>
				<h1 class="page-title">Archived Projects</h1>
				<p class="page-subtitle">Projects that have been put on hold or completed and archived.</p>
			</div>
			<button
				@click="router.push({ name: 'projects' })"
				class="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 hover:text-heading transition-all">
				← Back to Projects
			</button>
		</div>

		<!-- ── Stat strip ────────────────────────────────── -->
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-heading/8 flex items-center justify-center shrink-0">
					<v-icon name="bi-archive" class="text-text" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ archivedProjects.length }}</p>
					<p class="text-base text-text mt-0.5">Archived</p>
				</div>
			</div>
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
				<div class="w-12 h-12 rounded-sm bg-emerald-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-check-circle" class="text-emerald-500" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">
						{{ archivedProjects.filter(p => p.status === 'Completed').length }}
					</p>
					<p class="text-base text-text mt-0.5">Completed</p>
				</div>
			</div>
			<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
				<div class="w-12 h-12 rounded-sm bg-amber-500/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-clock" class="text-amber-500" scale="1.4" />
				</div>
				<div>
					<p class="text-2xl font-bold text-heading leading-none tabular-nums">
						{{ archivedProjects.filter(p => p.status !== 'Completed').length }}
					</p>
					<p class="text-base text-text mt-0.5">Incomplete</p>
				</div>
			</div>
		</div>

		<!-- ── Toolbar ────────────────────────────────────── -->
		<div class="bg-panel rounded-sm border border-heading/5 p-3.5 mb-6">
			<div class="flex flex-wrap items-center gap-2.5">
				<div class="relative flex-1 min-w-48">
					<v-icon name="bi-search"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
						scale="0.85" />
					<input v-model="searchQuery" type="text" placeholder="Search archived projects…"
						class="w-full pl-9 pr-8 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
					<button v-if="searchQuery" @click="searchQuery = ''"
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-text">
						<v-icon name="bi-x" scale="0.8" />
					</button>
				</div>
				<div class="flex-1 hidden sm:block" />
				<div class="flex items-center gap-1 bg-heading/5 rounded-sm p-1">
					<button @click="viewMode = 'grid'"
						:class="[viewMode === 'grid' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text',
							'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-grid-3x3-gap" scale="0.85" /> Grid
					</button>
					<button @click="viewMode = 'list'"
						:class="[viewMode === 'list' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text',
							'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
						<v-icon name="bi-list-ul" scale="0.85" /> List
					</button>
				</div>
			</div>
		</div>

		<!-- ── Empty state ────────────────────────────────── -->
		<div v-if="filtered.length === 0" class="text-center py-24">
			<div class="w-20 h-20 bg-heading/5 rounded-3xl flex items-center justify-center mx-auto mb-5">
				<v-icon name="bi-archive" class="text-text" scale="2" />
			</div>
			<h3 class="section-title mb-2">No archived projects</h3>
			<p class="page-subtitle mb-6">
				{{ searchQuery ? 'No results for your search.' : 'Projects you archive will appear here.' }}
			</p>
			<button v-if="searchQuery" @click="searchQuery = ''"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 transition-colors">
				Clear search
			</button>
		</div>

		<!-- ── GRID VIEW ──────────────────────────────────── -->
		<div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
			<div v-for="project in filtered" :key="project.id"
				class="bg-panel rounded-sm border border-heading/8 hover:shadow-lg hover:shadow-heading/5 transition-all duration-200 group overflow-hidden flex flex-col opacity-80 hover:opacity-100">

				<!-- Grayscale-ish color stripe -->
				<div :class="`h-1 w-full ${project.color} opacity-60`" />

				<div class="p-5 flex-1">
					<!-- Header row -->
					<div class="flex items-start justify-between mb-3">
						<div :class="`w-10 h-10 rounded-sm ${project.color} opacity-60 flex items-center justify-center shrink-0`">
							<v-icon name="md-folderspecial-outlined" class="text-white" scale="1.0" />
						</div>
						<!-- Archived badge -->
						<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-heading/8 border border-heading/10">
							<v-icon name="bi-archive" class="text-text" scale="0.75" />
							<span class="text-sm font-semibold text-text">Archived</span>
						</div>
					</div>

					<!-- Title + description -->
					<h3 class="section-title mb-1.5 line-clamp-1">{{ project.name }}</h3>
					<p class="text-base text-text leading-relaxed line-clamp-2 mb-4">{{ project.description }}</p>

					<!-- Progress -->
					<div class="mb-3">
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-sm font-semibold uppercase tracking-wide text-text">Progress</span>
							<span class="text-sm font-bold tabular-nums text-text">{{ project.progress }}%</span>
						</div>
						<div class="h-1.5 bg-heading/8 rounded-full overflow-hidden">
							<div :class="[progressColor(project.progress), 'h-full rounded-full opacity-60']"
								:style="`width: ${project.progress}%`" />
						</div>
					</div>

					<!-- Status + priority chips -->
					<div class="flex items-center gap-2 flex-wrap mb-4">
						<span :class="[statusConfig[project.status]?.cls, 'inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-semibold']">
							<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
							{{ project.status }}
						</span>
						<span :class="[priorityConfig[project.priority]?.cls, 'text-sm px-2.5 py-1 rounded-full font-semibold']">
							{{ project.priority }}
						</span>
					</div>

					<!-- Archived date -->
					<p class="text-sm text-text flex items-center gap-1.5">
						<v-icon name="bi-calendar3" scale="0.75" />
						Archived {{ formatDate(project.archivedAt) }}
					</p>
				</div>

				<!-- Card footer -->
				<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between bg-heading/[0.01]">
					<!-- Members -->
					<div class="flex -space-x-2">
						<div v-for="(m, i) in project.members.slice(0, 3)" :key="i"
							:class="[m.color, 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-panel opacity-70']"
							:title="m.name">
							{{ m.initials }}
						</div>
					</div>
					<!-- Actions -->
					<div class="flex items-center gap-1.5">
						<button
							@click="confirmUnarchive(project.id)"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/8 transition-all"
							title="Restore project">
							<v-icon name="bi-arrow-counterclockwise" scale="0.85" />
							Unarchive
						</button>
						<button
							@click="confirmDelete(project.id)"
							class="w-7 h-7 rounded-sm flex items-center justify-center text-text hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
							title="Delete permanently">
							<v-icon name="bi-trash" scale="0.85" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- ── LIST VIEW ──────────────────────────────────── -->
		<div v-else class="bg-panel rounded-sm border border-heading/8">
			<table class="w-full">
				<thead>
					<tr class="border-b border-heading/8 bg-heading/[0.02]">
						<th class="text-left px-5 py-3 text-sm font-semibold uppercase tracking-wide text-text">Project</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Status</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text w-36">Progress</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Tasks</th>
						<th class="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text">Archived</th>
						<th class="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-text">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-heading/5">
					<tr v-for="project in filtered" :key="project.id"
						class="hover:bg-heading/[0.015] transition-colors opacity-80 hover:opacity-100 group">
						<td class="px-5 py-4">
							<div class="flex items-center gap-3">
								<div :class="`w-8 h-8 rounded-sm ${project.color} opacity-60 flex items-center justify-center shrink-0`">
									<v-icon name="md-folderspecial-outlined" class="text-white" scale="0.85" />
								</div>
								<div>
									<p class="text-base font-semibold text-heading">{{ project.name }}</p>
									<p class="text-sm text-text line-clamp-1 max-w-xs mt-0.5">{{ project.description }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-4">
							<span :class="[statusConfig[project.status]?.cls, 'inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-semibold']">
								<span :class="[statusConfig[project.status]?.dot, 'w-1.5 h-1.5 rounded-full']" />
								{{ project.status }}
							</span>
						</td>
						<td class="px-4 py-4">
							<div class="flex items-center gap-2">
								<div class="flex-1 h-1.5 bg-heading/8 rounded-full overflow-hidden min-w-16">
									<div :class="[progressColor(project.progress), 'h-full rounded-full opacity-60']"
										:style="`width: ${project.progress}%`" />
								</div>
								<span class="text-sm font-bold text-text w-8 text-right tabular-nums">{{ project.progress }}%</span>
							</div>
						</td>
						<td class="px-4 py-4">
							<span class="text-base text-text font-medium">{{ project.taskCounts.done }}/{{ project.taskCounts.total }}</span>
						</td>
						<td class="px-4 py-4">
							<span class="text-sm text-text">{{ formatDate(project.archivedAt) }}</span>
						</td>
						<td class="px-4 py-4 text-right">
							<div class="flex items-center justify-end gap-1.5">
								<button
									@click="confirmUnarchive(project.id)"
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/8 transition-all">
									<v-icon name="bi-arrow-counterclockwise" scale="0.8" />
									Unarchive
								</button>
								<button
									@click="confirmDelete(project.id)"
									class="w-8 h-8 rounded-sm flex items-center justify-center text-text hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
									<v-icon name="bi-trash" scale="0.9" />
								</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>

			<div class="px-5 py-3 border-t border-heading/8 bg-body/40">
				<p class="text-base text-text">{{ filtered.length }} archived project{{ filtered.length !== 1 ? 's' : '' }}</p>
			</div>
		</div>

		<!-- ── Unarchive Confirm Modal ─────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showUnarchiveConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showUnarchiveConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center mb-4">
							<v-icon name="bi-arrow-counterclockwise" class="text-accent" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Unarchive Project?</h3>
						<p class="text-base text-text mb-6">
							This project will be restored to your active projects list and become visible to the team again.
						</p>
						<div class="flex gap-3">
							<button @click="showUnarchiveConfirm = false"
								class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleUnarchive"
								class="flex-1 tazko-btn">
								<v-icon name="bi-arrow-counterclockwise" scale="1" />
								Unarchive
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- ── Delete Confirm Modal ────────────────────────── -->
		<Teleport to="body">
			<Transition name="modal">
				<div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
					<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
						<div class="w-12 h-12 rounded-sm bg-red-50 flex items-center justify-center mb-4">
							<v-icon name="bi-trash" class="text-red-500" scale="1.2" />
						</div>
						<h3 class="section-title mb-2">Delete Permanently?</h3>
						<p class="text-base text-text mb-6">
							This will permanently delete the project and all its tasks. This action cannot be undone.
						</p>
						<div class="flex gap-3">
							<button @click="showDeleteConfirm = false"
								class="flex-1 tazko-btn-cancel">
								<v-icon name="bi-x" scale="1" />
								Cancel
							</button>
							<button @click="handleDelete"
								class="flex-1 tazko-btn-danger">
								<v-icon name="bi-trash" scale="1" />
								Delete
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

.line-clamp-1 {
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>