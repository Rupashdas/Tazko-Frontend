<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import HeaderCompontent from '@/components/HeaderCompontent.vue'
const route = useRoute()
const routeKey = computed(() => route.matched[0]?.path)
</script>

<template>
	<HeaderCompontent />
	<main class="container">
		<router-view v-slot="{ Component }">
			<transition name="slide-up" mode="out-in">
				<component :is="Component" :key="routeKey" />
			</transition>
		</router-view>
	</main>
</template>
<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.2s ease;
}

.slide-up-enter-from {
	opacity: 0;
	transform: translateY(5px);
}

.slide-up-enter-to {
	opacity: 1;
	transform: translateY(0);
}

.slide-up-leave-from {
	opacity: 1;
	transform: translateY(0);
}

.slide-up-leave-to {
	opacity: 0;
	transform: translateY(5px);
}
</style>