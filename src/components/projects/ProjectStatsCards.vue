<script setup>
import { addIcons } from 'oh-vue-icons'
import {
	BiFolder2Open, BiLightningCharge, BiCheckCircle, BiGraphUp,
} from 'oh-vue-icons/icons'

addIcons(BiFolder2Open, BiLightningCharge, BiCheckCircle, BiGraphUp)

defineProps({
	total:     { type: Number, default: 0 },
	active:    { type: Number, default: 0 },
	completed: { type: Number, default: 0 },
	avgProgress: { type: Number, default: 0 },
})
</script>

<template>
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
		<div class="card p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-folder2-open" class="text-accent" scale="1.2" />
			</div>
			<div>
				<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ total }}</p>
				<p class="text-sm text-text mt-0.5 font-medium">Total</p>
			</div>
		</div>
		<div class="card p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-lightning-charge" class="text-blue-600" scale="1.2" />
			</div>
			<div>
				<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ active }}</p>
				<p class="text-sm text-text mt-0.5 font-medium">Active</p>
			</div>
		</div>
		<div class="card p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-check-circle" class="text-emerald-600" scale="1.2" />
			</div>
			<div>
				<p class="text-xl font-bold text-heading leading-none tabular-nums">{{ completed }}</p>
				<p class="text-sm text-text mt-0.5 font-medium">Completed</p>
			</div>
		</div>
		<div class="card p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
				<v-icon name="bi-graph-up" class="text-violet-600" scale="1.2" />
			</div>
			<div>
				<p class="text-xl font-bold text-heading leading-none tabular-nums">
					{{ avgProgress }}<span class="text-sm font-medium text-text">%</span>
				</p>
				<p class="text-sm text-text mt-0.5 font-medium">Avg Progress</p>
			</div>
		</div>
	</div>
</template>
