<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import {
    BiReply, BiTrash, BiChatLeftText, BiFileEarmark,
    BiFileEarmarkPdf, BiFileEarmarkExcel, BiFileEarmarkText, BiDownload,
} from 'oh-vue-icons/icons'
addIcons(BiReply, BiTrash, BiChatLeftText, BiFileEarmark, BiFileEarmarkPdf, BiFileEarmarkExcel, BiFileEarmarkText, BiDownload)

const props = defineProps({
    message:   { type: Object,  required: true },
    isGrouped: { type: Boolean, default: false },
    showAvatar:{ type: Boolean, default: true },
})

const store    = useChatStore()
const showActions      = ref(false)
const showQuickReact   = ref(false)

const isMine   = computed(() => props.message.senderId === store.CURRENT_USER_ID)
const sender   = computed(() => store.getUser(props.message.senderId))
const isThread = computed(() => (props.message.threads?.length ?? 0) > 0)

const QUICK_EMOJIS = ['👍','❤️','😂','🔥','😍','🎉','👏','💯']

function fileIcon(type) {
    if (!type) return 'bi-file-earmark'
    if (type === 'pdf')  return 'bi-file-earmark-pdf'
    if (type === 'xlsx' || type === 'csv') return 'bi-file-earmark-excel'
    return 'bi-file-earmark-text'
}

function fileColor(type) {
    if (!type) return '#6c63ff'
    if (type === 'pdf')  return '#ef4444'
    if (type === 'xlsx') return '#10b981'
    return '#3b82f6'
}
</script>

<template>
    <div
        v-if="!message.deleted"
        class="group relative flex gap-3 px-4 py-0.5 transition-colors duration-100 hover:bg-heading/3"
        :class="{ 'pt-3': !isGrouped }"
        @mouseenter="showActions = true"
        @mouseleave="showActions = false; showQuickReact = false"
    >
        <!-- Avatar column -->
        <div class="w-9 shrink-0 pt-0.5">
            <div v-if="!isGrouped && showAvatar"
                 class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 :style="`background: ${sender?.color ?? '#6c63ff'}`">
                {{ sender?.initials ?? '?' }}
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
            <!-- Sender name + time (non-grouped only) -->
            <div v-if="!isGrouped" class="flex items-baseline gap-2 mb-1">
                <span class="text-sm font-bold" :class="isMine ? 'text-accent' : 'text-heading'">
                    {{ isMine ? 'You' : sender?.name }}
                </span>
                <span class="text-[11px] text-text/40 font-medium">{{ message.time }}</span>
            </div>
            <!-- Grouped: show time on hover -->
            <span v-else
                  class="absolute left-4 top-1.5 text-[10px] text-text/30 opacity-0 group-hover:opacity-100 transition-opacity select-none"
                  style="width: 36px; text-align: center;">
                {{ message.time }}
            </span>

            <!-- Image -->
            <div v-if="message.type === 'image'" class="mt-1 mb-1 max-w-xs">
                <img :src="message.url" :alt="message.content"
                     class="rounded-xl w-full object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                     style="display: block;" />
            </div>

            <!-- File card -->
            <div v-else-if="message.type === 'file'"
                 class="mt-1 mb-1 inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-heading/10 bg-body max-w-xs hover:bg-heading/4 transition-colors cursor-pointer group/file">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     :style="`background: ${fileColor(message.fileType)}22`">
                    <v-icon :name="fileIcon(message.fileType)" scale="1.1" :style="`color: ${fileColor(message.fileType)}`" />
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-heading truncate max-w-[160px]">{{ message.content }}</p>
                    <p class="text-xs text-text/50">{{ message.fileSize }}</p>
                </div>
                <v-icon name="bi-download" class="text-text/30 group-hover/file:text-accent transition-colors ml-1" scale="0.9" />
            </div>

            <!-- Text -->
            <p v-else class="text-sm text-heading leading-relaxed break-words">
                <span v-html="message.content.replace(/@(\w[\w\s]*)/g, '<span class=\'mention\'>@$1</span>')" />
            </p>

            <!-- Thread count -->
            <button v-if="isThread"
                    @click="store.openThread(message.id)"
                    class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 hover:underline transition-colors">
                <v-icon name="bi-chat-left-text" scale="0.75" />
                {{ message.threads.length }} {{ message.threads.length === 1 ? 'reply' : 'replies' }}
            </button>

            <!-- Reactions -->
            <div v-if="message.reactions?.length" class="flex flex-wrap gap-1 mt-2">
                <button
                    v-for="reaction in message.reactions" :key="reaction.emoji"
                    @click="store.toggleReaction(message.id, reaction.emoji)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all duration-100"
                    :class="reaction.userIds.includes(store.CURRENT_USER_ID)
                        ? 'bg-accent/12 border-accent/30 text-accent font-semibold'
                        : 'bg-heading/5 border-heading/10 text-text hover:bg-heading/10'"
                >
                    <span>{{ reaction.emoji }}</span>
                    <span>{{ reaction.userIds.length }}</span>
                </button>
            </div>
        </div>

        <!-- Read receipts (own messages) -->
        <div v-if="isMine" class="shrink-0 self-end pb-1">
            <span class="text-[10px]" :class="message.readBy.length > 1 ? 'text-accent' : 'text-text/30'">
                {{ message.readBy.length > 1 ? '✓✓' : '✓' }}
            </span>
        </div>

        <!-- Hover action bar -->
        <Transition name="actions-fade">
            <div v-if="showActions"
                 class="absolute right-4 -top-4 flex items-center gap-0.5 bg-panel border border-heading/10 rounded-lg shadow-lg px-1 py-1 z-20">
                <!-- Quick reactions -->
                <div class="flex items-center">
                    <button
                        v-for="emoji in QUICK_EMOJIS" :key="emoji"
                        @click="store.toggleReaction(message.id, emoji)"
                        class="w-7 h-7 text-sm rounded-md hover:bg-heading/8 flex items-center justify-center transition-colors"
                        :title="emoji">
                        {{ emoji }}
                    </button>
                </div>
                <div class="w-px h-5 bg-heading/10 mx-1" />
                <!-- Reply -->
                <button @click="store.openThread(message.id)"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text hover:bg-accent/10 hover:text-accent transition-colors" title="Reply in thread">
                    <v-icon name="bi-reply" scale="0.85" />
                </button>
                <!-- Delete (own only) -->
                <button v-if="isMine"
                        @click="store.deleteMessage(message.id)"
                        class="w-7 h-7 rounded-md flex items-center justify-center text-text hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                    <v-icon name="bi-trash" scale="0.85" />
                </button>
            </div>
        </Transition>
    </div>

    <!-- Deleted message placeholder -->
    <div v-else class="flex gap-3 px-4 py-1">
        <div class="w-9 shrink-0" />
        <p class="text-sm italic text-text/35">This message was deleted.</p>
    </div>
</template>

<style scoped>
.actions-fade-enter-active, .actions-fade-leave-active { transition: all 0.12s ease; }
.actions-fade-enter-from, .actions-fade-leave-to { opacity: 0; transform: translateY(3px) scale(0.97); }

:deep(.mention) {
    display: inline-block;
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent);
    font-weight: 600;
    font-size: 0.85em;
    padding: 0.05em 0.35em;
    border-radius: 4px;
}
</style>
