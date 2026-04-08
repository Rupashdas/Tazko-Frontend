<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import { MdCloseRound, BiReply } from 'oh-vue-icons/icons'
addIcons(MdCloseRound, BiReply)

const store   = useChatStore()
const reply   = ref('')
const taRef   = ref(null)

function sendReply() {
    const content = reply.value.trim()
    if (!content) return
    store.sendThreadReply(content)
    reply.value = ''
    nextTick(() => taRef.value?.focus())
}

function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
}

function getUser(id) { return store.getUser(id) }
</script>

<template>
    <Transition name="thread-slide">
        <aside v-if="store.activeThread"
               class="flex flex-col border-l border-heading/8 bg-panel overflow-hidden"
               style="width: 320px; min-width: 320px;">

            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-heading/8 shrink-0">
                <div class="flex items-center gap-2">
                    <v-icon name="bi-reply" class="text-accent" scale="0.9" />
                    <span class="text-sm font-bold text-heading">Thread</span>
                </div>
                <button @click="store.closeThread()"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-text/50 hover:bg-heading/8 hover:text-heading transition-colors">
                    <v-icon name="md-close-round" scale="0.9" />
                </button>
            </div>

            <!-- Parent message -->
            <div v-if="store.threadParent" class="px-4 py-3 border-b border-heading/6 bg-body/40 shrink-0">
                <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                         :style="`background: ${getUser(store.threadParent.senderId)?.color ?? '#6c63ff'}`">
                        {{ getUser(store.threadParent.senderId)?.initials }}
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-heading">{{ getUser(store.threadParent.senderId)?.name }}</p>
                        <p class="text-xs text-text mt-0.5 line-clamp-3 break-words">{{ store.threadParent.content }}</p>
                        <img v-if="store.threadParent.type === 'image'" :src="store.threadParent.url"
                             class="mt-1.5 rounded-lg max-h-28 object-cover" />
                    </div>
                </div>
            </div>

            <!-- Replies list -->
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3" style="scrollbar-width: thin;">
                <p v-if="!store.threadReplies.length" class="text-xs text-text/40 text-center mt-8">
                    No replies yet. Be the first!
                </p>
                <TransitionGroup name="thread-msg" tag="div" class="space-y-3">
                    <div v-for="msg in store.threadReplies" :key="msg.id"
                         class="flex items-start gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                             :style="`background: ${getUser(msg.senderId)?.color ?? '#6c63ff'}`">
                            {{ getUser(msg.senderId)?.initials }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline gap-2">
                                <span class="text-xs font-bold text-heading">
                                    {{ msg.senderId === store.CURRENT_USER_ID ? 'You' : getUser(msg.senderId)?.name }}
                                </span>
                                <span class="text-[10px] text-text/35">{{ msg.time }}</span>
                            </div>
                            <p class="text-sm text-heading mt-0.5 break-words leading-relaxed">{{ msg.content }}</p>
                        </div>
                    </div>
                </TransitionGroup>
            </div>

            <!-- Reply input -->
            <div class="px-3 pb-3 pt-2 border-t border-heading/6 shrink-0">
                <div class="flex items-end gap-2 bg-body rounded-xl border border-heading/10 px-3 py-2 focus-within:border-accent/30 transition-colors">
                    <textarea
                        ref="taRef"
                        v-model="reply"
                        @keydown="onKey"
                        rows="1"
                        placeholder="Reply in thread…"
                        class="flex-1 resize-none bg-transparent text-sm text-heading placeholder:text-text/35 focus:outline-none leading-relaxed py-1 max-h-24"
                        style="scrollbar-width: thin;"
                    />
                    <button @click="sendReply"
                            :disabled="!reply.trim()"
                            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                            :class="reply.trim() ? 'bg-accent text-white hover:bg-accent/85' : 'bg-heading/8 text-text/30 cursor-not-allowed'">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    </Transition>
</template>

<style scoped>
.thread-slide-enter-active, .thread-slide-leave-active { transition: all 0.22s ease; }
.thread-slide-enter-from, .thread-slide-leave-to { transform: translateX(100%); opacity: 0; }

.thread-msg-enter-active { transition: all 0.18s ease; }
.thread-msg-enter-from   { opacity: 0; transform: translateY(4px); }
</style>
