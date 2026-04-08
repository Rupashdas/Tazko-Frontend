<script setup>
const textColors = [
	'#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
	'#ff0000', '#ff4500', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff',
	'#ff00ff', '#ea4335', '#fbbc04', '#34a853', '#4285f4', '#ab47bc', '#e06666', '#f6b26b',
	'#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
]

const highlightColors = [
	'#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff9900', '#ff4500',
	'#9900ff', '#4285f4', '#ffd966', '#b6d7a8', '#a2c4c9', '#ea9999',
	'#ffe599', '#d9ead3', '#d0e4f5', '#f4cccc', '#fff2cc', '#e6d0de',
	'#d9d2e9', '#fce5cd',
]

const emit = defineEmits(['pick', 'close'])
</script>

<template>
	<div class="p-[10px_12px_12px] min-w-[220px] cp-panel" @click.stop @keydown.escape="emit('close')">
		<div class="text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-text/45 mb-1.5">Text Color</div>
		<div class="grid grid-cols-10 gap-[3px] mb-1">
			<button
				v-for="c in textColors" :key="c" type="button"
				class="w-[18px] h-[18px] rounded-[3px] border-0 cursor-pointer p-0 transition-transform duration-100 hover:scale-125 hover:relative hover:z-10"
				:style="{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #ccc' : 'none' }"
				:title="c"
				@click="emit('pick', { type: 'color', value: c })"
			/>
		</div>
		<button type="button"
			class="text-[0.72rem] text-text/55 bg-transparent border border-heading/12 rounded-[4px] px-2 py-0.5 cursor-pointer transition-colors duration-[120ms] hover:bg-heading/6 hover:text-heading"
			@click="emit('pick', { type: 'color', value: null })">
			Remove color
		</button>

		<div class="text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-text/45 mt-2.5 mb-1.5">Highlight</div>
		<div class="grid grid-cols-10 gap-[3px] mb-1">
			<button
				v-for="c in highlightColors" :key="'h' + c" type="button"
				class="w-[18px] h-[18px] rounded-[3px] border-0 cursor-pointer p-0 transition-transform duration-100 hover:scale-125 hover:relative hover:z-10"
				:style="{ background: c }"
				:title="c"
				@click="emit('pick', { type: 'highlight', value: c })"
			/>
		</div>
		<button type="button"
			class="text-[0.72rem] text-text/55 bg-transparent border border-heading/12 rounded-[4px] px-2 py-0.5 cursor-pointer transition-colors duration-[120ms] hover:bg-heading/6 hover:text-heading"
			@click="emit('pick', { type: 'highlight', value: null })">
			Remove highlight
		</button>
	</div>
</template>
