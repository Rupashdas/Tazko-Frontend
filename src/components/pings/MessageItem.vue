<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import {
    BiReply, BiTrash,
    BiFileEarmark, BiFileEarmarkPdf, BiFileEarmarkExcel, BiFileEarmarkText,
    BiDownload, BiChevronDown,
} from 'oh-vue-icons/icons'
addIcons(BiReply, BiTrash, BiFileEarmark, BiFileEarmarkPdf,
         BiFileEarmarkExcel, BiFileEarmarkText, BiDownload, BiChevronDown)

const props = defineProps({
    message:   { type: Object,  required: true },
    isGrouped: { type: Boolean, default: false },
})

const store          = useChatStore()
const showActions    = ref(false)
const expandReplies  = ref(false)

const isMine   = computed(() => props.message.senderId === store.CURRENT_USER_ID)
const sender   = computed(() => store.getUser(props.message.senderId))
const replyUser = computed(() => props.message.replyTo ? store.getUser(props.message.replyTo.senderId) : null)

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😍', '🎉', '👏', '💯']

function fileIcon(type) {
    if (!type) return 'bi-file-earmark'
    if (type === 'pdf')                    return 'bi-file-earmark-pdf'
    if (type === 'xlsx' || type === 'csv') return 'bi-file-earmark-excel'
    return 'bi-file-earmark-text'
}
function fileColor(type) {
    if (!type)           return '#6c63ff'
    if (type === 'pdf')  return '#ef4444'
    if (type === 'xlsx') return '#10b981'
    return '#3b82f6'
}
</script>

