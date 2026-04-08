<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import ThreadPanel from './ThreadPanel.vue'
import CallModal from './CallModal.vue'

const store    = useChatStore()
const hasConv  = computed(() => !!store.activeConv)
</script>

<template>
    <div class="flex flex-1 min-w-0 overflow-hidden">
        <!-- Main chat area -->
        <div class="flex flex-col flex-1 min-w-0 overflow-hidden relative">

            <!-- Empty state: no conversation selected -->
            <div v-if="!hasConv" class="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div class="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-2">
                    <svg class="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-heading">Your messages</h3>
                    <p class="text-sm text-text/60 mt-1 max-w-xs">Send private messages to your teammates or jump into a channel conversation.</p>
                </div>
            </div>

            <!-- Active conversation -->
            <template v-else>
                <ChatHeader />
                <MessageList />
                <MessageInput />
            </template>
        </div>

        <!-- Thread panel -->
        <ThreadPanel />

        <!-- Call modal -->
        <CallModal />
    </div>
</template>
