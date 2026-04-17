<script setup>
/**
 * ShareLinkPanel — slide-in panel for managing public share links on a file.
 *
 * Open it by passing a non-null `file` prop (an attachment row from the API).
 * Close it via the `close` event or by clicking outside.
 *
 * Uses attachmentService.js exclusively — share state is local to this modal's
 * lifecycle, no Pinia store is needed. Destructive actions use ConfirmModal
 * (never native confirm()) to stay visually consistent with the rest of the app.
 */
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiX, BiPlus, BiArrowRepeat, BiClipboard, BiCheck2, BiTrash,
	BiToggleOn, BiToggleOff, BiShield, BiDownload, BiClock,
} from 'oh-vue-icons/icons'
import {
	listShares, createShare, updateShare, revokeShare, publicShareUrl,
} from '@/services/attachmentService'
import { useToast } from '@/utils/toast'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

addIcons(BiX, BiPlus, BiArrowRepeat, BiClipboard, BiCheck2, BiTrash,
	BiToggleOn, BiToggleOff, BiShield, BiDownload, BiClock)

const props = defineProps({
	file: { type: Object, default: null }, // null = closed
})
const emit = defineEmits(['close'])

const { successToast, errorToast } = useToast()

// ── State ────────────────────────────────────────────────────
const shares      = ref([])
const loading     = ref(false)
const creating    = ref(false)
const copiedId    = ref(null)   // briefly set to share.id after a copy
const togglingId  = ref(null)
const revokingId  = ref(null)

// New-share form
const newExpiry        = ref('')      // YYYY-MM-DD or ''
const newAllowDownload = ref(true)

// Revoke confirmation
const showRevokeModal   = ref(false)
const pendingRevoke     = ref(null)

// Track in-flight fetches so rapid file switches don't clobber state.
let loadToken = 0

// ── Load shares when file changes ────────────────────────────
watch(() => props.file, async (file) => {
	shares.value = []
	// Reset form state between files so the previous file's values don't bleed.
	newExpiry.value = ''
	newAllowDownload.value = true
	if (!file) return

	const myToken = ++loadToken
	loading.value = true
	try {
		const data = await listShares(file.id)
		if (myToken !== loadToken) return
		shares.value = Array.isArray(data) ? data : (data?.data ?? [])
	} catch (err) {
		if (myToken !== loadToken) return
		errorToast(err?.response?.data?.message ?? 'Failed to load share links.')
	} finally {
		if (myToken === loadToken) loading.value = false
	}
}, { immediate: true })

onBeforeUnmount(() => { loadToken++ })

// ── Create share ─────────────────────────────────────────────
async function handleCreate() {
	if (!props.file || creating.value) return
	creating.value = true
	const result = await createShare(props.file.id, {
		allow_download: newAllowDownload.value,
		expires_at: newExpiry.value || null,
	})
	creating.value = false
	if (result.success) {
		shares.value.unshift(result.share)
		newExpiry.value = ''
		newAllowDownload.value = true
		successToast('Share link created.')
	} else {
		errorToast(result.message)
	}
}

// ── Toggle enabled ───────────────────────────────────────────
async function toggleEnabled(share) {
	if (togglingId.value === share.id) return
	togglingId.value = share.id
	const result = await updateShare(share.id, { enabled: !share.enabled })
	togglingId.value = null
	if (result.success) {
		const idx = shares.value.findIndex(s => s.id === share.id)
		if (idx !== -1) shares.value[idx] = result.share
	} else {
		errorToast(result.message)
	}
}

// ── Revoke ───────────────────────────────────────────────────
function requestRevoke(share) {
	pendingRevoke.value = share
	showRevokeModal.value = true
}

async function confirmRevoke() {
	const share = pendingRevoke.value
	if (!share) return
	revokingId.value = share.id
	const result = await revokeShare(share.id)
	revokingId.value = null
	showRevokeModal.value = false
	pendingRevoke.value = null
	if (result.success) {
		shares.value = shares.value.filter(s => s.id !== share.id)
		successToast('Share link revoked.')
	} else {
		errorToast(result.message)
	}
}

function cancelRevoke() {
	showRevokeModal.value = false
	pendingRevoke.value = null
}

// ── Copy to clipboard ────────────────────────────────────────
async function copyUrl(share) {
	const url = publicShareUrl(share.token)
	try {
		await navigator.clipboard.writeText(url)
		copiedId.value = share.id
		successToast('Link copied to clipboard.')
		setTimeout(() => { copiedId.value = null }, 2000)
	} catch {
		// Fallback for older browsers / non-secure contexts
		try {
			const el = document.createElement('textarea')
			el.value = url
			el.style.position = 'fixed'
			el.style.opacity = '0'
			document.body.appendChild(el)
			el.select()
			document.execCommand('copy')
			document.body.removeChild(el)
			copiedId.value = share.id
			successToast('Link copied to clipboard.')
			setTimeout(() => { copiedId.value = null }, 2000)
		} catch {
			errorToast('Could not copy. Please copy the link manually.')
		}
	}
}

