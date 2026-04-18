<script setup>
import { addIcons } from 'oh-vue-icons'
import {
	BiThreeDotsVertical, BiArrowRight, BiPencil, BiArchive, BiTrash,
} from 'oh-vue-icons/icons'

addIcons(BiThreeDotsVertical, BiArrowRight, BiPencil, BiArchive, BiTrash)

defineProps({
	open:        { type: Boolean, default: false },
	canOpen:     { type: Boolean, default: true },
	canUpdate:   { type: Boolean, default: false },
	canArchive:  { type: Boolean, default: false },
	canDelete:   { type: Boolean, default: false },
	buttonSize:  { type: String, default: 'w-8 h-8' },
	iconScale:   { type: String, default: '0.85' },
})

const emit = defineEmits(['toggle', 'open', 'edit', 'archive', 'delete'])
</script>

<template>
	<div class="relative" @click.stop>
		<button type="button"
			:aria-expanded="open"
			aria-haspopup="menu"
			@click="emit('toggle')"
			:class="[buttonSize, 'rounded-sm flex items-center justify-center hover:bg-heading/5 transition-colors text-text']">
			<v-icon name="bi-three-dots-vertical" :scale="iconScale" />
		</button>
		<Transition name="fade-drop">
			<div v-if="open"
				class="absolute right-0 top-full mt-1 w-44 bg-panel rounded-sm border border-heading/10 shadow-xl z-20 overflow-hidden">
				<button v-if="canOpen"
					@click.stop="emit('open')"
					class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
					<v-icon name="bi-arrow-right" scale="0.85" /> Open
				</button>
				<button v-if="canUpdate"
					@click.stop="emit('edit')"
					class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-heading/5 transition-colors">
					<v-icon name="bi-pencil" scale="0.85" /> Edit
				</button>
				<button v-if="canArchive"
					@click.stop="emit('archive')"
					class="w-full flex items-center gap-2 px-4 py-3 text-base text-text hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
					<v-icon name="bi-archive" scale="0.85" /> Archive
				</button>
				<template v-if="canDelete">
					<div class="h-px bg-heading/5 mx-2" />
					<button
						@click.stop="emit('delete')"
						class="w-full flex items-center gap-2 px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
						<v-icon name="bi-trash" scale="0.85" /> Delete
					</button>
				</template>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.fade-drop-enter-active,
.fade-drop-leave-active {
	transition: all 0.15s ease;
}
.fade-drop-enter-from,
.fade-drop-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}
</style>
