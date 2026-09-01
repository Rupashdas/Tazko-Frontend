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
    store.setConvSearchQuery('')
})

function toggleSearch() {
    searchMode.value = !searchMode.value
    if (!searchMode.value) store.setConvSearchQuery('')
}

function closeMenu() { showMenu.value = false }

function markRead() {
    store.markConvRead(store.activeConvId)
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
        <div class="flex items-center gap-3 px-4 py-3 min-h-[60px]">

            <!-- Back (mobile only) -->
            <button class="md:hidden w-9 h-9 rounded-md flex items-center justify-center text-text
                           hover:bg-heading/5 hover:text-heading transition-all duration-150 active:scale-95 shrink-0"
                    @click="store.setMobileSidebarOpen(true)">
                <v-icon name="bi-arrow-left" scale="0.9" />
            </button>

            <!-- Avatar -->
            <div class="relative shrink-0">
                <div v-if="conv.type === 'dm'"
                     class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                     :style="`background:${avatarUser?.color ?? '#6c63ff'}`">
                    {{ avatarUser?.initials }}
                </div>
                <div v-else-if="conv.type === 'group'" class="relative w-9 h-9">
                    <div v-for="(u, i) in memberAvatars" :key="u.id"
                         class="absolute w-[22px] h-[22px] rounded-full border-2 border-panel flex items-center justify-center text-[9px] font-bold text-white"
                         :style="`background:${u.color};${i===0?'top:0;left:0':'bottom:0;right:0'}`">
                        {{ u.initials?.slice(0,1) }}
                    </div>
                </div>
                <div v-else class="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                    #
                </div>
                <span v-if="isOnline"
                      class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-panel" />
            </div>

            <!-- Title + subtitle -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-heading truncate">{{ name }}</p>
                    <span v-if="muteState" class="badge badge-neutral shrink-0">Muted</span>
                    <span v-if="onlineCount > 0" class="badge badge-success shrink-0 whitespace-nowrap">
                        {{ onlineCount }} online
                    </span>
                </div>
                <p class="text-xs truncate mt-0.5" :class="isOnline ? 'text-emerald-600 font-medium' : 'text-text'">
                    {{ subtitle }}
                </p>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1 shrink-0">
                <template v-if="callable">
                    <button @click="store.startCall('voice')"
                            class="w-9 h-9 rounded-md flex items-center justify-center text-text hover:bg-heading/5 hover:text-heading transition-all duration-150 active:scale-95" title="Voice call">
                        <v-icon name="bi-telephone" scale="0.88" />
                    </button>
                    <button @click="store.startCall('video')"
                            class="w-9 h-9 rounded-md flex items-center justify-center text-text hover:bg-heading/5 hover:text-heading transition-all duration-150 active:scale-95" title="Video call">
                        <v-icon name="bi-camera-video" scale="0.88" />
                    </button>
                </template>
                <template v-else-if="conv.type === 'group'">
                    <button @click="store.startCall('video')"
                            class="w-9 h-9 rounded-md flex items-center justify-center text-text hover:bg-heading/5 hover:text-heading transition-all duration-150 active:scale-95" title="Group video call">
                        <v-icon name="bi-camera-video" scale="0.88" />
                    </button>
                    <div class="badge badge-neutral cursor-default select-none hidden sm:inline-flex">
                        <v-icon name="bi-people" scale="0.82" />
                        {{ memberCount }}
                    </div>
                </template>

                <!-- Search toggle -->
                <button @click="toggleSearch"
                        class="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95"
                        :class="searchMode ? 'bg-accent/10 text-accent' : 'text-text hover:bg-heading/5 hover:text-heading'"
                        title="Search in conversation">
                    <v-icon :name="searchMode ? 'bi-x' : 'bi-search'" scale="0.88" />
                </button>

                <!-- 3-dots menu -->
                <div class="relative">
                    <button @click.stop="showMenu = !showMenu"
                            class="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95"
                            :class="showMenu ? 'bg-heading/8 text-heading' : 'text-text hover:bg-heading/5 hover:text-heading'"
                            title="More options">
                        <v-icon name="bi-three-dots-vertical" scale="0.85" />
                    </button>

                    <!-- Backdrop -->
                    <div v-if="showMenu" class="fixed inset-0 z-10" @click="closeMenu" />

                    <!-- Dropdown -->
                    <Transition name="menu-pop">
                        <div v-if="showMenu"
                             class="dropdown-menu absolute right-0 top-full mt-2 z-20 w-56">
                            <div class="px-1.5 flex flex-col">

                                <!-- Mark as read -->
                                <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="markRead">
                                    <v-icon name="bi-check-all" scale="0.88" class="text-accent shrink-0" />
                                    Mark as read
                                </button>

                                <!-- Mute toggle -->
                                <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="toggleMute">
                                    <v-icon name="bi-volume-mute" scale="0.88" class="text-text shrink-0" />
                                    {{ muteState ? 'Unmute notifications' : 'Mute notifications' }}
                                </button>

                                <template v-if="conv.type === 'dm'">
                                    <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="closeMenu">
                                        <v-icon name="bi-person-badge" scale="0.88" class="text-text shrink-0" />
                                        View profile
                                    </button>
                                    <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="closeMenu">
                                        <v-icon name="bi-pin" scale="0.88" class="text-text shrink-0" />
                                        Pin conversation
                                    </button>
                                </template>

                                <template v-else-if="conv.type === 'group'">
                                    <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="closeMenu">
                                        <v-icon name="bi-people" scale="0.88" class="text-text shrink-0" />
                                        View members
                                    </button>
                                    <div class="my-1.5 h-px bg-heading/8" />
                                    <button class="dropdown-item w-full text-left text-red-600 hover:bg-red-500/10" @click="closeMenu">
                                        <v-icon name="bi-box-arrow-right" scale="0.88" class="shrink-0" />
                                        Leave group
                                    </button>
                                </template>

                                <template v-else>
                                    <button class="dropdown-item dropdown-item-hover w-full text-left text-heading" @click="closeMenu">
                                        <v-icon name="bi-pin" scale="0.88" class="text-text shrink-0" />
                                        Pin channel
                                    </button>
                                    <div class="my-1.5 h-px bg-heading/8" />
                                    <button class="dropdown-item w-full text-left text-red-600 hover:bg-red-500/10" @click="closeMenu">
                                        <v-icon name="bi-box-arrow-right" scale="0.88" class="shrink-0" />
                                        Leave channel
                                    </button>
                                </template>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </div>

        <!-- ── Inline search bar ────────────────────────────── -->
        <Transition name="search-bar">
            <div v-if="searchMode"
                 class="flex items-center gap-3 px-4 pb-3">
                <div class="relative flex-1">
                    <v-icon name="bi-search"
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 pointer-events-none"
                            scale="0.8" />
                    <input
                        :value="store.convSearchQuery"
                        @input="store.setConvSearchQuery($event.target.value)"
                        type="text"
                        placeholder="Search messages in this conversation…"
                        class="tazko-search pl-9 pr-3 py-2"
                        autofocus
                    />
                </div>
                <span v-if="store.convSearchQuery" class="text-xs font-semibold text-text whitespace-nowrap tabular-nums">
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
