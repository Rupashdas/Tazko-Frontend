<script setup>
import { ref } from 'vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderComponent from '@/components/HeaderComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'

const route = useRoute()
const routeKey = computed(() => route.matched[0]?.path)
const mobileSidebarOpen = ref(false)

const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
}
</script>

<template>
    <div class="min-h-screen bg-body">
        <!-- Sidebar -->
        <SidebarComponent :mobile-open="mobileSidebarOpen" @close="closeMobileSidebar" />

        <!-- Mobile sidebar backdrop -->
        <Transition name="fade">
            <div
                v-if="mobileSidebarOpen"
                class="fixed inset-0 z-30 bg-heading/20 backdrop-blur-sm lg:hidden"
                @click="closeMobileSidebar"
            ></div>
        </Transition>

        <!-- Main Area -->
        <div class="lg:pl-60 transition-all duration-300">
            <HeaderComponent @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" :sidebar-open="mobileSidebarOpen" />

            <main class="container py-8 min-h-[calc(100vh-4rem)]">
                <router-view v-slot="{ Component }">
                    <transition name="slide-up" mode="out-in">
                        <component :is="Component" :key="routeKey" />
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.2s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(6px);
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
    transform: translateY(6px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
