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
             class="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div class="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>

            <div class="flex flex-col gap-1.5">
                <h3 class="section-title">Your messages</h3>
                <p class="text-sm text-text max-w-[280px] leading-relaxed">
                    Select a conversation from the sidebar to start messaging.
                </p>
            </div>

            <div class="grid grid-cols-3 gap-3 w-full max-w-xs">
                <div class="card p-3 flex flex-col items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                  d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <span class="text-xs font-medium text-text">Direct</span>
                </div>
                <div class="card p-3 flex flex-col items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span class="text-xs font-medium text-text">Groups</span>
                </div>
                <div class="card p-3 flex flex-col items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-base leading-none">
                        #
                    </div>
                    <span class="text-xs font-medium text-text">Channels</span>
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
