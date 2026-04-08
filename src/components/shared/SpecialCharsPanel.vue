<script setup>
import { ref } from 'vue'

const categories = [
	{
		name: 'Common',
		chars: [
			{ char: '©', label: 'Copyright' },
			{ char: '®', label: 'Registered' },
			{ char: '™', label: 'Trademark' },
			{ char: '°', label: 'Degree' },
			{ char: '…', label: 'Ellipsis' },
			{ char: '—', label: 'Em dash' },
			{ char: '–', label: 'En dash' },
			{ char: '·', label: 'Middle dot' },
			{ char: '•', label: 'Bullet' },
			{ char: '†', label: 'Dagger' },
			{ char: '‡', label: 'Double dagger' },
			{ char: '§', label: 'Section' },
			{ char: '¶', label: 'Pilcrow' },
			{ char: '\u2018', label: 'Left single quote' },
			{ char: '\u2019', label: 'Right single quote' },
			{ char: '\u201C', label: 'Left double quote' },
			{ char: '\u201D', label: 'Right double quote' },
			{ char: '‹', label: 'Left angle quote' },
			{ char: '›', label: 'Right angle quote' },
			{ char: '«', label: 'Left guillemet' },
			{ char: '»', label: 'Right guillemet' },
			{ char: '&', label: 'Ampersand' },
			{ char: '#', label: 'Hash' },
			{ char: '@', label: 'At sign' },
		],
	},
	{
		name: 'Arrows',
		chars: [
			{ char: '→', label: 'Right arrow' },
			{ char: '←', label: 'Left arrow' },
			{ char: '↑', label: 'Up arrow' },
			{ char: '↓', label: 'Down arrow' },
			{ char: '↔', label: 'Left-right arrow' },
			{ char: '↕', label: 'Up-down arrow' },
			{ char: '⇒', label: 'Double right arrow' },
			{ char: '⇐', label: 'Double left arrow' },
			{ char: '⇔', label: 'Double left-right' },
			{ char: '↩', label: 'Return arrow' },
			{ char: '↪', label: 'Right angle arrow' },
			{ char: '➔', label: 'Heavy right arrow' },
			{ char: '➜', label: 'Heavy curved arrow' },
			{ char: '➤', label: 'Arrowhead right' },
			{ char: '▶', label: 'Right triangle' },
			{ char: '◀', label: 'Left triangle' },
		],
	},
	{
		name: 'Math',
		chars: [
			{ char: '½', label: 'One half' },
			{ char: '¼', label: 'One quarter' },
			{ char: '¾', label: 'Three quarters' },
			{ char: '⅓', label: 'One third' },
			{ char: '⅔', label: 'Two thirds' },
			{ char: '±', label: 'Plus-minus' },
			{ char: '×', label: 'Multiplication' },
			{ char: '÷', label: 'Division' },
			{ char: '≤', label: 'Less or equal' },
			{ char: '≥', label: 'Greater or equal' },
			{ char: '≠', label: 'Not equal' },
			{ char: '≈', label: 'Approximately' },
			{ char: '∞', label: 'Infinity' },
			{ char: '√', label: 'Square root' },
			{ char: '∑', label: 'Summation' },
			{ char: '∏', label: 'Product' },
			{ char: 'π', label: 'Pi' },
			{ char: 'μ', label: 'Mu' },
			{ char: 'Δ', label: 'Delta' },
			{ char: 'Ω', label: 'Omega' },
			{ char: '∂', label: 'Partial' },
			{ char: '∫', label: 'Integral' },
			{ char: '°', label: 'Degree' },
			{ char: '‰', label: 'Per mille' },
		],
	},
	{
		name: 'Currency',
		chars: [
			{ char: '$', label: 'Dollar' },
			{ char: '€', label: 'Euro' },
			{ char: '£', label: 'Pound' },
			{ char: '¥', label: 'Yen' },
			{ char: '¢', label: 'Cent' },
			{ char: '₹', label: 'Rupee' },
			{ char: '₩', label: 'Won' },
			{ char: '₿', label: 'Bitcoin' },
			{ char: '₽', label: 'Ruble' },
			{ char: '₺', label: 'Lira' },
			{ char: '₴', label: 'Hryvnia' },
			{ char: '₦', label: 'Naira' },
		],
	},
	{
		name: 'Latin',
		chars: [
			{ char: 'À', label: 'A grave' }, { char: 'Á', label: 'A acute' }, { char: 'Â', label: 'A circumflex' },
			{ char: 'Ã', label: 'A tilde' }, { char: 'Ä', label: 'A umlaut' }, { char: 'Å', label: 'A ring' },
			{ char: 'Æ', label: 'AE' }, { char: 'Ç', label: 'C cedilla' }, { char: 'È', label: 'E grave' },
			{ char: 'É', label: 'E acute' }, { char: 'Ê', label: 'E circumflex' }, { char: 'Ë', label: 'E umlaut' },
			{ char: 'Ì', label: 'I grave' }, { char: 'Í', label: 'I acute' }, { char: 'Î', label: 'I circumflex' },
			{ char: 'Ï', label: 'I umlaut' }, { char: 'Ð', label: 'Eth' }, { char: 'Ñ', label: 'N tilde' },
			{ char: 'Ò', label: 'O grave' }, { char: 'Ó', label: 'O acute' }, { char: 'Ô', label: 'O circumflex' },
			{ char: 'Õ', label: 'O tilde' }, { char: 'Ö', label: 'O umlaut' }, { char: 'Ø', label: 'O slash' },
			{ char: 'Ù', label: 'U grave' }, { char: 'Ú', label: 'U acute' }, { char: 'Û', label: 'U circumflex' },
			{ char: 'Ü', label: 'U umlaut' }, { char: 'Ý', label: 'Y acute' }, { char: 'Þ', label: 'Thorn' },
			{ char: 'ß', label: 'Sharp s' }, { char: 'à', label: 'a grave' }, { char: 'á', label: 'a acute' },
			{ char: 'â', label: 'a circumflex' }, { char: 'ã', label: 'a tilde' }, { char: 'ä', label: 'a umlaut' },
			{ char: 'å', label: 'a ring' }, { char: 'æ', label: 'ae' }, { char: 'ç', label: 'c cedilla' },
			{ char: 'é', label: 'e acute' }, { char: 'ê', label: 'e circumflex' }, { char: 'ë', label: 'e umlaut' },
			{ char: 'í', label: 'i acute' }, { char: 'î', label: 'i circumflex' }, { char: 'ñ', label: 'n tilde' },
			{ char: 'ó', label: 'o acute' }, { char: 'ô', label: 'o circumflex' }, { char: 'ö', label: 'o umlaut' },
			{ char: 'ú', label: 'u acute' }, { char: 'ü', label: 'u umlaut' },
		],
	},
]

