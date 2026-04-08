<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiSearch, BiPlus, BiPinAngle } from 'oh-vue-icons/icons'
addIcons(BiSearch, BiPlus, BiPinAngle)

import { useChatStore } from '@/stores/useChatStore'
import ChatListItem from './ChatListItem.vue'

const store = useChatStore()
</script>

<template>
    <aside class="flex flex-col h-full bg-panel border-r border-heading/8 overflow-hidden">
        <!-- Header -->
        <div class="px-4 pt-5 pb-3 border-b border-heading/6 shrink-0">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-base font-bold text-heading">Messages</h2>
                <button class="w-8 h-8 rounded-lg flex items-center justify-center text-text hover:bg-accent/10 hover:text-accent transition-colors" title="New message">
                    <v-icon name="bi-plus" scale="1.1" />
                </button>
            </div>
            <!-- Search -->
            <div class="relative">
                <v-icon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" scale="0.85" />
                <input
                    v-model="store.searchQuery"
                    type="text"
                    placeholder="Search conversations…"
                    class="w-full pl-8 pr-3 py-2 rounded-lg text-sm bg-heading/5 border border-heading/8 text-heading placeholder:text-text/40 focus:outline-none focus:border-accent/40 focus:bg-white transition-colors"
                />
            </div>
        </div>

        <!-- Conversation List -->
        <div class="flex-1 overflow-y-auto py-2 px-2 space-y-4" style="scrollbar-width: thin;">

            <!-- Pinned -->
            <template v-if="store.filteredConversations.filter(c => c.pinned).length">
                <div>
                    <p class="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-text/40 flex items-center gap-1">
                        <v-icon name="bi-pin-angle" scale="0.75" /> Pinned
                    </p>
                    <ChatListItem
                        v-for="conv in store.filteredConversations.filter(c => c.pinned)"
                        :key="conv.id"
                        :conversation="conv"
                    />
                </div>
            </template>

            <!-- Direct Messages -->
            <div v-if="store.directMessages.filter(c => !c.pinned).length">
                <p class="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-text/40">Direct Messages</p>
                <ChatListItem
                    v-for="conv in store.directMessages.filter(c => !c.pinned)"
                    :key="conv.id"
                    :conversation="conv"
                />
            </div>

            <!-- Groups -->
            <div v-if="store.groupChats.filter(c => !c.pinned).length">
                <p class="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-text/40">Groups</p>
                <ChatListItem
                    v-for="conv in store.groupChats.filter(c => !c.pinned)"
                    :key="conv.id"
                    :conversation="conv"
                />
            </div>

            <!-- Channels -->
            <div v-if="store.channels.length">
                <p class="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-text/40">Channels</p>
                <ChatListItem
                    v-for="conv in store.channels"
                    :key="conv.id"
                    :conversation="conv"
                />
            </div>

            <!-- Empty -->
            <div v-if="!store.filteredConversations.length" class="flex flex-col items-center gap-2 py-10 text-center px-4">
                <span class="text-3xl">💬</span>
                <p class="text-sm text-text/50">No conversations found</p>
            </div>
        </div>

        <!-- Current user footer -->
        <div class="px-4 py-3 border-t border-heading/6 shrink-0 flex items-center gap-3">
            <div class="relative shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                     :style="`background: ${store.currentUser?.color ?? '#6c63ff'}`">
                    {{ store.currentUser?.initials }}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-panel"
                      style="background: #22c55e;" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-heading truncate">{{ store.currentUser?.name }}</p>
                <p class="text-[10px] text-green-500 font-medium">Active now</p>
            </div>
        </div>
    </aside>
</template>
