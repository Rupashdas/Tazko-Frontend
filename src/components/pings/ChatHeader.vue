<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import { BiTelephone, BiCameraVideo, BiThreeDotsVertical, BiArrowLeft, BiPeople } from 'oh-vue-icons/icons'
addIcons(BiTelephone, BiCameraVideo, BiThreeDotsVertical, BiArrowLeft, BiPeople)

const store = useChatStore()

const conv = computed(() => store.activeConv)
const name = computed(() => store.convName(conv.value))
const subtitle = computed(() => store.convSubtitle(conv.value))

const avatarUser = computed(() => {
    if (!conv.value) return null
    if (conv.value.type === 'dm') return store.getUser(conv.value.userId)
    return null
})

const isOnline = computed(() => avatarUser.value?.online ?? false)

const memberAvatars = computed(() => {
    if (conv.value?.type !== 'group') return []
    return (conv.value.members ?? []).slice(0, 4).map(id => store.getUser(id)).filter(Boolean)
})

const callable = computed(() => conv.value?.type === 'dm')
</script>

<template>
    <header v-if="conv" class="flex items-center gap-3 px-4 py-3 bg-panel border-b border-heading/8 shrink-0 z-10">
        <!-- Back button (mobile) -->
        <button class="md:hidden p-1.5 rounded-sm text-text hover:bg-heading/8 transition-colors"
                @click="store.mobileSidebarOpen = true">
            <v-icon name="bi-arrow-left" scale="1" />
        </button>

        <!-- Avatar -->
        <div class="relative shrink-0">
            <div v-if="conv.type === 'dm'"
                 class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                 :style="`background: ${avatarUser?.color ?? '#6c63ff'}`">
                {{ avatarUser?.initials }}
            </div>
            <div v-else-if="conv.type === 'group'" class="relative w-10 h-10 shrink-0">
                <div v-for="(u, i) in memberAvatars.slice(0,2)" :key="u.id"
                     class="absolute w-6 h-6 rounded-full border-2 border-panel flex items-center justify-center text-[9px] font-bold text-white"
                     :style="`background: ${u.color}; ${i===0?'top:0;left:0':'bottom:0;right:0'}`">
                    {{ u.initials?.slice(0,1) }}
                </div>
            </div>
            <div v-else
                 class="w-10 h-10 rounded-sm bg-accent/12 flex items-center justify-center text-accent font-bold text-base">
                #
            </div>

            <span v-if="isOnline"
                  class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-panel"
                  style="background: #22c55e;" />
        </div>

        <!-- Name + Subtitle -->
        <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-heading truncate">{{ name }}</p>
            <p class="text-xs truncate" :class="isOnline ? 'text-green-500 font-medium' : 'text-text/60'">
                {{ subtitle }}
            </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
            <template v-if="callable">
                <button @click="store.startCall('voice')"
                        class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:bg-heading/8 hover:text-accent transition-colors" title="Voice call">
                    <v-icon name="bi-telephone" scale="0.95" />
                </button>
                <button @click="store.startCall('video')"
                        class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:bg-heading/8 hover:text-accent transition-colors" title="Video call">
                    <v-icon name="bi-camera-video" scale="0.95" />
                </button>
            </template>
            <button v-else
                    class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:bg-heading/8 hover:text-accent transition-colors" title="Members">
                <v-icon name="bi-people" scale="0.95" />
            </button>
            <button class="w-9 h-9 rounded-sm flex items-center justify-center text-text hover:bg-heading/8 transition-colors" title="More">
                <v-icon name="bi-three-dots-vertical" scale="0.9" />
            </button>
        </div>
    </header>
</template>
