<script setup>
defineProps({
	mode:  { type: String, default: 'grid' }, // 'grid' | 'list'
	count: { type: Number, default: 6 },
	header: { type: Boolean, default: false }, // list-variant column header
})
</script>

<template>
	<!-- Grid -->
	<div v-if="mode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
		<div v-for="n in count" :key="n"
			class="bg-panel rounded-sm border border-heading/8 overflow-hidden flex flex-col animate-pulse">
			<div class="h-1 w-full bg-heading/10" />
			<div class="p-5 flex-1">
				<div class="flex items-start justify-between mb-3">
					<div class="w-10 h-10 rounded-sm bg-heading/10" />
					<div class="w-20 h-6 rounded-full bg-heading/10" />
				</div>
				<div class="h-4 bg-heading/10 rounded w-3/4 mb-2" />
				<div class="h-3 bg-heading/8 rounded w-full mb-1" />
				<div class="h-3 bg-heading/8 rounded w-5/6 mb-4" />
				<div class="mb-4">
					<div class="h-1.5 bg-heading/8 rounded-full w-full" />
				</div>
				<div class="flex gap-2">
					<div class="h-6 w-24 rounded-full bg-heading/8" />
					<div class="h-6 w-16 rounded-full bg-heading/8" />
				</div>
			</div>
			<div class="px-5 py-3 border-t border-heading/8 flex items-center justify-between">
				<div class="flex -space-x-2">
					<div v-for="a in 3" :key="a" class="w-10 h-10 rounded-full bg-heading/10 border-2 border-panel" />
				</div>
				<div class="h-4 w-16 rounded bg-heading/8" />
			</div>
		</div>
	</div>

	<!-- List -->
	<div v-else class="bg-panel rounded-sm border border-heading/8 overflow-hidden animate-pulse">
		<div v-if="header" class="border-b border-heading/8 bg-heading/[0.02] px-5 py-3 flex gap-6">
			<div class="h-3 w-32 rounded bg-heading/10" />
			<div class="h-3 w-16 rounded bg-heading/10" />
			<div class="h-3 w-16 rounded bg-heading/10" />
			<div class="h-3 w-24 rounded bg-heading/10" />
			<div class="h-3 w-12 rounded bg-heading/10" />
			<div class="h-3 w-12 rounded bg-heading/10" />
			<div class="h-3 w-16 rounded bg-heading/10" />
		</div>
		<div v-for="n in count" :key="n"
			class="flex items-center gap-4 px-5 py-4 border-b border-heading/5 last:border-0">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				<div class="w-8 h-8 rounded-sm bg-heading/10 shrink-0" />
				<div class="space-y-1.5 flex-1">
					<div class="h-3.5 bg-heading/10 rounded w-2/5" />
					<div class="h-3 bg-heading/8 rounded w-3/5" />
				</div>
			</div>
			<div class="h-6 w-24 rounded-full bg-heading/10 shrink-0" />
			<div class="h-6 w-16 rounded-full bg-heading/8 shrink-0" />
			<div class="flex items-center gap-2 w-36 shrink-0">
				<div class="flex-1 h-1.5 bg-heading/8 rounded-full" />
				<div class="h-3 w-8 rounded bg-heading/8" />
			</div>
			<div class="h-3 w-10 rounded bg-heading/8 shrink-0" />
			<div class="flex -space-x-1.5 shrink-0">
				<div v-for="a in 3" :key="a" class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
			</div>
			<div class="h-3 w-14 rounded bg-heading/8 shrink-0" />
		</div>
	</div>
</template>
