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
				class="modal-overlay"
				@mousedown.self="cancel">
				<div class="modal-content w-[360px] max-w-[95vw]" role="dialog" aria-modal="true" aria-label="Insert link" @click.stop>

					<div class="px-5 pt-5 pb-3 text-base font-semibold text-heading border-b border-heading/7">
						Insert Link
					</div>

					<div class="px-5 py-4 flex flex-col gap-3">
						<label class="form-label">URL</label>
						<input
							ref="urlInput"
							v-model="url"
							type="url"
							class="input-field"
							placeholder="https://example.com"
							@keydown="onKeydown"
						/>
						<label class="flex items-center gap-2 text-sm text-text cursor-pointer select-none">
							<input v-model="newTab" type="checkbox" class="accent-accent w-4 h-4 cursor-pointer" />
							Open in new tab
						</label>
					</div>

					<div class="px-5 pt-3 pb-4 flex gap-2 border-t border-heading/7">
						<button type="button"
							class="tazko-btn flex-1"
							@click="insert">
							{{ hasLink ? 'Update' : 'Insert' }}
						</button>
						<button v-if="hasLink" type="button"
							class="tazko-btn-cancel flex-1 !text-red-600 !border-red-200 hover:!bg-red-50"
							@click="remove">
							Remove link
						</button>
						<button type="button"
							class="tazko-btn-cancel flex-1"
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
