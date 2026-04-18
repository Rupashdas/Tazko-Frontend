<script setup>
// Initial-load skeleton for the whole Project Detail page.
</script>

<template>
	<div class="animate-pulse">
		<!-- Breadcrumb -->
		<div class="flex items-center gap-1.5 mb-4">
			<div class="h-3 w-16 bg-heading/10 rounded" />
			<div class="h-3 w-3 bg-heading/10 rounded" />
			<div class="h-3 w-36 bg-heading/10 rounded" />
		</div>

		<!-- Hero -->
		<div class="bg-panel border border-heading/8 rounded-t-sm px-6 pt-5 pb-0">
			<div class="flex flex-wrap gap-5 items-start justify-between mb-4">
				<div class="flex items-start gap-4 flex-1 min-w-0">
					<div class="w-12 h-12 rounded-sm bg-heading/10 shrink-0" />
					<div class="flex-1 space-y-2 pt-1">
						<div class="h-5 w-56 bg-heading/10 rounded" />
						<div class="h-3 w-24 bg-heading/10 rounded" />
					</div>
				</div>
				<div class="h-10 w-28 bg-heading/10 rounded-sm shrink-0" />
			</div>

			<div class="space-y-2 mb-4 px-2">
				<div class="h-3 w-full bg-heading/10 rounded" />
				<div class="h-3 w-5/6 bg-heading/10 rounded" />
				<div class="h-3 w-3/4 bg-heading/10 rounded" />
			</div>

			<div class="flex flex-wrap items-center gap-5 mb-5">
				<div class="h-1.5 w-52 bg-heading/10 rounded-full" />
				<div class="h-3 w-40 bg-heading/10 rounded" />
				<div class="h-3 w-28 bg-heading/10 rounded" />
				<div class="flex items-center ml-auto">
					<div v-for="n in 4" :key="n" class="w-12 h-12 rounded-full bg-heading/10 border-2 border-panel -ml-4 first:ml-0" />
					<div class="w-12 h-12 rounded-full bg-heading/10 border-2 border-dashed border-heading/20 -ml-1.5" />
				</div>
			</div>

			<div class="flex items-center gap-1 flex-wrap">
				<div v-for="n in 5" :key="n" class="h-10 w-24 bg-heading/10 rounded-sm" />
			</div>
		</div>

		<!-- Tab body -->
		<div class="bg-panel border border-heading/8 rounded-b-sm mt-0.5 p-4 md:p-5">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
				<div v-for="n in 4" :key="n" class="bg-heading/5 rounded-sm border border-heading/5 px-4 py-3 flex items-center gap-3">
					<div class="w-12 h-12 rounded-sm bg-heading/10 shrink-0" />
					<div class="space-y-1.5">
						<div class="h-5 w-10 bg-heading/10 rounded" />
						<div class="h-3 w-16 bg-heading/8 rounded" />
					</div>
				</div>
			</div>

			<div class="bg-heading/5 rounded-sm border border-heading/5 p-3.5 mb-4">
				<div class="flex flex-wrap items-center gap-2.5">
					<div class="h-9 w-full max-w-xs bg-heading/10 rounded-sm" />
					<div class="h-9 w-36 bg-heading/10 rounded-sm" />
					<div class="h-9 w-36 bg-heading/10 rounded-sm" />
					<div class="flex-1 hidden sm:block" />
					<div class="h-9 w-36 bg-heading/10 rounded-sm" />
				</div>
			</div>

			<div class="grid grid-cols-4 gap-4">
				<div v-for="n in 4" :key="n" class="rounded-sm border border-heading/5">
					<div class="px-3.5 py-3 bg-heading/5 rounded-t-sm flex items-center gap-2">
						<div class="w-2.5 h-2.5 rounded-full bg-heading/10" />
						<div class="h-3 w-20 bg-heading/10 rounded" />
						<div class="ml-auto w-5 h-5 bg-heading/10 rounded" />
					</div>
					<div class="p-2 space-y-2">
						<div v-for="i in 3" :key="i" class="bg-panel rounded-sm border border-heading/8 p-3">
							<div class="h-3 w-full bg-heading/8 rounded mb-2" />
							<div class="h-3 w-4/5 bg-heading/8 rounded mb-3" />
							<div class="flex items-center justify-between">
								<div class="h-4 w-12 bg-heading/8 rounded-full" />
								<div class="flex -space-x-1.5">
									<div class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
									<div class="w-6 h-6 rounded-full bg-heading/10 border-2 border-panel" />
								</div>
							</div>
						</div>
						<div class="min-h-[64px] border-2 border-dashed border-heading/8 rounded-sm" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
