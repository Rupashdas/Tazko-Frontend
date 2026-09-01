<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
	<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">

		<!-- Icon -->
		<div class="w-20 h-20 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
				<path d="M7 11V7a5 5 0 0 1 10 0v4" />
			</svg>
		</div>

		<h1 class="page-title mb-2">Access Denied</h1>
		<p class="text-text text-base max-w-sm mb-1">
			You don't have permission to view this page.
		</p>
		<p class="text-text text-base max-w-sm mb-8">
			Contact your administrator if you believe this is a mistake.
		</p>

		<!-- Actions -->
		<div class="flex items-center gap-3">
			<button @click="router.back()"
				class="tazko-btn-outline">
				← Go Back
			</button>
			<router-link :to="{ name: 'home' }"
				class="tazko-btn">
				Home
			</router-link>
		</div>

		<!-- Role info -->
		<p class="mt-8 text-sm text-text">
			Signed in as <span class="font-semibold">{{ auth.user?.name }}</span>
			({{auth.user?.roles?.map(r => r.label).join(', ') || 'No role'}})
		</p>

	</div>
</template>