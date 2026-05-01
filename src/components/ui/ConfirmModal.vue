<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiArrowRepeat } from 'oh-vue-icons/icons'

addIcons(BiArrowRepeat)

defineProps({
	show:            { type: Boolean, default: false },
	title:           { type: String,  required: true },
	message:         { type: String,  required: true },
	icon:            { type: String,  required: true },
	iconBg:          { type: String,  default: 'bg-red-50 dark:bg-red-500/10' },
	iconColor:       { type: String,  default: 'text-red-500' },
	confirmLabel:    { type: String,  default: 'Confirm' },
	confirmingLabel: { type: String,  default: 'Processing…' },
	confirmBg:       { type: String,  default: 'bg-red-500 hover:bg-red-600' },
	loading:         { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div class="absolute inset-0 bg-heading/50 backdrop-blur-sm" @click="emit('close')" />
				<div class="relative w-full max-w-sm bg-panel rounded-sm shadow-2xl border border-heading/10 p-6 transition-all">
					<div :class="[iconBg, 'w-12 h-12 rounded-sm flex items-center justify-center mb-4']">
						<v-icon :name="icon" :class="iconColor" scale="1.2" />
					</div>
					<h3 class="section-title mb-2">{{ title }}</h3>
					<p class="text-base text-text mb-6">{{ message }}</p>
					<div class="flex gap-3">
						<button @click="emit('close')" :disabled="loading" class="flex-1 tazko-btn-cancel">
							Cancel
						</button>
						<button @click="emit('confirm')" :disabled="loading"
							:class="[confirmBg, 'flex-1 inline-flex gap-2 items-center justify-center px-6 py-3 text-base tracking-wide rounded-sm shadow-sm text-white active:scale-95 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed']">
							<v-icon v-if="loading" name="bi-arrow-repeat" scale="1" class="animate-spin" />
							<v-icon v-else :name="icon" scale="1" />
							{{ loading ? confirmingLabel : confirmLabel }}
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
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
