<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import MessageItem from './MessageItem.vue'
import TypingIndicator from './TypingIndicator.vue'

const store      = useChatStore()
const listRef    = ref(null)
const loadingOld = ref(false)
const atBottom   = ref(true)

// Filter messages by in-conversation search
const visibleMessages = computed(() => {
    const msgs = store.activeMessages.filter(m => !m.deleted || true)
    const q    = store.convSearchQuery?.trim().toLowerCase()
    if (!q) return msgs
    return msgs.filter(m =>
        m.type === 'text' && m.content?.toLowerCase().includes(q)
    )
})

const grouped = computed(() => {
    const msgs = visibleMessages.value
    return msgs.map((msg, i) => {
        const prev       = msgs[i - 1]
        const sameSender = prev && prev.senderId === msg.senderId && !prev.deleted
        const sameDate   = prev && prev.date === msg.date
        const isGrouped  = !!(sameSender && sameDate)
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

function onScroll() {
    const el = listRef.value
    if (!el) return
    atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

watch(() => store.activeConvId, () => scrollToBottom(), { immediate: true })
watch(() => store.activeMessages.length, (n, o) => {
    if (n > o && atBottom.value) scrollToBottom(true)
})
onMounted(() => scrollToBottom())

async function handleLoadOlder() {
    loadingOld.value = true
    await new Promise(r => setTimeout(r, 600))
    store.loadOlderMessages()
    loadingOld.value = false
    nextTick(() => { if (listRef.value) listRef.value.scrollTop = 100 })
}
</script>

<template>
    <div ref="listRef"
         v-scrollbar class="flex-1 overflow-y-auto"
         @scroll="onScroll">

        <!-- Search active: no load-older button shown -->
        <div v-if="!store.convSearchQuery" class="flex justify-center pt-5 pb-2">
            <button @click="handleLoadOlder"
                    :disabled="loadingOld"
                    class="text-[11px] font-semibold text-text/45 hover:text-accent px-4 py-1.5 rounded-full
                           border border-heading/10 hover:border-accent/25 hover:bg-accent/4
                           transition-all duration-150 disabled:opacity-40 active:scale-95">
                <span v-if="loadingOld" class="flex items-center gap-1.5">
                    <span class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading…
                </span>
                <span v-else>↑ Load older messages</span>
            </button>
        </div>

        <!-- Search result header -->
        <div v-if="store.convSearchQuery"
             class="mx-4 my-3 px-3 py-2 rounded-xl bg-accent/6 border border-accent/15 text-[12px] font-semibold text-accent">
            Showing {{ grouped.length }} result{{ grouped.length !== 1 ? 's' : '' }} for
            "<span class="font-bold">{{ store.convSearchQuery }}</span>"
        </div>

        <!-- Empty search -->
        <div v-if="store.convSearchQuery && !grouped.length"
             class="flex flex-col items-center gap-2 py-12 text-center">
            <span class="text-3xl opacity-30">🔍</span>
            <p class="text-[13px] text-text/45 font-medium">No messages found</p>
        </div>

        <!-- Messages -->
        <TransitionGroup name="msg" tag="div">
            <template v-for="({ msg, isGrouped, showDateSep }) in grouped" :key="msg.id">
                <!-- Date separator -->
                <div v-if="showDateSep" class="flex items-center gap-3 px-5 py-3">
                    <div class="flex-1 h-px bg-heading/8" />
                    <span class="text-[11px] font-semibold text-text/40 px-3 py-1 rounded-full bg-heading/5 whitespace-nowrap">
                        {{ msg.date }}
                    </span>
                    <div class="flex-1 h-px bg-heading/8" />
                </div>

                <MessageItem :message="msg" :isGrouped="isGrouped" />
            </template>
        </TransitionGroup>

        <!-- Typing indicator -->
        <TypingIndicator :users="store.typingUsersInActive" />

        <div class="h-4" />
    </div>
</template>

<style scoped>
.msg-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1); }
.msg-enter-from   { opacity: 0; transform: translateY(8px); }
</style>
