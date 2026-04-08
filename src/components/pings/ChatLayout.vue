<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import ChatSidebar from './ChatSidebar.vue'
import ChatWindow from './ChatWindow.vue'

const store      = useChatStore()
const showSidebar = computed(() => store.mobileSidebarOpen || !store.activeConv)
const showChat    = computed(() => !store.mobileSidebarOpen || !!store.activeConv)
</script>

<template>
    <div class="flex overflow-hidden bg-body" style="height: calc(100dvh - 65px); min-height: 480px;">

        <!-- Sidebar: full-width on mobile when open, 280px on desktop -->
        <div class="shrink-0 transition-all duration-200 overflow-hidden"
             :class="[
                 'md:block md:w-[280px]',
                 showSidebar ? 'w-full' : 'w-0'
             ]">
            <ChatSidebar />
        </div>

        <!-- Chat window: hidden on mobile when sidebar is open -->
        <div class="flex-1 min-w-0 overflow-hidden"
             :class="showSidebar ? 'hidden md:flex' : 'flex'">
            <ChatWindow />
        </div>
    </div>
</template>
