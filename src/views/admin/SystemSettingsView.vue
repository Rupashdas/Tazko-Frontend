<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { addIcons } from "oh-vue-icons"
import { FaUsers, FaUserCog, FaCogs, IoEnterSharp } from "oh-vue-icons/icons"

addIcons(FaUsers, FaUserCog, FaCogs, IoEnterSharp)

const route = useRoute()

const navItems = [
	{
		name: 'system-settings-roles',
		icon: 'fa-user-cog',
		label: 'Manage Roles',
		desc: 'Role permissions',
		available: true,
	},
	{
		name: 'system-settings-users',
		icon: 'fa-users',
		label: 'Manage Users',
		desc: 'User accounts',
		available: true,
	},
	{
		name: null,
		icon: 'io-enter-sharp',
		label: 'Permissions',
		desc: 'Access rules',
		available: false,
	},
	{
		name: null,
		icon: 'fa-cogs',
		label: 'Configurations',
		desc: 'System config',
		available: false,
	},
]

const isActive = (name) => name && route.matched.some(r => r.name === name)
</script>

<template>
	<div class="py-8">

		<!-- Page Header -->
		<div class="mb-8">
			<p class="page-eyebrow">Admin</p>
			<h1 class="page-title">System Settings</h1>
			<p class="page-subtitle">Configure your workspace</p>
		</div>

		<!-- Mobile Tab Nav (unchanged) -->
		<div class="flex md:hidden gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
			<component v-for="item in navItems" :key="item.label" :is="item.available && item.name ? RouterLink : 'div'"
				:to="item.available && item.name ? { name: item.name } : undefined"
				class="flex items-center gap-2 px-4 py-2.5 rounded-sm transition-all whitespace-nowrap shrink-0 text-base font-semibold border"
				:class="[
					isActive(item.name)
						? 'bg-accent text-white border-accent shadow-sm'
						: item.available
							? 'bg-panel text-text border-heading/10 hover:border-accent/30 hover:text-heading cursor-pointer'
							: 'bg-panel/50 text-text border-heading/6 cursor-not-allowed'
				]">
				<v-icon :name="item.icon" scale="0.85" />
				{{ item.label }}
				<span v-if="!item.available"
					class="text-sm font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-heading/8 text-text ml-1">
					Soon
				</span>
			</component>
		</div>

		<!-- ✅ Single layout: sidebar (desktop only) + ONE RouterView -->
		<div class="flex gap-6 min-h-[600px]">

			<!-- SIDEBAR: hidden on mobile, visible on desktop -->
			<aside
				class="hidden md:flex w-64 shrink-0 bg-panel border border-heading/8 rounded-sm shadow-sm overflow-hidden self-start sticky top-24">
				<div class="w-full">
					<div class="px-5 pt-5 pb-4 border-b border-heading/8">
						<p class="text-base font-semibold text-text mb-1.5">Admin</p>
						<h2 class="section-title">System Settings</h2>
						<p class="section-desc mt-0.5">Configure your workspace</p>
					</div>
					<nav class="p-3 space-y-1">
						<component v-for="item in navItems" :key="item.label"
							:is="item.available && item.name ? RouterLink : 'div'"
							:to="item.available && item.name ? { name: item.name } : undefined"
							class="flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150  group"
							:class="[
								isActive(item.name) ? 'bg-accent/10 text-accent' : item.available ? 'cursor-pointer text-text hover:bg-heading/6 hover:text-heading' : 'text-text cursor-not-allowed'
							]">
							<div class="w-8 h-8 rounded-sm flex items-center justify-center shrink-0 transition-all"
								:class="isActive(item.name) ? 'bg-accent/15' : 'bg-heading/5 group-hover:bg-heading/8'">
								<v-icon :name="item.icon" scale="0.9" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-base font-semibold truncate">{{ item.label }}</p>
								<p class="section-desc mt-0.5 truncate" :class="!item.available ? 'opacity-30' : ''">{{
									item.desc }}</p>
							</div>
							<span v-if="!item.available"
								class="text-sm font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-heading/8 text-text shrink-0">
								Soon
							</span>
						</component>
					</nav>
				</div>
			</aside>

			<!-- ✅ একটাই RouterView — mobile এ full width, desktop এ flex-1 -->
			<div class="flex-1 min-w-0">
				<RouterView />
			</div>

		</div>
	</div>
</template>