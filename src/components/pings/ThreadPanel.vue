<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import { addIcons } from 'oh-vue-icons'
import { MdCloseRound, BiChatSquareDots, BiSend } from 'oh-vue-icons/icons'
addIcons(MdCloseRound, BiChatSquareDots, BiSend)

const store  = useChatStore()
const reply  = ref('')
const taRef  = ref(null)

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
               class="flex flex-col border-l border-heading/8 bg-panel overflow-hidden shrink-0
                      w-full sm:w-[320px] sm:min-w-[320px]">

            <!-- ── Header ──────────────────────────────────────── -->
            <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-heading/8 shrink-0 min-h-[60px]">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                        <v-icon name="bi-chat-square-dots" class="text-accent" scale="0.8" />
                    </div>
                    <span class="text-sm font-semibold text-heading truncate">Thread</span>
                </div>
                <button @click="store.closeThread()"
                        class="w-8 h-8 rounded-md flex items-center justify-center text-text shrink-0
                               hover:bg-heading/5 hover:text-heading transition-all duration-150 active:scale-95">
                    <v-icon name="md-close-round" scale="0.88" />
                </button>
            </div>

            <!-- ── Parent message ─────────────────────────────── -->
            <div v-if="store.threadParent"
                 class="mx-3 my-3 px-3 py-3 rounded-lg bg-heading/3 border border-heading/8 shrink-0">
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                         :style="`background: ${getUser(store.threadParent.senderId)?.color ?? '#6c63ff'}`">
                        {{ getUser(store.threadParent.senderId)?.initials }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline gap-2 mb-1">
                            <p class="text-sm font-semibold text-heading truncate">
                                {{ getUser(store.threadParent.senderId)?.name }}
                            </p>
                            <span class="text-xs text-text/60 tabular-nums shrink-0">
                                {{ store.threadParent.time }}
                            </span>
                        </div>
                        <p class="text-sm text-text leading-relaxed line-clamp-3 break-words">
                            {{ store.threadParent.content }}
                        </p>
                        <img v-if="store.threadParent.type === 'image'"
                             :src="store.threadParent.url"
                             class="mt-2 rounded-md max-h-28 object-cover border border-heading/8" />
                    </div>
                </div>
            </div>

            <!-- Thread divider -->
            <div class="flex items-center gap-3 px-4 pb-1 shrink-0">
                <div class="flex-1 h-px bg-heading/8" />
                <span class="text-xs font-semibold uppercase tracking-wider text-text/70 whitespace-nowrap">
                    {{ store.threadReplies.length }} {{ store.threadReplies.length === 1 ? 'Reply' : 'Replies' }}
                </span>
                <div class="flex-1 h-px bg-heading/8" />
            </div>

            <!-- ── Replies list ────────────────────────────────── -->
            <div v-scrollbar class="flex-1 overflow-y-auto"><div class="px-3 py-3 flex flex-col gap-4">
                <div v-if="!store.threadReplies.length"
                     class="flex flex-col items-center gap-3 py-10 text-center">
                    <div class="w-12 h-12 rounded-xl bg-heading/5 flex items-center justify-center">
                        <v-icon name="bi-chat-square-dots" class="text-text" scale="1.1" />
                    </div>
                    <p class="text-sm font-medium text-text">No replies yet.<br>Be the first!</p>
                </div>

                <TransitionGroup name="thread-msg" tag="div" class="flex flex-col gap-4">
                    <div v-for="msg in store.threadReplies" :key="msg.id"
                         class="flex items-start gap-3 group">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                             :style="`background: ${getUser(msg.senderId)?.color ?? '#6c63ff'}`">
                            {{ getUser(msg.senderId)?.initials }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline gap-2 mb-1">
                                <span class="text-sm font-semibold text-heading truncate">
                                    {{ msg.senderId === store.CURRENT_USER_ID ? 'You' : getUser(msg.senderId)?.name }}
                                </span>
                                <span class="text-xs text-text/60 tabular-nums shrink-0">
                                    {{ msg.time }}
                                </span>
                            </div>
                            <div class="px-3 py-2 rounded-lg rounded-tl-md bg-body border border-heading/8 text-sm text-heading leading-relaxed break-words">
                                {{ msg.content }}
                            </div>
                        </div>
                    </div>
                </TransitionGroup>
            </div></div>

            <!-- ── Reply input ────────────────────────────────── -->
            <div class="px-3 pb-3 pt-3 border-t border-heading/8 shrink-0">
                <div class="flex items-end gap-2 bg-body rounded-lg border border-heading/8 px-3 py-2
                            focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-all duration-150">
                    <textarea
                        ref="taRef"
                        v-model="reply"
                        @keydown="onKey"
                        rows="1"
                        placeholder="Reply in thread…"
                        class="flex-1 resize-none bg-transparent text-sm text-heading placeholder:text-text/50
                               focus:outline-none leading-relaxed py-1.5 max-h-24 [scrollbar-width:thin]"
                    />
                    <button @click="sendReply"
                            :disabled="!reply.trim()"
                            class="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150 shrink-0 active:scale-95"
                            :class="reply.trim()
                                ? 'bg-accent text-white hover:brightness-110'
                                : 'bg-heading/8 text-text/40 cursor-not-allowed'">
                        <v-icon name="bi-send" scale="0.82" />
                    </button>
                </div>
                <p class="text-xs text-text/70 mt-2 px-0.5">
                    <kbd class="px-1.5 py-0.5 rounded bg-heading/8 font-mono text-[10px] text-text">Enter</kbd> to reply
                </p>
            </div>
        </aside>
    </Transition>
</template>

<style scoped>
.thread-slide-enter-active, .thread-slide-leave-active { transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.thread-slide-enter-from, .thread-slide-leave-to { transform: translateX(100%); opacity: 0; }

.thread-msg-enter-active { transition: all 0.18s ease; }
.thread-msg-enter-from   { opacity: 0; transform: translateY(4px); }
</style>
