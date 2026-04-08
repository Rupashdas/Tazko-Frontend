<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	initialUrl: { type: String, default: '' },
	initialNewTab: { type: Boolean, default: false },
	hasLink: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'insert', 'remove'])

const url = ref('')
const newTab = ref(false)
const urlInput = ref(null)

watch(() => props.modelValue, (open) => {
	if (open) {
		url.value = props.initialUrl
		newTab.value = props.initialNewTab
		nextTick(() => urlInput.value?.focus())
	}
})

function insert() {
	const href = url.value.trim()
	if (!href) return
	const finalHref = /^https?:\/\//i.test(href) ? href : 'https://' + href
	emit('insert', { href: finalHref, target: newTab.value ? '_blank' : null })
	emit('update:modelValue', false)
}

function remove() {
	emit('remove')
	emit('update:modelValue', false)
}

function cancel() {
	emit('update:modelValue', false)
}

function onKeydown(e) {
	if (e.key === 'Enter') insert()
	if (e.key === 'Escape') cancel()
}
</script>

<template>
	<Teleport to="body">
		<Transition name="ld-fade">
			<div v-if="modelValue"
				class="fixed inset-0 z-[10000] bg-black/25 flex items-center justify-center"
				@mousedown.self="cancel">
				<div class="bg-panel border border-heading/10 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.1)] w-[360px] max-w-[95vw] overflow-hidden"
					role="dialog" aria-modal="true" aria-label="Insert link">

					<div class="px-[18px] pt-[14px] pb-[10px] text-[0.9rem] font-bold text-heading border-b border-heading/7">
						Insert Link
					</div>

					<div class="px-[18px] py-[14px] flex flex-col gap-2.5">
						<label class="text-xs font-semibold text-text/60">URL</label>
						<input
							ref="urlInput"
							v-model="url"
							type="url"
							class="w-full px-[10px] py-2 border border-heading/15 rounded-md text-sm bg-heading/3 text-text outline-none transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/15"
							placeholder="https://example.com"
							@keydown="onKeydown"
						/>
						<label class="flex items-center gap-2 text-[0.8rem] text-text cursor-pointer select-none">
							<input v-model="newTab" type="checkbox" class="accent-accent w-3.5 h-3.5 cursor-pointer" />
							Open in new tab
						</label>
					</div>

					<div class="px-[18px] pt-[10px] pb-[14px] flex gap-2 border-t border-heading/7">
						<button type="button"
							class="px-4 py-1.5 rounded-md text-[0.8rem] font-semibold cursor-pointer border-0 bg-accent text-white transition-colors duration-[120ms] hover:bg-accent/85"
							@click="insert">
							{{ hasLink ? 'Update' : 'Insert' }}
						</button>
						<button v-if="hasLink" type="button"
							class="px-4 py-1.5 rounded-md text-[0.8rem] font-semibold cursor-pointer border-0 bg-red-100 text-red-600 transition-colors duration-[120ms] hover:bg-red-200"
							@click="remove">
							Remove link
						</button>
						<button type="button"
							class="px-4 py-1.5 rounded-md text-[0.8rem] font-semibold cursor-pointer border-0 bg-heading/6 text-text transition-colors duration-[120ms] hover:bg-heading/10"
							@click="cancel">
							Cancel
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.ld-fade-enter-active,
.ld-fade-leave-active { transition: opacity 0.15s ease; }
.ld-fade-enter-from,
.ld-fade-leave-to { opacity: 0; }
</style>
