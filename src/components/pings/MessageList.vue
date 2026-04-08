<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import MessageItem from './MessageItem.vue'
import TypingIndicator from './TypingIndicator.vue'

const store      = useChatStore()
const listRef    = ref(null)
const loadingOld = ref(false)

const grouped = computed(() => {
    const msgs = store.activeMessages
    return msgs.map((msg, i) => {
        const prev = msgs[i - 1]
        const sameSender  = prev && prev.senderId === msg.senderId
        const sameDate    = prev && prev.date === msg.date
        // group if same sender, same date, within ~5 mins (we just check consecutive same-sender for simplicity)
        const isGrouped = !!(sameSender && sameDate && !prev.deleted)
        return { msg, isGrouped, showDateSep: !sameDate }
    })
})

function scrollToBottom(smooth = false) {
    nextTick(() => {
        const el = listRef.value
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    })
}

// Scroll to bottom when conversation changes or new message arrives
watch(() => store.activeConvId, () => scrollToBottom(), { immediate: true })
watch(() => store.activeMessages.length, (n, o) => {
    if (n > o) scrollToBottom(true)
})

onMounted(() => scrollToBottom())

async function handleLoadOlder() {
    loadingOld.value = true
    await new Promise(r => setTimeout(r, 600))
    store.loadOlderMessages()
    loadingOld.value = false
    // Keep scroll position by jumping to after the newly inserted message
    nextTick(() => {
        const el = listRef.value
        if (el) el.scrollTop = 100
    })
}
</script>

<template>
    <div ref="listRef" class="flex-1 overflow-y-auto" style="scrollbar-width: thin;">

        <!-- Load older messages -->
        <div class="flex justify-center pt-4 pb-2">
            <button @click="handleLoadOlder"
                    :disabled="loadingOld"
                    class="text-xs text-text/50 hover:text-accent px-4 py-1.5 rounded-full border border-heading/10 hover:border-accent/30 transition-all duration-150 disabled:opacity-50">
                <span v-if="loadingOld">Loading…</span>
                <span v-else>Load older messages</span>
            </button>
        </div>

        <!-- Messages -->
        <TransitionGroup name="msg-list" tag="div">
            <template v-for="({ msg, isGrouped, showDateSep }, i) in grouped" :key="msg.id">
                <!-- Date separator -->
                <div v-if="showDateSep" class="flex items-center gap-3 px-4 py-3">
                    <div class="flex-1 h-px bg-heading/8" />
                    <span class="text-[11px] font-semibold text-text/40 px-2 py-0.5 rounded-full bg-heading/5 shrink-0">
                        {{ msg.date }}
                    </span>
                    <div class="flex-1 h-px bg-heading/8" />
                </div>
                <!-- Message -->
                <MessageItem :message="msg" :isGrouped="isGrouped" :showAvatar="true" />
            </template>
        </TransitionGroup>

        <!-- Typing indicator -->
        <TypingIndicator :users="store.typingUsersInActive" />

        <!-- Bottom padding anchor -->
        <div class="h-4" />
    </div>
</template>

<style scoped>
.msg-list-enter-active { transition: all 0.2s ease; }
.msg-list-enter-from   { opacity: 0; transform: translateY(6px); }
</style>
