<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import {
    BiTelephone, BiCameraVideo, BiThreeDotsVertical,
    BiArrowLeft, BiPeople, BiSearch, BiX,
    BiVolumeMute, BiCheckAll, BiBoxArrowRight, BiPersonBadge,
    BiPin, BiTrash,
} from 'oh-vue-icons/icons'
addIcons(
    BiTelephone, BiCameraVideo, BiThreeDotsVertical,
    BiArrowLeft, BiPeople, BiSearch, BiX,
    BiVolumeMute, BiCheckAll, BiBoxArrowRight, BiPersonBadge,
    BiPin, BiTrash,
)

const store = useChatStore()

const showMenu      = ref(false)
const searchMode    = ref(false)
const muteState     = ref(false)

const conv          = computed(() => store.activeConv)
const name          = computed(() => store.convName(conv.value))
const subtitle      = computed(() => store.convSubtitle(conv.value))
const avatarUser    = computed(() => {
    if (!conv.value || conv.value.type !== 'dm') return null
    return store.getUser(conv.value.userId)
})
const isOnline      = computed(() => avatarUser.value?.online ?? false)
const memberAvatars = computed(() => {
    if (conv.value?.type !== 'group') return []
    return (conv.value.members ?? []).slice(0, 2).map(id => store.getUser(id)).filter(Boolean)
})
const callable      = computed(() => conv.value?.type === 'dm')
const memberCount   = computed(() => conv.value?.type === 'group' ? (conv.value.members ?? []).length : 0)
const onlineCount   = computed(() => {
    if (conv.value?.type !== 'group') return 0
    return (conv.value.members ?? []).filter(id => store.getUser(id)?.online).length
})

// Reset on conversation change
watch(() => store.activeConvId, () => {
    showMenu.value   = false
    searchMode.value = false
    muteState.value  = false
    store.convSearchQuery = ''
})

function toggleSearch() {
    searchMode.value = !searchMode.value
    if (!searchMode.value) store.convSearchQuery = ''
}

function closeMenu() { showMenu.value = false }

function markRead() {
    const c = store.conversations.find(c => c.id === store.activeConvId)
    if (c) c.unread = 0
    closeMenu()
}

function toggleMute() {
    muteState.value = !muteState.value
    closeMenu()
}
</script>

