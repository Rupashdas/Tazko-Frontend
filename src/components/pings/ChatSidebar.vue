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
        <div class="px-4 pt-5 pb-3 shrink-0 border-b border-heading/6">
            <div class="flex items-center justify-between mb-3.5">
                <span class="text-[10px] font-black tracking-[0.1em] uppercase text-heading/40">Messages</span>
                <button
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-text/50 hover:bg-accent/10 hover:text-accent transition-all duration-150 hover:scale-110 active:scale-95"
                    title="New conversation">
                    <v-icon name="bi-plus" scale="1.05" />
                </button>
            </div>

            <!-- Search -->
            <div class="relative">
                <v-icon name="bi-search"
                        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text/35 pointer-events-none"
                        scale="0.8" />
                <input
                    v-model="store.searchQuery"
                    type="text"
                    placeholder="Search…"
                    class="w-full pl-8 pr-3 py-[7px] rounded-lg text-[13px] bg-heading/5 border border-heading/8
                           text-heading placeholder:text-text/35 focus:outline-none focus:border-accent/40
                           focus:bg-accent/3 focus:ring-2 focus:ring-accent/10 transition-all duration-150"
                />
            </div>
        </div>

        <!-- ── Conversation List ─────────────────────────────── -->
        <div v-scrollbar class="flex-1 overflow-y-auto"><div class="py-2">

            <!-- Pinned -->
            <template v-if="store.filteredConversations.filter(c => c.pinned).length">
                <div class="mb-1">
                    <button
                        class="w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text/40 hover:text-text/70 transition-colors cursor-pointer"
                        @click="toggle('pinned')">
                        <v-icon name="bi-pin-angle" scale="0.7" />
                        Pinned
                        <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                                :class="is('pinned') ? '-rotate-90' : ''" scale="0.65" />
                    </button>
                    <div v-if="!is('pinned')" class="px-2 space-y-0.5">
                        <ChatListItem
                            v-for="conv in store.filteredConversations.filter(c => c.pinned)"
                            :key="conv.id" :conversation="conv" />
                    </div>
                </div>
            </template>

            <!-- Direct Messages -->
            <div v-if="store.directMessages.filter(c => !c.pinned).length" class="mb-1">
                <button
                    class="w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text/40 hover:text-text/70 transition-colors cursor-pointer"
                    @click="toggle('dms')">
                    Direct Messages
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('dms') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('dms')" class="px-2 space-y-0.5">
                    <ChatListItem
                        v-for="conv in store.directMessages.filter(c => !c.pinned)"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Groups -->
            <div v-if="store.groupChats.filter(c => !c.pinned).length" class="mb-1">
                <button
                    class="w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text/40 hover:text-text/70 transition-colors cursor-pointer"
                    @click="toggle('groups')">
                    Groups
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('groups') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('groups')" class="px-2 space-y-0.5">
                    <ChatListItem
                        v-for="conv in store.groupChats.filter(c => !c.pinned)"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Channels -->
            <div v-if="store.channels.length" class="mb-1">
                <button
                    class="w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text/40 hover:text-text/70 transition-colors cursor-pointer"
                    @click="toggle('channels')">
                    Channels
                    <v-icon name="bi-chevron-down" class="ml-auto transition-transform duration-200"
                            :class="is('channels') ? '-rotate-90' : ''" scale="0.65" />
                </button>
                <div v-if="!is('channels')" class="px-2 space-y-0.5">
                    <ChatListItem
                        v-for="conv in store.channels"
                        :key="conv.id" :conversation="conv" />
                </div>
            </div>

            <!-- Empty -->
            <div v-if="!store.filteredConversations.length"
                 class="flex flex-col items-center gap-2 py-12 text-center px-4">
                <span class="text-3xl opacity-40">💬</span>
                <p class="text-[13px] text-text/45 font-medium">No conversations found</p>
            </div>
        </div></div>

        <!-- ── Footer ─────────────────────────────────────────── -->
        <div class="px-4 py-3 border-t border-heading/8 shrink-0 flex items-center gap-3 bg-body/50">
            <div class="relative shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                     :style="`background: ${store.currentUser?.color ?? '#6c63ff'}`">
                    {{ store.currentUser?.initials }}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 border-panel bg-emerald-400
                             shadow-[0_0_0_2px_rgba(52,211,153,0.25)]" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-heading truncate">{{ store.currentUser?.name }}</p>
                <p class="text-[11px] text-emerald-500 font-semibold">● Active now</p>
            </div>
            <span v-if="store.totalUnread > 0"
                  class="shrink-0 min-w-[20px] h-5 rounded-full bg-accent text-white text-[10px] font-bold
                         flex items-center justify-center px-1.5">
                {{ store.totalUnread > 99 ? '99+' : store.totalUnread }}
            </span>
        </div>
    </aside>
</template>
