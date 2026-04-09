<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import CallModal from './CallModal.vue'

const store   = useChatStore()
const hasConv = computed(() => !!store.activeConv)
</script>

<template>
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden relative bg-body">

        <!-- Empty state -->
        <div v-if="!hasConv"
             class="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
            <div class="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center
                        shadow-[0_0_0_6px_rgba(108,99,255,0.06)] mb-1">
                <svg class="w-10 h-10 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <div>
                <h3 class="text-[18px] font-bold text-heading mb-1">Your messages</h3>
                <p class="text-[14px] text-text/55 max-w-[260px] leading-relaxed">
                    Select a conversation from the sidebar to start messaging.
                </p>
            </div>
            <div class="flex items-center gap-6 mt-2">
                <div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">💬</div>
                    <span class="text-[11px] text-text/45 font-medium">Direct</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-lg">👥</div>
                    <span class="text-[11px] text-text/45 font-medium">Groups</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-extrabold text-blue-400 text-base">#</div>
                    <span class="text-[11px] text-text/45 font-medium">Channels</span>
                </div>
            </div>
        </div>

        <!-- Active conversation -->
        <template v-else>
            <ChatHeader />
            <MessageList />
            <MessageInput />
        </template>

        <!-- Call modal -->
        <CallModal />
    </div>
</template>