<template>
    <!-- Deleted -->
    <div v-if="message.deleted" class="flex gap-3 px-4 sm:px-5 py-1.5">
        <div class="w-8 shrink-0" />
        <p class="text-sm italic text-text/60 select-none">This message was deleted.</p>
    </div>

    <!-- Message -->
    <div v-else
         class="group relative flex px-4 sm:px-5 transition-colors duration-100 hover:bg-heading/3"
         :class="[isMine ? 'flex-row-reverse' : 'flex-row', isGrouped ? 'py-0.5' : 'pt-3 pb-0.5']"
         @mouseenter="showActions = true"
         @mouseleave="showActions = false">

        <!-- Avatar (others only) -->
        <div class="shrink-0 mt-0.5" :class="isMine ? 'ml-2' : 'mr-3 w-8'">
            <div v-if="!isGrouped && !isMine"
                 class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 :style="`background:${sender?.color ?? '#6c63ff'}`">
                {{ sender?.initials ?? '?' }}
            </div>
        </div>

        <!-- Body -->
        <div class="flex flex-col max-w-[85%] sm:max-w-[72%]" :class="isMine ? 'items-end' : 'items-start'">

            <!-- Sender + time -->
            <div v-if="!isGrouped"
                 class="flex items-baseline gap-2 mb-1.5"
                 :class="isMine ? 'flex-row-reverse' : ''">
                <span class="text-sm font-semibold" :class="isMine ? 'text-accent' : 'text-heading'">
                    {{ isMine ? 'You' : sender?.name }}
                </span>
                <span class="text-xs text-text/60 tabular-nums">
                    {{ message.time }}
                </span>
            </div>
            <span v-else
                  class="text-xs text-text/50 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 tabular-nums">
                {{ message.time }}
            </span>

            <!-- ── Reply quote ──────────────────────────────────── -->
            <div v-if="message.replyTo"
                 class="mb-1.5 flex items-start gap-2 px-3 py-2 rounded-lg border-l-2 border-accent/50
                        bg-accent/5 max-w-full cursor-default">
                <div class="min-w-0">
                    <p class="text-xs font-semibold text-accent truncate mb-0.5">
                        {{ message.replyTo.senderId === store.CURRENT_USER_ID ? 'You' : message.replyTo.senderName }}
                    </p>
                    <p class="text-xs text-text truncate max-w-[220px]">
                        {{ message.replyTo.content }}
                    </p>
                </div>
            </div>

            <!-- Image -->
            <div v-if="message.type === 'image'"
                 class="relative rounded-xl overflow-hidden max-w-[320px] border border-heading/8 cursor-zoom-in"
                 :class="isMine ? 'rounded-tr-md' : 'rounded-tl-md'">
                <img :src="message.url" :alt="message.content"
                     class="w-full object-cover max-h-64 hover:brightness-95 transition-all duration-200" />
            </div>

            <!-- File card -->
            <div v-else-if="message.type === 'file'"
                 class="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-heading/8
                        bg-panel hover:border-accent/25 hover:bg-accent/3 cursor-pointer transition-all duration-150 group/file max-w-[280px]"
                 :class="isMine ? 'rounded-tr-md' : 'rounded-tl-md'">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     :style="`background:${fileColor(message.fileType)}18`">
                    <v-icon :name="fileIcon(message.fileType)" scale="1.05"
                            :style="`color:${fileColor(message.fileType)}`" />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-heading truncate">{{ message.content }}</p>
                    <p class="text-xs text-text mt-0.5">{{ message.fileSize }}</p>
                </div>
                <v-icon name="bi-download" scale="0.88"
                        class="text-text/50 group-hover/file:text-accent transition-colors shrink-0" />
            </div>

            <!-- Text bubble -->
            <div v-else
                 class="px-4 py-2.5 text-sm leading-relaxed break-words rounded-xl transition-colors duration-150"
                 :class="isMine
                     ? 'bg-accent text-white rounded-tr-md'
                     : 'bg-panel border border-heading/8 text-heading rounded-tl-md'">
                <span v-html="message.content.replace(/@(\w[\w\s]*)/g, '<span class=\'@mention\'>@$1</span>')" />
            </div>

            <!-- Reactions -->
            <div v-if="message.reactions?.length" class="flex flex-wrap gap-1.5 mt-2">
                <button
                    v-for="r in message.reactions" :key="r.emoji"
                    @click="store.toggleReaction(message.id, r.emoji)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border
                           transition-all duration-150 active:scale-95"
                    :class="r.userIds.includes(store.CURRENT_USER_ID)
                        ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
                        : 'bg-heading/5 border-heading/8 text-text hover:bg-heading/10 hover:border-heading/15'">
                    {{ r.emoji }} <span class="font-semibold tabular-nums">{{ r.userIds.length }}</span>
                </button>
            </div>

            <!-- Read receipt (own) -->
            <div v-if="isMine" class="mt-1">
                <span class="text-xs tabular-nums"
                      :class="message.readBy.length > 1 ? 'text-accent/70' : 'text-text/50'">
                    {{ message.readBy.length > 1 ? '✓✓ Seen' : '✓ Sent' }}
                </span>
            </div>
        </div>

        <!-- ── Floating action toolbar ──────────────────────── -->
        <Transition name="toolbar">
            <div v-if="showActions"
                 class="absolute z-20 flex items-center gap-0.5 bg-panel rounded-lg border border-heading/8
                        shadow-lg shadow-heading/10 px-1.5 py-1.5 max-w-[calc(100%-2rem)] overflow-x-auto scrollbar-thin"
                 :class="isMine ? 'left-4 sm:left-5 -top-4' : 'right-4 sm:right-5 -top-4'">
                <!-- Quick reactions -->
                <div class="flex items-center gap-0.5 pr-1.5 border-r border-heading/8">
                    <button v-for="emoji in QUICK_EMOJIS" :key="emoji"
                            @click="store.toggleReaction(message.id, emoji)"
                            class="w-7 h-7 rounded-md text-sm hover:bg-heading/8 flex items-center justify-center
                                   transition-all duration-150 hover:scale-125 active:scale-95">
                        {{ emoji }}
                    </button>
                </div>
                <!-- Reply -->
                <button @click="store.setReplyTo(message)"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text
                               hover:bg-accent/10 hover:text-accent transition-all duration-150"
                        title="Reply">
                    <v-icon name="bi-reply" scale="0.82" />
                </button>
                <!-- Delete (own) -->
                <button v-if="isMine"
                        @click="store.deleteMessage(message.id)"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text
                               hover:bg-red-500/10 hover:text-red-600 transition-all duration-150"
                        title="Delete">
                    <v-icon name="bi-trash" scale="0.82" />
                </button>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.toolbar-enter-active, .toolbar-leave-active { transition: all 0.12s ease; }
.toolbar-enter-from, .toolbar-leave-to { opacity: 0; transform: translateY(4px) scale(0.97); }

:deep(.\@mention) {
    display: inline-block;
    background: color-mix(in srgb, var(--color-accent) 15%, transparent);
    color: var(--color-accent);
    font-weight: 700;
    font-size: 0.875em;
    padding: 0.05em 0.3em;
    border-radius: 4px;
}
</style>
