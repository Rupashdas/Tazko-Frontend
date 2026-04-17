<script setup>
/**
 * ProjectFilesTab — aggregate view of every committed attachment under a project.
 *
 * Uses attachmentService.js exclusively — no Pinia store. Files state is
 * inherently scoped to "the Files tab of project X" so the page-level
 * fetch + local ref pattern is simpler than a global store.
 *
 * Keeps style consistent with ProjectCommentsTab:
 *   - Header title: `text-base font-bold text-heading`
 *   - Meta text:    `text-sm text-text`, small meta `text-xs text-text/50`
 *   - Destructive confirm: ConfirmModal (never native confirm())
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiFileEarmark, BiFileEarmarkImage, BiFileEarmarkPlay, BiFileEarmarkMusic,
	BiDownload, BiTrash, BiLink45Deg, BiArrowRepeat, BiSearch, BiX,
	BiGrid3X3Gap, BiListUl, BiFiles, BiChevronLeft, BiChevronRight,
} from 'oh-vue-icons/icons'
import { listProjectAttachments, streamUrl, deleteAttachment } from '@/services/attachmentService'
import { useToast } from '@/utils/toast'
import ShareLinkPanel from '@/components/shared/ShareLinkPanel.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

addIcons(
	BiFileEarmark, BiFileEarmarkImage, BiFileEarmarkPlay, BiFileEarmarkMusic,
	BiDownload, BiTrash, BiLink45Deg, BiArrowRepeat, BiSearch, BiX,
	BiGrid3X3Gap, BiListUl, BiFiles, BiChevronLeft, BiChevronRight,
)

const props = defineProps({
	projectId:  { type: [Number, String], required: true },
	canUpload:  { type: Boolean, default: false },
	canDelete:  { type: Boolean, default: false },
})


const { errorToast, successToast } = useToast()

// ── State ───────────────────────────────────────────────────
const files        = ref([])
const loading      = ref(false)
const viewMode     = ref('grid')    // 'grid' | 'list'
const searchQuery  = ref('')
const filterType   = ref('')        // '' | 'image' | 'video' | 'audio' | 'file'
const deletingId   = ref(null)
const sharingFile  = ref(null)      // the file whose ShareLinkPanel is open
const page         = ref(1)
const lastPage     = ref(1)
const total        = ref(0)
const perPage      = 30

// Delete confirmation modal state
const showDeleteModal   = ref(false)
const pendingDeleteFile = ref(null)

// Track in-flight fetches so unmount or rapid filter changes don't clobber state.
let fetchToken = 0

// ── Fetch ────────────────────────────────────────────────────
async function fetchFiles(targetPage = page.value) {
	if (!props.projectId) return
	const myToken = ++fetchToken
	loading.value = true
	try {
		const params = { page: targetPage, per_page: perPage }
		if (filterType.value) params.file_type = filterType.value
		if (searchQuery.value.trim()) params.q = searchQuery.value.trim()

		const result = await listProjectAttachments(props.projectId, params)
		if (myToken !== fetchToken) return // stale response — a newer fetch is in flight

		// Laravel's ResourceCollection::paginate() serializes as:
		//   { data: [...items], meta: { current_page, last_page, total, … },
		//     links: { first, last, prev, next } }
		// Defensively handle plain-array responses too (e.g. non-paginated tests).
		if (Array.isArray(result)) {
			files.value = result
			lastPage.value = 1
			total.value = result.length
		} else if (result?.data) {
			files.value = Array.isArray(result.data) ? result.data : []
			lastPage.value = result.meta?.last_page ?? result.last_page ?? 1
			total.value    = result.meta?.total     ?? result.total     ?? files.value.length
		} else {
			files.value = []
			lastPage.value = 1
			total.value = 0
		}
		page.value = targetPage
	} catch (err) {
		if (myToken !== fetchToken) return
		errorToast(err?.response?.data?.message ?? 'Failed to load files.')
	} finally {
		if (myToken === fetchToken) loading.value = false
	}
}

onMounted(() => fetchFiles(1))

// Re-fetch when filter or search changes (with a tiny debounce for search).
// Always reset to page 1 when filters change.
let searchTimer = null
watch(filterType, () => fetchFiles(1))
watch(searchQuery, () => {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(() => fetchFiles(1), 300)
})

onBeforeUnmount(() => {
	// Invalidate any in-flight fetch so its late resolution can't mutate state,
	// and clear the search debounce so it can't fire after unmount.
	fetchToken++
	clearTimeout(searchTimer)
})

// ── Delete ───────────────────────────────────────────────────
function requestDelete(file) {
	pendingDeleteFile.value = file
	showDeleteModal.value = true
}

async function confirmDelete() {
	const file = pendingDeleteFile.value
	if (!file) return
	deletingId.value = file.id
	const result = await deleteAttachment(file.id)
	deletingId.value = null
	showDeleteModal.value = false
	pendingDeleteFile.value = null
	if (result.success) {
		files.value = files.value.filter(f => f.id !== file.id)
		total.value = Math.max(0, total.value - 1)
		// If current page becomes empty and we're past page 1, step back.
		if (files.value.length === 0 && page.value > 1) {
			fetchFiles(page.value - 1)
		}
		successToast('File deleted.')
	} else {
		errorToast(result.message)
	}
}

function cancelDelete() {
	showDeleteModal.value = false
	pendingDeleteFile.value = null
}

// ── Helpers ──────────────────────────────────────────────────
function fileStreamUrl(file, download = false) {
	return streamUrl(file.id, { download })
}

function formatBytes(bytes) {
	if (!bytes) return ''
	if (bytes < 1024) return bytes + ' B'
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
	if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
	return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatDate(str) {
	if (!str) return ''
	return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function typeIcon(fileType) {
	if (fileType === 'image') return 'bi-file-earmark-image'
	if (fileType === 'video') return 'bi-file-earmark-play'
	if (fileType === 'audio') return 'bi-file-earmark-music'
	return 'bi-file-earmark'
}

function typeLabel(fileType) {
	return { image: 'Image', video: 'Video', audio: 'Audio', file: 'File' }[fileType] ?? 'File'
}

const typeFilters = [
	{ label: 'All',    value: '' },
	{ label: 'Images', value: 'image' },
	{ label: 'Video',  value: 'video' },
	{ label: 'Audio',  value: 'audio' },
	{ label: 'Files',  value: 'file' },
]

const isEmpty   = computed(() => !loading.value && files.value.length === 0)
const showPager = computed(() => lastPage.value > 1)

function goToPage(p) {
	if (p < 1 || p > lastPage.value || p === page.value) return
	fetchFiles(p)
}
</script>

<template>
	<!-- Single root required: v-show on this component applies to the root element.
	     ShareLinkPanel uses Teleport so it doesn't affect the DOM tree here. -->
	<div>
		<div class="p-5">
			<div class="max-w-5xl mx-auto flex flex-col gap-4">

				<!-- ── Header bar ─────────────────────────────────────────── -->
				<div class="flex items-center justify-between gap-3 flex-wrap mb-1">
					<div class="flex items-center gap-2">
						<v-icon name="bi-files" scale="0.95" class="text-accent" />
						<h3 class="text-base font-bold text-heading">Project Files</h3>
						<span v-if="total > 0"
							class="text-sm font-bold px-2 py-0.5 rounded-full tabular-nums bg-heading/5 text-text">
							{{ total }}
						</span>
					</div>

					<div class="flex items-center gap-2 flex-wrap">
						<!-- Search -->
						<div class="relative">
							<v-icon name="bi-search" scale="0.8"
								class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" />
							<input
								v-model="searchQuery"
								type="text"
								placeholder="Search files…"
								class="pl-8 pr-7 py-1.5 text-sm rounded-sm border border-heading/12 bg-transparent text-text placeholder-text/35 focus:outline-none focus:border-accent/50 w-48 transition-colors" />
							<button v-if="searchQuery" type="button"
								class="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 hover:text-text transition-colors"
								@click="searchQuery = ''">
								<v-icon name="bi-x" scale="0.8" />
							</button>
						</div>

						<!-- View toggle -->
						<div class="flex items-center border border-heading/12 rounded-sm overflow-hidden">
							<button type="button"
								class="px-2 py-1.5 transition-colors"
								:class="viewMode === 'grid' ? 'bg-accent/10 text-accent' : 'text-text/50 hover:text-heading hover:bg-heading/5'"
								:title="'Grid view'"
								@click="viewMode = 'grid'">
								<v-icon name="bi-grid-3x3-gap" scale="0.9" />
							</button>
							<button type="button"
								class="px-2 py-1.5 transition-colors border-l border-heading/12"
								:class="viewMode === 'list' ? 'bg-accent/10 text-accent' : 'text-text/50 hover:text-heading hover:bg-heading/5'"
								:title="'List view'"
								@click="viewMode = 'list'">
								<v-icon name="bi-list-ul" scale="0.9" />
							</button>
						</div>

						<!-- Reload -->
						<button type="button"
							class="p-1.5 rounded-sm text-text/50 hover:text-heading hover:bg-heading/5 transition-colors"
							:disabled="loading"
							title="Refresh"
							@click="fetchFiles(page)">
							<v-icon name="bi-arrow-repeat" scale="0.9" :class="{ 'animate-spin': loading }" />
						</button>
					</div>
				</div>

				<!-- ── Type filter pills ──────────────────────────────────── -->
				<div class="flex items-center gap-2 flex-wrap">
					<button v-for="f in typeFilters" :key="f.value"
						type="button"
						class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
						:class="filterType === f.value
							? 'bg-accent text-white border-accent'
							: 'border-heading/12 text-text/60 hover:border-accent/40 hover:text-accent'"
						@click="filterType = f.value">
						{{ f.label }}
					</button>
				</div>

				<!-- ── Loading skeleton ───────────────────────────────────── -->
				<div v-if="loading && files.length === 0"
					class="grid gap-3"
					:class="viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'">
					<div v-for="i in 8" :key="i"
						class="rounded-sm border border-heading/5 bg-heading/[0.03] animate-pulse"
						:class="viewMode === 'grid' ? 'h-32' : 'h-14'" />
				</div>

				<!-- ── Empty state ─────────────────────────────────────────── -->
				<div v-else-if="isEmpty" class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-14 h-14 rounded-sm bg-heading/5 flex items-center justify-center mb-3">
						<v-icon name="bi-file-earmark" class="text-text/40" scale="1.7" />
					</div>
					<p class="text-base font-semibold text-heading">
						{{ searchQuery || filterType ? 'No files match your filter' : 'No files yet' }}
					</p>
					<p class="text-sm text-text mt-1">
						{{ searchQuery || filterType ? 'Try a different search or filter.' : 'Files attached in task and project descriptions appear here.' }}
					</p>
					<button v-if="searchQuery || filterType" type="button"
						class="mt-3 text-sm font-semibold text-accent hover:underline"
						@click="searchQuery = ''; filterType = ''">
						Clear filters
					</button>
				</div>

				<!-- ── Grid view ───────────────────────────────────────────── -->
				<div v-else-if="viewMode === 'grid'"
					class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
					<div v-for="file in files" :key="file.id"
						class="group flex flex-col rounded-sm border border-heading/8 bg-panel overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all">

						<!-- Thumbnail -->
						<a :href="fileStreamUrl(file)" target="_blank" rel="noopener noreferrer"
							class="block aspect-[4/3] bg-heading/[0.04] overflow-hidden relative">
							<img v-if="file.file_type === 'image'"
								:src="fileStreamUrl(file)"
								:alt="file.name"
								class="w-full h-full object-cover"
								loading="lazy" />
							<div v-else class="w-full h-full flex items-center justify-center">
								<v-icon :name="typeIcon(file.file_type)" class="text-text/25" scale="2.5" />
							</div>
						</a>

						<!-- Info -->
						<div class="flex-1 px-3 pt-2 pb-1 min-w-0">
							<p class="text-sm font-semibold text-heading truncate" :title="file.name">{{ file.name }}</p>
							<p class="text-xs text-text/50 mt-0.5">
								{{ typeLabel(file.file_type) }}{{ file.size ? ' · ' + formatBytes(file.size) : '' }}
							</p>
						</div>

						<!-- Actions row -->
						<div class="flex items-center gap-0.5 px-2 pb-2">
							<a :href="fileStreamUrl(file, true)" :download="file.name"
								class="flex-1 flex items-center justify-center py-1.5 text-text/50 hover:text-accent hover:bg-accent/8 rounded transition-colors"
								title="Download">
								<v-icon name="bi-download" scale="0.8" />
							</a>
							<button type="button"
								class="flex-1 flex items-center justify-center py-1.5 text-text/50 hover:text-accent hover:bg-accent/8 rounded transition-colors"
								title="Share link"
								@click="sharingFile = file">
								<v-icon name="bi-link-45deg" scale="0.9" />
							</button>
							<button v-if="canDelete" type="button"
								class="flex-1 flex items-center justify-center py-1.5 text-text/50 hover:text-red-500 hover:bg-red-500/8 rounded transition-colors"
								:disabled="deletingId === file.id"
								title="Delete"
								@click="requestDelete(file)">
								<v-icon :name="deletingId === file.id ? 'bi-arrow-repeat' : 'bi-trash'"
									scale="0.8"
									:class="{ 'animate-spin': deletingId === file.id }" />
							</button>
						</div>
					</div>
				</div>

				<!-- ── List view ───────────────────────────────────────────── -->
				<div v-else class="flex flex-col divide-y divide-heading/8 border border-heading/8 rounded-sm bg-panel">
					<div v-for="file in files" :key="file.id"
						class="flex items-center gap-3 py-2.5 px-3 hover:bg-heading/[0.02] transition-colors group">

						<!-- Icon / thumbnail -->
						<div class="w-10 h-10 rounded-sm bg-heading/5 flex items-center justify-center shrink-0 overflow-hidden">
							<img v-if="file.file_type === 'image'"
								:src="fileStreamUrl(file)"
								:alt="file.name"
								class="w-full h-full object-cover"
								loading="lazy" />
							<v-icon v-else :name="typeIcon(file.file_type)" class="text-text/40" scale="1.1" />
						</div>

						<!-- Name + meta -->
						<div class="flex-1 min-w-0">
							<a :href="fileStreamUrl(file)" target="_blank" rel="noopener noreferrer"
								class="text-sm font-semibold text-heading truncate block hover:text-accent transition-colors">
								{{ file.name }}
							</a>
							<p class="text-xs text-text/50 mt-0.5">
								{{ typeLabel(file.file_type) }}
								{{ file.size ? ' · ' + formatBytes(file.size) : '' }}
								{{ file.uploader?.name ? ' · ' + file.uploader.name : '' }}
								{{ file.created_at ? ' · ' + formatDate(file.created_at) : '' }}
							</p>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
							<a :href="fileStreamUrl(file, true)" :download="file.name"
								class="p-1.5 rounded text-text/50 hover:text-accent hover:bg-accent/8 transition-colors"
								title="Download">
								<v-icon name="bi-download" scale="0.85" />
							</a>
							<button type="button"
								class="p-1.5 rounded text-text/50 hover:text-accent hover:bg-accent/8 transition-colors"
								title="Share link"
								@click="sharingFile = file">
								<v-icon name="bi-link-45deg" scale="0.9" />
							</button>
							<button v-if="canDelete" type="button"
								class="p-1.5 rounded text-text/50 hover:text-red-500 hover:bg-red-500/8 transition-colors"
								:disabled="deletingId === file.id"
								title="Delete"
								@click="requestDelete(file)">
								<v-icon :name="deletingId === file.id ? 'bi-arrow-repeat' : 'bi-trash'"
									scale="0.85"
									:class="{ 'animate-spin': deletingId === file.id }" />
							</button>
						</div>
					</div>
				</div>

				<!-- ── Pagination ──────────────────────────────────────────── -->
				<div v-if="showPager" class="flex items-center justify-between gap-3 pt-2">
					<p class="text-xs text-text/50 tabular-nums">
						Page {{ page }} of {{ lastPage }} · {{ total }} file{{ total === 1 ? '' : 's' }}
					</p>
					<div class="flex items-center gap-1">
						<button type="button"
							class="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold border border-heading/12 text-text hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							:disabled="page <= 1 || loading"
							@click="goToPage(page - 1)">
							<v-icon name="bi-chevron-left" scale="0.75" />
							Prev
						</button>
						<button type="button"
							class="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold border border-heading/12 text-text hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							:disabled="page >= lastPage || loading"
							@click="goToPage(page + 1)">
							Next
							<v-icon name="bi-chevron-right" scale="0.75" />
						</button>
					</div>
				</div>

			</div>
		</div>

		<!-- Share link slide-in panel (Teleported to body — not a real DOM child here) -->
		<ShareLinkPanel :file="sharingFile" @close="sharingFile = null" />

		<!-- Delete confirmation -->
		<ConfirmModal
			:show="showDeleteModal"
			title="Delete File"
			:message="pendingDeleteFile
				? `Delete “${pendingDeleteFile.name}”? This cannot be undone and will remove it from any descriptions or comments where it's embedded.`
				: ''"
			icon="bi-trash"
			confirm-label="Delete"
			confirming-label="Deleting…"
			:loading="deletingId !== null"
			@close="cancelDelete"
			@confirm="confirmDelete" />
	</div>
</template>
