<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'

const props = defineProps({
    conversation: { type: Object, required: true },
})

const store     = useChatStore()
const conv      = computed(() => props.conversation)
const name      = computed(() => store.convName(conv.value))
const isActive  = computed(() => store.activeConvId === conv.value.id)
const avatarUser = computed(() => store.convAvatar(conv.value))

const isOnline  = computed(() => {
    if (conv.value.type === 'dm') return store.getUser(conv.value.userId)?.online ?? false
    return false
})

const lastText = computed(() => {
    const lm = conv.value.lastMessage
    if (!lm) return ''
    const sender = lm.senderId === store.CURRENT_USER_ID
        ? 'You'
        : store.getUser(lm.senderId)?.name?.split(' ')[0] ?? ''
    return sender ? `${sender}: ${lm.text}` : lm.text
})

const groupMembers = computed(() => {
    if (conv.value.type !== 'group') return []
    return (conv.value.members ?? []).slice(0, 2).map(id => store.getUser(id)).filter(Boolean)
})
</script>

<template>
    <button
        @click="store.setActiveConv(conv.id)"
        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group"
        :class="isActive
            ? 'bg-accent/10 shadow-[inset_0_0_0_1px_rgba(108,99,255,0.2)]'
            : 'hover:bg-heading/5'"
    >
        <!-- Avatar -->
        <div class="relative shrink-0">
            <!-- DM avatar -->
            <div v-if="conv.type === 'dm'"
                 class="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm"
                 :style="`background: ${avatarUser?.color ?? '#6c63ff'}`">
                {{ avatarUser?.initials ?? '?' }}
            </div>

            <!-- Group: stacked avatars -->
            <div v-else-if="conv.type === 'group'" class="relative w-9 h-9 shrink-0">
                <div v-for="(u, i) in groupMembers" :key="u.id"
                     class="absolute w-[22px] h-[22px] rounded-full border-2 border-panel flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                     :style="`background: ${u.color}; ${i === 0 ? 'top:0;left:0' : 'bottom:0;right:0'}`">
                    {{ u.initials?.slice(0, 1) }}
                </div>
            </div>

            <!-- Channel -->
            <div v-else
                 class="w-9 h-9 rounded-xl flex items-center justify-center text-base font-extrabold transition-colors duration-150"
                 :class="isActive ? 'bg-accent/15 text-accent' : 'bg-heading/8 text-text/60 group-hover:bg-heading/12'">
                #
            </div>

            <!-- Online dot -->
            <span v-if="isOnline"
                  class="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 border-panel bg-emerald-400 shadow-[0_0_0_1.5px_rgba(52,211,153,0.3)]" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="text-[13px] font-semibold truncate"
                      :class="isActive ? 'text-accent' : 'text-heading'">
                    {{ name }}
                </span>
                <span class="text-[10px] shrink-0 tabular-nums"
                      :class="isActive ? 'text-accent/70' : 'text-text/40'">
                    {{ conv.lastMessage?.time ?? '' }}
                </span>
            </div>
            <div class="flex items-center justify-between gap-1">
                <span class="text-[12px] truncate"
                      :class="isActive ? 'text-accent/65' : 'text-text/55'">
                    {{ lastText }}
                </span>
                <span v-if="conv.unread"
                      class="shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[9px] font-bold
                             flex items-center justify-center px-1 unread-pop">
                    {{ conv.unread > 9 ? '9+' : conv.unread }}
                </span>
            </div>
        </div>
    </button>
</template>

<style scoped>
.unread-pop { animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
</style>
