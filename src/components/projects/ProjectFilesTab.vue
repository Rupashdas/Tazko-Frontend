<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiFileEarmark, BiPlus, BiPlusCircle } from 'oh-vue-icons/icons'

addIcons(BiFileEarmark, BiPlus, BiPlusCircle)

defineProps({
	canUpload: { type: Boolean, default: false },
})
</script>

<template>
	<div class="p-5">
		<div v-if="canUpload" class="flex items-center justify-between mb-5">
			<p class="text-base font-semibold text-text">Project Files</p>
			<button
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all shadow-md shadow-accent/20">
				<v-icon name="bi-plus" scale="0.85" />
				Upload File
			</button>
		</div>
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="w-16 h-16 rounded-sm bg-heading/5 flex items-center justify-center mb-4">
				<v-icon name="bi-file-earmark" class="text-text" scale="1.8" />
			</div>
			<p class="text-base font-semibold text-text">No files uploaded yet</p>
			<p class="text-sm text-text mt-1 mb-5">Upload project files, designs, and documents</p>
			<button v-if="canUpload"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-heading/10 text-base font-semibold text-text hover:bg-heading/5 hover:text-heading transition-all">
				<v-icon name="bi-plus-circle" scale="0.9" /> Upload Files
			</button>
			<p v-else class="text-sm text-text/60">You don't have permission to upload files.</p>
		</div>
	</div>
</template>
