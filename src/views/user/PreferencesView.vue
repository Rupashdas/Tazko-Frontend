<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@/utils/toast'
import { TIMEZONES } from '@/resources/timezones'
import { PALETTES } from '@/resources/palettes'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

import { addIcons } from 'oh-vue-icons'
import {
	BiPalette,
	MdAvtimer,
	MdDisabledvisibleOutlined,
	BiSun,
	MdDarkmodeOutlined,
	RiComputerLine, BiArrowRepeat, BiCheck2
} from 'oh-vue-icons/icons'

addIcons(BiPalette, MdAvtimer, MdDisabledvisibleOutlined, BiSun, MdDarkmodeOutlined, RiComputerLine, BiArrowRepeat, BiCheck2)
import AppSelect from '@/components/ui/AppSelect.vue'

const { successToast, errorToast } = useToast()
const store = usePreferencesStore()
const { palette, appearance, timezone, week_start, time_format, saving } = storeToRefs(store)

const paletteKeys = computed(() => Object.keys(PALETTES))

const APPEARANCE_OPTIONS = [
	{ icon: 'bi-sun', label: 'Light', value: 'light', desc: 'Bright & clear', bg: '#f8fafc' },
	{ icon: 'md-darkmode-outlined', label: 'Dark', value: 'dark', desc: 'Easy on the eyes', bg: '#0f172a' },
	{ icon: 'ri-computer-line', label: 'System', value: 'os', desc: 'Follow OS setting', bg: 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)' },
]

const WEEK_START_OPTIONS = [
	{ label: 'Sunday', value: 'sunday' },
	{ label: 'Monday', value: 'monday' },
	{ label: 'Tuesday', value: 'tuesday' },
	{ label: 'Wednesday', value: 'wednesday' },
	{ label: 'Thursday', value: 'thursday' },
	{ label: 'Friday', value: 'friday' },
	{ label: 'Saturday', value: 'saturday' },
]

const TIME_FORMAT_OPTIONS = [
	{ label: '12-hour  (1:30 PM)', value: '12' },
	{ label: '24-hour  (13:30)', value: '24' },
]

const getPaletteColors = (name, forceMode = null) => {
	const mode = forceMode || store.currentMode
	return PALETTES[name]?.[mode] || {}
}

const getPaletteName = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const changePalette = (key) => store.updatePalette(key)
const changeAppearance = (mode) => store.updateAppearance(mode)

const saveDateTime = async () => {
	const { data } = await store.updateDateTimePreferences()
	if (data.status === 'success') {
		successToast(data.message)
	} else {
		if (data.errors && Object.keys(data.errors).length > 0) {
			Object.values(data.errors).flat().forEach(msg => errorToast(msg))
		} else {
			errorToast(data.message || 'Something went wrong')
		}
	}
}
</script>

