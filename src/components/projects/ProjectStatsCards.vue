<script setup>
import { addIcons } from 'oh-vue-icons'
import {
	MdFolderspecialOutlined, BiLightningCharge, BiCheckCircle, BiGraphUp,
} from 'oh-vue-icons/icons'

addIcons(MdFolderspecialOutlined, BiLightningCharge, BiCheckCircle, BiGraphUp)

defineProps({
	total:     { type: Number, default: 0 },
	active:    { type: Number, default: 0 },
	completed: { type: Number, default: 0 },
	avgProgress: { type: Number, default: 0 },
})
</script>

<template>
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
		<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
			<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
				<v-icon name="md-folderspecial-outlined" class="text-accent" scale="1.4" />
			</div>
			<div>
				<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ total }}</p>
				<p class="text-sm text-text mt-0.5">Total</p>
			</div>
		</div>
		<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
			<div class="w-12 h-12 rounded-sm bg-blue-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-lightning-charge" class="text-blue-500" scale="1.4" />
			</div>
			<div>
				<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ active }}</p>
				<p class="text-sm text-text mt-0.5">Active</p>
			</div>
		</div>
		<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
			<div class="w-12 h-12 rounded-sm bg-emerald-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-check-circle" class="text-emerald-500" scale="1.4" />
			</div>
			<div>
				<p class="text-2xl font-bold text-heading leading-none tabular-nums">{{ completed }}</p>
				<p class="text-sm text-text mt-0.5">Completed</p>
			</div>
		</div>
		<div class="bg-panel rounded-sm border border-heading/8 p-4 flex items-center gap-3">
			<div class="w-12 h-12 rounded-sm bg-violet-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-graph-up" class="text-violet-500" scale="1.4" />
			</div>
			<div>
				<p class="text-2xl font-bold text-heading leading-none tabular-nums">
					{{ avgProgress }}<span class="text-base font-medium text-text">%</span>
				</p>
				<p class="text-sm text-text mt-0.5">Avg Progress</p>
			</div>
		</div>
	</div>
</template>