<template>
    <div v-if="conv" class="shrink-0 bg-panel border-b border-heading/8 z-10">

        <!-- ── Main header row ─────────────────────────────── -->
        <div class="flex items-center gap-2.5 px-4 py-2.5 min-h-[56px]">

            <!-- Back (mobile only) -->
            <button class="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text/60
                           hover:bg-heading/8 transition-all duration-150 active:scale-95"
                    @click="store.mobileSidebarOpen = true">
                <v-icon name="bi-arrow-left" scale="0.9" />
            </button>

            <!-- Avatar -->
            <div class="relative shrink-0">
                <div v-if="conv.type === 'dm'"
                     class="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-sm"
                     :style="`background:${avatarUser?.color ?? '#6c63ff'}`">
                    {{ avatarUser?.initials }}
                </div>
                <div v-else-if="conv.type === 'group'" class="relative w-9 h-9">
                    <div v-for="(u, i) in memberAvatars" :key="u.id"
                         class="absolute w-[22px] h-[22px] rounded-full border-2 border-panel flex items-center justify-center text-[8px] font-bold text-white"
                         :style="`background:${u.color};${i===0?'top:0;left:0':'bottom:0;right:0'}`">
                        {{ u.initials?.slice(0,1) }}
                    </div>
                </div>
                <div v-else class="w-9 h-9 rounded-xl bg-accent/12 flex items-center justify-center text-accent font-extrabold text-lg">
                    #
                </div>
                <span v-if="isOnline"
                      class="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-emerald-400 border-2 border-panel shadow-[0_0_0_2px_rgba(52,211,153,0.25)]" />
            </div>

            <!-- Title + subtitle -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <p class="text-[14px] font-bold text-heading truncate">{{ name }}</p>
                    <span v-if="muteState"
                          class="text-[9px] font-bold uppercase tracking-wider text-text/40 bg-heading/8 px-1.5 py-0.5 rounded-full">
                        Muted
                    </span>
                    <span v-if="onlineCount > 0"
                          class="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/70 px-2 py-px rounded-full whitespace-nowrap">
                        {{ onlineCount }} online
                    </span>
                </div>
                <p class="text-[12px] truncate" :class="isOnline ? 'text-emerald-500 font-semibold' : 'text-text/50'">
                    {{ subtitle }}
                </p>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-0.5 shrink-0">
                <template v-if="callable">
                    <button @click="store.startCall('voice')"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-text/60 hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95" title="Voice call">
                        <v-icon name="bi-telephone" scale="0.88" />
                    </button>
                    <button @click="store.startCall('video')"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-text/60 hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95" title="Video call">
                        <v-icon name="bi-camera-video" scale="0.88" />
                    </button>
                </template>
                <template v-else-if="conv.type === 'group'">
                    <button @click="store.startCall('video')"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-text/60 hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95" title="Group video call">
                        <v-icon name="bi-camera-video" scale="0.88" />
                    </button>
                    <div class="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-heading/6 text-text/65
                                text-[12px] font-semibold border border-heading/8 cursor-default select-none">
                        <v-icon name="bi-people" scale="0.82" />
                        {{ memberCount }}
                    </div>
                </template>

                <!-- Search toggle -->
                <button @click="toggleSearch"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-text/60 hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95"
                        :class="{ 'bg-accent/10 !text-accent': searchMode }"
                        title="Search in conversation">
                    <v-icon :name="searchMode ? 'bi-x' : 'bi-search'" scale="0.88" />
                </button>

                <!-- 3-dots menu -->
                <div class="relative">
                    <button @click.stop="showMenu = !showMenu"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-text/60 hover:bg-heading/8 hover:text-heading transition-all duration-150 active:scale-95"
                            :class="{ 'bg-heading/8': showMenu }"
                            title="More options">
                        <v-icon name="bi-three-dots-vertical" scale="0.85" />
                    </button>

                    <!-- Backdrop -->
                    <div v-if="showMenu" class="fixed inset-0 z-10" @click="closeMenu" />

                    <!-- Dropdown -->
                    <Transition name="menu-pop">
                        <div v-if="showMenu"
                             class="absolute right-0 top-full mt-1.5 z-20 w-52 bg-panel rounded-xl
                                    border border-heading/10 shadow-xl shadow-heading/10 py-1.5 overflow-hidden">

                            <!-- Mark as read -->
                            <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="markRead">
                                <v-icon name="bi-check-all" scale="0.88" class="text-accent" />
                                Mark as read
                            </button>

                            <!-- Mute toggle -->
                            <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="toggleMute">
                                <v-icon name="bi-volume-mute" scale="0.88" class="text-text/60" />
                                {{ muteState ? 'Unmute notifications' : 'Mute notifications' }}
                            </button>

                            <template v-if="conv.type === 'dm'">
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-person-badge" scale="0.88" class="text-text/60" />
                                    View profile
                                </button>
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-pin" scale="0.88" class="text-text/60" />
                                    Pin conversation
                                </button>
                            </template>

                            <template v-else-if="conv.type === 'group'">
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-people" scale="0.88" class="text-text/60" />
                                    View members
                                </button>
                                <div class="mx-3 my-1.5 h-px bg-heading/8" />
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-box-arrow-right" scale="0.88" />
                                    Leave group
                                </button>
                            </template>

                            <template v-else>
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-heading hover:bg-heading/5 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-pin" scale="0.88" class="text-text/60" />
                                    Pin channel
                                </button>
                                <div class="mx-3 my-1.5 h-px bg-heading/8" />
                                <button class="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-100 text-left" @click="closeMenu">
                                    <v-icon name="bi-box-arrow-right" scale="0.88" />
                                    Leave channel
                                </button>
                            </template>
                        </div>
                    </Transition>
                </div>
            </div>
        </div>

        <!-- ── Inline search bar ────────────────────────────── -->
        <Transition name="search-bar">
            <div v-if="searchMode"
                 class="flex items-center gap-2.5 px-4 pb-3">
                <div class="relative flex-1">
                    <v-icon name="bi-search"
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-text/35 pointer-events-none"
                            scale="0.8" />
                    <input
                        v-model="store.convSearchQuery"
                        type="text"
                        placeholder="Search messages in this conversation…"
                        class="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] bg-heading/6 border border-heading/10
                               text-heading placeholder:text-text/35 focus:outline-none focus:border-accent/35
                               focus:ring-2 focus:ring-accent/10 transition-all duration-150"
                        autofocus
                    />
                </div>
                <span v-if="store.convSearchQuery" class="text-[11px] font-semibold text-text/50 whitespace-nowrap">
                    {{ store.activeMessages.filter(m => m.content?.toLowerCase().includes(store.convSearchQuery.toLowerCase())).length }} results
                </span>
            </div>
        </Transition>
    </div>
</template>

<style scoped>

.menu-pop-enter-active, .menu-pop-leave-active { transition: all 0.15s cubic-bezier(0.4,0,0.2,1); }
.menu-pop-enter-from, .menu-pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.search-bar-enter-active, .search-bar-leave-active { transition: all 0.18s ease; }
.search-bar-enter-from, .search-bar-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
