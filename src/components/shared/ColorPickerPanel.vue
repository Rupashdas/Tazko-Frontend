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
	<div class="p-3 min-w-[220px] dropdown-menu cp-panel" @click.stop @keydown.escape="emit('close')">
		<div class="text-xs font-semibold uppercase tracking-wider text-text/50 mb-2">Text Color</div>
		<div class="grid grid-cols-10 gap-1 mb-2">
			<button
				v-for="c in textColors" :key="c" type="button"
				class="w-[18px] h-[18px] rounded-md border-0 cursor-pointer p-0 transition-transform duration-100 hover:scale-110 hover:relative hover:z-10"
				:style="{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #ccc' : 'none' }"
				:title="c"
				@click="emit('pick', { type: 'color', value: c })"
			/>
		</div>
		<button type="button"
			class="text-xs text-text/60 bg-transparent border border-heading/10 rounded-md px-2.5 py-1 cursor-pointer transition-colors hover:bg-heading/5 hover:text-heading"
			@click="emit('pick', { type: 'color', value: null })">
			Remove color
		</button>

		<div class="text-xs font-semibold uppercase tracking-wider text-text/50 mt-3 mb-2">Highlight</div>
		<div class="grid grid-cols-10 gap-1 mb-2">
			<button
				v-for="c in highlightColors" :key="'h' + c" type="button"
				class="w-[18px] h-[18px] rounded-md border-0 cursor-pointer p-0 transition-transform duration-100 hover:scale-110 hover:relative hover:z-10"
				:style="{ background: c }"
				:title="c"
				@click="emit('pick', { type: 'highlight', value: c })"
			/>
		</div>
		<button type="button"
			class="text-xs text-text/60 bg-transparent border border-heading/10 rounded-md px-2.5 py-1 cursor-pointer transition-colors hover:bg-heading/5 hover:text-heading"
			@click="emit('pick', { type: 'highlight', value: null })">
			Remove highlight
		</button>
	</div>
</template>
