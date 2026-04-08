<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'

const props = defineProps({
    conversation: { type: Object, required: true },
})

const store = useChatStore()
const conv  = computed(() => props.conversation)
const name  = computed(() => store.convName(conv.value))
const isActive = computed(() => store.activeConvId === conv.value.id)
const avatarUser = computed(() => store.convAvatar(conv.value))

const lastText = computed(() => {
    const lm = conv.value.lastMessage
    if (!lm) return ''
    const sender = lm.senderId === store.CURRENT_USER_ID ? 'You' : store.getUser(lm.senderId)?.name?.split(' ')[0] ?? ''
    return sender ? `${sender}: ${lm.text}` : lm.text
})

const isOnline = computed(() => {
    if (conv.value.type === 'dm') return store.getUser(conv.value.userId)?.online ?? false
    return false
})
</script>

<template>
    <button
        @click="store.setActiveConv(conv.id)"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all duration-150 group"
        :class="isActive
            ? 'bg-accent/12 text-accent'
            : 'text-text hover:bg-heading/6 hover:text-heading'"
    >
        <!-- Avatar / Icon -->
        <div class="relative shrink-0">
            <!-- DM: user avatar -->
            <div v-if="conv.type === 'dm'"
                 class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                 :style="`background: ${avatarUser?.color ?? '#6c63ff'}`">
                {{ avatarUser?.initials ?? '?' }}
            </div>
            <!-- Group: stacked letters -->
            <div v-else-if="conv.type === 'group'"
                 class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                 :class="isActive ? 'bg-accent/20 text-accent' : 'bg-heading/10 text-heading'">
                {{ conv.name?.slice(0,2).toUpperCase() }}
            </div>
            <!-- Channel: hash icon -->
            <div v-else
                 class="w-9 h-9 rounded-sm flex items-center justify-center text-base font-bold shrink-0"
                 :class="isActive ? 'bg-accent/15 text-accent' : 'bg-heading/8 text-text'">
                #
            </div>

            <!-- Online dot -->
            <span v-if="isOnline"
                  class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-panel"
                  style="background: #22c55e;" />
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
                <span class="text-sm font-semibold truncate"
                      :class="isActive ? 'text-accent' : 'text-heading'">
                    {{ name }}
                </span>
                <span class="text-xs shrink-0"
                      :class="isActive ? 'text-accent/70' : 'text-text/50'">
                    {{ conv.lastMessage?.time ?? '' }}
                </span>
            </div>
            <div class="flex items-center justify-between gap-1 mt-0.5">
                <span class="text-xs truncate" :class="isActive ? 'text-accent/70' : 'text-text/60'">
                    {{ lastText }}
                </span>
                <span v-if="conv.unread"
                      class="shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {{ conv.unread > 9 ? '9+' : conv.unread }}
                </span>
            </div>
        </div>
    </button>
</template>
