<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import ChatSidebar from './ChatSidebar.vue'
import ChatWindow from './ChatWindow.vue'

const store       = useChatStore()
// On mobile: show sidebar when mobileSidebarOpen or no conversation selected
// On desktop: sidebar is ALWAYS visible via md:block
const showOnMobile = computed(() => store.mobileSidebarOpen || !store.activeConv)
</script>

<template>
    <div class="chat-layout flex overflow-hidden bg-body">

        <!--
            Sidebar:
            - Mobile: hidden unless showOnMobile is true
            - Desktop (md+): ALWAYS shown (md:block overrides hidden)
            We never use v-show here — it would set inline display:none
            which overrides Tailwind's md:block responsive rule.
        -->
        <div class="shrink-0 overflow-hidden md:w-[272px] transition-all duration-200"
             :class="showOnMobile ? 'w-full block' : 'hidden md:block'">
            <ChatSidebar />
        </div>

        <!-- Chat window -->
        <div class="flex-1 min-w-0 overflow-hidden"
             :class="showOnMobile ? 'hidden md:flex' : 'flex'">
            <ChatWindow />
        </div>

    </div>
</template>

<style scoped>
.chat-layout {
    height: calc(100dvh - 89px);
    min-height: 480px;
}
</style>