// ── Helpers ──────────────────────────────────────────────────
function isActive(share) {
	if (!share.enabled) return false
	if (share.expires_at && new Date(share.expires_at) < new Date()) return false
	return true
}

function formatExpiry(str) {
	if (!str) return 'No expiry'
	const d = new Date(str)
	if (isNaN(d.getTime())) return 'No expiry'
	if (d < new Date()) return 'Expired ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	return 'Expires ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const isOpen = computed(() => !!props.file)
const minDate = computed(() => new Date().toISOString().split('T')[0])
</script>

<template>
	<Teleport to="body">
		<Transition
			enter-active-class="transition-all duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-all duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0">
			<!-- Backdrop -->
			<div v-if="isOpen"
				class="fixed inset-0 z-[900] bg-heading/40 backdrop-blur-[1px]"
				@click="emit('close')" />
		</Transition>

		<Transition
			enter-active-class="transition-all duration-200 ease-out"
			enter-from-class="opacity-0 translate-x-6"
			enter-to-class="opacity-100 translate-x-0"
			leave-active-class="transition-all duration-150 ease-in"
			leave-from-class="opacity-100 translate-x-0"
			leave-to-class="opacity-0 translate-x-6">
			<div v-if="isOpen"
				class="fixed right-0 top-0 bottom-0 z-[901] w-full max-w-[400px] bg-panel border-l border-heading/10 shadow-2xl flex flex-col overflow-hidden">

				<!-- Header -->
				<div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-heading/8 shrink-0">
					<div class="min-w-0">
						<h3 class="section-title">Share Link</h3>
						<p class="text-sm text-text truncate mt-0.5" :title="file?.name">{{ file?.name }}</p>
					</div>
					<button type="button"
						class="p-1.5 rounded-sm text-text/40 hover:text-heading hover:bg-heading/8 transition-colors shrink-0"
						title="Close"
						@click="emit('close')">
						<v-icon name="bi-x" scale="1.1" />
					</button>
				</div>

				<!-- Scrollable body -->
				<div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

					<!-- ── Create new share ──────────────────────── -->
					<section>
						<p class="text-xs font-bold text-text/60 uppercase tracking-wider mb-3">
							Create Share Link
						</p>

						<!-- Expiry date -->
						<div class="mb-3">
							<label for="share-expiry"
								class="text-sm font-semibold text-text mb-1 flex items-center gap-1.5">
								<v-icon name="bi-clock" scale="0.8" />
								Expiry date
							</label>
							<input
								id="share-expiry"
								v-model="newExpiry"
								type="date"
								:min="minDate"
								class="w-full text-sm px-3 py-1.5 rounded-sm border border-heading/12 bg-transparent text-text focus:outline-none focus:border-accent/50 transition-colors" />
							<p class="text-xs text-text/50 mt-1">Leave blank for no expiry.</p>
						</div>

						<!-- Allow download toggle -->
						<div class="flex items-center justify-between gap-3 mb-4 py-2.5 px-3 rounded-sm bg-heading/[0.03] border border-heading/8">
							<div class="flex items-center gap-2.5">
								<v-icon name="bi-download" scale="0.9" class="text-text/50" />
								<div>
									<p class="text-sm font-semibold text-heading">Allow download</p>
									<p class="text-xs text-text/50">Recipient can download the file</p>
								</div>
							</div>
							<button type="button"
								class="shrink-0 transition-colors"
								:class="newAllowDownload ? 'text-accent' : 'text-text/30'"
								:title="newAllowDownload ? 'Downloads enabled' : 'View-only'"
								@click="newAllowDownload = !newAllowDownload">
								<v-icon :name="newAllowDownload ? 'bi-toggle-on' : 'bi-toggle-off'" scale="1.5" />
							</button>
						</div>

						<button type="button"
							:disabled="creating"
							class="w-full inline-flex items-center justify-center gap-2 py-2 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
							@click="handleCreate">
							<v-icon v-if="creating" name="bi-arrow-repeat" scale="0.9" class="animate-spin" />
							<v-icon v-else name="bi-plus" scale="0.9" />
							{{ creating ? 'Generating…' : 'Generate Link' }}
						</button>
					</section>

					<!-- ── Existing links ────────────────────────── -->
					<section v-if="loading || shares.length > 0">
						<p class="text-xs font-bold text-text/60 uppercase tracking-wider mb-3">
							Existing Links
							<span v-if="shares.length" class="normal-case font-normal ml-1 text-text/40">({{ shares.length }})</span>
						</p>

						<!-- Skeleton -->
						<div v-if="loading" class="flex flex-col gap-2">
							<div v-for="i in 2" :key="i" class="h-20 rounded-sm bg-heading/[0.04] animate-pulse" />
						</div>

						<div v-else class="flex flex-col gap-2">
							<div v-for="share in shares" :key="share.id"
								class="rounded-sm border border-heading/8 bg-heading/[0.02] overflow-hidden">

								<!-- Status bar -->
								<div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-heading/6">
									<div class="flex items-center gap-1.5">
										<span class="w-1.5 h-1.5 rounded-full shrink-0"
											:class="isActive(share) ? 'bg-emerald-500' : 'bg-text/25'" />
										<span class="text-xs font-semibold"
											:class="isActive(share) ? 'text-emerald-600' : 'text-text/45'">
											{{ isActive(share) ? 'Active' : (share.enabled ? 'Expired' : 'Disabled') }}
										</span>
									</div>
									<!-- Toggle enabled -->
									<button type="button"
										class="transition-colors"
										:class="share.enabled ? 'text-accent' : 'text-text/30'"
										:disabled="togglingId === share.id"
										:title="share.enabled ? 'Disable link' : 'Enable link'"
										@click="toggleEnabled(share)">
										<v-icon v-if="togglingId === share.id" name="bi-arrow-repeat" scale="0.9" class="animate-spin" />
										<v-icon v-else :name="share.enabled ? 'bi-toggle-on' : 'bi-toggle-off'" scale="1.2" />
									</button>
								</div>

								<!-- URL + meta -->
								<div class="px-3 py-2">
									<div class="flex items-center gap-1.5 mb-1.5">
										<code class="flex-1 text-xs text-text/70 truncate bg-heading/[0.04] px-2 py-1 rounded font-mono">
											{{ publicShareUrl(share.token) }}
										</code>
										<!-- Copy -->
										<button type="button"
											class="shrink-0 p-1.5 rounded text-text/50 hover:text-accent hover:bg-accent/8 transition-colors"
											:title="copiedId === share.id ? 'Copied!' : 'Copy link'"
											@click="copyUrl(share)">
											<v-icon :name="copiedId === share.id ? 'bi-check2' : 'bi-clipboard'" scale="0.85"
												:class="copiedId === share.id ? 'text-emerald-500' : ''" />
										</button>
										<!-- Revoke -->
										<button type="button"
											class="shrink-0 p-1.5 rounded text-text/50 hover:text-red-500 hover:bg-red-500/8 transition-colors"
											:disabled="revokingId === share.id"
											title="Revoke link"
											@click="requestRevoke(share)">
											<v-icon :name="revokingId === share.id ? 'bi-arrow-repeat' : 'bi-trash'" scale="0.8"
												:class="{ 'animate-spin': revokingId === share.id }" />
										</button>
									</div>

									<!-- Metadata row -->
									<div class="flex items-center gap-3 text-xs text-text/45 flex-wrap">
										<span class="inline-flex items-center gap-1">
											<v-icon name="bi-clock" scale="0.7" />
											{{ formatExpiry(share.expires_at) }}
										</span>
										<span class="inline-flex items-center gap-1">
											<v-icon name="bi-download" scale="0.7" />
											{{ share.allow_download ? 'Download on' : 'View only' }}
										</span>
										<span v-if="share.access_count">
											{{ share.access_count }} view{{ share.access_count !== 1 ? 's' : '' }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</section>

					<!-- No links -->
					<p v-if="!loading && shares.length === 0" class="text-sm text-text/50 text-center py-4">
						No active share links. Generate one above.
					</p>

					<!-- Security note -->
					<div class="flex items-start gap-2 text-xs text-text/55 bg-heading/[0.03] rounded-sm px-3 py-2.5 border border-heading/8">
						<v-icon name="bi-shield" scale="0.85" class="shrink-0 mt-0.5 text-text/40" />
						<span>Links are public — anyone with the URL can view the file. Internal access and project membership are unaffected by share links.</span>
					</div>

				</div>
			</div>
		</Transition>

		<!-- Revoke confirmation -->
		<ConfirmModal
			:show="showRevokeModal"
			title="Revoke Share Link"
			message="Permanently revoke this share link? Anyone with the URL will get a 410 Gone response. This cannot be undone."
			icon="bi-trash"
			confirm-label="Revoke"
			confirming-label="Revoking…"
			:loading="revokingId !== null"
			@close="cancelRevoke"
			@confirm="confirmRevoke" />
	</Teleport>
</template>
