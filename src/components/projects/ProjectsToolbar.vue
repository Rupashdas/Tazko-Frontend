<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiSearch, BiX, BiGrid3X3Gap, BiListUl } from 'oh-vue-icons/icons'
import AppSelect from '@/components/ui/AppSelect.vue'

addIcons(BiSearch, BiX, BiGrid3X3Gap, BiListUl)

const props = defineProps({
	search:         { type: String,  default: '' },
	statusFilter:   { type: String,  default: 'All' },
	priorityFilter: { type: String,  default: 'All' },
	viewMode:       { type: String,  default: 'grid' },
	statuses:       { type: Array,   required: true },
	priorities:     { type: Array,   required: true },
})

const emit = defineEmits([
	'update:search', 'update:statusFilter', 'update:priorityFilter', 'update:viewMode',
])
</script>

<template>
	<div class="bg-panel rounded-sm border border-heading/5 p-3.5 mb-6">
		<div class="flex flex-wrap items-center gap-2.5">
			<div class="relative flex-1 min-w-48">
				<v-icon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none" scale="0.85" />
				<input :value="search" @input="emit('update:search', $event.target.value)" type="text" placeholder="Search projects…"
					class="w-full pl-9 pr-8 py-2 rounded-sm border border-heading/8 bg-heading/3 text-base text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
				<button v-if="search"
					type="button"
					aria-label="Clear search"
					@click="emit('update:search', '')"
					class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text hover:text-heading">
					<v-icon name="bi-x" scale="0.8" />
				</button>
			</div>

			<div class="w-36">
				<AppSelect
					:model-value="statusFilter"
					@update:model-value="emit('update:statusFilter', $event)"
					:options="[{ label: 'All Status', value: 'All' }, ...statuses.slice(1).map(s => ({ label: s, value: s }))]"
					placeholder="All Status"
					size="sm"
					:highlight="true"
					inactive-value="All" />
			</div>

			<div class="w-36">
				<AppSelect
					:model-value="priorityFilter"
					@update:model-value="emit('update:priorityFilter', $event)"
					:options="[{ label: 'All Priority', value: 'All' }, ...priorities.slice(1).map(p => ({ label: p, value: p }))]"
					placeholder="All Priority"
					size="sm"
					:highlight="true"
					inactive-value="All" />
			</div>

			<div class="flex-1 hidden sm:block" />

			<div class="flex items-center gap-1 bg-heading/5 rounded-sm p-1">
				<button @click="emit('update:viewMode', 'grid')"
					:class="[viewMode === 'grid' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
					<v-icon name="bi-grid-3x3-gap" scale="0.85" /> Grid
				</button>
				<button @click="emit('update:viewMode', 'list')"
					:class="[viewMode === 'list' ? 'bg-panel text-heading shadow-sm' : 'text-text hover:text-text', 'px-3 py-1.5 rounded-sm text-sm font-semibold transition-all flex items-center gap-1.5']">
					<v-icon name="bi-list-ul" scale="0.85" /> List
				</button>
			</div>
		</div>
	</div>
</template>
