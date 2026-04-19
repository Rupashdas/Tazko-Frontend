<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiChevronDown, BiCheck2, BiX } from 'oh-vue-icons/icons'

addIcons(BiChevronDown, BiCheck2, BiX)

const props = defineProps({
	modelValue: { default: null },
	options: { type: Array, default: () => [] },
	optionLabel: { type: String, default: 'label' },
	optionValue: { type: String, default: 'value' },
	placeholder: { type: String, default: 'Select…' },
	multiple: { type: Boolean, default: false },
	searchable: { type: Boolean, default: false },
	size: { type: String, default: 'md' }, // 'sm' | 'md'
	highlight: { type: Boolean, default: false },
	inactiveValue: { default: null },
	disabled: { type: Boolean, default: false },
	disabledValues: { type: Array, default: () => [] },
	// When true, the trigger always shows the placeholder (not chips).
	// Useful when the parent renders the selected items separately.
	hideValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const container = ref(null)
const searchInput = ref(null)

const normalized = computed(() =>
	props.options.map(opt =>
		typeof opt === 'string'
			? { label: opt, value: opt }
			: {
				label: opt[props.optionLabel],
				value: opt[props.optionValue],
				color: opt.color,
				initials: opt.initials,
				avatar: opt.avatar ?? null,
				group: opt.group ?? null,
				isNonMember: opt.isNonMember ?? false,
			}
	)
)

const filtered = computed(() => {
	if (!search.value) return normalized.value
	return normalized.value.filter(o =>
		o.label.toLowerCase().includes(search.value.toLowerCase())
	)
})

// Flat list for rendering: group headers are separate entries with their own
// stable unique keys. This guarantees each keyed slot maps to exactly ONE <li>,
// preventing Vue's VDOM patcher from losing DOM nodes when options update
// concurrently (e.g. mid-Transition after a remote search response).
const displayList = computed(() => {
	const list = []
	filtered.value.forEach((opt, idx) => {
		if (opt.group && (idx === 0 || filtered.value[idx - 1].group !== opt.group)) {
			list.push({ _type: 'group', _key: `g__${opt.group}`, label: opt.group })
		}
		list.push({ _type: 'option', _key: `o__${String(opt.value)}`, ...opt })
	})
	return list
})

const selectedArr = computed(() =>
	props.multiple ? (Array.isArray(props.modelValue) ? props.modelValue : []) : []
)

const isSelected = (value) =>
	props.multiple ? selectedArr.value.includes(value) : props.modelValue === value

const displayLabel = computed(() => {
	if (props.multiple) return null
	const v = props.modelValue
	if (v === null || v === undefined || v === '') return null
	if (props.inactiveValue !== null && v === props.inactiveValue) return null
	return normalized.value.find(o => o.value === v)?.label ?? String(v)
})

const selectedAvatars = computed(() =>
	props.multiple
		? selectedArr.value.map(v => normalized.value.find(o => o.value === v)).filter(Boolean)
		: []
)

const isActive = computed(() => {
	if (!props.highlight) return false
	if (props.multiple) return selectedArr.value.length > 0
	return (
		props.modelValue !== null &&
		props.modelValue !== undefined &&
		props.modelValue !== '' &&
		props.modelValue !== props.inactiveValue
	)
})

const toggle = (value) => {
	if (props.disabledValues.includes(value)) return
	if (props.multiple) {
		const cur = [...selectedArr.value]
		const idx = cur.indexOf(value)
		idx === -1 ? cur.push(value) : cur.splice(idx, 1)
		emit('update:modelValue', cur)
	} else {
		emit('update:modelValue', value)
		open.value = false
		search.value = ''
	}
}

const openDropdown = () => {
	if (props.disabled) return
	open.value = !open.value
	if (open.value && props.searchable) {
		setTimeout(() => searchInput.value?.focus(), 50)
	}
}

const handleClickOutside = (e) => {
	if (container.value && !container.value.contains(e.target)) {
		open.value = false
		search.value = ''
	}
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const triggerPadding = computed(() =>
	props.size === 'sm' ? 'pl-3 pr-8 py-2' : 'px-4 py-3'
)

const triggerBg = computed(() => {
	if (isActive.value) return 'border-accent bg-accent/8'
	return props.size === 'sm' ? 'border-heading/15 bg-heading/3' : 'border-heading/15 bg-panel'
})

const textCls = computed(() =>
	isActive.value ? 'text-accent font-semibold' : 'text-heading'
)
</script>

<template>
	<div ref="container" class="relative">
		<!-- ── Trigger ───────────────────────────────── -->
		<button
			type="button"
			@click="openDropdown"
			:disabled="disabled"
			class="w-full flex items-center gap-2 rounded-sm border transition-colors focus:outline-none focus:border-accent text-left leading-tight min-w-0"
			:class="[triggerPadding, triggerBg, open ? 'border-accent' : '', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']">

			<!-- Multi: chips (hidden when hideValue is true) -->
			<template v-if="multiple && selectedAvatars.length && !hideValue">
				<div class="flex flex-wrap gap-1 flex-1 min-w-0 py-0.5">
					<span
						v-for="opt in selectedAvatars" :key="opt.value"
						class="inline-flex items-center gap-1 pl-1 pr-2 py-1 rounded-sm bg-accent/10 text-accent text-sm font-semibold leading-none">
						<span
							:class="[opt.color ?? 'bg-accent', 'w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 overflow-hidden']">
							<img v-if="opt.avatar" :src="opt.avatar" class="w-full h-full object-cover" :alt="opt.label" />
							<span v-else>{{ opt.initials }}</span>
						</span>
						{{ opt.label }}
					</span>
				</div>
			</template>

			<!-- Single, empty, or hideValue -->
			<template v-else>
				<span class="flex-1 truncate text-base" :class="displayLabel && !hideValue ? textCls : 'text-text'">
					{{ (!hideValue && displayLabel) || placeholder }}
				</span>
			</template>

			<v-icon
				name="bi-chevron-down"
				class="shrink-0 text-text transition-transform duration-200 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
				:class="open ? 'rotate-180' : ''"
				scale="0.75" />
		</button>

		<!-- ── Dropdown ──────────────────────────────── -->
		<Transition
			enter-active-class="transition-all duration-150 ease-out"
			enter-from-class="opacity-0 -translate-y-1"
			enter-to-class="opacity-100 translate-y-0"
			leave-active-class="transition-all duration-100 ease-in"
			leave-from-class="opacity-100 translate-y-0"
			leave-to-class="opacity-0 -translate-y-1">
			<div
				v-if="open"
				class="absolute z-50 top-full mt-1 w-full min-w-max bg-panel border border-heading/10 rounded-sm shadow-xl shadow-heading/8 overflow-hidden">

				<!-- Search -->
				<div v-if="searchable" class="p-2 border-b border-heading/8">
					<input
						ref="searchInput"
						v-model="search"
						type="text"
						placeholder="Search…"
						class="w-full px-3 py-1.5 rounded-sm border border-heading/8 bg-heading/3 text-sm text-heading placeholder:text-text focus:outline-none focus:border-accent/40 transition-colors" />
				</div>

				<!-- Options (no v-scrollbar — OverlayScrollbars rewraps children inside
				     .os-viewport>.os-content, breaking Vue's insertBefore anchors) -->
				<ul class="max-h-56 overflow-y-auto">
					<li v-if="!displayList.length">
						<span class="block px-3 py-2 text-sm text-text">No options</span>
					</li>
					<li
						v-for="item in displayList"
						:key="item._key">

						<!-- Group header: rendered as a styled div inside the <li> -->
						<div
							v-if="item._type === 'group'"
							class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text select-none border-t border-heading/8">
							{{ item.label }}
						</div>

						<!-- Option -->
						<button
							v-else
							type="button"
							@click="toggle(item.value)"
							class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
							:class="[
								disabledValues.includes(item.value)
									? 'opacity-50 cursor-default'
									: isSelected(item.value) ? 'text-accent bg-accent/5 hover:bg-accent/5' : 'text-heading hover:bg-heading/5'
							]">

							<!-- Avatar / initials -->
							<span
								v-if="item.color || item.initials || item.avatar"
								:class="[item.color ?? 'bg-accent', 'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 overflow-hidden']">
								<img v-if="item.avatar" :src="item.avatar" class="w-full h-full object-cover" :alt="item.label" />
								<span v-else>{{ item.initials }}</span>
							</span>

							<span class="flex-1 font-medium">{{ item.label }}</span>

							<!-- Non-member badge -->
							<span
								v-if="item.isNonMember && !isSelected(item.value)"
								class="text-[10px] font-bold text-accent/70 bg-accent/10 px-1.5 py-0.5 rounded-full leading-none">
								+
							</span>

							<v-icon v-if="isSelected(item.value) || disabledValues.includes(item.value)" name="bi-check2" class="shrink-0" :class="disabledValues.includes(item.value) ? 'text-text' : 'text-accent'" scale="0.85" />
						</button>
					</li>
				</ul>

				<!-- Multi: clear footer -->
				<div v-if="multiple && selectedArr.length" class="px-3 py-2 border-t border-heading/8">
					<button
						type="button"
						@click="emit('update:modelValue', [])"
						class="text-sm text-text hover:text-red-500 transition-colors font-semibold flex items-center gap-1">
						<v-icon name="bi-x" scale="0.8" />
						Clear all
					</button>
				</div>
			</div>
		</Transition>
	</div>
</template>
