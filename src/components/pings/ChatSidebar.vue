<script setup>
import { ref } from 'vue'
import { addIcons } from 'oh-vue-icons'
import { BiSearch, BiPlus, BiPinAngle, BiChevronDown } from 'oh-vue-icons/icons'
addIcons(BiSearch, BiPlus, BiPinAngle, BiChevronDown)

import { useChatStore } from '@/stores/useChatStore'
import ChatListItem from './ChatListItem.vue'

const store     = useChatStore()
const collapsed = ref(new Set())

function toggle(key) {
    const s = new Set(collapsed.value)
    s.has(key) ? s.delete(key) : s.add(key)
    collapsed.value = s
}
function is(key) { return collapsed.value.has(key) }
</script>

<template>
    <aside class="flex flex-col h-full bg-panel border-r border-heading/8 overflow-hidden">

        <!-- ── Header ────────────────────────────────────────── -->
        <div class="px-4 pt-4 pb-3 shrink-0 border-b border-heading/8">
            <div class="flex items-center justify-between gap-3 mb-3">
                <span class="text-xs font-semibold uppercase tracking-widest text-text/70">Messages</span>
                <button
                    class="w-8 h-8 rounded-md flex items-center justify-center text-text hover:bg-accent/10 hover:text-accent transition-all duration-150 active:scale-95"
                    title="New conversation">
                    <v-icon name="bi-plus" scale="1.05" />
                </button>
            </div>

            <!-- Search -->
            <div class="relative">
                <v-icon name="bi-search"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 pointer-events-none"
                        scale="0.8" />
                <input
                    :value="store.searchQuery"
                    @input="store.setSearchQuery($event.target.value)"
                    type="text"
                    placeholder="Search conversations…"
                    class="tazko-search pl-9 pr-3 py-2"
                />
            </div>
        </div>

        <!-- ── Conversation List ─────────────────────────────── -->
        <div v-scrollbar class="flex-1 overflow-y-auto"><div class="py-3">

            <!-- Pinned -->
            <template v-if="store.filteredConversations.filter(c => c.pinned).length">
                <div class="mb-3">
                    <button
                        class="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text/70 hover:text-heading transition-colors cursor-pointer"
                        @click="toggle('pinned')">
                        <v-icon name="bi-pin-angle" scale="0.7" />
                        Pinned
                        <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                                :class="is('pinned') ? '-rotate-90' : ''" scale="0.65" />
                    </button>
                    <div v-if="!is('pinned')" class="px-2 mt-1 flex flex-col gap-0.5">
                        <ChatListItem
                            v-for="conv in store.filteredConversations.filter(c => c.pinned)"
                            :key="conv.id" :conversation="conv" />
                    </div>
                </div>
            </template>

            <!-- Direct Messages -->
            <div v-if="store.directMessages.filter(c => !c.pinned).length" class="mb-3">
                <button
                    class="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text/70 hover:text-heading transition-colors cursor-pointer"
                    @click="toggle('dms')">
                    Direct Messages
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('dms') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('dms')" class="px-2 mt-1 flex flex-col gap-0.5">
                    <ChatListItem
                        v-for="conv in store.directMessages.filter(c => !c.pinned)"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Groups -->
            <div v-if="store.groupChats.filter(c => !c.pinned).length" class="mb-3">
                <button
                    class="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text/70 hover:text-heading transition-colors cursor-pointer"
                    @click="toggle('groups')">
                    Groups
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('groups') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('groups')" class="px-2 mt-1 flex flex-col gap-0.5">
                    <ChatListItem
                        v-for="conv in store.groupChats.filter(c => !c.pinned)"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Channels -->
            <div v-if="store.channels.length" class="mb-3">
                <button
                    class="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text/70 hover:text-heading transition-colors cursor-pointer"
                    @click="toggle('channels')">
                    Channels
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('channels') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('channels')" class="px-2 mt-1 flex flex-col gap-0.5">
                    <ChatListItem
                        v-for="conv in store.channels"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Empty -->
            <div v-if="!store.filteredConversations.length"
                 class="flex flex-col items-center gap-3 py-12 text-center px-4">
                <div class="w-12 h-12 rounded-xl bg-heading/5 flex items-center justify-center">
                    <v-icon name="bi-search" class="text-text" scale="1.2" />
                </div>
                <p class="text-sm font-medium text-text">No conversations found</p>
            </div>
        </div></div>

        <!-- ── Footer ─────────────────────────────────────────── -->
        <div class="px-4 py-3 border-t border-heading/8 shrink-0 flex items-center gap-3">
            <div class="relative shrink-0">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                     :style="`background: ${store.currentUser?.color ?? '#6c63ff'}`">
                    {{ store.currentUser?.initials }}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-panel bg-emerald-500" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-heading truncate">{{ store.currentUser?.name }}</p>
                <p class="text-xs text-emerald-600 font-medium">Active now</p>
            </div>
            <span v-if="store.totalUnread > 0"
                  class="shrink-0 min-w-[22px] h-[22px] rounded-full bg-accent text-white text-xs font-bold
                         flex items-center justify-center px-1.5 tabular-nums">
                {{ store.totalUnread > 99 ? '99+' : store.totalUnread }}
            </span>
        </div>
    </aside>
</template>
