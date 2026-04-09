<script setup>
import { ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps({
	node: {
		type: Object,
		required: true,
	},
	selected: {
		type: Boolean,
		default: false,
	},
})

const imageLoadFailed = ref(false)

const handleImageError = () => {
	imageLoadFailed.value = true
}
</script>

<template>
	<NodeViewWrapper
		as="span"
		role="button"
		:aria-label="`Mention: ${node.attrs.name}`"
		tabindex="0"
		class="mention-chip inline-flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-[4px] cursor-pointer transition-colors duration-150 hover:bg-accent/15"
		:class="{ 'ring-2 ring-accent': selected }"
	>
		<!-- Avatar with initials fallback -->
		<div
			class="w-[20px] h-[20px] rounded-full flex items-center justify-center text-white text-[0.6rem] font-bold shrink-0"
			:class="node.attrs.color || 'bg-accent'"
		>
			<img
				v-if="node.attrs.avatar && !imageLoadFailed"
				:src="node.attrs.avatar"
				:alt="node.attrs.name"
				class="w-full h-full rounded-full object-cover"
				@error="handleImageError"
			/>
			<span v-else>{{ node.attrs.initials || '?' }}</span>
		</div>

		<!-- Username in accent color -->
		<span class="text-accent font-semibold text-[0.85rem] whitespace-nowrap">
			{{ node.attrs.name }}
		</span>
	</NodeViewWrapper>
</template>

<style scoped>
.mention-chip {
	user-select: all;
	line-height: 1;
}
</style>
