<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiCalendar3, BiChevronLeft, BiChevronRight, BiX } from 'oh-vue-icons/icons'

addIcons(BiCalendar3, BiChevronLeft, BiChevronRight, BiX)

const props = defineProps({
	modelValue: { type: String, default: '' },
	placeholder: { type: String, default: 'Select date…' },
	min: { type: String, default: '' },
	max: { type: String, default: '' },
	size: { type: String, default: 'md' }, 
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const container = ref(null)
const triggerRef = ref(null)

// ── Dropdown position (for teleport) ─────────────────────
const dropdownStyle = ref({})

const calcPosition = async () => {
	await nextTick()
	if (!triggerRef.value) return
	const rect = triggerRef.value.getBoundingClientRect()
	const spaceBelow = window.innerHeight - rect.bottom
	const dropHeight = 340

	if (spaceBelow >= dropHeight) {
		// Open downward
		dropdownStyle.value = {
			position: 'fixed',
			top: rect.bottom + 4 + 'px',
			left: rect.left + 'px',
			width: rect.width + 'px',
			zIndex: 9999,
		}
	} else {
		// Open upward
		dropdownStyle.value = {
			position: 'fixed',
			bottom: window.innerHeight - rect.top + 4 + 'px',
			left: rect.left + 'px',
			width: rect.width + 'px',
			zIndex: 9999,
		}
	}
}

const todayDate = new Date()
todayDate.setHours(0, 0, 0, 0)

const viewYear = ref(todayDate.getFullYear())
const viewMonth = ref(todayDate.getMonth())

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const selectedDate = computed(() =>
	props.modelValue ? new Date(props.modelValue + 'T00:00:00') : null
)

const displayValue = computed(() => {
	if (!props.modelValue) return null
	return new Date(props.modelValue + 'T00:00:00').toLocaleDateString('en-US', {
		month: 'short', day: 'numeric', year: 'numeric',
	})
})

const calendarDays = computed(() => {
	const first = new Date(viewYear.value, viewMonth.value, 1)
	const last = new Date(viewYear.value, viewMonth.value + 1, 0)
	const days = []
	for (let i = 0; i < first.getDay(); i++) days.push(null)
	for (let d = 1; d <= last.getDate(); d++) {
		days.push(new Date(viewYear.value, viewMonth.value, d))
	}
	while (days.length % 7 !== 0) days.push(null)
	return days
})

const prevMonth = () => {
	if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
	else viewMonth.value--
}
const nextMonth = () => {
	if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
	else viewMonth.value++
}

const isToday = (date) => date && date.getTime() === todayDate.getTime()
const isSelected = (date) => date && selectedDate.value && date.getTime() === selectedDate.value.getTime()
const isDisabled = (date) => {
	if (!date) return false
	if (props.min && date < new Date(props.min + 'T00:00:00')) return true
	if (props.max && date > new Date(props.max + 'T00:00:00')) return true
	return false
}

const selectDate = (date) => {
	if (!date || isDisabled(date)) return
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	emit('update:modelValue', `${y}-${m}-${d}`)
	open.value = false
}

const openPicker = () => {
	if (selectedDate.value) {
		viewYear.value = selectedDate.value.getFullYear()
		viewMonth.value = selectedDate.value.getMonth()
	} else {
		viewYear.value = todayDate.getFullYear()
		viewMonth.value = todayDate.getMonth()
	}
	open.value = !open.value
	if (open.value) calcPosition()
}

const handleClickOutside = (e) => {
	// Close if click is outside both the trigger container and the dropdown
	const dropdown = document.getElementById('app-datepicker-dropdown')
	if (
		container.value && !container.value.contains(e.target) &&
		dropdown && !dropdown.contains(e.target)
	) {
		open.value = false
	}
}

const handleScroll = () => {
	if (open.value) calcPosition()
}

onMounted(() => {
	document.addEventListener('mousedown', handleClickOutside)
	window.addEventListener('scroll', handleScroll, true)
	window.addEventListener('resize', handleScroll)
})
onUnmounted(() => {
	document.removeEventListener('mousedown', handleClickOutside)
	window.removeEventListener('scroll', handleScroll, true)
	window.removeEventListener('resize', handleScroll)
})

const triggerPadding = computed(() =>
	props.size === 'sm' ? 'pl-9 pr-8 py-2' : 'pl-11 pr-10 py-3'
)
const triggerBg = computed(() =>
	props.size === 'sm'
		? 'border-heading/8 bg-heading/3'
		: 'border-heading/15 bg-panel'
)
</script>

<template>
	<div ref="container" class="relative">
		<!-- ── Trigger ───────────────────────────────── -->
		<button
			ref="triggerRef"
			type="button"
			@click="openPicker"
			class="w-full flex items-center rounded-sm border transition-colors focus:outline-none focus:border-accent/50 cursor-pointer text-left leading-tight"
			:class="[triggerPadding, triggerBg, open ? 'border-accent/50' : '']">

			<v-icon
				name="bi-calendar3"
				class="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
				scale="0.85" />

			<span class="flex-1 truncate text-base" :class="displayValue ? 'text-heading' : 'text-text'">
				{{ displayValue || placeholder }}
			</span>

			<button
				v-if="modelValue"
				type="button"
				@click.stop="emit('update:modelValue', '')"
				class="absolute right-3 top-1/2 -translate-y-1/2 text-text hover:text-red-500 transition-colors">
				<v-icon name="bi-x" scale="0.85" />
			</button>
		</button>

		<!-- ── Calendar Dropdown (teleported to body to avoid overflow) ── -->
		<Teleport to="body">
			<Transition
				enter-active-class="transition-transform transition-opacity duration-150 ease-out"
				enter-from-class="opacity-0 -translate-y-1"
				enter-to-class="opacity-100 translate-y-0"
				leave-active-class="transition-transform transition-opacity duration-100 ease-in"
				leave-from-class="opacity-100 translate-y-0"
				leave-to-class="opacity-0 -translate-y-1">
				<div
					v-if="open"
					id="app-datepicker-dropdown"
					:style="dropdownStyle"
					class="bg-panel border border-heading/10 rounded-sm shadow-xl shadow-heading/8 p-3 w-72">

					<!-- Month/year navigation -->
					<div class="flex items-center justify-between mb-3">
						<button type="button" @click="prevMonth"
							class="w-7 h-7 rounded-sm hover:bg-heading/8 flex items-center justify-center text-text transition-colors">
							<v-icon name="bi-chevron-left" scale="0.8" />
						</button>
						<span class="text-sm font-bold text-heading select-none">
							{{ MONTHS[viewMonth] }} {{ viewYear }}
						</span>
						<button type="button" @click="nextMonth"
							class="w-7 h-7 rounded-sm hover:bg-heading/8 flex items-center justify-center text-text transition-colors">
							<v-icon name="bi-chevron-right" scale="0.8" />
						</button>
					</div>

					<!-- Day headers -->
					<div class="grid grid-cols-7 mb-1">
						<span
							v-for="d in DAY_HEADERS" :key="d"
							class="text-center text-[11px] font-bold text-text py-1 select-none">
							{{ d }}
						</span>
					</div>

					<!-- Days grid -->
					<div class="grid grid-cols-7 gap-y-0.5">
						<div v-for="(date, i) in calendarDays" :key="i">
							<button
								v-if="date"
								type="button"
								@click="selectDate(date)"
								:disabled="isDisabled(date)"
								class="w-full aspect-square rounded-sm text-sm font-medium transition-all flex items-center justify-center select-none"
								:class="[
									isSelected(date)
										? 'bg-accent text-white font-bold shadow-sm shadow-accent/30'
										: isToday(date)
											? 'bg-accent/12 text-accent font-bold'
											: isDisabled(date)
												? 'text-text/25 cursor-not-allowed'
												: 'text-heading hover:bg-heading/8'
								]">
								{{ date.getDate() }}
							</button>
							<div v-else class="w-full aspect-square" />
						</div>
					</div>

					<!-- Footer -->
					<div class="mt-3 pt-2.5 border-t border-heading/8 flex items-center justify-between">
						<button
							type="button"
							@click="selectDate(todayDate)"
							class="text-sm font-semibold text-accent hover:text-accent/70 transition-colors">
							Today
						</button>
						<button
							v-if="modelValue"
							type="button"
							@click="emit('update:modelValue', ''); open = false"
							class="text-sm font-semibold text-text hover:text-red-500 transition-colors">
							Clear
						</button>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>