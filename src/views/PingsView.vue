<script setup>
import { onUnmounted } from 'vue'
import ChatLayout from '@/components/pings/ChatLayout.vue'
import { useChatStore } from '@/stores/useChatStore'

const chatStore = useChatStore()

// Without cleanup the simulated-reply / call setTimeouts fire after the
// user navigates away and mutate chat state for a conversation no one
// is looking at — causing stale unread badges and sometimes a wrongly-
// active call indicator on return.
onUnmounted(() => {
    chatStore.cleanup()
})
</script>

<template>
    <div class="-mx-5">
        <ChatLayout />
    </div>
</template>
