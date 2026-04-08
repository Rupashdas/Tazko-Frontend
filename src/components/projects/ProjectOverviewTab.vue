<script setup>
import { computed } from 'vue'
import { addIcons } from 'oh-vue-icons'
import {
	BiListTask, BiLightningCharge, BiExclamationCircle, BiCheckCircle,
	BiCheck2, BiCalendar3, BiPeople, BiActivity, BiPersonPlus,
} from 'oh-vue-icons/icons'

addIcons(
	BiListTask, BiLightningCharge, BiExclamationCircle, BiCheckCircle,
	BiCheck2, BiCalendar3, BiPeople, BiActivity, BiPersonPlus,
)

const props = defineProps({
	project: { type: Object, required: true },
	tasks: { type: Array, required: true },
	activity: { type: Array, default: () => [] },
})

const emit = defineEmits(['add-member-click'])

const columnStatuses = ['Todo', 'In Progress', 'Review', 'Done']

const columnConfig = {
	'Todo': { dotClass: 'bg-slate-400' },
	'In Progress': { dotClass: 'bg-accent' },
	'Review': { dotClass: 'bg-violet-500' },
	'Done': { dotClass: 'bg-emerald-500' },
}

const totalTasks = computed(() => props.tasks.length)
const doneCount = computed(() => props.tasks.filter(t => t.status === 'Done').length)
const inProgressCount = computed(() => props.tasks.filter(t => t.status === 'In Progress').length)
const reviewCount = computed(() => props.tasks.filter(t => t.status === 'Review').length)

const columnCounts = computed(() =>
	Object.fromEntries(columnStatuses.map(s => [s, props.tasks.filter(t => t.status === s).length]))
)