<template>
	<div class="max-w-3xl mx-auto mt-6 md:mt-10 mb-24 px-4">

		<!-- Page Header -->
		<div class="mb-6 md:mb-8">
			<p class="page-eyebrow">User</p>
			<h1 class="page-title">Preferences</h1>
			<p class="page-subtitle">Customize your workspace to feel just right.</p>
		</div>

		<!-- ─── SECTION 1: COLOR PALETTE ─────────────────────────── -->
		<section class="mb-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
					<v-icon name="bi-palette" class="text-accent" scale="1.2" />
				</div>
				<div>
					<h2 class="section-title">Color Palette</h2>
					<p class="section-desc">Choose a theme that fits your style</p>
				</div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
				<button v-for="key in paletteKeys" :key="key" type="button" @click="changePalette(key)"
					class="group relative rounded-sm overflow-hidden border-2 transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					:class="palette === key
						? 'border-accent shadow-lg shadow-accent/20 scale-[1.02]'
						: 'border-heading/8 hover:border-heading/20 hover:scale-[1.01]'"
					:style="{ background: getPaletteColors(key).body }">

					<!-- Mini UI preview -->
					<div class="p-3 pb-2" :style="{ background: getPaletteColors(key).body }">
						<div class="rounded-sm px-2.5 py-1.5 mb-2 flex items-center gap-1.5"
							:style="{ background: getPaletteColors(key).panel }">
							<div class="w-2 h-2 rounded-full" :style="{ background: getPaletteColors(key).accent }" />
							<div class="flex-1 h-1.5 rounded-full"
								:style="{ background: getPaletteColors(key).heading + '20' }" />
							<div class="w-4 h-1.5 rounded-full"
								:style="{ background: getPaletteColors(key).accent + 'aa' }" />
						</div>
						<div class="space-y-1 px-1">
							<div class="h-1.5 rounded-full w-3/4"
								:style="{ background: getPaletteColors(key).heading + '60' }" />
							<div class="h-1 rounded-full w-full"
								:style="{ background: getPaletteColors(key).text + '40' }" />
							<div class="h-1 rounded-full w-5/6"
								:style="{ background: getPaletteColors(key).text + '30' }" />
						</div>
					</div>

					<!-- Color strip -->
					<div class="flex h-2">
						<div class="flex-1" :style="{ background: getPaletteColors(key).body }" />
						<div class="flex-1" :style="{ background: getPaletteColors(key).heading }" />
						<div class="flex-1" :style="{ background: getPaletteColors(key).accent }" />
						<div class="flex-1" :style="{ background: getPaletteColors(key).text }" />
						<div class="flex-1" :style="{ background: getPaletteColors(key).panel }" />
					</div>

					<!-- Palette label -->
					<div class="px-3 py-3 flex items-center justify-between"
						:style="{ background: getPaletteColors(key).panel }">
						<span class="text-base font-semibold capitalize"
							:style="{ color: getPaletteColors(key).heading }">
							{{ getPaletteName(key) }}
						</span>
						<Transition name="pop">
							<span v-if="palette === key" class="w-5 h-5 rounded-full flex items-center justify-center"
								:style="{ background: getPaletteColors(key).accent }">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none"
									stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</span>
						</Transition>
					</div>
				</button>
			</div>
		</section>

		<!-- ─── SECTION 2: APPEARANCE ─────────────────────────────── -->
		<section class="mb-6">
			<div class="bg-panel border border-heading/8 rounded-sm p-5 md:p-6 shadow-sm">
				<div class="flex items-center gap-3 mb-5">
					<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
						<v-icon name="md-disabledvisible-outlined" class="text-accent" scale="1.2" />
					</div>
					<div>
						<!-- FIX: section-title (was text-lg font-bold) -->
						<h2 class="section-title">Appearance</h2>
						<!-- FIX: section-desc -->
						<p class="section-desc">How the interface looks</p>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-3">
					<button v-for="option in APPEARANCE_OPTIONS" :key="option.value" type="button"
						@click="changeAppearance(option.value)"
						class="group relative rounded-sm overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						:class="appearance === option.value
							? 'border-accent shadow-md shadow-accent/15'
							: 'border-heading/8 hover:border-heading/20'">

						<div class="h-16 sm:h-20 w-full relative overflow-hidden" :style="{ background: option.bg }">
							<div class="absolute inset-x-3 top-2.5 rounded h-2.5 opacity-70"
								:style="{ background: option.value === 'dark' ? '#1e293b' : '#e2e8f0' }" />
							<div class="absolute inset-x-3 bottom-2.5 rounded h-1.5 opacity-40"
								:style="{ background: option.value === 'dark' ? '#334155' : '#cbd5e1' }" />
							<div class="absolute inset-0 flex items-center justify-center">
								<v-icon :name="option.icon" scale="1.2"
									:fill="option.value === 'dark' ? '#94a3b8' : '#64748b'" class="opacity-50" />
							</div>
						</div>

						<div class="py-3 px-3 flex items-center justify-between bg-panel">
							<div>
								<p class="section-title text-left">{{ option.label }}</p>
								<p class="section-desc mt-0.5">{{ option.desc }}</p>
							</div>
							<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
								:class="appearance === option.value ? 'border-accent' : 'border-heading/20'">
								<div v-if="appearance === option.value" class="w-2 h-2 rounded-full bg-accent" />
							</div>
						</div>
					</button>
				</div>
			</div>
		</section>

		<!-- ─── SECTION 3: DATE & TIME ────────────────────────────── -->
		<section>
			<form @submit.prevent="saveDateTime">
				<div class="bg-panel border border-heading/8 rounded-sm p-5 md:p-6 shadow-sm">
					<div class="flex items-center gap-3 mb-5">
						<div class="w-12 h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
							<v-icon name="md-avtimer" class="text-accent" scale="1.2" />
						</div>
						<div>
							<h2 class="section-title">Date & Time</h2>
							<p class="section-desc">Regional formatting preferences</p>
						</div>
					</div>

					<div class="space-y-5">

						<!-- Timezone -->
						<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
							<div class="sm:w-40 shrink-0">
								<p class="text-base font-semibold text-text">Timezone</p>
								<p class="section-desc">Your local time</p>
							</div>
							<div class="flex-1">
								<AppSelect
									v-model="timezone"
									:options="TIMEZONES"
									option-label="label"
									option-value="value"
									placeholder="Select timezone…"
									:searchable="true" />
							</div>
						</div>

						<div class="border-t border-heading/6" />

						<!-- First Day of Week -->
						<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
							<div class="sm:w-40 shrink-0">
								<p class="text-base font-semibold text-text">Week starts</p>
								<p class="section-desc">First day of week</p>
							</div>
							<div class="flex gap-1.5 flex-wrap">
								<button v-for="opt in WEEK_START_OPTIONS" :key="opt.value" type="button"
									@click="week_start = opt.value"
									class="px-3 py-2 rounded-sm text-base font-semibold transition-all duration-150 border"
									:class="week_start === opt.value
										? 'bg-accent text-white border-accent shadow-sm'
										: 'bg-body text-text border-heading/10 hover:border-accent/40 hover:text-text'">
									{{ opt.label.slice(0, 3) }}
								</button>
							</div>
						</div>

						<div class="border-t border-heading/6" />

						<!-- Time Format -->
						<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
							<div class="sm:w-40 shrink-0">
								<p class="text-base font-semibold text-text">Time format</p>
								<p class="section-desc">Clock display style</p>
							</div>
							<div class="flex gap-2 flex-wrap">
								<button v-for="opt in TIME_FORMAT_OPTIONS" :key="opt.value" type="button"
									@click="time_format = opt.value"
									class="px-4 py-3 rounded-sm text-base font-semibold transition-all duration-150 border"
									:class="time_format === opt.value
										? 'bg-accent text-white border-accent shadow-sm'
										: 'bg-body text-text border-heading/10 hover:border-accent/40 hover:text-text'">
									{{ opt.label }}
								</button>
							</div>
						</div>

					</div>

					<!-- Save Button -->
					<div class="mt-6 pt-5 border-t border-heading/6 flex justify-end">
						<button type="submit" :disabled="saving" class="tazko-btn">
							<v-icon v-if="!saving" name="bi-check2" scale="1" />
							<v-icon v-else name="bi-arrow-repeat" class="animate-spin" scale="1" />
							{{ saving ? 'Saving…' : 'Save Preferences' }}
						</button>
					</div>
				</div>
			</form>
		</section>
	</div>
</template>

<style scoped>
.pop-enter-active {
	transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-leave-active {
	transition: all 0.1s ease;
}

.pop-enter-from {
	opacity: 0;
	transform: scale(0.5);
}

.pop-leave-to {
	opacity: 0;
	transform: scale(0.5);
}

select {
	-webkit-appearance: none;
	-moz-appearance: none;
}
</style>