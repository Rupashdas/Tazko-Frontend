<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
	<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">

		<!-- Icon -->
		<div class="w-20 h-20 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
		</div>

		<h1 class="page-title mb-2">Page Not Found</h1>
		<p class="text-text text-base max-w-sm mb-1">
			The page you're looking for doesn't exist or has been moved.
		</p>
		<p class="text-text text-base max-w-sm mb-8">
			Check the URL or head back to a familiar place.
		</p>

		<!-- Actions -->
		<div class="flex items-center gap-3">
			<button @click="router.back()"
				class="tazko-btn-outline">
				← Go Back
			</button>
			<router-link :to="{ name: auth.isLoggedIn ? 'home' : 'login' }"
				class="tazko-btn">
				{{ auth.isLoggedIn ? 'Home' : 'Login' }}
			</router-link>
		</div>

	</div>
</template>