const daysLeft = computed(() => Math.ceil((new Date(props.project.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
const todayPercent = computed(() => {
	const start = new Date(props.project.startDate), end = new Date(props.project.endDate)
	return Math.min(100, Math.max(0, Math.round(((new Date() - start) / (end - start)) * 100)))
})
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
</script>

<template>
	<div class="p-5">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

			<!-- ── Left col (2/3 width) ── -->
			<div class="lg:col-span-2 space-y-4">

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div v-for="stat in [
						{ label: 'Total Tasks', value: totalTasks, icon: 'bi-list-task', cls: 'text-heading', bg: 'bg-heading/5' },
						{ label: 'In Progress', value: inProgressCount, icon: 'bi-lightning-charge', cls: 'text-accent', bg: 'bg-accent/10' },
						{ label: 'In Review', value: reviewCount, icon: 'bi-exclamation-circle', cls: 'text-violet-500', bg: 'bg-violet-500/10' },
						{ label: 'Completed', value: doneCount, icon: 'bi-check-circle', cls: 'text-emerald-500', bg: 'bg-emerald-500/10' },
					]" :key="stat.label" class="bg-panel rounded-sm border border-heading/5 px-4 py-3 flex items-center gap-3">
						<div
							:class="[stat.bg, 'w-12 h-12 rounded-sm flex items-center justify-center shrink-0']">
							<v-icon :name="stat.icon" :class="stat.cls" scale="1.4" />
						</div>
						<div>
							<p :class="[stat.cls, 'text-xl font-bold leading-none tabular-nums']">{{ stat.value
							}}</p>
							<p class="text-sm text-text mt-0.5">{{ stat.label }}</p>
						</div>
					</div>
				</div>

				<!-- Progress card -->
				<div class="bg-panel rounded-sm border border-heading/8 shadow-sm p-5">
					<p class="text-sm font-bold uppercase text-text mb-4 flex items-center gap-1.5">
						<v-icon name="bi-lightning-charge" scale="0.75" class="text-accent" />
						Overall Progress
					</p>
					<div class="flex items-center justify-between mb-2">
						<span class="text-base text-text">{{ doneCount }} of {{ totalTasks }} tasks
							done</span>
						<span class="text-base font-bold text-accent tabular-nums">{{ project.progress
						}}%</span>
					</div>
					<div class="h-2.5 bg-heading/8 rounded-full overflow-hidden mb-4">
						<div class="h-full bg-accent rounded-full transition-all duration-700"
							:style="`width:${project.progress}%`" />
					</div>
					<div class="grid grid-cols-4 gap-3">
						<div v-for="st in columnStatuses" :key="st" class="text-center">
							<p class="text-base font-bold text-heading tabular-nums leading-none">{{
								columnCounts[st] ?? 0 }}</p>
							<div
								:class="[columnConfig[st]?.dotClass, 'w-full h-1 rounded-full mt-1.5 opacity-50']" />
							<p class="text-sm text-text mt-1.5">{{ st }}</p>
						</div>
					</div>
				</div>

				<!-- Goal card -->
				<div class="bg-panel rounded-sm border border-heading/8 shadow-sm p-5">
					<p class="text-sm font-bold uppercase text-text mb-3 flex items-center gap-1.5">
						<v-icon name="bi-check2" scale="0.75" class="text-accent" />
						Project Goal
					</p>
					<p class="text-base text-text leading-relaxed">{{ project.goal }}</p>
				</div>

				<!-- Timeline card -->
				<div class="bg-panel rounded-sm border border-heading/8 shadow-sm p-5">
					<p class="text-sm font-bold uppercase text-text mb-4 flex items-center gap-1.5">
						<v-icon name="bi-calendar3" scale="0.75" class="text-violet-500" />
						Timeline
					</p>
					<div class="flex items-center justify-between text-sm text-text mb-2">
						<span>{{ formatDate(project.startDate) }}</span>
						<span>{{ formatDate(project.endDate) }}</span>
					</div>
					<div class="relative h-2.5 bg-heading/8 rounded-full overflow-visible mb-3">
						<div class="absolute inset-y-0 left-0 bg-accent rounded-full"
							:style="`width: ${todayPercent}%`" />
						<div class="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-md shadow-accent/30"
							:style="`left: calc(${todayPercent}% - 7px)`" />
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-text">{{ todayPercent }}% elapsed</span>
						<span class="text-sm"
							:class="daysLeft <= 14 ? 'text-amber-500 font-semibold' : 'text-text'">
							{{ daysLeft > 0 ? `${daysLeft} days remaining` : 'Past deadline' }}
						</span>
					</div>
				</div>

			</div>

			<!-- ── Right col (1/3 width) ── -->
			<div class="space-y-4">

				<!-- Team card -->
				<div class="bg-panel rounded-sm border border-heading/8 shadow-sm p-4">
					<div class="flex items-center justify-between mb-3">
						<p class="text-sm font-bold uppercase text-text flex items-center gap-1.5">
							<v-icon name="bi-people" scale="0.75" class="text-emerald-500" />
							Team ({{ project.members.length }})
						</p>
						<button @click="emit('add-member-click')"
							class="text-text hover:text-accent transition-colors"
							title="Add member">
							<v-icon name="bi-person-plus" scale="0.85" />
						</button>
					</div>
					<div class="space-y-2">
						<div v-for="m in project.members" :key="m.initials"
							class="flex items-center gap-2.5 cursor-pointer group">
							<div
								:class="[m.color, 'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm']">
								{{ m.initials }}
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-semibold text-heading truncate">{{ m.name }}</p>
								<p class="text-sm text-text truncate">{{ m.role }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Activity card -->
				<div class="bg-panel rounded-sm border border-heading/8 shadow-sm p-4">
					<p class="text-sm font-bold uppercase text-text mb-3 flex items-center gap-1.5">
						<v-icon name="bi-activity" scale="0.75" class="text-accent" />
						Recent Activity
					</p>
					<div class="space-y-3">
						<div v-for="(item, i) in activity" :key="i" class="flex items-start gap-2.5">
							<div
								:class="[item.color, 'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5']">
								{{ item.initials }}
							</div>
							<div class="min-w-0">
								<p class="text-sm text-text leading-relaxed">{{ item.text }}</p>
								<p class="text-sm text-text mt-0.5">{{ item.time }}</p>
							</div>
						</div>
					</div>
				</div>

			</div>

		</div>
	</div>
</template>