const activeCategory = ref(0)
const emit = defineEmits(['pick', 'close'])
</script>

<template>
	<div class="w-[300px] p-2 sc-panel" @click.stop @keydown.escape="emit('close')">
		<div class="flex gap-0.5 flex-wrap mb-1.5">
			<button
				v-for="(cat, i) in categories" :key="cat.name"
				type="button"
				class="px-[9px] py-[3px] text-[0.72rem] font-semibold border border-heading/12 rounded-[5px] bg-transparent text-text/60 cursor-pointer transition-colors duration-100 hover:bg-accent/12 hover:text-accent hover:border-accent/30"
				:class="{ 'bg-accent/12 !text-accent border-accent/30': activeCategory === i }"
				@click="activeCategory = i"
			>{{ cat.name }}</button>
		</div>
		<div class="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
			<button
				v-for="item in categories[activeCategory].chars" :key="item.char"
				type="button"
				class="w-8 h-8 text-base border border-transparent rounded-[4px] bg-transparent cursor-pointer flex items-center justify-center transition-colors duration-100 text-text font-['Georgia',serif] hover:bg-accent/10 hover:border-accent/20 hover:text-heading"
				:title="item.label + ' (' + item.char + ')'"
				@click="emit('pick', item.char)"
			>{{ item.char }}</button>
		</div>
	</div>
</template>
