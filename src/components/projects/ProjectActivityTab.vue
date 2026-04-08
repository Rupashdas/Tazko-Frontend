<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiActivity } from 'oh-vue-icons/icons'

addIcons(BiActivity)

defineProps({
	canView: { type: Boolean, default: true },
	activity: { type: Array, default: () => [] },
})
</script>

<template>
	<div class="p-5">
		<div v-if="!canView" class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-16 h-16 rounded-sm bg-heading/5 flex items-center justify-center mb-4">
				<v-icon name="bi-activity" class="text-text" scale="1.8" />
			</div>
			<p class="text-base font-semibold text-text">Access Denied</p>
			<p class="text-sm text-text mt-1">You don't have permission to view activity logs.</p>
		</div>
		<div v-else>
			<div class="max-w-2xl mx-auto">
				<div class="relative">
					<div class="absolute left-4 top-4 bottom-4 w-px bg-heading/8" />
					<div class="space-y-5">
						<div v-for="(item, i) in activity" :key="i" class="flex items-start gap-4 relative">
							<div
								:class="[item.color, 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 z-10 ring-2 ring-panel shadow-sm']">
								{{ item.initials }}
							</div>
							<div class="flex-1 bg-panel border border-heading/5 rounded-sm px-4 py-3 shadow-sm">
								<p class="text-base text-text leading-relaxed">{{ item.text }}</p>
								<p class="text-sm text-text mt-1.5">{{ item.time }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
